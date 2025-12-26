import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { Box, Button, Stack, Tooltip, TextField, IconButton, Typography } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useTheme } from '@emotion/react';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useSound } from '@/hooks/useSound';
import { submitOrder } from '@/apiServices';
import { msAndKs } from '@/util';
import { getExitStrategyFromUrgency } from '@/util/urgencyUtils';
import { useAccountBalanceContext } from './AccountBalanceContext';
import { usePriceDataContext } from './PriceDataContext';

// Constants
const STORAGE_KEYS = {
  MARKET_BUY_BUTTONS: 'market_buy_buttons',
  MARKET_SELL_BUTTONS: 'market_sell_buttons',
};

const DEFAULT_BUTTON_VALUES = ['250', '1000', '2500', '10000', '25000'];
const PERCENTAGES = [10, 25, 50, 75, 100];
const MARKET_ORDER_DURATION = 60; // 1 minute

// Utility functions
// formatKMB function removed - using msAndKs from utils instead

// Custom hook to get top bid/ask quantities from order book
const useBidAskQuantities = () => {
  const { orderBookData } = usePriceDataContext();
  const { selectedPair, selectedAccounts, initialLoadValue } = useOrderForm();
  const [isPaused, setIsPaused] = useState(false);
  const [pausedData, setPausedData] = useState({ topBidQty: null, topAskQty: null });
  const [pausedOrderBookData, setPausedOrderBookData] = useState(null);
  const currentDataRef = useRef({ topBidQty: null, topAskQty: null });

  // Get the current exchange name from selected accounts
  const currentExchangeName = useMemo(() => {
    if (!selectedAccounts || selectedAccounts.length === 0 || !initialLoadValue?.accounts) return null;
    const firstAccountName = selectedAccounts[0];
    const firstAccount = initialLoadValue.accounts[firstAccountName];
    return firstAccount?.exchangeName || null;
  }, [selectedAccounts, initialLoadValue?.accounts]);

  const currentData = useMemo(() => {
    if (!orderBookData || !selectedPair || !currentExchangeName) {
      return { topBidQty: null, topAskQty: null };
    }

    // Get order book data for the specific exchange
    const exchangeData = orderBookData[currentExchangeName];
    if (!exchangeData) {
      return { topBidQty: null, topAskQty: null };
    }

    const topBidQty = exchangeData.bids?.[0]?.y || null;
    const topAskQty = exchangeData.asks?.[0]?.y || null;

    const result = { topBidQty, topAskQty };
    currentDataRef.current = result;
    return result;
  }, [orderBookData, selectedPair, currentExchangeName]);

  // Update paused data when not paused
  useEffect(() => {
    if (!isPaused && (currentData.topBidQty || currentData.topAskQty)) {
      setPausedData(currentData);
      setPausedOrderBookData(orderBookData);
    }
  }, [currentData, orderBookData, isPaused]);

  // Reset pause state when exchange changes
  useEffect(() => {
    if (currentExchangeName) {
      setIsPaused(false);
      setPausedData({ topBidQty: null, topAskQty: null });
      setPausedOrderBookData(null);
    }
  }, [currentExchangeName]);

  const handleMouseEnter = useCallback(() => {
    // When hovering, capture the current data as paused data
    if (currentDataRef.current.topBidQty || currentDataRef.current.topAskQty) {
      setPausedData(currentDataRef.current);
      setPausedOrderBookData(orderBookData);
    }
    setIsPaused(true);
  }, [orderBookData]);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    topBidQty: isPaused ? pausedData.topBidQty : currentData.topBidQty,
    topAskQty: isPaused ? pausedData.topAskQty : currentData.topAskQty,
    orderBookData: isPaused ? pausedOrderBookData : orderBookData,
    handleMouseEnter,
    handleMouseLeave,
    isPaused,
  };
};

