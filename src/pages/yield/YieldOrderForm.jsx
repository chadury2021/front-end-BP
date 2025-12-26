import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  IconButton,
  OutlinedInput,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { SwapHoriz, WarningAmber } from '@mui/icons-material';
import { Loader } from '@/shared/Loader';
import { useTheme } from '@emotion/react';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import AccountDropdown from '@/shared/fields/AccountDropdown';
import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import { MultiOrderConfirmationModal } from '@/pages/dashboard/orderEntry/OrderConfirmationModal';
import { ignoreScrollEvent } from '@/util';
import { DashboardAccordianComponent } from '@/pages/dashboard/orderEntry/util';
import AggregatePreTradeAnalytics from '@/pages/multiOrder/AggregatePreTradeAnalytics';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { calculatePreTradeAnalytics } from '@/apiServices';
import { getQuoteCurrency } from '@/pages/yield/utils/yieldUtils';
import { useAccountBalanceContext } from '@/pages/dashboard/orderEntry/AccountBalanceContext';
import LabelTooltip from '@/shared/components/LabelTooltip';
import YieldAdvancedSettings from './components/YieldAdvancedSettings';
import YieldPairSelector from './YieldPairSelector';
import { useAccountSelection } from './hooks/useAccountSelection';
import { useYieldOrderForm } from './hooks/useYieldOrderForm';
import { useYieldPage } from './context/YieldPageContext';
import {
  durationStartTimeAtom,
  durationEndTimeAtom,
  formPageTypeAtom,
  dynamicLimitBpsFormatAtom,
} from './state/yieldFormAtoms';

