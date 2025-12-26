import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { calculatePeriodRate } from '@/pages/explore/utils';
import { ApiError, openInNewTab, submitMultiOrder } from '@/apiServices';
import { BASEURL, smartRound } from '@/util';
import { useAtomValue, useSetAtom } from 'jotai';
import { fetchPreviewPrice } from '@/pages/multiOrder/util';
import { getQuoteCurrency, normalize } from '@/pages/yield/utils/yieldUtils';
import {
  durationStartTimeAtom,
  durationEndTimeAtom,
  formPageTypeAtom,
  dynamicLimitBpsFormatAtom,
} from '../state/yieldFormAtoms';
import { useYieldPage } from '../context/YieldPageContext';

// Constants
const PRECISION_MULTIPLIER = 1e8;
const DEFAULT_FUNDING_INTERVAL = 4;
const DEFAULT_STRATEGY_DURATION = 900;
const DEFAULT_ENGINE_PASSIVENESS = 0.02;
const DEFAULT_SCHEDULE_DISCRETION = 0.06;
const DEFAULT_EXPOSURE_TOLERANCE = 0.1;
const DEFAULT_ALPHA_TILT = 0;
const DEFAULT_LIMIT_PRICE_SPREAD = 0;

function resolveAccount(selectedAccount, orderAccounts = {}) {
  if (!selectedAccount) return null;
  const entries = Object.entries(orderAccounts);
  const byId = entries.find(([, account]) => String(account.id) === String(selectedAccount.accountId));
  if (byId) {
    return { key: byId[0], value: byId[1] };
  }

  if (orderAccounts[selectedAccount.accountName]) {
    return { key: selectedAccount.accountName, value: orderAccounts[selectedAccount.accountName] };
  }

  return null;
}

function buildPairOptions({ fundingRates, tokenPairs, exchangeName }) {
  if (!exchangeName || !Array.isArray(fundingRates) || !Array.isArray(tokenPairs)) {
    return [];
  }

  const normalizedExchange = normalize(exchangeName);
  const quoteCurrency = getQuoteCurrency(exchangeName);

  const tokenPairsById = new Map();
  tokenPairs.forEach((pair) => {
    if (!pair?.id) return;
    const supportsExchange = (pair.exchanges || []).some((ex) => normalize(ex) === normalizedExchange);
    if (supportsExchange) {
      tokenPairsById.set(pair.id, pair);
    }
  });

  const optionsMap = new Map();

  fundingRates.forEach((rateEntry) => {
    if (!rateEntry) return;
    if (normalize(rateEntry.exchange) !== normalizedExchange) return;

    const baseSymbol = rateEntry.pair;
    if (!baseSymbol) return;

    const spotId = `${baseSymbol}-${quoteCurrency}`;
    const perpId = `${baseSymbol}:PERP-${quoteCurrency}`;

    const spotPair = tokenPairsById.get(spotId);
    const perpPair = tokenPairsById.get(perpId);

    if (!spotPair || !perpPair) {
      return;
    }

    const interval =
      Number(rateEntry.funding_rate_interval ?? rateEntry.interval ?? DEFAULT_FUNDING_INTERVAL) ||
      DEFAULT_FUNDING_INTERVAL;
    const rate = Number(rateEntry.rate) || 0;
    const annualizedRate = calculatePeriodRate(rate, interval, 'year');

    if (!optionsMap.has(baseSymbol) || optionsMap.get(baseSymbol).annualizedRate < annualizedRate) {
      optionsMap.set(baseSymbol, {
        baseSymbol,
        displayLabel: `${baseSymbol} / ${quoteCurrency}`,
        spotPair,
        perpPair,
        rate,
        interval,
        annualizedRate,
      });
    }
  });

  return Array.from(optionsMap.values()).sort((a, b) => b.annualizedRate - a.annualizedRate);
}

