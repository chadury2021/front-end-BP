import React, { useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  useTheme,
  FormControlLabel,
  Switch,
  Menu,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useAtom } from 'jotai';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import BorderedStack from './AlgoOrderFieldsComponents/BorderedStack';
import { useMarketDataContext } from './MarketDataContext';
import { usePriceDataContext } from './PriceDataContext';
import ExitUrgencyPicker from './ExitUrgencyPicker';
import { formatPrice, msAndKs } from '../../../util';

const EXIT_INPUT_IDS = Object.freeze({
  TAKE_PROFIT_PERCENT: 'take-profit-percent',
  TAKE_PROFIT_AMOUNT: 'take-profit-amount',
  TAKE_PROFIT_PRICE: 'take-profit-price',
  STOP_LOSS_PERCENT: 'stop-loss-percent',
  STOP_LOSS_AMOUNT: 'stop-loss-amount',
  STOP_LOSS_PRICE: 'stop-loss-price',
});

const getActiveInputId = () => (typeof document !== 'undefined' ? (document.activeElement?.id ?? null) : null);

function ExitConditionsFields({ FormAtoms }) {
  const theme = useTheme();
  const { marketSummaryMetrics } = useMarketDataContext();
  const { livePairPrice } = usePriceDataContext();
  const { selectedPair: contextSelectedPair } = useOrderForm();

  // Atoms for values
  const [takeProfitPrice, setTakeProfitPrice] = useAtom(FormAtoms.takeProfitPriceAtom);
  const [takeProfitPercentage, setTakeProfitPercentage] = useAtom(FormAtoms.takeProfitPercentageAtom);
  const [takeProfitAmount, setTakeProfitAmount] = useAtom(FormAtoms.takeProfitAmountAtom);
  const [takeProfitDiffMode, setTakeProfitDiffMode] = useAtom(FormAtoms.takeProfitDiffModeAtom);

  const [stopLossPrice, setStopLossPrice] = useAtom(FormAtoms.stopLossPriceAtom);
  const [stopLossPercentage, setStopLossPercentage] = useAtom(FormAtoms.stopLossPercentageAtom);
  const [stopLossAmount, setStopLossAmount] = useAtom(FormAtoms.stopLossAmountAtom);
  const [stopLossDiffMode, setStopLossDiffMode] = useAtom(FormAtoms.stopLossDiffModeAtom);

  // UI State for Dropdowns
  const [takeProfitMenuAnchor, setTakeProfitMenuAnchor] = React.useState(null);
  const [stopLossMenuAnchor, setStopLossMenuAnchor] = React.useState(null);

  const [takeProfitUrgency, setTakeProfitUrgency] = useAtom(FormAtoms.takeProfitUrgencyAtom);
  const [stopLossUrgency, setStopLossUrgency] = useAtom(FormAtoms.stopLossUrgencyAtom);
  const [selectedPairPrice] = useAtom(FormAtoms.selectedPairPriceAtom);
  const [selectedSide] = useAtom(FormAtoms.selectedSideAtom);
  const [selectedPair] = useAtom(FormAtoms.selectedPairAtom);
  const [selectedAccounts] = useAtom(FormAtoms.selectedAccountsAtom);
  const [baseQty] = useAtom(FormAtoms.baseQtyAtom);
  const [quoteQty] = useAtom(FormAtoms.quoteQtyAtom);

  // Refs to prevent infinite loops
  const isUpdatingTakeProfit = useRef(false);
  const isUpdatingStopLoss = useRef(false);

  // Helper to get current price - use real-time price from PriceDataContext if available, fallback to selectedPairPrice
  const currentPrice = parseFloat(livePairPrice) || parseFloat(selectedPairPrice?.price) || 0;
  const isBuy = selectedSide === 'buy';
  const isPairSelected = !!selectedPair;
  const isAccountSelected = selectedAccounts && selectedAccounts.length > 0;
  const isFormReady = isPairSelected && isAccountSelected;

  const clampTakeProfitPercentageNumber = (pct) => {
    if (!Number.isFinite(pct)) return pct;
    if (pct < 0) return 0;
    if (!isBuy && pct > 100) return 100;
    return pct;
  };

  const clampStopLossPercentageNumber = (pct) => {
    if (!Number.isFinite(pct)) return pct;
    if (pct < 0) return 0;
    if (isBuy && pct > 100) return 100;
    return pct;
  };

  // Calculate estimated profit/loss
  const calculateEstimatedProfit = () => {
    if (!takeProfitPrice || !currentPrice) return null;
    const tpPrice = parseFloat(takeProfitPrice);
    if (Number.isNaN(tpPrice)) return null;

    // Use quoteQty if available, otherwise use baseQty converted to quote
    let quantity = parseFloat(quoteQty);
    if (!quantity || Number.isNaN(quantity)) {
      // If quoteQty is not available, try to use baseQty
      const baseQuantity = parseFloat(baseQty);
      if (baseQuantity && !Number.isNaN(baseQuantity) && currentPrice > 0) {
        quantity = baseQuantity * currentPrice;
      } else {
        return null;
      }
    }

    const perUnitProfit = isBuy ? tpPrice - currentPrice : currentPrice - tpPrice;
    const profitInQuote = perUnitProfit * (quantity / currentPrice);
    return Math.round(profitInQuote);
  };

  const calculateEstimatedLoss = () => {
    if (!stopLossPrice || !currentPrice) return null;
    const slPrice = parseFloat(stopLossPrice);
    if (Number.isNaN(slPrice)) return null;

    // Use quoteQty if available, otherwise use baseQty converted to quote
    let quantity = parseFloat(quoteQty);
    if (!quantity || Number.isNaN(quantity)) {
      // If quoteQty is not available, try to use baseQty
      const baseQuantity = parseFloat(baseQty);
      if (baseQuantity && !Number.isNaN(baseQuantity) && currentPrice > 0) {
        quantity = baseQuantity * currentPrice;
      } else {
        return null;
      }
    }

    const perUnitLoss = isBuy ? currentPrice - slPrice : slPrice - currentPrice;
    const lossInQuote = perUnitLoss * (quantity / currentPrice);
    return Math.round(lossInQuote);
  };

  // Normal cumulative distribution function (approximation)
  const normalCDF = (z) => {
    // Abramowitz and Stegun approximation
    const p = 0.2316419;
    const b1 = 0.31938153;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;

    const t = 1 / (1 + p * Math.abs(z));
    const cdf =
      1 -
      (1 / Math.sqrt(2 * Math.PI)) *
      Math.exp((-z * z) / 2) *
      (b1 * t + b2 * t * t + b3 * t * t * t + b4 * t * t * t * t + b5 * t * t * t * t * t);

    return z >= 0 ? cdf : 1 - cdf;
  };

  // Calculate % chance of 24h fill using Bayesian probability based on Brownian motion
  const calculateFillChance = (targetPrice) => {
    if (!targetPrice || !currentPrice) return null;
    const price = parseFloat(targetPrice);
    if (Number.isNaN(price)) return null;

    const distance = Math.abs(price - currentPrice);
    const distancePercent = (distance / currentPrice) * 100;

    // Get 1h volatility (annualized), fallback to 24h price change if not available
    const hourlyVolatility = marketSummaryMetrics.priceVolatility || Math.abs(marketSummaryMetrics.priceDiff) || 1;

    if (distancePercent === 0) return 100;

    // Convert 1h projected volatility to daily volatility
    // The hourlyVolatility is already annualized and projected for 1 hour
    // To get daily volatility: daily = hourly * sqrt(24)
    const dailyVolatility = hourlyVolatility * Math.sqrt(24);

    // For a 24-hour period, the standard deviation is daily volatility
    // Using normal distribution: P(X > target) = 1 - P(X <= target)
    // For Brownian motion, the probability of reaching a certain distance in 24h
    // follows a normal distribution with mean = current price, std = daily volatility

    // Convert distance to number of standard deviations
    const zScore = distancePercent / dailyVolatility;

    // Calculate probability using normal distribution
    // For a two-sided test (price can go up or down), we use the complementary probability
    // P(reach target) = 2 * (1 - P(X <= zScore))
    const probability = 2 * (1 - normalCDF(zScore));
    return Math.min(100, Math.max(0, probability * 100));
  };

  // Helper functions to check if prices are valid
  const isTakeProfitPriceValid = () => {
    if (!takeProfitPrice || !currentPrice) return true;
    const price = parseFloat(takeProfitPrice);
    if (Number.isNaN(price)) return true; // Allow typing
    if (isBuy) {
      return price >= currentPrice; // Buy: take profit should be >= current price
    }
    return price >= 0 && price <= currentPrice; // Sell: take profit should be 0 <= price <= current price
  };

  const isStopLossPriceValid = () => {
    if (!stopLossPrice || !currentPrice) return true;
    const price = parseFloat(stopLossPrice);
    if (Number.isNaN(price)) return true; // Allow typing
    if (isBuy) {
      return price >= 0 && price <= currentPrice; // Buy: stop loss should be 0 <= price <= current price
    }
    return price >= currentPrice; // Sell: stop loss should be >= current price
  };

  // Helper function to format price for display (for profit/loss, not input fields)
  const formatPriceValue = (price) => {
    if (!price) return '';
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum)) return price;
    // Use formatPrice for consistent formatting with pair info bar, then add commas
    const formattedPrice = formatPrice(priceNum);
    return formattedPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Exit input coordination summary:
  // - Users can freely type or paste partial numeric strings into either price or percentage fields; clearing one clears the other.
  // - The field in focus is treated as the source of truth, so we only derive its counterpart when the user is typing elsewhere.
  // - Programmatic updates (side toggles, live price refreshes, template loads) continually re-sync prices from stored percentages,
  //   but only when the relevant price box is not focused to avoid interrupting active edits.
  // - Take profit and stop loss share the same rounding rules (two decimals) and validation so both behave identically.

  // Coordination: when % changes, update price and amount
  useEffect(() => {
    if (!currentPrice) return;
    if (isUpdatingTakeProfit.current) return;
    const activeInputId = getActiveInputId();
    if (takeProfitPercentage !== '' && activeInputId === EXIT_INPUT_IDS.TAKE_PROFIT_PERCENT) {
      isUpdatingTakeProfit.current = true;
      const pct = parseFloat(takeProfitPercentage);
      if (!Number.isNaN(pct)) {
        const boundedPct = clampTakeProfitPercentageNumber(pct);
        if (boundedPct !== pct) {
          setTakeProfitPercentage(boundedPct.toString());
        }
        const price = isBuy ? currentPrice * (1 + boundedPct / 100) : currentPrice * (1 - boundedPct / 100);
        setTakeProfitPrice(price.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setTakeProfitAmount(amount.toFixed(2));
      }
      setTimeout(() => {
        isUpdatingTakeProfit.current = false;
      }, 0);
    }
    // eslint-disable-next-line
  }, [takeProfitPercentage, currentPrice, isBuy]);

  // Coordination: when amount changes, update price and %
  useEffect(() => {
    if (!currentPrice) return;
    if (isUpdatingTakeProfit.current) return;
    const activeInputId = getActiveInputId();
    if (takeProfitAmount !== '' && activeInputId === EXIT_INPUT_IDS.TAKE_PROFIT_AMOUNT) {
      isUpdatingTakeProfit.current = true;
      const amount = parseFloat(takeProfitAmount);
      if (!Number.isNaN(amount)) {
        // Amount is always positive distance
        const price = isBuy ? currentPrice + amount : currentPrice - amount;

        // Check validity - for sell, price cannot be negative
        const validPrice = Math.max(0, price);
        const validAmount = Math.abs(validPrice - currentPrice);

        if (validAmount !== amount) {
          setTakeProfitAmount(validAmount.toString());
        }

        setTakeProfitPrice(validPrice.toFixed(2));

        // Update percentage
        const pct = (validAmount / currentPrice) * 100;
        setTakeProfitPercentage(pct.toFixed(2));
      }
      setTimeout(() => {
        isUpdatingTakeProfit.current = false;
      }, 0);
    }
  }, [takeProfitAmount, currentPrice, isBuy]);

  useEffect(() => {
    if (!currentPrice) return;
    if (isUpdatingStopLoss.current) return;
    const activeInputId = getActiveInputId();
    if (stopLossPercentage !== '' && activeInputId === EXIT_INPUT_IDS.STOP_LOSS_PERCENT) {
      isUpdatingStopLoss.current = true;
      const pct = parseFloat(stopLossPercentage);
      if (!Number.isNaN(pct)) {
        const boundedPct = clampStopLossPercentageNumber(pct);
        if (boundedPct !== pct) {
          setStopLossPercentage(boundedPct.toString());
        }
        const priceMultiplier = isBuy ? Math.max(0, 1 - boundedPct / 100) : 1 + boundedPct / 100;
        const price = currentPrice * priceMultiplier;
        setStopLossPrice(price.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setStopLossAmount(amount.toFixed(2));
      }
      setTimeout(() => {
        isUpdatingStopLoss.current = false;
      }, 0);
    }
    // eslint-disable-next-line
  }, [stopLossPercentage, currentPrice, isBuy]);

  // Coordination: when amount changes, update price and %
  useEffect(() => {
    if (!currentPrice) return;
    if (isUpdatingStopLoss.current) return;
    const activeInputId = getActiveInputId();
    if (stopLossAmount !== '' && activeInputId === EXIT_INPUT_IDS.STOP_LOSS_AMOUNT) {
      isUpdatingStopLoss.current = true;
      const amount = parseFloat(stopLossAmount);
      if (!Number.isNaN(amount)) {
        // Amount is always positive distance
        const price = isBuy ? currentPrice - amount : currentPrice + amount;

        // Check validity - for buy, price cannot be negative
        const validPrice = Math.max(0, price);
        const validAmount = Math.abs(validPrice - currentPrice);

        if (validAmount !== amount) {
          setStopLossAmount(validAmount.toString());
        }

        setStopLossPrice(validPrice.toFixed(2));

        // Update percentage
        const pct = (validAmount / currentPrice) * 100;
        setStopLossPercentage(pct.toFixed(2));
      }
      setTimeout(() => {
        isUpdatingStopLoss.current = false;
      }, 0);
    }
  }, [stopLossAmount, currentPrice, isBuy]);

  // Coordination: when price changes, update % and amount
  useEffect(() => {
    if (!currentPrice) return;
    if (isUpdatingTakeProfit.current) return;
    const activeInputId = getActiveInputId();
    if (takeProfitPrice !== '' && activeInputId === EXIT_INPUT_IDS.TAKE_PROFIT_PRICE) {
      isUpdatingTakeProfit.current = true;
      const price = parseFloat(takeProfitPrice);
      if (!Number.isNaN(price) && currentPrice !== 0) {
        const pct = isBuy ? (price / currentPrice - 1) * 100 : (1 - price / currentPrice) * 100;
        const boundedPct = clampTakeProfitPercentageNumber(pct);
        setTakeProfitPercentage(boundedPct.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setTakeProfitAmount(amount.toFixed(2));
      }
      setTimeout(() => {
        isUpdatingTakeProfit.current = false;
      }, 0);
    }
    // eslint-disable-next-line
  }, [takeProfitPrice, currentPrice, isBuy]);

  useEffect(() => {
    if (!currentPrice) return;
    if (isUpdatingStopLoss.current) return;
    const activeInputId = getActiveInputId();
    if (stopLossPrice !== '' && activeInputId === EXIT_INPUT_IDS.STOP_LOSS_PRICE) {
      isUpdatingStopLoss.current = true;
      const price = parseFloat(stopLossPrice);
      if (!Number.isNaN(price) && currentPrice !== 0) {
        const pct = isBuy ? (1 - price / currentPrice) * 100 : (price / currentPrice - 1) * 100;
        const boundedPct = clampStopLossPercentageNumber(pct);
        setStopLossPercentage(boundedPct.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setStopLossAmount(amount.toFixed(2));
      }
      setTimeout(() => {
        isUpdatingStopLoss.current = false;
      }, 0);
    }
    // eslint-disable-next-line
  }, [stopLossPrice, currentPrice, isBuy]);

  // Recalculate prices when side changes
  useEffect(() => {
    if (!currentPrice) return;
    const activeInputId = getActiveInputId();

    // Recalculate take profit price if percentage exists
    if (takeProfitPercentage !== '' && activeInputId !== EXIT_INPUT_IDS.TAKE_PROFIT_PRICE && activeInputId !== EXIT_INPUT_IDS.TAKE_PROFIT_AMOUNT) {
      const pct = parseFloat(takeProfitPercentage);
      if (!Number.isNaN(pct)) {
        const boundedPct = clampTakeProfitPercentageNumber(pct);
        if (boundedPct !== pct) {
          setTakeProfitPercentage(boundedPct.toString());
        }
        const price = isBuy ? currentPrice * (1 + boundedPct / 100) : currentPrice * (1 - boundedPct / 100);
        setTakeProfitPrice(price.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setTakeProfitAmount(amount.toFixed(2));
      }
    }

    // Recalculate stop loss price if percentage exists
    if (stopLossPercentage !== '' && activeInputId !== EXIT_INPUT_IDS.STOP_LOSS_PRICE && activeInputId !== EXIT_INPUT_IDS.STOP_LOSS_AMOUNT) {
      const pct = parseFloat(stopLossPercentage);
      if (!Number.isNaN(pct)) {
        const boundedPct = clampStopLossPercentageNumber(pct);
        if (boundedPct !== pct) {
          setStopLossPercentage(boundedPct.toString());
        }
        const priceMultiplier = isBuy ? Math.max(0, 1 - boundedPct / 100) : 1 + boundedPct / 100;
        const price = currentPrice * priceMultiplier;
        setStopLossPrice(price.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setStopLossAmount(amount.toFixed(2));
      }
    }
    // eslint-disable-next-line
  }, [isBuy, currentPrice]);

  // Auto-update prices when live price changes (only if percentages are set)
  useEffect(() => {
    if (!currentPrice) return;
    const activeInputId = getActiveInputId();

    // Only update if the user has set percentages and we're not currently updating
    if (
      takeProfitPercentage !== '' &&
      !isUpdatingTakeProfit.current &&
      activeInputId !== EXIT_INPUT_IDS.TAKE_PROFIT_PRICE &&
      activeInputId !== EXIT_INPUT_IDS.TAKE_PROFIT_AMOUNT
    ) {
      const pct = parseFloat(takeProfitPercentage);
      if (!Number.isNaN(pct)) {
        const boundedPct = clampTakeProfitPercentageNumber(pct);
        if (boundedPct !== pct) {
          setTakeProfitPercentage(boundedPct.toString());
        }
        const price = isBuy ? currentPrice * (1 + boundedPct / 100) : currentPrice * (1 - boundedPct / 100);
        setTakeProfitPrice(price.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setTakeProfitAmount(amount.toFixed(2));
      }
    }

    if (stopLossPercentage !== '' && !isUpdatingStopLoss.current && activeInputId !== EXIT_INPUT_IDS.STOP_LOSS_PRICE && activeInputId !== EXIT_INPUT_IDS.STOP_LOSS_AMOUNT) {
      const pct = parseFloat(stopLossPercentage);
      if (!Number.isNaN(pct)) {
        const boundedPct = clampStopLossPercentageNumber(pct);
        if (boundedPct !== pct) {
          setStopLossPercentage(boundedPct.toString());
        }
        const priceMultiplier = isBuy ? Math.max(0, 1 - boundedPct / 100) : 1 + boundedPct / 100;
        const price = currentPrice * priceMultiplier;
        setStopLossPrice(price.toFixed(2));

        // Update amount
        const amount = Math.abs(price - currentPrice);
        setStopLossAmount(amount.toFixed(2));
      }
    }
    // eslint-disable-next-line
  }, [livePairPrice, isBuy, takeProfitPercentage, stopLossPercentage]);

  return (
    <Grid container spacing={1}>
      {/* Take Profit Section */}
      <Grid sx={{ pl: 1, pb: 2, mt: 2 }} xs={12}>
        <BorderedStack spacing={1} sx={{ padding: 2 }} title='Take Profit' titleColor='green'>
          <Grid container alignItems='center' spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  disabled={!isFormReady}
                  id={takeProfitDiffMode === 'percentage' ? 'take-profit-percent' : 'take-profit-amount'}
                  InputLabelProps={{
                    sx: {
                      color: !isFormReady ? theme.palette.text.disabled : undefined,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <Box
                          role='button'
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: isFormReady ? 'pointer' : 'default',
                            userSelect: 'none',
                            '&:hover': {
                              color: isFormReady ? 'text.primary' : 'text.disabled',
                            },
                          }}
                          tabIndex={0}
                          onClick={(e) => isFormReady && setTakeProfitMenuAnchor(e.currentTarget)}
                          onKeyDown={(e) => {
                            if (isFormReady && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              setTakeProfitMenuAnchor(e.currentTarget);
                            }
                          }}
                        >
                          <Typography sx={{ fontWeight: 'bold' }} variant='body2'>
                            {takeProfitDiffMode === 'percentage' ? '%' : '$'}
                          </Typography>
                          <ArrowDropDownIcon fontSize='small' />
                        </Box>
                        <Menu
                          anchorEl={takeProfitMenuAnchor}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          open={Boolean(takeProfitMenuAnchor)}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                          }}
                          onClose={() => setTakeProfitMenuAnchor(null)}
                        >
                          <MenuItem
                            onClick={() => {
                              setTakeProfitDiffMode('percentage');
                              setTakeProfitMenuAnchor(null);
                            }}
                          >
                            %
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setTakeProfitDiffMode('amount');
                              setTakeProfitMenuAnchor(null);
                            }}
                          >
                            $
                          </MenuItem>
                        </Menu>
                      </InputAdornment>
                    ),
                    inputComponent: NumericFormatCustom,
                    inputProps: {
                      inputMode: 'decimal',
                      min: 0,
                      step: 'any',
                      isAllowed: (values) => {
                        const { floatValue } = values;
                        if (floatValue === undefined) return true;
                        if (floatValue < 0) return false;
                        if (takeProfitDiffMode === 'percentage' && !isBuy && floatValue > 100) return false;
                        return true;
                      },
                    },
                    sx: {
                      '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                        display: 'none',
                      },
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                    },
                  }}
                  label={takeProfitDiffMode === 'percentage' ? 'Take Profit %' : 'Take Profit $'}
                  size='small'
                  value={takeProfitDiffMode === 'percentage' ? takeProfitPercentage : takeProfitAmount}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (takeProfitDiffMode === 'percentage') {
                      if (Number.isNaN(parseFloat(value))) {
                        setTakeProfitPercentage(value);
                        // If percentage is cleared, also clear price and amount
                        if (value === '') {
                          setTakeProfitPrice('');
                          setTakeProfitAmount('');
                        }
                      } else {
                        // For buy orders: floor at 0, no cap
                        // For sell orders: floor at 0, cap at 100
                        const cappedValue = isBuy
                          ? Math.max(0, parseFloat(value))
                          : Math.max(0, Math.min(100, parseFloat(value)));
                        setTakeProfitPercentage(cappedValue.toString());
                      }
                    } else if (Number.isNaN(parseFloat(value))) {
                      // Amount mode
                      setTakeProfitAmount(value);
                      if (value === '') {
                        setTakeProfitPrice('');
                        setTakeProfitPercentage('');
                      }
                    } else {
                      setTakeProfitAmount(value);
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                disabled={!isFormReady}
                id='take-profit-price'
                InputLabelProps={{
                  sx: {
                    color: !isFormReady ? theme.palette.text.disabled : undefined,
                  },
                }}
                InputProps={{
                  startAdornment: <Box component='span'>$</Box>,
                  inputComponent: NumericFormatCustom,
                  inputProps: {
                    inputMode: 'decimal',
                    step: 'any',
                  },
                  sx: {
                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                      display: 'none',
                    },
                    '& input[type=number]': {
                      MozAppearance: 'textfield',
                    },
                    ...(isTakeProfitPriceValid()
                      ? {}
                      : {
                        '& .MuiInputBase-input': {
                          color: theme.palette.error.main,
                        },
                        '& .MuiInputLabel-root': {
                          color: theme.palette.error.main,
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.palette.error.main,
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.error.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.error.main,
                          },
                        },
                      }),
                  },
                }}
                label='Take Profit Price'
                size='small'
                value={takeProfitPrice}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === '') {
                    setTakeProfitPrice('');
                    setTakeProfitPercentage('');
                    setTakeProfitAmount('');
                  } else {
                    setTakeProfitPrice(value);
                  }
                }}
              />
            </Grid>
          </Grid>
          <Grid container alignItems='center' spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography
                color={
                  calculateEstimatedProfit() !== null && calculateEstimatedProfit() !== 0
                    ? 'success.main'
                    : 'textSecondary'
                }
                variant='body2'
              >
                {calculateEstimatedProfit() !== null ? `~$${msAndKs(calculateEstimatedProfit(), 2)}` : 'N/A'} Max Profit
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography color='textSecondary' variant='body2'>
                {calculateFillChance(takeProfitPrice) !== null
                  ? `${calculateFillChance(takeProfitPrice).toFixed(2)}%`
                  : 'N/A'}{' '}
                Chance of 24h Fill
              </Typography>
            </Grid>
          </Grid>

          {/* Exit Condition Urgency Selector */}
          <Grid container alignItems='center' spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <ExitUrgencyPicker
                disabled={!isFormReady}
                setUrgency={setTakeProfitUrgency}
                urgency={takeProfitUrgency}
              />
            </Grid>
          </Grid>
        </BorderedStack>
      </Grid>

      {/* Stop Loss Section */}
      <Grid sx={{ pl: 1, pb: 2, mt: 2 }} xs={12}>
        <BorderedStack spacing={1} sx={{ padding: 2 }} title='Stop Loss' titleColor='red'>
          <Grid container alignItems='center' spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  disabled={!isFormReady}
                  id={stopLossDiffMode === 'percentage' ? 'stop-loss-percent' : 'stop-loss-amount'}
                  InputLabelProps={{
                    sx: {
                      color: !isFormReady ? theme.palette.text.disabled : undefined,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <Box
                          role='button'
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: isFormReady ? 'pointer' : 'default',
                            userSelect: 'none',
                            '&:hover': {
                              color: isFormReady ? 'text.primary' : 'text.disabled',
                            },
                          }}
                          tabIndex={0}
                          onClick={(e) => isFormReady && setStopLossMenuAnchor(e.currentTarget)}
                          onKeyDown={(e) => {
                            if (isFormReady && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              setStopLossMenuAnchor(e.currentTarget);
                            }
                          }}
                        >
                          <Typography sx={{ fontWeight: 'bold' }} variant='body2'>
                            {stopLossDiffMode === 'percentage' ? '%' : '$'}
                          </Typography>
                          <ArrowDropDownIcon fontSize='small' />
                        </Box>
                        <Menu
                          anchorEl={stopLossMenuAnchor}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          id='stop-loss-menu'
                          open={Boolean(stopLossMenuAnchor)}
                          PaperProps={{
                            sx: {
                              minWidth: theme.spacing(7.5),
                            },
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                          }}
                          onClose={() => setStopLossMenuAnchor(null)}
                        >
                          <MenuItem
                            onClick={() => {
                              setStopLossDiffMode('percentage');
                              setStopLossMenuAnchor(null);
                            }}
                          >
                            %
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setStopLossDiffMode('amount');
                              setStopLossMenuAnchor(null);
                            }}
                          >
                            $
                          </MenuItem>
                        </Menu>
                      </InputAdornment>
                    ),
                    inputComponent: NumericFormatCustom,
                    inputProps: {
                      inputMode: 'decimal',
                      min: 0,
                      step: 'any',
                      ...(isBuy && stopLossDiffMode === 'percentage' ? { max: 100 } : {}),
                      isAllowed: (values) => {
                        const { floatValue } = values;
                        if (floatValue === undefined) return true;
                        if (floatValue < 0) return false;
                        if (isBuy && stopLossDiffMode === 'percentage' && floatValue > 100) return false;
                        return true;
                      },
                    },
                    sx: {
                      '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                        display: 'none',
                      },
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                    },
                  }}
                  label={stopLossDiffMode === 'percentage' ? 'Stop Loss %' : 'Stop Loss $'}
                  size='small'
                  value={stopLossDiffMode === 'percentage' ? stopLossPercentage : stopLossAmount}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (stopLossDiffMode === 'percentage') {
                      if (Number.isNaN(parseFloat(value))) {
                        setStopLossPercentage(value);
                        // If percentage is cleared, also clear price and amount
                        if (value === '') {
                          setStopLossPrice('');
                          setStopLossAmount('');
                        }
                      } else {
                        // For buy orders: floor at 0, cap at 100
                        // For sell orders: floor at 0, no cap
                        const cappedValue = isBuy
                          ? Math.max(0, Math.min(100, parseFloat(value)))
                          : Math.max(0, parseFloat(value));
                        setStopLossPercentage(cappedValue.toString());
                      }
                    } else if (Number.isNaN(parseFloat(value))) {
                      // Amount mode
                      setStopLossAmount(value);
                      if (value === '') {
                        setStopLossPrice('');
                        setStopLossPercentage('');
                      }
                    } else {
                      setStopLossAmount(value);
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                disabled={!isFormReady}
                id='stop-loss-price'
                InputLabelProps={{
                  sx: {
                    color: !isFormReady ? theme.palette.text.disabled : undefined,
                  },
                }}
                InputProps={{
                  startAdornment: <Box component='span'>$</Box>,
                  inputComponent: NumericFormatCustom,
                  inputProps: {
                    inputMode: 'decimal',
                    step: 'any',
                  },
                  sx: {
                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                      display: 'none',
                    },
                    '& input[type=number]': {
                      MozAppearance: 'textfield',
                    },
                    ...(isStopLossPriceValid()
                      ? {}
                      : {
                        '& .MuiInputBase-input': {
                          color: theme.palette.error.main,
                        },
                        '& .MuiInputLabel-root': {
                          color: theme.palette.error.main,
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.palette.error.main,
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.error.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.error.main,
                          },
                        },
                      }),
                  },
                }}
                label='Stop Loss Price'
                size='small'
                value={stopLossPrice}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === '') {
                    setStopLossPrice('');
                    setStopLossPercentage('');
                    setStopLossAmount('');
                  } else {
                    setStopLossPrice(value);
                  }
                }}
              />
            </Grid>
          </Grid>

          <Grid container alignItems='center' spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography
                color={
                  calculateEstimatedLoss() !== null && calculateEstimatedLoss() > 0 ? 'error.main' : 'textSecondary'
                }
                variant='body2'
              >
                {calculateEstimatedLoss() !== null ? `~$${msAndKs(calculateEstimatedLoss(), 2)}` : 'N/A'} Max Loss
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography color='textSecondary' variant='body2'>
                {calculateFillChance(stopLossPrice) !== null
                  ? `${calculateFillChance(stopLossPrice).toFixed(2)}%`
                  : 'N/A'}{' '}
                Chance of 24h Fill
              </Typography>
            </Grid>
          </Grid>

          {/* Exit Condition Urgency Selector */}
          <Grid container alignItems='center' spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <ExitUrgencyPicker disabled={!isFormReady} setUrgency={setStopLossUrgency} urgency={stopLossUrgency} />
            </Grid>
          </Grid>
        </BorderedStack>
      </Grid>
    </Grid>
  );
}

export default ExitConditionsFields;