export default function YieldOrderForm({
  // Account selector props
  accounts,
  selectedAccountName,
  accountsLoading,
  accountsError,
  onAccountSelect,
  // Order form props
  selectedAccount,
  accountsMap,
  tokenPairs,
  fundingRates,
  defaultStrategyId,
  strategies,
  strategyParams: strategyParamsProp,
  loading,
  error,
}) {
  const theme = useTheme();
  const { isDev } = useUserMetadata();
  const [preTradeAnalytics, setPreTradeAnalytics] = useState({ buy: null, sell: null });
  const {
    // Account data
    accounts: contextAccounts,
    selectedAccountName: contextSelectedAccountName,
    loading: contextLoading,
    error: contextError,
    // Order form data
    orderAccountsMap,
    tokenPairs: contextTokenPairs,
    defaultStrategyId: contextDefaultStrategyId,
    strategiesMap,
    strategyParams: contextStrategyParams,
    orderFormLoading,
    orderFormError,
    // Funding rates data
    fundingRates: contextFundingRates,
    fundingRatesLoading,
    fundingRatesError,
  } = useYieldPage();

  const { accountsMapForDropdown, handleAccountSelectChange } = useAccountSelection();

  const effectiveStrategies = strategies || strategiesMap;
  const effectiveStrategyParams = strategyParamsProp || contextStrategyParams;

  const {
    isBaseAsset,
    amount,
    selectedBase,
    modalOpen,
    confirmationData,
    confirmLoading,
    resolvedAccount,
    pairOptions,
    selectedOption,
    getCurrentAsset,
    swapAssetTooltip,
    setAmount,
    setSelectedBase,
    setModalOpen,
    swapAssetOnClick,
    handleSubmit,
    handleConfirmOrder,
    selectedStrategyId,
    selectedStrategyParams,
    selectedDuration,
    passiveness,
    discretion,
    exposureTolerance,
    alphaTilt,
    maxClipSize,
    orderCondition,
    isOrderConditionValidated,
    limitPriceSpread,
    isDynamicLimitCollapsed,
    advancedSettingsOpen,
    selectedStrategyName,
    selectedAccountExchangeNames,
    dynamicLimitFormState,
    setSelectedStrategyParams,
    setSelectedDuration,
    setPassiveness,
    setDiscretion,
    setExposureTolerance,
    setAlphaTilt,
    setMaxClipSize,
    setOrderCondition,
    setIsOrderConditionValidated,
    setLimitPriceSpread,
    setIsDynamicLimitCollapsed,
    setAdvancedSettingsOpen,
    handleSetTimeStart,
    handleResetDefaults,
    strategyParams: availableStrategyParams,
    showAlert,
  } = useYieldOrderForm({
    selectedAccount:
      selectedAccount ||
      contextAccounts.find((acc) => acc.name === (selectedAccountName || contextSelectedAccountName)),
    accountsMap: accountsMap || orderAccountsMap,
    tokenPairs: tokenPairs || contextTokenPairs,
    fundingRates: fundingRates || contextFundingRates,
    defaultStrategyId: defaultStrategyId || contextDefaultStrategyId,
    strategies: effectiveStrategies,
    strategyParams: effectiveStrategyParams,
  });

  // Ticker data for analytics and pre-trade net notional approximation
  const { tickerData } = useExchangeTicker();

  const effectiveFundingRates = fundingRates || contextFundingRates;
  const effectiveSelectedAccount = useMemo(
    () =>
      selectedAccount ||
      contextAccounts.find((acc) => acc.name === (selectedAccountName || contextSelectedAccountName)) ||
      null,
    [selectedAccount, contextAccounts, selectedAccountName, contextSelectedAccountName]
  );

  const quoteCurrency = useMemo(
    () => getQuoteCurrency(effectiveSelectedAccount?.exchangeName),
    [effectiveSelectedAccount?.exchangeName]
  );

  const resolvedQuoteCurrency = selectedOption?.spotPair?.quote || quoteCurrency;
  const perpQuoteCurrency = selectedOption?.perpPair?.quote || resolvedQuoteCurrency;

  const baseSymbol = selectedOption?.baseSymbol || '';
  const spotPairId =
    selectedOption?.spotPair?.id ||
    (baseSymbol && resolvedQuoteCurrency ? `${baseSymbol}-${resolvedQuoteCurrency}` : '');
  const perpPairId =
    selectedOption?.perpPair?.id || (baseSymbol && perpQuoteCurrency ? `${baseSymbol}:PERP-${perpQuoteCurrency}` : '');
  const spotTicker = spotPairId ? tickerData?.[spotPairId] : null;
  const perpTicker = perpPairId ? tickerData?.[perpPairId] : null;
  const spotPrice = spotTicker?.lastPrice ? Number(spotTicker.lastPrice) : null;
  const perpPrice = perpTicker?.lastPrice ? Number(perpTicker.lastPrice) : null;

  const numericAmount = useMemo(() => {
    if (!amount) return null;
    const parsed = Number(String(amount).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }, [amount]);

  const halfAllocation = useMemo(() => {
    if (numericAmount == null || numericAmount <= 0) return null;
    return numericAmount / 2;
  }, [numericAmount]);

  const [aggregatedOrderItems, analyticsPayload] = useMemo(() => {
    const defaultPayload = { shouldFetch: false, buyAttrs: [], sellAttrs: [] };
    const buyItem = dynamicLimitFormState?.buy?.[0];
    const sellItem = dynamicLimitFormState?.sell?.[0];

    if (!selectedOption || !buyItem || !sellItem || !halfAllocation) {
      return [{ buy: null, sell: null }, defaultPayload];
    }

    const allocationQty = halfAllocation.toString();

    const buildDisplayItem = (item, pairPrice) => ({
      ...item,
      qty: allocationQty,
      pair: {
        ...item?.pair,
        price: pairPrice ?? item?.pair?.price ?? '',
      },
    });

    const buyDisplayItem = buildDisplayItem(dynamicLimitFormState?.buy?.[0], spotPrice);
    const sellDisplayItem = buildDisplayItem(dynamicLimitFormState?.sell?.[0], perpPrice);

    const durationValue = Number(selectedDuration) || 900;
    const buyAccounts = (buyItem.accounts || []).map((acc) => acc?.exchangeName).filter(Boolean);
    const sellAccounts = (sellItem.accounts || []).map((acc) => acc?.exchangeName).filter(Boolean);
    const buyPairId = buyItem.pair?.id;
    const sellPairId = sellItem.pair?.id;

    if (!durationValue || !buyAccounts.length || !sellAccounts.length || !buyPairId || !sellPairId) {
      return [{ buy: buyDisplayItem, sell: sellDisplayItem }, defaultPayload];
    }

    const computeBaseQty = (isPerp) => {
      if (isBaseAsset) return halfAllocation;
      const price = isPerp ? perpPrice : spotPrice;
      if (!price || !Number.isFinite(price) || price <= 0) return null;
      return halfAllocation / price;
    };

    const buyBaseQty = computeBaseQty(false);
    const sellBaseQty = computeBaseQty(true);

    if (!buyBaseQty || !sellBaseQty || !Number.isFinite(buyBaseQty) || !Number.isFinite(sellBaseQty)) {
      return [{ buy: buyDisplayItem, sell: sellDisplayItem }, defaultPayload];
    }

    const analyticsData = {
      shouldFetch: true,
      buyAttrs: [
        {
          qty: buyBaseQty,
          pair: buyPairId,
          exchange_names: buyAccounts,
          duration: durationValue,
        },
      ],
      sellAttrs: [
        {
          qty: sellBaseQty,
          pair: sellPairId,
          exchange_names: sellAccounts,
          duration: durationValue,
        },
      ],
    };

    return [{ buy: buyDisplayItem, sell: sellDisplayItem }, analyticsData];
  }, [dynamicLimitFormState, selectedOption, halfAllocation, isBaseAsset, spotPrice, perpPrice, selectedDuration]);

  useEffect(() => {
    let isMounted = true;

    if (!analyticsPayload.shouldFetch) {
      if (isMounted) {
        setPreTradeAnalytics({ buy: null, sell: null });
      }
      return () => {
        isMounted = false;
      };
    }

    const fetchAnalytics = async () => {
      try {
        setPreTradeAnalytics({ buy: null, sell: null });
        const [buyResponse, sellResponse] = await Promise.all([
          calculatePreTradeAnalytics({ orderAttrs: analyticsPayload.buyAttrs, priceLookup: {} }),
          calculatePreTradeAnalytics({ orderAttrs: analyticsPayload.sellAttrs, priceLookup: {} }),
        ]);

        if (!isMounted) return;
        setPreTradeAnalytics({ buy: buyResponse || null, sell: sellResponse || null });
      } catch (analyticsError) {
        if (!isMounted) return;
        setPreTradeAnalytics({ buy: null, sell: null });
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [analyticsPayload]);

  const formAtoms = useMemo(
    () => ({
      durationStartTimeAtom,
      durationEndTimeAtom,
      formPageType: formPageTypeAtom,
    }),
    []
  );

  const effectiveAccounts = accounts || contextAccounts;
  const effectiveSelectedAccountName = selectedAccountName || contextSelectedAccountName;
  const effectiveAccountsLoading = accountsLoading || contextLoading;
  const effectiveAccountsError = accountsError || contextError;
  const effectiveLoading = loading || orderFormLoading || fundingRatesLoading;
  const effectiveError = error || orderFormError || fundingRatesError;

  const accountBalanceContext = useAccountBalanceContext();
  const {
    calculateAssetBalance,
    calculateMarginBalance,
    isBalanceLoading: isAccountBalanceLoading,
  } = accountBalanceContext || {};

  const accountOverrides = useMemo(() => {
    if (!resolvedAccount?.key || !resolvedAccount?.value) {
      return null;
    }
    return {
      selectedAccounts: [resolvedAccount.key],
      accounts: { [resolvedAccount.key]: resolvedAccount.value },
    };
  }, [resolvedAccount]);

  const cashBalanceInfo = useMemo(() => {
    if (!accountOverrides || !resolvedQuoteCurrency) {
      return { status: 'unavailable', message: 'N/A' };
    }

    if (!accountBalanceContext || typeof calculateAssetBalance !== 'function') {
      return { status: 'loading', message: 'Loading...' };
    }

    if (isAccountBalanceLoading) {
      return { status: 'loading', message: 'Loading...' };
    }

    const overrides = {
      ...accountOverrides,
      selectedPair: { market_type: 'spot' },
    };

    const value = calculateAssetBalance(resolvedQuoteCurrency, overrides);
    if (!Number.isFinite(value)) {
      return { status: 'error', message: 'Balance unavailable' };
    }

    return { status: 'value', value };
  }, [accountBalanceContext, accountOverrides, calculateAssetBalance, isAccountBalanceLoading, resolvedQuoteCurrency]);

  const marginBalanceInfo = useMemo(() => {
    if (!accountOverrides || !perpQuoteCurrency || !selectedOption?.perpPair) {
      return { status: 'unavailable', message: 'N/A' };
    }

    if (!accountBalanceContext || typeof calculateMarginBalance !== 'function') {
      return { status: 'loading', message: 'Loading...' };
    }

    if (isAccountBalanceLoading) {
      return { status: 'loading', message: 'Loading...' };
    }

    const overrides = {
      ...accountOverrides,
      selectedPair: {
        ...(selectedOption?.perpPair || {}),
        market_type: selectedOption?.perpPair?.market_type || 'perp',
      },
    };

    const value = calculateMarginBalance(perpQuoteCurrency, overrides);
    if (!Number.isFinite(value)) {
      return { status: 'error', message: 'Balance unavailable' };
    }

    return { status: 'value', value };
  }, [
    accountBalanceContext,
    accountOverrides,
    calculateMarginBalance,
    isAccountBalanceLoading,
    perpQuoteCurrency,
    selectedOption?.perpPair,
  ]);

  const convertBaseToQuote = (baseAmount, priceCandidates = []) => {
    if (!baseAmount || baseAmount <= 0) return null;
    const validCandidate = priceCandidates.find((candidate) => {
      const numericCandidate = Number(candidate);
      return Number.isFinite(numericCandidate) && numericCandidate > 0;
    });
    if (validCandidate) {
      return baseAmount * Number(validCandidate);
    }
    return null;
  };

  const halfQuoteNotional = useMemo(() => {
    if (!numericAmount || numericAmount <= 0) return null;
    const half = numericAmount / 2;
    if (!isBaseAsset) {
      return half;
    }

    return convertBaseToQuote(half, [
      spotPrice,
      perpPrice,
      selectedOption?.spotPair?.price,
      selectedOption?.perpPair?.price,
    ]);
  }, [
    isBaseAsset,
    numericAmount,
    spotPrice,
    perpPrice,
    selectedOption?.spotPair?.price,
    selectedOption?.perpPair?.price,
  ]);

  const spotRequiredNotional = halfQuoteNotional;
  const perpRequiredNotional = halfQuoteNotional;

  const numericCashBalance = useMemo(() => {
    if (cashBalanceInfo.status !== 'value') return null;
    const parsed = Number(cashBalanceInfo.value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [cashBalanceInfo]);

  const numericMarginBalance = useMemo(() => {
    if (marginBalanceInfo.status !== 'value') return null;
    const parsed = Number(marginBalanceInfo.value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [marginBalanceInfo]);

  const isCashInsufficient = useMemo(() => {
    if (numericCashBalance == null) return false;
    if (spotRequiredNotional == null) return false;
    return numericCashBalance < spotRequiredNotional;
  }, [numericCashBalance, spotRequiredNotional]);

  const isMarginInsufficient = useMemo(() => {
    if (numericMarginBalance == null) return false;
    if (perpRequiredNotional == null) return false;
    return numericMarginBalance < perpRequiredNotional;
  }, [numericMarginBalance, perpRequiredNotional]);

  const formatBalanceValue = (info) => {
    if (info.status === 'loading') return 'Loading...';
    if (info.status === 'error') return info.message;
    if (info.status === 'unavailable') return info.message;
    return Number(info.value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  };

  const getBalanceColor = (info, forceWarning = false) => {
    if (forceWarning) return 'warning.main';
    if (info.status === 'error') return 'warning.main';
    if (info.status === 'loading' || info.status === 'unavailable') return 'text.secondary';
    return 'text.primary';
  };

  // Check if yield trading is available (dev only)
  if (!isDev) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Typography color='text.secondary' variant='h6'>
              Yield trading is not available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const noArrowStyle = {
    '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    'input[type=number]': {
      MozAppearance: 'textfield',
    },
  };

  const renderAccountSelector = () => {
    if (effectiveAccountsLoading) {
      return <Loader />;
    }

    if (effectiveAccountsError) {
      return <Alert severity='error'>{effectiveAccountsError}</Alert>;
    }

    if (!effectiveAccounts.length) {
      return (
        <Typography color='text.secondary'>
          Connect a Bybit, Binance, OKX, Hyperliquid, or Gate account to view yield analytics.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        <AccountDropdown
          simpleChip
          accounts={accountsMapForDropdown}
          handleSelectedAccountsChange={handleAccountSelectChange}
          handleSelectedAccountsDelete={() => onAccountSelect?.('')}
          multiple={false}
          selectedAccounts={effectiveSelectedAccountName}
        />
      </Stack>
    );
  };

  const renderOrderForm = () => {
    if (!effectiveSelectedAccount) {
      return (
        <Typography color='text.secondary' variant='body2'>
          Select an account to view available funding pairs.
        </Typography>
      );
    }

    if (!resolvedAccount) {
      return (
        <Typography color='text.secondary' variant='body2'>
          The selected account is not enabled for multi-order execution yet.
        </Typography>
      );
    }

    if (!pairOptions.length) {
      return (
        <Typography color='text.secondary' variant='body2'>
          No funding pairs with both spot and perp markets are available for {effectiveSelectedAccount.exchangeName}{' '}
          yet.
        </Typography>
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <YieldPairSelector
            pairOptions={pairOptions}
            selectedBase={selectedBase}
            selectedOption={selectedOption}
            onPairChange={setSelectedBase}
          />

          <Box>
            <Typography color='text.secondary' sx={{ mb: 1 }} variant='subtitle2'>
              Allocation
            </Typography>
            <FormControl
              fullWidth
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
              variant='outlined'
            >
              <Box width='100%'>
                <OutlinedInput
                  fullWidth
                  disabled={!selectedOption}
                  endAdornment={
                    <>
                      <Typography
                        sx={{ display: selectedOption ? 'inline' : 'none', fontSize: '0.8rem' }}
                        variant='body2'
                      >
                        {getCurrentAsset()}
                      </Typography>
                      <Tooltip title={swapAssetTooltip}>
                        <span>
                          <IconButton disabled={!selectedOption} onClick={swapAssetOnClick}>
                            <SwapHoriz />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  }
                  inputComponent={NumericFormatCustom}
                  inputProps={{
                    step: 'any',
                  }}
                  placeholder={isBaseAsset ? 'Enter base amount' : 'Enter quote amount'}
                  style={{ paddingRight: 0 }}
                  sx={noArrowStyle}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  onWheel={ignoreScrollEvent}
                />
              </Box>
            </FormControl>
            <Box sx={{ mt: 1.5 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography color='text.secondary' variant='caption'>
                    Spot Cash ({resolvedQuoteCurrency || '—'})
                  </Typography>
                  <Typography color={getBalanceColor(cashBalanceInfo, isCashInsufficient)} variant='body2'>
                    {formatBalanceValue(cashBalanceInfo)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Tooltip title='Please verify actual margin on your exchange website before trading'>
                    <Typography
                      color='text.secondary'
                      sx={{
                        textDecoration: 'underline dotted',
                        textDecorationColor: 'text.disabled',
                        textDecorationThickness: '1px',
                        textUnderlineOffset: '2px',
                        cursor: 'help',
                      }}
                      variant='caption'
                    >
                      Perp Margin ({perpQuoteCurrency || '—'})
                    </Typography>
                  </Tooltip>
                  <Typography color={getBalanceColor(marginBalanceInfo, isMarginInsufficient)} variant='body2'>
                    {formatBalanceValue(marginBalanceInfo)}
                  </Typography>
                </Box>
              </Stack>
              {(isCashInsufficient || isMarginInsufficient) && (
                <Stack alignItems='center' direction='row' spacing={1} sx={{ mt: 1 }}>
                  <WarningAmber color='warning' fontSize='small' />
                  <Typography color='warning.main' variant='caption'>
                    Insufficient balance for one or both legs.
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>

          <Box sx={{ width: '100%' }}>
            <DashboardAccordianComponent
              isAlgo
              isOpen={advancedSettingsOpen}
              setIsOpen={setAdvancedSettingsOpen}
              title='Advanced Settings'
            >
              <YieldAdvancedSettings
                alphaTilt={alphaTilt}
                discretion={discretion}
                dynamicLimitFormatAtom={dynamicLimitBpsFormatAtom}
                dynamicLimitFormState={dynamicLimitFormState}
                exposureTolerance={exposureTolerance}
                FormAtoms={formAtoms}
                isDynamicLimitCollapsed={isDynamicLimitCollapsed}
                isOrderConditionValidated={isOrderConditionValidated}
                limitPriceSpread={limitPriceSpread}
                maxClipSize={maxClipSize}
                orderCondition={orderCondition}
                passiveness={passiveness}
                selectedAccountExchangeNames={selectedAccountExchangeNames}
                selectedDuration={selectedDuration}
                selectedStrategyName={selectedStrategyName}
                selectedStrategyParams={selectedStrategyParams}
                setAlphaTilt={setAlphaTilt}
                setDiscretion={setDiscretion}
                setExposureTolerance={setExposureTolerance}
                setIsDynamicLimitCollapsed={setIsDynamicLimitCollapsed}
                setIsOrderConditionValidated={setIsOrderConditionValidated}
                setLimitPriceSpread={setLimitPriceSpread}
                setMaxClipSize={setMaxClipSize}
                setOrderCondition={setOrderCondition}
                setPassiveness={setPassiveness}
                setSelectedDuration={setSelectedDuration}
                setSelectedStrategyParams={setSelectedStrategyParams}
                setTimeStart={handleSetTimeStart}
                showAlert={showAlert}
                strategyParams={availableStrategyParams}
                onResetDefaults={handleResetDefaults}
              />
            </DashboardAccordianComponent>
          </Box>

          {/* Yield-specific analytics with proper aggregation */}
          {selectedOption && (
            <AggregatePreTradeAnalytics
              buyData={preTradeAnalytics.buy}
              buyOrderItems={aggregatedOrderItems.buy ? [aggregatedOrderItems.buy] : []}
              hasBalanceShortfall={isCashInsufficient || isMarginInsufficient}
              sellData={preTradeAnalytics.sell}
              sellOrderItems={aggregatedOrderItems.sell ? [aggregatedOrderItems.sell] : []}
              theme={theme}
            />
          )}

          <Button color='success' disabled={confirmLoading} size='large' type='submit' variant='contained'>
            Submit Order
          </Button>
        </Stack>
      </form>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* Fixed Header Section */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack spacing={3}>
            {/* Account Selection Section */}
            <Box>
              <Typography variant='h6'>Account Selection</Typography>
            </Box>

            {renderAccountSelector()}

            <Divider />

            {/* Order Form Section */}
            <Box>
              <Typography variant='h6'>Automated Funding Arbitrage</Typography>
              <Typography color='text.secondary' variant='body2'>
                Deploy a delta-neutral strategy to capture funding yield.
              </Typography>
            </Box>

            <Box>
              {effectiveError && <Alert severity='error'>{effectiveError}</Alert>}
              {effectiveLoading && <Loader />}
            </Box>
          </Stack>
        </Box>

        {/* Scrollable Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 3,
            pb: 3,
            scrollbarGutter: 'stable',
          }}
        >
          {!effectiveError && !effectiveLoading && renderOrderForm()}
        </Box>
      </CardContent>
      <MultiOrderConfirmationModal
        data={confirmationData}
        handleConfirm={handleConfirmOrder}
        handleEdit={() => setModalOpen(false)}
        open={modalOpen}
        setOpen={setModalOpen}
        submitLoading={confirmLoading}
      />
    </Card>
  );
}