// Custom hook for button management
const useButtonManager = (storageKey, defaultValue = DEFAULT_BUTTON_VALUES) => {
  const [buttons, setButtons] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const [editButtons, setEditButtons] = useState(defaultValue.slice(0, -1)); // Only first 4 buttons
  const [focusedInputIndex, setFocusedInputIndex] = useState(null);

  // Load buttons from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 5) {
          // Ensure all values are valid numbers or strings that can be converted to numbers
          const validButtons = parsed.map((val) => {
            const num = Number(val);
            return Number.isNaN(num) ? '0' : val.toString();
          });
          setButtons(validButtons);
          setEditButtons(validButtons.slice(0, -1)); // Only first 4 buttons for editing
        }
      } catch (error) {
        // Failed to parse stored buttons, using defaults
      }
    }
  }, [storageKey]);

  const saveButtons = useCallback(() => {
    localStorage.setItem(storageKey, JSON.stringify(buttons));
  }, [buttons, storageKey]);

  const handleEdit = useCallback(() => {
    // When editing, only make the first 4 buttons editable, keep the L1 value
    const editableButtons = buttons.slice(0, -1);
    setEditButtons(editableButtons);
    setIsEditing(true);
  }, [buttons, storageKey]);

  const handleSave = useCallback(() => {
    // Reconstruct the full 5-button array: edited values + original L1 value
    const newButtons = [...editButtons, buttons[buttons.length - 1]];
    setButtons(newButtons);
    // Save the new buttons array directly instead of relying on state update
    localStorage.setItem(storageKey, JSON.stringify(newButtons));
    setIsEditing(false);
  }, [editButtons, buttons, storageKey]);

  const handleCancel = useCallback(() => {
    // Reset editButtons to the first 4 buttons (non-L1 buttons)
    setEditButtons(buttons.slice(0, -1));
    setIsEditing(false);
  }, [buttons]);

  const handleButtonChange = useCallback(
    (index, value) => {
      const newButtons = [...editButtons];
      newButtons[index] = value;
      setEditButtons(newButtons);
    },
    [editButtons]
  );

  const handleInputFocus = useCallback((index) => {
    setFocusedInputIndex(index);
  }, []);

  const handleInputBlur = useCallback(() => {
    setFocusedInputIndex(null);
  }, []);

  return {
    buttons,
    isEditing,
    editButtons,
    focusedInputIndex,
    handleEdit,
    handleSave,
    handleCancel,
    handleButtonChange,
    handleInputFocus,
    handleInputBlur,
  };
};

// Balance calculations moved to AccountBalanceProvider

// Quantity calculation helpers
const calculateBuyQuantities = (getCurrentBalance, getUSDTBalance) => {
  const usdtBalance = getUSDTBalance();
  const baseBalance = getCurrentBalance();

  if (baseBalance < 0) {
    return PERCENTAGES.map((percentage) => ({
      percentage,
      quantity: Math.abs(baseBalance) * (percentage / 100),
      isBaseAsset: true,
    }));
  }

  return PERCENTAGES.map((percentage) => ({
    percentage,
    quantity: usdtBalance * (percentage / 100),
    isBaseAsset: false,
  }));
};

const calculateSellQuantities = (getCurrentBalance, getUSDTBalance) => {
  const baseBalance = getCurrentBalance();
  const usdtBalance = getUSDTBalance();

  if (baseBalance < 0) {
    return PERCENTAGES.map((percentage) => ({
      percentage,
      quantity: usdtBalance * (percentage / 100),
      isBaseAsset: false,
    }));
  }

  return PERCENTAGES.map((percentage) => ({
    percentage,
    quantity: baseBalance * (percentage / 100),
    isBaseAsset: true,
  }));
};

