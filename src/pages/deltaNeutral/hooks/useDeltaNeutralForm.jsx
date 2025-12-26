import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { calculateDurationForPov, getPairPrice, submitMultiOrder } from '@/apiServices';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useToast } from '@/shared/context/ToastProvider';
import { useSound } from '@/hooks/useSound';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { getSupportedChains } from '@/shared/dexUtils';
import resolveExchangeName from '@/shared/utils/resolveExchangeName';
import { getPairVariant } from '@/util';

const MIN_TOTAL_NOTIONAL = 500;

const MODES = [
  { value: 'aggressive', label: 'Aggressive', urgency: 'HIGH', povTarget: 0.25, passiveness: 0.02, minDuration: 5 },
  { value: 'normal', label: 'Normal', urgency: 'MEDIUM', povTarget: 0.1, passiveness: 0.03, minDuration: 15 },
  { value: 'passive', label: 'Passive', urgency: 'LOW', povTarget: 0.025, passiveness: 0.06, minDuration: 30 },
];

const DEFAULT_BUILDER_FEE = 0.0002; // 2 bps

function estimateMakerFee({ exchangeName, pair }) {
  if (!exchangeName || !pair) return 0.0002; // default 2 bps
  if (exchangeName === 'Hyperliquid') {
    const isPerp = getPairVariant(pair) === 'PERP';
    return isPerp ? 0.00015 : 0.0002; // 1.5 bps perps, 2 bps spot
  }
  if (exchangeName === 'Aster') return 0.00005; // 0.5 bps
  if (exchangeName === 'Pacifica') return 0.00015; // 1.5 bps
  return 0.0002;
}