export function useYieldOrderForm({
  selectedAccount,
  accountsMap,
  tokenPairs,
  fundingRates,
  defaultStrategyId,
  strategies,
  strategyParams = [],
}) {
  const { showAlert } = useContext(ErrorContext);
  const { setSelectedPerpOption, pendingMatrixSelection, setPendingMatrixSelection } = useYieldPage();

  const setDurationStartAtom = useSetAtom(durationStartTimeAtom);
  const setDurationEndAtom = useSetAtom(durationEndTimeAtom);
  const setFormPageType = useSetAtom(formPageTypeAtom);
  const isDynamicLimitInBps = useAtomValue(dynamicLimitBpsFormatAtom);

  const [isBaseAsset, setIsBaseAsset] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedBase, setSelectedBase] = useState(() => {
    // Try to get last selected pair for the current account
    if (selectedAccount?.accountId) {
      const saved = localStorage.getItem(`yield-last-selected-pair-${selectedAccount.accountId}`);
      return saved || '';
    }
    return '';
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [selectedStrategyId, setSelectedStrategyId] = useState(defaultStrategyId ?? null);
  const [selectedStrategyParams, setSelectedStrategyParams] = useState({});
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_STRATEGY_DURATION);
  const [passiveness, setPassiveness] = useState(DEFAULT_ENGINE_PASSIVENESS);
  const [discretion, setDiscretion] = useState(DEFAULT_SCHEDULE_DISCRETION);
  const [exposureTolerance, setExposureTolerance] = useState(DEFAULT_EXPOSURE_TOLERANCE);
  const [alphaTilt, setAlphaTilt] = useState(DEFAULT_ALPHA_TILT);
  const [maxClipSize, setMaxClipSize] = useState(null);
  const [orderCondition, setOrderCondition] = useState('');
  const [isOrderConditionValidated, setIsOrderConditionValidated] = useState(false);
  const [limitPriceSpread, setLimitPriceSpread] = useState(DEFAULT_LIMIT_PRICE_SPREAD);
  const [isDynamicLimitCollapsed, setIsDynamicLimitCollapsed] = useState(true);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [startTimeIso, setStartTimeIso] = useState(null);

  useEffect(() => {
    setFormPageType('YieldPage');
  }, [setFormPageType]);

  // Save selected pair to localStorage whenever it changes
  useEffect(() => {
    if (selectedBase && selectedAccount?.accountId) {
      localStorage.setItem(`yield-last-selected-pair-${selectedAccount.accountId}`, selectedBase);
    }
  }, [selectedBase, selectedAccount?.accountId]);

  const resolvedAccount = useMemo(() => resolveAccount(selectedAccount, accountsMap), [accountsMap, selectedAccount]);

  const pairOptions = useMemo(
    () => buildPairOptions({ fundingRates, tokenPairs, exchangeName: selectedAccount?.exchangeName }),
    [fundingRates, tokenPairs, selectedAccount?.exchangeName]
  );

  useEffect(() => {
    if (!pairOptions.length) {
      setSelectedBase('');
      return;
    }

    // Try to restore last selected pair for this account, fallback to first available
    const lastSelectedPair = selectedAccount?.accountId
      ? localStorage.getItem(`yield-last-selected-pair-${selectedAccount.accountId}`)
      : null;

    const validLastPair = lastSelectedPair && pairOptions.some((option) => option.baseSymbol === lastSelectedPair);
    const pairToSelect = validLastPair ? lastSelectedPair : pairOptions[0].baseSymbol;

    setSelectedBase(pairToSelect);
  }, [pairOptions, selectedAccount?.accountId]);

  // Always use TWAP strategy for yield orders
  useEffect(() => {
    if (strategies) {
      const twapStrategy = Object.entries(strategies).find(([, strategy]) => strategy?.name === 'TWAP');
      if (twapStrategy) {
        setSelectedStrategyId(twapStrategy[0]);
      }
    }
  }, [strategies]);

  useEffect(() => {
    setAmount('');
    setOrderCondition('');
    setIsOrderConditionValidated(false);
    setLimitPriceSpread(DEFAULT_LIMIT_PRICE_SPREAD);
    setStartTimeIso(null);
    setDurationStartAtom(undefined);
    setDurationEndAtom(undefined);
  }, [selectedAccount?.accountId, setDurationEndAtom, setDurationStartAtom]);

  const selectedOption = useMemo(
    () => pairOptions.find((option) => option.baseSymbol === selectedBase) || null,
    [pairOptions, selectedBase]
  );

  const resolvedQuoteCurrency = useMemo(() => {
    if (selectedOption?.spotPair?.quote) {
      return selectedOption.spotPair.quote;
    }
    return getQuoteCurrency(selectedAccount?.exchangeName);
  }, [selectedAccount?.exchangeName, selectedOption?.spotPair?.quote]);

  useEffect(() => {
    setSelectedPerpOption(selectedOption);
  }, [selectedOption, setSelectedPerpOption]);

  useEffect(() => {
    if (!pendingMatrixSelection) return;

    const { baseSymbol, exchange } = pendingMatrixSelection;
    const selectionExchange = normalize(exchange);
    const accountExchange = normalize(selectedAccount?.exchangeName);

    if (selectionExchange && accountExchange && selectionExchange !== accountExchange) {
      return;
    }

    const matchingOption = pairOptions.find((option) => option.baseSymbol === baseSymbol);
    if (!matchingOption) {
      return;
    }

    setSelectedBase(baseSymbol);
    setPendingMatrixSelection(null);
  }, [pairOptions, pendingMatrixSelection, selectedAccount?.exchangeName, setPendingMatrixSelection, setSelectedBase]);

  const selectedStrategyName = useMemo(() => {
    if (!selectedStrategyId || !strategies) {
      return '';
    }
    return strategies[selectedStrategyId]?.name || '';
  }, [selectedStrategyId, strategies]);

  const selectedAccountExchangeNames = useMemo(() => {
    const exchangeName = resolvedAccount?.value?.exchangeName;
    return exchangeName ? [exchangeName] : [];
  }, [resolvedAccount]);

  const dynamicLimitFormState = useMemo(() => {
    const accountEntry = resolvedAccount?.value ? [resolvedAccount.value] : [];

    const buildPair = (pair) => {
      if (!pair) {
        return { base: '', id: '', label: '', quote: '', is_inverse: false, is_contract: false, price: '' };
      }
      return {
        base: pair.base ?? '',
        id: pair.id ?? pair.name ?? '',
        label: pair.label ?? pair.id ?? '',
        quote: pair.quote ?? '',
        is_inverse: Boolean(pair.is_inverse),
        is_contract: Boolean(pair.is_contract),
        price: pair.price ?? '',
      };
    };

    return {
      buy: [
        {
          accounts: accountEntry,
          isBaseAsset,
          pair: buildPair(selectedOption?.spotPair),
          qty: amount ? String(amount) : '',
          side: 'buy',
        },
      ],
      sell: [
        {
          accounts: accountEntry,
          isBaseAsset,
          pair: buildPair(selectedOption?.perpPair),
          qty: amount ? String(amount) : '',
          side: 'sell',
        },
      ],
    };
  }, [amount, isBaseAsset, resolvedAccount, selectedOption]);

  useEffect(() => {
    setIsOrderConditionValidated(false);
  }, [orderCondition]);

  const getCurrentAsset = () => {
    if (!selectedOption) return '';
    return isBaseAsset ? selectedOption.baseSymbol : resolvedQuoteCurrency;
  };

  const swapAssetOnClick = () => {
    setIsBaseAsset((prev) => !prev);
    setAmount('');
  };

  const swapAssetTooltip = (() => {
    if (!selectedOption) return '';
    if (isBaseAsset) {
      return `Swap asset to ${resolvedQuoteCurrency}`;
    }
    return `Swap asset to ${selectedOption.baseSymbol}`;
  })();

  const handleSetTimeStart = useCallback((value) => {
    setStartTimeIso(value);
  }, []);

  const handleResetDefaults = useCallback(() => {
    setSelectedDuration(DEFAULT_STRATEGY_DURATION);
    setPassiveness(DEFAULT_ENGINE_PASSIVENESS);
    setDiscretion(DEFAULT_SCHEDULE_DISCRETION);
    setExposureTolerance(DEFAULT_EXPOSURE_TOLERANCE);
    setAlphaTilt(DEFAULT_ALPHA_TILT);
    setMaxClipSize(null);
    setSelectedStrategyParams({});
    setOrderCondition('');
    setIsOrderConditionValidated(false);
    setLimitPriceSpread(DEFAULT_LIMIT_PRICE_SPREAD);
    setStartTimeIso(null);
    setDurationStartAtom(undefined);
    setDurationEndAtom(undefined);
    setIsDynamicLimitCollapsed(true);
  }, [setDurationEndAtom, setDurationStartAtom, setSelectedStrategyParams]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedAccount) {
        showAlert({ severity: 'warning', message: 'Select an account before submitting.' });
        return;
      }
      if (!resolvedAccount) {
        showAlert({ severity: 'error', message: 'Selected account is unavailable for trading.' });
        return;
      }
      if (!selectedOption) {
        showAlert({ severity: 'warning', message: 'Choose a funding pair before submitting.' });
        return;
      }

      const numericAmount = Number(String(amount).replace(/,/g, ''));
      if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        showAlert({ severity: 'warning', message: 'Enter a positive amount to allocate.' });
        return;
      }

      // Always use TWAP strategy for yield orders
      const twapStrategy = strategies
        ? Object.entries(strategies).find(([, strategy]) => strategy?.name === 'TWAP')
        : null;
      const strategyId = twapStrategy ? twapStrategy[0] : null;

      if (!strategyId) {
        showAlert({ severity: 'error', message: 'TWAP strategy is not available for this order.' });
        return;
      }

      const halfAmount = numericAmount / 2;
      const halfAmountRounded = Math.round(halfAmount * PRECISION_MULTIPLIER) / PRECISION_MULTIPLIER;
      const halfAmountStr = halfAmountRounded.toString();

      const qtyField = isBaseAsset ? 'base_asset_qty' : 'quote_asset_qty';

      const safeNumber = (value, fallback) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const durationSeconds = safeNumber(selectedDuration, DEFAULT_STRATEGY_DURATION);
      const enginePassiveness = safeNumber(passiveness, DEFAULT_ENGINE_PASSIVENESS);
      const scheduleDiscretion = safeNumber(discretion, DEFAULT_SCHEDULE_DISCRETION);
      const tolerance = safeNumber(exposureTolerance, DEFAULT_EXPOSURE_TOLERANCE);
      const tilt = safeNumber(alphaTilt, DEFAULT_ALPHA_TILT);

      let limitSpreadValue = 0;
      const rawLimitSpread = Number(limitPriceSpread);
      if (!Number.isNaN(rawLimitSpread) && rawLimitSpread !== 0) {
        if (isDynamicLimitInBps) {
          const exchangeName = resolvedAccount.value?.exchangeName;
          const perpPairId = selectedOption.perpPair?.id;
          if (!exchangeName || !perpPairId) {
            showAlert({
              severity: 'error',
              message: 'Unable to calculate BPS spread without a valid perpetual market.',
            });
            return;
          }
          const previewPrice = await fetchPreviewPrice(exchangeName, perpPairId, showAlert);
          if (!previewPrice || previewPrice <= 0) {
            showAlert({
              severity: 'error',
              message: 'Unable to convert spread from bps to price.',
            });
            return;
          }
          limitSpreadValue = smartRound((rawLimitSpread / 10000) * previewPrice, 10);
        } else {
          limitSpreadValue = rawLimitSpread;
        }
      }

      const strategyParamsPayload = { ...(selectedStrategyParams || {}) };
      if (maxClipSize !== null && maxClipSize !== '') {
        strategyParamsPayload.max_clip_size = maxClipSize;
      } else {
        delete strategyParamsPayload.max_clip_size;
      }

      const basePayload = {
        strategy: strategyId,
        duration: Number.isFinite(durationSeconds) ? durationSeconds : DEFAULT_STRATEGY_DURATION,
        engine_passiveness: enginePassiveness,
        schedule_discretion: scheduleDiscretion,
        exposure_tolerance: tolerance,
        alpha_tilt: tilt,
        strategy_params: strategyParamsPayload,
        order_condition: orderCondition || null,
        child_orders: [
          {
            accounts: [resolvedAccount.key],
            pair: selectedOption.spotPair.id,
            side: 'buy',
            [qtyField]: halfAmountStr,
            note: 'Funding Rate Arbitrage Order',
          },
          {
            accounts: [resolvedAccount.key],
            pair: selectedOption.perpPair.id,
            side: 'sell',
            [qtyField]: halfAmountStr,
            note: 'Funding Rate Arbitrage Order',
          },
        ],
        strategies: strategies || {},
        accounts: accountsMap,
        limit_price_spread: limitSpreadValue,
        start_datetime: startTimeIso,
      };

      setConfirmationData(basePayload);
      setModalOpen(true);
    },
    [
      accountsMap,
      alphaTilt,
      amount,
      defaultStrategyId,
      discretion,
      exposureTolerance,
      isBaseAsset,
      isDynamicLimitInBps,
      limitPriceSpread,
      orderCondition,
      passiveness,
      resolvedAccount,
      selectedAccount,
      selectedDuration,
      selectedOption,
      selectedStrategyId,
      selectedStrategyParams,
      showAlert,
      startTimeIso,
      strategies,
    ]
  );

  const handleConfirmOrder = async (event) => {
    event?.preventDefault?.();
    if (!confirmationData) return;

    setConfirmLoading(true);
    try {
      const response = await submitMultiOrder(confirmationData);
      if (response?.id) {
        showAlert({ severity: 'success', message: 'Funding arbitrage order submitted successfully.' });
        openInNewTab(`${BASEURL}/multi_order/${response.id}`);
        setAmount('');
        setModalOpen(false);
        setConfirmationData(null);
      } else {
        showAlert({ severity: 'error', message: 'Unable to submit order. Please try again.' });
      }
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ severity: 'error', message: e.message });
      } else {
        showAlert({ severity: 'error', message: 'Unexpected error while submitting the order.' });
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  return {
    // State
    isBaseAsset,
    amount,
    selectedBase,
    modalOpen,
    confirmationData,
    confirmLoading,
    resolvedAccount,
    pairOptions,
    selectedOption,
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
    startTimeIso,

    // Computed values
    getCurrentAsset,
    swapAssetTooltip,
    selectedStrategyName,
    selectedAccountExchangeNames,
    dynamicLimitFormState,

    // Actions
    setAmount,
    setSelectedBase,
    setModalOpen,
    swapAssetOnClick,
    handleSubmit,
    handleConfirmOrder,
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

    // Shared config
    strategyParams,
    showAlert,
  };
}