// Reusable button component
function QuickTradeButton({ color, disabled, onClick, children, tooltip, isSubmitting }) {
  const theme = useTheme();

  const button = (
    <Button
      fullWidth
      color={color}
      disabled={disabled || isSubmitting}
      size='small'
      sx={{
        borderColor: disabled ? theme.palette.text.disabled : theme.palette[color].main,
        color: disabled ? theme.palette.text.disabled : theme.palette[color].main,
        opacity: disabled ? 0.6 : 1,
        minWidth: '60px',
        width: '100%',
        '&:hover': {
          backgroundColor: theme.palette[color].main,
          borderColor: theme.palette[color].dark,
          color: theme.palette[color].contrastText,
        },
      }}
      variant='outlined'
      onClick={onClick}
    >
      {children}
    </Button>
  );

  return <Tooltip title={tooltip}>{disabled || isSubmitting ? <span>{button}</span> : button}</Tooltip>;
}

// Reusable edit section component
function EditSection({ title, color, isEditing, onEdit, onSave, onCancel, disabled, children }) {
  const theme = useTheme();

  return (
    <Box>
      <Stack alignItems='center' direction='row' justifyContent='space-between' sx={{ mb: 1 }}>
        <Typography sx={{ color: theme.palette[color].main }} variant='body1'>
          {title}
        </Typography>
        <Box>
          {!isEditing ? (
            <IconButton disabled={disabled} size='small' onClick={onEdit}>
              <EditIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          ) : (
            <Stack direction='row' spacing={0.5}>
              <IconButton color='success' size='small' onClick={onSave}>
                <SaveIcon sx={{ fontSize: '16px' }} />
              </IconButton>
              <IconButton color='error' size='small' onClick={onCancel}>
                <CancelIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </Stack>
          )}
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

export default function MarketStrategyPanel({ quickSubmitEnabled, onQuickSubmitToggle }) {
  const theme = useTheme();
  const { showAlert } = useContext(ErrorContext);
  const { FormAtoms } = useOrderForm();

  // Get form state from useOrderForm
  const orderFormContext = useOrderForm();
  const {
    selectedAccounts,
    selectedPair,
    selectedSide,
    balances,
    initialLoadValue,
    // Exit conditions
    takeProfitPrice,
    stopLossPrice,
    takeProfitUrgency,
    stopLossUrgency,
    takeProfitPercentage,
    stopLossPercentage,
  } = orderFormContext;

  const { accounts } = initialLoadValue || {};

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get token balances
  const { tokenBalances } = useTokenBalances(selectedAccounts);

  // Custom hooks
  const buyButtonManager = useButtonManager(STORAGE_KEYS.MARKET_BUY_BUTTONS);
  const sellButtonManager = useButtonManager(STORAGE_KEYS.MARKET_SELL_BUTTONS);
  const { getCurrentBalance, getUSDTBalance } = useAccountBalanceContext();
  const { playOrderSuccess } = useSound();
  const { topBidQty, topAskQty, orderBookData, handleMouseEnter, handleMouseLeave, isPaused } = useBidAskQuantities();

  // Derived values
  const hasSelectedAccounts = selectedAccounts && selectedAccounts.length > 0;
  const baseBalance = getCurrentBalance();
  const usdtBalance = getUSDTBalance();
  const baseSymbol = selectedPair?.base_asset || '';

  // Memoized quantities
  const buyQuantities = useMemo(
    () => calculateBuyQuantities(getCurrentBalance, getUSDTBalance),
    [getCurrentBalance, getUSDTBalance]
  );
  const sellQuantities = useMemo(
    () => calculateSellQuantities(getCurrentBalance, getUSDTBalance),
    [getCurrentBalance, getUSDTBalance]
  );

  // Tooltip text generators
  const getBuyTooltipText = useCallback((quantity, isBaseAsset, symbol, balance, hasAccounts) => {
    if (!hasAccounts) {
      return 'Please select accounts to use quick trade';
    }

    if (isBaseAsset) {
      return `Order: ${(Number(quantity) || 0).toFixed(4)} ${symbol}`;
    }

    if (balance <= 0) {
      return 'Insufficient USDT balance';
    }
    return `Order: $${(Number(quantity) || 0).toFixed(2)} USDT`;
  }, []);

  const getSellTooltipText = useCallback((quantity, isBaseAsset, symbol, balance, hasAccounts) => {
    if (!hasAccounts) {
      return 'Please select accounts to use quick trade';
    }

    if (isBaseAsset) {
      if (balance <= 0) {
        return 'Insufficient balance';
      }
      return `Order: ${(Number(quantity) || 0).toFixed(4)} ${symbol}`;
    }
    return `Order: $${(Number(quantity) || 0).toFixed(2)} USDT`;
  }, []);

  // Submit market order - moved after all variables are defined
  const submitMarketOrder = useCallback(
    async (quantity, side, isDollarAmount = false, isBaseAsset = true) => {
      if (!selectedAccounts?.length || !selectedPair) {
        showAlert({
          message: 'Please select accounts and trading pair',
          severity: 'error',
        });
        return;
      }

      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        let baseAssetQty;
        let quoteAssetQty;

        if (isDollarAmount) {
          quoteAssetQty = quantity;
        } else if (side === 'buy') {
          if (isBaseAsset) {
            baseAssetQty = quantity;
          } else {
            quoteAssetQty = quantity;
          }
        } else if (side === 'sell') {
          if (isBaseAsset) {
            baseAssetQty = quantity;
          } else {
            quoteAssetQty = quantity;
          }
        }

        // Add exit conditions as a single JSON object
        const exitConditions = {};
        if (takeProfitPrice && takeProfitPrice.trim() !== '') {
          exitConditions.takeProfitExit = {
            price: takeProfitPrice,
            type: getExitStrategyFromUrgency(takeProfitUrgency),
            percent: (parseFloat(takeProfitPercentage) / 100).toString(),
          };
        }
        if (stopLossPrice && stopLossPrice.trim() !== '') {
          exitConditions.stopLossExit = {
            price: stopLossPrice,
            type: getExitStrategyFromUrgency(stopLossUrgency),
            percent: (parseFloat(stopLossPercentage) / 100).toString(),
          };
        }

        const orderData = {
          accounts: selectedAccounts,
          base_asset_qty: baseAssetQty,
          duration: MARKET_ORDER_DURATION,
          pair: selectedPair.id,
          quote_asset_qty: quoteAssetQty,
          side,
          strategy: 'Market',
          ...(Object.keys(exitConditions).length > 0 && { exit_conditions: exitConditions }),
        };

        const response = await submitOrder(orderData);

        if (response.id) {
          // Play success sound
          playOrderSuccess();

          showAlert({
            message: `Successfully submitted ${side} market order`,
            severity: 'success',
          });
        }
      } catch (error) {
        showAlert({
          message: error.message || `Failed to submit ${side} market order`,
          severity: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedAccounts,
      selectedPair,
      isSubmitting,
      showAlert,
      takeProfitPrice,
      stopLossPrice,
      takeProfitUrgency,
      stopLossUrgency,
      takeProfitPercentage,
      stopLossPercentage,
      playOrderSuccess,
    ]
  );

  // Event handlers
  const handleBuyButtonClick = useCallback(
    (quantity, isBaseAsset) => {
      submitMarketOrder(parseFloat(quantity), 'buy', false, isBaseAsset);
    },
    [submitMarketOrder]
  );

  const handleSellButtonClick = useCallback(
    (quantity, isBaseAsset) => {
      submitMarketOrder(parseFloat(quantity), 'sell', false, isBaseAsset);
    },
    [submitMarketOrder]
  );

  const handleDollarButtonClick = useCallback(
    (quantity, side) => {
      submitMarketOrder(parseFloat(quantity), side, true);
    },
    [submitMarketOrder]
  );

  // Helper to get dynamic button data
  const getDynamicButtonData = useCallback(
    (side, buttons) => {
      const dynamicButtons = [...buttons];

      if (side === 'buy' && topAskQty) {
        // For buy orders, show ask quantity as dollar amount
        const askPrice = orderBookData?.[Object.keys(orderBookData)[0]]?.asks?.[0]?.price || 0;
        const askDollarAmount = (topAskQty * askPrice).toFixed(2);
        dynamicButtons[dynamicButtons.length - 1] = askDollarAmount;
      } else if (side === 'sell' && topBidQty) {
        // For sell orders, show bid quantity as dollar amount
        const bidPrice = orderBookData?.[Object.keys(orderBookData)[0]]?.bids?.[0]?.price || 0;
        const bidDollarAmount = (topBidQty * bidPrice).toFixed(2);
        dynamicButtons[dynamicButtons.length - 1] = bidDollarAmount;
      }

      return dynamicButtons;
    },
    [topAskQty, topBidQty, orderBookData]
  );

  // Move renderQuickTradePanel function definition after all variables are defined
  const renderQuickTradePanel = useCallback(
    () => (
      <Box
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          backgroundColor: theme.palette.background.paper,
          position: 'relative',
          opacity: !quickSubmitEnabled ? 0.6 : 1,
          pointerEvents: !quickSubmitEnabled ? 'none' : 'auto',
        }}
      >
        {!quickSubmitEnabled && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: `${theme.palette.common.pureBlack}4D`, // 30% opacity
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: 1,
              pointerEvents: 'auto',
            }}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                border: `3px solid ${theme.palette.primary.main}`,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                boxShadow: theme.shadows[12],
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                opacity: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.primary.dark,
                  boxShadow: theme.shadows[16],
                  transform: 'scale(1.02)',
                },
              }}
              onClick={onQuickSubmitToggle}
            >
              <Typography
                sx={{
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  textShadow: `0 1px 2px ${theme.palette.common.pureBlack}CC`, // 80% opacity
                }}
                variant='body1'
              >
                Quick Trade Panel Disabled
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.primary.light,
                  textAlign: 'center',
                  mt: 0.5,
                  fontStyle: 'italic',
                  fontWeight: '500',
                  textShadow: `0 1px 2px ${theme.palette.common.pureBlack}CC`, // 80% opacity
                }}
                variant='body2'
              >
                Click to enable quick submit
              </Typography>
            </Box>
          </Box>
        )}

        <Stack spacing={2}>
          {/* Buy Section */}
          <EditSection
            color='success'
            disabled={!hasSelectedAccounts}
            isEditing={buyButtonManager.isEditing}
            title='Quick Buy'
            onCancel={buyButtonManager.handleCancel}
            onEdit={buyButtonManager.handleEdit}
            onSave={buyButtonManager.handleSave}
          >
            <Stack spacing={1}>
              {/* Buy % Buttons Row */}
              <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
                {buyQuantities.map(({ percentage, quantity, isBaseAsset }) => {
                  const isDisabled = !hasSelectedAccounts || (isBaseAsset ? baseBalance >= 0 : usdtBalance <= 0);

                  return (
                    <Box key={`buy-${percentage}`} sx={{ flex: 1 }}>
                      <QuickTradeButton
                        color='success'
                        disabled={isDisabled}
                        isSubmitting={isSubmitting}
                        tooltip={getBuyTooltipText(quantity, isBaseAsset, baseSymbol, usdtBalance, hasSelectedAccounts)}
                        onClick={() => handleBuyButtonClick(quantity, isBaseAsset)}
                      >
                        {percentage}%
                      </QuickTradeButton>
                    </Box>
                  );
                })}
              </Stack>

              {/* Buy $ Buttons Row */}
              {buyButtonManager.isEditing ? (
                <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
                  {buyButtonManager.editButtons.map((value, index) => (
                    <Box key={`edit-buy-${value}`} sx={{ flex: 1 }}>
                      <TextField
                        autoFocus={buyButtonManager.focusedInputIndex === index}
                        inputProps={{ style: { textAlign: 'center' } }}
                        size='small'
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 0,
                            borderColor: theme.palette.success.main,
                            color: theme.palette.success.main,
                            '& .MuiOutlinedInput-input': { textAlign: 'center' },
                            '&:hover': { borderColor: theme.palette.success.dark },
                            '&.Mui-focused': { borderColor: theme.palette.success.main },
                          },
                        }}
                        value={value}
                        onBlur={buyButtonManager.handleInputBlur}
                        onChange={(e) => buyButtonManager.handleButtonChange(index, e.target.value)}
                        onFocus={() => buyButtonManager.handleInputFocus(index)}
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
                  {/* Static dollar amount buttons (first 4) */}
                  {buyButtonManager.buttons.slice(0, -1).map((quantity, index) => {
                    const formattedQuantity = msAndKs(Number(quantity) || 0, 0);

                    return (
                      <Box key={`buy-static-${quantity}`} sx={{ flex: 1 }}>
                        <QuickTradeButton
                          color='success'
                          disabled={!hasSelectedAccounts}
                          isSubmitting={isSubmitting}
                          tooltip={
                            !hasSelectedAccounts
                              ? 'Please select accounts to use quick trade'
                              : `Order: $${(Number(quantity) || 0).toFixed(2)} USDT`
                          }
                          onClick={() => handleDollarButtonClick(quantity, 'buy')}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span>
                              <span style={{ fontWeight: 'normal' }}>$</span>
                              <span style={{ fontWeight: 'bold' }}>{formattedQuantity}</span>
                            </span>
                          </Box>
                        </QuickTradeButton>
                      </Box>
                    );
                  })}

                  {/* L1 Order Book Button (last column) - always green and moving */}
                  <Box sx={{ flex: 1 }}>
                    <QuickTradeButton
                      color='success'
                      disabled={!hasSelectedAccounts || !topAskQty}
                      isSubmitting={isSubmitting}
                      tooltip={
                        !hasSelectedAccounts
                          ? 'Please select accounts to use quick trade'
                          : `Ask Level 1: $${(topAskQty * (orderBookData?.[Object.keys(orderBookData)[0]]?.asks?.[0]?.price || 0) || 0).toFixed(2)}`
                      }
                      onClick={() => {
                        if (topAskQty) {
                          const askPrice = orderBookData?.[Object.keys(orderBookData)[0]]?.asks?.[0]?.price || 0;
                          const askDollarAmount = topAskQty * askPrice;
                          handleDollarButtonClick(askDollarAmount, 'buy');
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <span>
                          <span style={{ fontWeight: 'normal' }}>$</span>
                          <span style={{ fontWeight: 'bold' }}>
                            {topAskQty
                              ? msAndKs(
                                  topAskQty * (orderBookData?.[Object.keys(orderBookData)[0]]?.asks?.[0]?.price || 0) ||
                                    0,
                                  0
                                )
                              : '0'}
                          </span>
                        </span>
                      </Box>
                    </QuickTradeButton>
                  </Box>
                </Stack>
              )}
            </Stack>
          </EditSection>

          {/* Sell Section */}
          <EditSection
            color='error'
            disabled={!hasSelectedAccounts}
            isEditing={sellButtonManager.isEditing}
            title='Quick Sell'
            onCancel={sellButtonManager.handleCancel}
            onEdit={sellButtonManager.handleEdit}
            onSave={sellButtonManager.handleSave}
          >
            <Stack spacing={1}>
              {/* Sell % Buttons Row */}
              <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
                {sellQuantities.map(({ percentage, quantity, isBaseAsset }) => {
                  const isDisabled = !hasSelectedAccounts || (isBaseAsset ? baseBalance <= 0 : usdtBalance <= 0);

                  return (
                    <Box key={`sell-${percentage}`} sx={{ flex: 1 }}>
                      <QuickTradeButton
                        color='error'
                        disabled={isDisabled}
                        isSubmitting={isSubmitting}
                        tooltip={getSellTooltipText(
                          quantity,
                          isBaseAsset,
                          baseSymbol,
                          baseBalance,
                          hasSelectedAccounts
                        )}
                        onClick={() => handleSellButtonClick(quantity, isBaseAsset)}
                      >
                        {percentage}%
                      </QuickTradeButton>
                    </Box>
                  );
                })}
              </Stack>

              {/* Sell $ Buttons Row */}
              {sellButtonManager.isEditing ? (
                <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
                  {sellButtonManager.editButtons.map((value, index) => (
                    <Box key={`edit-sell-${value}`} sx={{ flex: 1 }}>
                      <TextField
                        autoFocus={sellButtonManager.focusedInputIndex === index}
                        size='small'
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 0,
                            borderColor: theme.palette.error.main,
                            color: theme.palette.error.main,
                            '& .MuiOutlinedInput-input': { textAlign: 'center' },
                            '&:hover': { borderColor: theme.palette.error.dark },
                            '&.Mui-focused': { borderColor: theme.palette.error.main },
                          },
                        }}
                        value={value}
                        onBlur={sellButtonManager.handleInputBlur}
                        onChange={(e) => sellButtonManager.handleButtonChange(index, e.target.value)}
                        onFocus={() => sellButtonManager.handleInputFocus(index)}
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
                  {/* Static dollar amount buttons (first 4) */}
                  {sellButtonManager.buttons.slice(0, -1).map((quantity, index) => {
                    const formattedQuantity = msAndKs(Number(quantity) || 0, 0);

                    return (
                      <Box key={`sell-static-${quantity}`} sx={{ flex: 1 }}>
                        <QuickTradeButton
                          color='error'
                          disabled={!hasSelectedAccounts}
                          isSubmitting={isSubmitting}
                          tooltip={
                            !hasSelectedAccounts
                              ? 'Please select accounts to use quick trade'
                              : `Order: $${(Number(quantity) || 0).toFixed(2)} USDT`
                          }
                          onClick={() => handleDollarButtonClick(quantity, 'sell')}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span>
                              <span style={{ fontWeight: 'normal' }}>$</span>
                              <span style={{ fontWeight: 'bold' }}>{formattedQuantity}</span>
                            </span>
                          </Box>
                        </QuickTradeButton>
                      </Box>
                    );
                  })}

                  {/* L1 Order Book Button (last column) - always green and moving */}
                  <Box sx={{ flex: 1 }}>
                    <QuickTradeButton
                      color='error'
                      disabled={!hasSelectedAccounts || !topBidQty}
                      isSubmitting={isSubmitting}
                      tooltip={
                        !hasSelectedAccounts
                          ? 'Please select accounts to use quick trade'
                          : `Bid Level 1: $${(topBidQty * (orderBookData?.[Object.keys(orderBookData)[0]]?.bids?.[0]?.price || 0) || 0).toFixed(2)}`
                      }
                      onClick={() => {
                        if (topBidQty) {
                          const bidPrice = orderBookData?.[Object.keys(orderBookData)[0]]?.bids?.[0]?.price || 0;
                          const bidDollarAmount = topBidQty * bidPrice;
                          handleDollarButtonClick(bidDollarAmount, 'sell');
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <span>
                          <span style={{ fontWeight: 'normal' }}>$</span>
                          <span style={{ fontWeight: 'bold' }}>
                            {topBidQty
                              ? msAndKs(
                                  topBidQty * (orderBookData?.[Object.keys(orderBookData)[0]]?.bids?.[0]?.price || 0) ||
                                    0,
                                  0
                                )
                              : '0'}
                          </span>
                        </span>
                      </Box>
                    </QuickTradeButton>
                  </Box>
                </Stack>
              )}
            </Stack>
          </EditSection>
        </Stack>
      </Box>
    ),
    [
      theme,
      quickSubmitEnabled,
      hasSelectedAccounts,
      buyButtonManager,
      sellButtonManager,
      buyQuantities,
      sellQuantities,
      baseBalance,
      usdtBalance,
      baseSymbol,
      isSubmitting,
      getBuyTooltipText,
      getSellTooltipText,
      handleBuyButtonClick,
      handleSellButtonClick,
      handleDollarButtonClick,
      getDynamicButtonData,
      topAskQty,
      topBidQty,
      handleMouseEnter,
      handleMouseLeave,
      isPaused,
    ]
  );

  return renderQuickTradePanel();
}