export default function useDeltaNeutralForm() {
  const { initialLoadValue, FormAtoms } = useOrderForm();
  const { accounts = {}, tokenPairs = [] } = initialLoadValue;
  const [longAccount, setLongAccount] = useState(null);
  const [shortAccount, setShortAccount] = useState(null);
  const [longPair, setLongPair] = useState(null);
  const [shortPair, setShortPair] = useState(null);
  const [notional, setNotional] = useState('');
  const [mode, setMode] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [durationsByMode, setDurationsByMode] = useState({
    aggressive: MODES[0].minDuration,
    normal: MODES[1].minDuration,
    passive: MODES[2].minDuration,
  });
  const { showToastMessage } = useToast();
  const { playOrderSuccess } = useSound();
  const priceCacheRef = useRef({});
  const { tickerData, loadTickerData } = useExchangeTicker();
  const [swapPending, setSwapPending] = useState(false);
  const isSwapInProgressRef = useRef(false);
  const prevLongAccountRef = useRef(null);
  const prevShortAccountRef = useRef(null);
  const durationCalculationTimeoutRef = useRef(null);

  // Get the setSelectedAccounts function from FormAtoms to sync with AccountBalanceProvider
  const [, setSelectedAccounts] = useAtom(FormAtoms.selectedAccountsAtom);

  const tradableAccounts = useMemo(() => {
    return Object.values(accounts).filter((a) => a.exchangeName !== 'OKXDEX');
  }, [accounts]);

  // Sync both accounts with AccountBalanceProvider for margin polling
  useEffect(() => {
    const accountNames = [];
    if (longAccount) accountNames.push(longAccount.name);
    if (shortAccount) accountNames.push(shortAccount.name);
    setSelectedAccounts(accountNames);
  }, [longAccount, shortAccount, setSelectedAccounts]);

  // Load ticker data when accounts change - no dependency on loadTickerData to prevent infinite loop
  useEffect(() => {
    if (longAccount && longAccount.exchangeName) {
      loadTickerData(longAccount.exchangeName);
    }
  }, [longAccount]);

  useEffect(() => {
    if (shortAccount && shortAccount.exchangeName) {
      loadTickerData(shortAccount.exchangeName);
    }
  }, [shortAccount]);

  // Clear pairs when accounts change or become null
  useEffect(() => {
    if (prevLongAccountRef.current !== longAccount) {
      if (!isSwapInProgressRef.current) {
        setLongPair(null);
      }
      prevLongAccountRef.current = longAccount;
    }
  }, [longAccount]);

  useEffect(() => {
    if (prevShortAccountRef.current !== shortAccount) {
      if (!isSwapInProgressRef.current) {
        setShortPair(null);
      }
      prevShortAccountRef.current = shortAccount;
    }
  }, [shortAccount]);

  useEffect(() => {
    if (isSwapInProgressRef.current) {
      isSwapInProgressRef.current = false;
    }
  }, [longAccount, shortAccount, longPair, shortPair]);

  const tradeablePairsLong = useMemo(() => {
    // Only show pairs if longAccount is selected
    if (!longAccount) {
      return [];
    }
    const basePairs = tokenPairs.filter((p) => {
      if (longAccount.exchangeName === 'OKXDEX') {
        return getSupportedChains(longAccount.walletType).includes(p.chain_id);
      }
      const resolvedExchangeName = resolveExchangeName(longAccount.exchangeName);
      return p.exchanges.includes(resolvedExchangeName);
    });

    return basePairs
      .map((p) => ({
        ...p,
        ticker: tickerData[p.id],
      }))
      .sort((a, b) => {
        const volumeA = a.ticker?.volume24hNotional;
        const volumeB = b.ticker?.volume24hNotional;
        if (volumeA === undefined) return 1;
        if (volumeB === undefined) return -1;
        return volumeB - volumeA;
      });
  }, [longAccount, tokenPairs, tickerData]);

  const tradeablePairsShort = useMemo(() => {
    // Only show pairs if shortAccount is selected
    if (!shortAccount) {
      return [];
    }
    const basePairs = tokenPairs.filter((p) => {
      if (shortAccount.exchangeName === 'OKXDEX') {
        return getSupportedChains(shortAccount.walletType).includes(p.chain_id);
      }
      const resolvedExchangeName = resolveExchangeName(shortAccount.exchangeName);
      return p.exchanges.includes(resolvedExchangeName);
    });

    return basePairs
      .map((p) => ({
        ...p,
        ticker: tickerData[p.id],
      }))
      .sort((a, b) => {
        const volumeA = a.ticker?.volume24hNotional;
        const volumeB = b.ticker?.volume24hNotional;
        if (volumeA === undefined) return 1;
        if (volumeB === undefined) return -1;
        return volumeB - volumeA;
      });
  }, [shortAccount, tokenPairs, tickerData]);

  const numericNotional = useMemo(() => {
    const n = parseFloat(String(notional).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }, [notional]);

  const perLegNotional = useMemo(() => {
    return numericNotional ? numericNotional / 2 : null;
  }, [numericNotional]);

  const notionalError = useMemo(() => {
    if (numericNotional == null || numericNotional === 0) return null;
    if (numericNotional < MIN_TOTAL_NOTIONAL) {
      return `Minimum notional is $${MIN_TOTAL_NOTIONAL.toLocaleString()}`;
    }
    return null;
  }, [numericNotional]);

  // Adjust minimum durations when projected volume (total notional) is small
  const adjustedMinDurationByMode = useMemo(() => {
    const lowVolumeMins = { aggressive: 3, normal: 5, passive: 10 };
    const defaultMins = { aggressive: 5, normal: 15, passive: 30 };
    return numericNotional && numericNotional < 5000 ? lowVolumeMins : defaultMins;
  }, [numericNotional]);

  const getPrice = useCallback(async (pair, exchangeName) => {
    const key = `${exchangeName}|${pair}`;
    if (priceCacheRef.current[key]) return priceCacheRef.current[key];
    const res = await getPairPrice(pair, exchangeName);
    // API returns { "PAIR-NAME": price }
    const price = parseFloat(res[pair] || res.price || res?.data?.price || 0);
    if (Number.isFinite(price) && price > 0) {
      priceCacheRef.current[key] = price;
      return price;
    }
    throw new Error('Unable to fetch price');
  }, []);

  // Calculate durations when inputs change (debounced by 1s after user stops typing)
  useEffect(() => {
    if (!perLegNotional || !longAccount || !shortAccount || !longPair || !shortPair) {
      return () => {
        // No cleanup needed when inputs are incomplete
      };
    }

    // Clear any existing timeout
    if (durationCalculationTimeoutRef.current) {
      clearTimeout(durationCalculationTimeoutRef.current);
    }

    // Debounce the duration calculation by 1 second
    durationCalculationTimeoutRef.current = setTimeout(async () => {
      try {
        // Get prices with caching
        const getPriceWithCache = async (pair, exchangeName) => {
          const key = `${exchangeName}|${pair}`;
          if (priceCacheRef.current[key]) return priceCacheRef.current[key];
          const res = await getPairPrice(pair, exchangeName);
          // API returns { "PAIR-NAME": price }
          const price = parseFloat(res[pair] || res.price || res?.data?.price || 0);
          if (Number.isFinite(price) && price > 0) {
            priceCacheRef.current[key] = price;
            return price;
          }
          throw new Error('Unable to fetch price');
        };

        const [longPrice, shortPrice] = await Promise.all([
          getPriceWithCache(longPair, longAccount.exchangeName),
          getPriceWithCache(shortPair, shortAccount.exchangeName),
        ]);
        const longBaseQty = perLegNotional / longPrice;
        const shortBaseQty = perLegNotional / shortPrice;

        const modeDurations = {};
        await Promise.all(
          MODES.map(async (m) => {
            const [longDurResult, shortDurResult] = await Promise.all([
              calculateDurationForPov([longAccount.exchangeName], longPair, longBaseQty, m.povTarget),
              calculateDurationForPov([shortAccount.exchangeName], shortPair, shortBaseQty, m.povTarget),
            ]);
            // Extract duration - API returns { duration: <minutes> }
            const d1 = parseInt(longDurResult?.duration || 0, 10);
            const d2 = parseInt(shortDurResult?.duration || 0, 10);
            const maxDuration = Math.max(d1, d2);
            // Use max of calculated duration and floor
            modeDurations[m.value] = Math.max(adjustedMinDurationByMode[m.value], maxDuration);
          })
        );
        setDurationsByMode(modeDurations);
      } catch (_) {
        // swallow errors; durations will be blank until inputs are complete
      }
    }, 1000);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (durationCalculationTimeoutRef.current) {
        clearTimeout(durationCalculationTimeoutRef.current);
      }
    };
  }, [perLegNotional, longAccount, shortAccount, longPair, shortPair, adjustedMinDurationByMode]);

  const tradeableModes = useMemo(() => {
    return MODES.map((m) => ({
      ...m,
      // Override minDuration per current projected volume
      minDuration: adjustedMinDurationByMode[m.value],
      duration: durationsByMode[m.value] || null,
    }));
  }, [durationsByMode, adjustedMinDurationByMode]);

  const derivedPassiveness = useMemo(() => {
    const selectedMode = tradeableModes.find((m) => m.value === mode);
    return selectedMode?.passiveness || null;
  }, [tradeableModes, mode]);

  const longFees = useMemo(() => {
    if (!perLegNotional) return null;
    const longFeeRate =
      DEFAULT_BUILDER_FEE + estimateMakerFee({ exchangeName: longAccount?.exchangeName, pair: longPair });
    return perLegNotional * longFeeRate;
  }, [perLegNotional, longAccount, longPair]);

  const shortFees = useMemo(() => {
    if (!perLegNotional) return null;
    const shortFeeRate =
      DEFAULT_BUILDER_FEE + estimateMakerFee({ exchangeName: shortAccount?.exchangeName, pair: shortPair });
    return perLegNotional * shortFeeRate;
  }, [perLegNotional, shortAccount, shortPair]);

  const combinedEstimatedFees = useMemo(() => {
    if (longFees == null || shortFees == null) return null;
    return longFees + shortFees;
  }, [longFees, shortFees]);

  const longPovRate = useMemo(() => {
    const selectedMode = tradeableModes.find((m) => m.value === mode);
    return selectedMode?.povTarget || null;
  }, [tradeableModes, mode]);

  const shortPovRate = useMemo(() => {
    const selectedMode = tradeableModes.find((m) => m.value === mode);
    return selectedMode?.povTarget || null;
  }, [tradeableModes, mode]);

  // Get ticker data for both pairs
  const longTicker = useMemo(() => tickerData[longPair], [tickerData, longPair]);
  const shortTicker = useMemo(() => tickerData[shortPair], [tickerData, shortPair]);

  // Check if long leg volume exceeds 20% of 24h volume
  const longExceedsVolumeLimit = useMemo(() => {
    if (!perLegNotional || !longTicker?.volume24hNotional) return false;
    const volume24h = parseFloat(longTicker.volume24hNotional);
    if (!volume24h || volume24h <= 0) return false; // Skip check if volume is empty/0
    return perLegNotional > volume24h * 0.2;
  }, [perLegNotional, longTicker]);

  // Check if short leg volume exceeds 20% of 24h volume
  const shortExceedsVolumeLimit = useMemo(() => {
    if (!perLegNotional || !shortTicker?.volume24hNotional) return false;
    const volume24h = parseFloat(shortTicker.volume24hNotional);
    if (!volume24h || volume24h <= 0) return false; // Skip check if volume is empty/0
    return perLegNotional > volume24h * 0.2;
  }, [perLegNotional, shortTicker]);

  const exceedsVolumeLimit = useMemo(() => {
    return longExceedsVolumeLimit || shortExceedsVolumeLimit;
  }, [longExceedsVolumeLimit, shortExceedsVolumeLimit]);

  const canSubmit = useMemo(() => {
    return Boolean(
      perLegNotional &&
        longAccount &&
        shortAccount &&
        longPair &&
        shortPair &&
        mode &&
        numericNotional >= MIN_TOTAL_NOTIONAL &&
        !exceedsVolumeLimit
    );
  }, [perLegNotional, longAccount, shortAccount, longPair, shortPair, mode, numericNotional, exceedsVolumeLimit]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !perLegNotional) return;
    try {
      setIsSubmitting(true);

      // Get prices with fallback
      const getPriceWithFallback = async (pair, exchangeName) => {
        const key = `${exchangeName}|${pair}`;
        if (priceCacheRef.current[key]) return priceCacheRef.current[key];

        try {
          const res = await getPairPrice(pair, exchangeName);
          // API returns { "PAIR-NAME": price }
          const price = parseFloat(res[pair] || res.price || res?.data?.price || 0);
          if (Number.isFinite(price) && price > 0) {
            priceCacheRef.current[key] = price;
            return price;
          }
        } catch (err) {
          // Silently fail and throw error below
        }
        throw new Error(`Unable to fetch price for ${pair}`);
      };

      const [longPrice, shortPrice] = await Promise.all([
        getPriceWithFallback(longPair, longAccount.exchangeName),
        getPriceWithFallback(shortPair, shortAccount.exchangeName),
      ]);
      const longBaseQty = perLegNotional / longPrice;
      const shortBaseQty = perLegNotional / shortPrice;

      const selected = tradeableModes.find((m) => m.value === mode) || MODES[1];
      const durationMinutes = Math.max(selected.minDuration, durationsByMode[mode] || selected.minDuration);

      const payload = {
        accounts: [longAccount.name, shortAccount.name],
        strategy: 'TWAP',
        delta_neutral: true,
        strategy_params: {
          passive_only: false,
          active_limit: true,
          cleanup_on_cancel: false,
        },
        engine_passiveness: selected.passiveness,
        schedule_discretion: mode === 'aggressive' ? 0.04 : 0.03,
        child_orders: [
          { accounts: [longAccount.name], pair: longPair, side: 'buy', base_asset_qty: longBaseQty },
          { accounts: [shortAccount.name], pair: shortPair, side: 'sell', base_asset_qty: shortBaseQty },
        ],
        duration: durationMinutes * 60,
      };

      await submitMultiOrder(payload);
      playOrderSuccess();
      showToastMessage({ type: 'success', message: 'Delta Neutral bot started' });
      setNotional('');
    } catch (error) {
      showToastMessage({ type: 'error', message: error?.message || 'Failed to start Delta Neutral bot' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    perLegNotional,
    longAccount,
    shortAccount,
    longPair,
    shortPair,
    tradeableModes,
    mode,
    durationsByMode,
    getPrice,
    showToastMessage,
    playOrderSuccess,
  ]);

  const handleSwapAccountsAndPairs = useCallback(() => {
    // Basic safety: require both accounts and pairs before swapping
    if (!longAccount || !shortAccount || !longPair || !shortPair) return;

    isSwapInProgressRef.current = true;
    setSwapPending(true);
    setLongAccount(shortAccount);
    setShortAccount(longAccount);
    setLongPair(shortPair);
    setShortPair(longPair);

    // prevent rapid double swaps
    setTimeout(() => setSwapPending(false), 600);
  }, [longAccount, shortAccount, longPair, shortPair, setLongAccount, setShortAccount, setLongPair, setShortPair]);

  return {
    // selections
    longAccount,
    setLongAccount,
    shortAccount,
    setShortAccount,
    longPair,
    setLongPair,
    shortPair,
    setShortPair,
    notional,
    setNotional,
    mode,
    setMode,
    // derived
    perLegNotional,
    tradeablePairsLong,
    tradeablePairsShort,
    tradableAccounts,
    tradeableModes,
    combinedEstimatedFees,
    longFees,
    shortFees,
    longPovRate,
    shortPovRate,
    derivedDurationMinutes: tradeableModes.find((m) => m.value === mode)?.duration || null,
    derivedPassiveness,
    notionalError,
    // submission
    canSubmit,
    isSubmitting,
    handleSubmit,
    handleSwapAccountsAndPairs,
    swapPending,
    // volume validation
    longExceedsVolumeLimit,
    shortExceedsVolumeLimit,
    exceedsVolumeLimit,
  };
}
