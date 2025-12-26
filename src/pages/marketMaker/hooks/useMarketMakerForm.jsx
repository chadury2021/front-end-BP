import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { submitMultiOrder, changeMarketMakerSpread } from '@/apiServices';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useToast } from '@/shared/context/ToastProvider';
import { useSound } from '@/hooks/useSound';
import { useAccountApproval } from '@/shared/context/AccountApprovalProvider';
import { getSupportedChains } from '@/shared/dexUtils';
import resolveExchangeName from '@/shared/utils/resolveExchangeName';

const MODES = [
  {
    value: 'aggressive',
    label: 'Aggressive',
    urgency: 'HIGH',
    description: 'Fast, High Cost',
    subtitle: 'Tight spreads, prioritize speed',
    povTarget: 0.1,
    passiveness: 0.04,
    minDuration: 5,
    maxDuration: 360,
  },
  {
    value: 'normal',
    label: 'Normal',
    urgency: 'MEDIUM',
    description: 'Medium Speed',
    subtitle: 'Default settings',
    povTarget: 0.025,
    passiveness: 0.04,
    minDuration: 15,
    maxDuration: 720,
  },
  {
    value: 'passive',
    label: 'Passive',
    urgency: 'LOW',
    description: 'Long Duration',
    subtitle: 'Wide spreads, capture volatility',
    povTarget: 0.01,
    passiveness: 0.04,
    minDuration: 30,
    maxDuration: 1440,
  },
];

const fetchHyperliquidUserFees = async (account, isMainnet = false) => {
  const hyperliquidUrl = isMainnet ? 'https://api.hyperliquid.xyz' : 'https://api.hyperliquid-testnet.xyz';
  const body = {
    type: 'userFees',
    user: account.api_key,
  };

  const response = await fetch(`${hyperliquidUrl}/info`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body),
  });

  return response.json();
};

const useMarketMakerForm = ({ onSubmitted } = {}) => {
  const { isMainnet } = useUserMetadata();
  const [feeAmount, setFeeAmount] = useState('100');
  const [volumeAmount, setVolumeAmount] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [feeTimeoutId, setFeeTimeoutId] = useState(null);
  const [volumeTimeoutId, setVolumeTimeoutId] = useState(null);
  const [account, setAccount] = useState(null);
  const [pair, setPair] = useState(null);
  const [mode, setMode] = useState('normal');
  const [chaseDecayMode, setChaseDecayMode] = useState('normal'); // 'quick' | 'normal' | 'slow'
  const [directionalBias, setDirectionalBias] = useState(0);
  const [referencePrice, setReferencePrice] = useState('mid'); // 'mid' | 'grid' | 'other_exchange'
  const [referenceExchange, setReferenceExchange] = useState('Binance');
  const [spreadBps, setSpreadBps] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { initialLoadValue, FormAtoms } = useOrderForm();
  const { accounts, tokenPairs } = initialLoadValue;
  const [userFees, setUserFees] = useState(null);
  const { showToastMessage } = useToast();
  const { playOrderSuccess } = useSound();
  const prevAccountRef = useRef(null);
  const prevTotalFeeRateRef = useRef(null);
  const prevAccountForPairClearRef = useRef(null);
  const shouldAutoSelectPairRef = useRef(false);
  const [activeField, setActiveField] = useState(null); // 'fee' or 'volume' or null
  const [lastEditedField, setLastEditedField] = useState(null); // Track which field was last edited by user
  const isProgrammaticUpdate = useRef(false); // Flag to prevent sync chain reactions

  // Get the setSelectedAccounts function from FormAtoms to sync with AccountBalanceProvider
  // FormAtoms is always available since this is wrapped in OrderFormProvider
  const [, setSelectedAccounts] = useAtom(FormAtoms.selectedAccountsAtom);

  const { tickerData, loadTickerData, loading: isTickerDataLoading } = useExchangeTicker();
  const { openApprovalModal, accountNeedsApproval } = useAccountApproval();
  // Sync account with OrderForm's selectedAccounts for AccountBalanceProvider polling
  // This ensures that the AccountBalanceProvider only polls for the selected account
  useEffect(() => {
    if (account) {
      setSelectedAccounts([account.name]);
    } else {
      setSelectedAccounts([]);
    }
  }, [account, setSelectedAccounts]);

  const tradeablePairs = useMemo(() => {
    // Only show pairs if account is selected, and filter by the account's exchange / supported chains
    if (!account) {
      return [];
    }

    const filteredPairs = tokenPairs.filter((p) => {
      if (account.exchangeName === 'OKXDEX') {
        return getSupportedChains(account.walletType).includes(p.chain_id);
      }
      const resolvedExchangeName = resolveExchangeName(account.exchangeName);
      return p.exchanges.includes(resolvedExchangeName);
    });

    // Attach ticker data and sort by 24h notional volume (descending) so the most liquid
    // pairs appear first in selectors, matching the previous behavior.
    return filteredPairs
      .map((p) => ({
        ...p,
        ticker: tickerData[p.id],
      }))
      .sort((a, b) => {
        const volumeA = a.ticker?.volume24hNotional;
        const volumeB = b.ticker?.volume24hNotional;

        if (volumeA == null && volumeB == null) return 0;
        if (volumeA == null) return 1;
        if (volumeB == null) return -1;

        return volumeB - volumeA;
      });
  }, [tokenPairs, tickerData, account]);

  const tradableAccounts = useMemo(() => {
    return Object.values(accounts).filter((a) => a.exchangeName !== 'OKXDEX');
  }, [accounts]);

  // Build list of exchange options for "other exchange" selection
  const availableReferenceExchanges = useMemo(() => {
    const set = new Set();
    Object.values(accounts || {}).forEach((a) => {
      if (a?.exchangeName) set.add(a.exchangeName);
    });
    ['Binance', 'OKX', 'Bybit', 'Bitget', 'Hyperliquid'].forEach((ex) => set.add(ex));
    return Array.from(set);
  }, [accounts]);

  // Default reference exchange when account changes
  useEffect(() => {
    if (account?.exchangeName) {
      setReferenceExchange(account.exchangeName);
    }
  }, [account]);

  const spreadOptionsByReference = useMemo(
    () => ({
      mid: [0, 1, 2, 5, 10],
      grid: [-10, -1, 0, 5, 10],
      other_exchange: [0, 1, 5],
    }),
    []
  );

  // Reset spread when reference changes
  useEffect(() => {
    const options = spreadOptionsByReference[referencePrice] || [];
    const defaultSpread = options.includes(0) ? 0 : options[0];
    if (defaultSpread != null) setSpreadBps(defaultSpread);
  }, [referencePrice, spreadOptionsByReference]);

  const pairTicker = useMemo(() => {
    return tickerData[pair];
  }, [tickerData, pair]);

  // Calculate the total fee rate (builder fee + maker fee) - slippage is excluded from volume calculation
  const totalFeeRate = useMemo(() => {
    const builderFee = 0.0002;
    // Check if this is an XYZ exchange pair (starts with "xyz_")
    const isXyzPair = pair?.toLowerCase().startsWith('xyz_') ?? false;
    // Check if pair name contains an underscore (for Hyperliquid pairs like xyz_*, flx_*, etc.)
    const hasUnderscore = pair?.includes('_') ?? false;

    if (account?.exchangeName === 'Hyperliquid') {
      // For Hyperliquid pairs with underscores, use 2.3bps total fee rate
      if (hasUnderscore) {
        return 0.00023; // 2.3bps total
      }

      // For Hyperliquid, use fetched user fees or fallback to defaults
      if (!userFees) {
        // Default Hyperliquid fees while loading
        const defaultMakerFee = pair?.includes('PERP') ? 0.00015 : 0.0002;
        return builderFee + defaultMakerFee;
      }
      const makerFee = pair?.includes('PERP') ? userFees.userAddRate : userFees.userSpotAddRate;
      return builderFee + parseFloat(makerFee);
    }

    if (account?.exchangeName === 'Aster') {
      // Aster maker fee override: 0.5bps (0.00005)
      const asterMakerFee = 0.00005; // 0.5 bps
      // For Aster, do not charge builder fee in the MM fee estimate
      return asterMakerFee;
    }

    if (account?.exchangeName === 'Pacifica') {
      // Pacifica maker fee override: 1.5bps (0.00015)
      const pacificaMakerFee = 0.00015; // 1.5 bps
      return builderFee + pacificaMakerFee;
    }

    if (account?.exchangeName === 'Paradex') {
      // Paradex maker fee override: 1bps (0.0001)
      const paradexMakerFee = 0.0001; // 1 bps
      // For Paradex, do not charge builder fee in the MM fee estimate
      return paradexMakerFee;
    }

    // Default fee rates for other exchanges - 2bps (0.02%) for all pairs
    const defaultMakerFee = 0.0002; // 2 bps (0.02%) for non-Hyperliquid exchanges
    return builderFee + defaultMakerFee;
  }, [userFees, pair, account]);

  // Derive notional from volume input (since fee and volume are now synced)
  const derivedNotional = useMemo(() => {
    const numericVolume = parseFloat(String(volumeAmount).replace(/,/g, ''));
    return numericVolume && numericVolume > 0 ? numericVolume : null;
  }, [volumeAmount]);

  // Adjust minimum durations when projected volume is small
  const adjustedMinDurationByMode = useMemo(() => {
    const lowVolumeMins = { aggressive: 3, normal: 5, passive: 10 };
    const defaultMins = { aggressive: 5, normal: 15, passive: 30 };
    return derivedNotional && derivedNotional < 5000 ? lowVolumeMins : defaultMins;
  }, [derivedNotional]);

  const getEstimatedDuration = useCallback(
    (povTarget, minDuration, maxDuration) => {
      // If we cannot estimate, default to the mode-specific minimum
      if (!pairTicker || !derivedNotional || pairTicker.volume24hNotional <= 0) return minDuration;

      const durationHours = derivedNotional / ((povTarget * pairTicker.volume24hNotional) / 24);
      // Enforce a mode-specific minimum duration
      const estimatedDurationMinutes = Math.max(minDuration, Math.round(durationHours * 60));
      return Math.min(estimatedDurationMinutes, maxDuration);
    },
    [pairTicker, derivedNotional]
  );

  const tradeableModes = useMemo(() => {
    return MODES.map((m) => {
      const minDuration = adjustedMinDurationByMode[m.value];
      const duration = getEstimatedDuration(m.povTarget, minDuration, m.maxDuration);
      return {
        ...m,
        // Override minDuration per current projected volume and use for estimates
        minDuration,
        duration,
      };
    });
  }, [pairTicker, derivedNotional, getEstimatedDuration, adjustedMinDurationByMode]);

  // Sync functions to update one field when the other changes
  const handleFeeChange = useCallback(
    (value) => {
      setFeeAmount(value);

      // Skip sync if this is a programmatic update
      if (isProgrammaticUpdate.current) {
        return;
      }

      setActiveField('fee');
      setLastEditedField('fee');

      // Clear any existing timeout
      if (feeTimeoutId) {
        clearTimeout(feeTimeoutId);
      }

      // Set loading state
      setIsSyncing(true);

      // Set a new timeout to debounce the sync - only update volume, not fee
      const newTimeoutId = setTimeout(() => {
        const numericFee = parseFloat(String(value).replace(/,/g, ''));
        if (numericFee && totalFeeRate) {
          isProgrammaticUpdate.current = true;
          const calculatedVolume = numericFee / totalFeeRate;
          setVolumeAmount(calculatedVolume.toFixed(0));
          // Reset flag and syncing state after state update
          setTimeout(() => {
            isProgrammaticUpdate.current = false;
            setIsSyncing(false);
            setActiveField(null);
          }, 0);
        } else {
          isProgrammaticUpdate.current = true;
          setVolumeAmount('');
          setTimeout(() => {
            isProgrammaticUpdate.current = false;
            setIsSyncing(false);
            setActiveField(null);
          }, 0);
        }
      }, 2000); // Wait 2 seconds after user stops typing

      setFeeTimeoutId(newTimeoutId);
    },
    [totalFeeRate, feeTimeoutId]
  );

  const handleVolumeChange = useCallback(
    (value) => {
      setVolumeAmount(value);

      // Skip sync if this is a programmatic update
      if (isProgrammaticUpdate.current) {
        return;
      }

      setActiveField('volume');
      setLastEditedField('volume');

      // Clear any existing timeout
      if (volumeTimeoutId) {
        clearTimeout(volumeTimeoutId);
      }

      // Set loading state
      setIsSyncing(true);

      // Set a new timeout to debounce the sync - only update fee, not volume
      const newTimeoutId = setTimeout(() => {
        const numericVolume = parseFloat(String(value).replace(/,/g, ''));
        if (numericVolume && totalFeeRate) {
          isProgrammaticUpdate.current = true;
          const calculatedFee = numericVolume * totalFeeRate;
          setFeeAmount(Math.round(calculatedFee).toString());
          // Reset flag and syncing state after state update
          setTimeout(() => {
            isProgrammaticUpdate.current = false;
            setIsSyncing(false);
            setActiveField(null);
          }, 0);
        } else {
          isProgrammaticUpdate.current = true;
          setFeeAmount('');
          setTimeout(() => {
            isProgrammaticUpdate.current = false;
            setIsSyncing(false);
            setActiveField(null);
          }, 0);
        }
      }, 2000); // Wait 2 seconds after user stops typing

      setVolumeTimeoutId(newTimeoutId);
    },
    [totalFeeRate, volumeTimeoutId]
  );

  const handleFeeBlur = useCallback(() => {
    // Clear timeout and sync immediately on blur - only update volume
    if (feeTimeoutId) {
      clearTimeout(feeTimeoutId);
      setFeeTimeoutId(null);
    }

    const numericFee = parseFloat(String(feeAmount).replace(/,/g, ''));
    if (numericFee && totalFeeRate) {
      isProgrammaticUpdate.current = true;
      const calculatedVolume = numericFee / totalFeeRate;
      setVolumeAmount(calculatedVolume.toFixed(0));
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 0);
    }
    setIsSyncing(false);
    setActiveField(null);
  }, [feeAmount, totalFeeRate, feeTimeoutId]);

  const handleVolumeBlur = useCallback(() => {
    // Clear timeout and sync immediately on blur - only update fee
    if (volumeTimeoutId) {
      clearTimeout(volumeTimeoutId);
      setVolumeTimeoutId(null);
    }

    const numericVolume = parseFloat(String(volumeAmount).replace(/,/g, ''));
    if (numericVolume && totalFeeRate) {
      isProgrammaticUpdate.current = true;
      const calculatedFee = numericVolume * totalFeeRate;
      setFeeAmount(Math.round(calculatedFee).toString());
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 0);
    }
    setIsSyncing(false);
    setActiveField(null);
  }, [volumeAmount, totalFeeRate, volumeTimeoutId]);

  const resetForm = useCallback(() => {
    // Return the form to a clean, initial state after a successful submission
    setFeeAmount(''); // clear budget so user must explicitly set it again
    setVolumeAmount('');
    setMode('normal');
    setChaseDecayMode('normal');
    setDirectionalBias(0);
    setActiveField(null);
    setLastEditedField(null);
    isProgrammaticUpdate.current = false;
    setIsSyncing(false);

    // Clear any pending timeouts
    if (feeTimeoutId) {
      clearTimeout(feeTimeoutId);
      setFeeTimeoutId(null);
    }
    if (volumeTimeoutId) {
      clearTimeout(volumeTimeoutId);
      setVolumeTimeoutId(null);
    }
  }, [feeTimeoutId, volumeTimeoutId]);

  // Clear pair when account changes or becomes null
  useEffect(() => {
    if (prevAccountForPairClearRef.current !== account) {
      setPair(null);
      // Mark that we should auto-select a pair after pairs are loaded
      shouldAutoSelectPairRef.current = account !== null;
    }
    prevAccountForPairClearRef.current = account;
  }, [account]);

  useEffect(() => {
    const fetchUserFees = async () => {
      const res = await fetchHyperliquidUserFees(account, isMainnet);
      setUserFees(res);
    };

    if (account) {
      loadTickerData(account.exchangeName);
    }

    if (account?.exchangeName === 'Hyperliquid') {
      fetchUserFees();
    }
  }, [account]);

  // Auto-select highest volume pair when account is selected and pairs are available
  useEffect(() => {
    // Only auto-select if:
    // 1. We should auto-select (account just changed)
    // 2. Account is selected
    // 3. No pair is currently selected
    // 4. Tradeable pairs are available
    if (shouldAutoSelectPairRef.current && account && !pair && tradeablePairs.length > 0) {
      // Select the first pair (highest volume due to sorting in tradeablePairs)
      const highestVolumePair = tradeablePairs[0];
      if (highestVolumePair?.id) {
        setPair(highestVolumePair.id);
        shouldAutoSelectPairRef.current = false; // Reset flag after auto-selecting
      }
    }
  }, [account, pair, tradeablePairs]);

  // Auto-adjust chase decay based on duration
  useEffect(() => {
    const durationMinutes = tradeableModes.find((m) => m.value === mode)?.duration;
    if (durationMinutes == null) return;

    // If duration > 6 hours, default to slow
    if (durationMinutes > 360 && chaseDecayMode !== 'slow') {
      setChaseDecayMode('slow');
    }
    // If duration > 30 minutes and currently on quick, switch to normal
    else if (durationMinutes > 30 && chaseDecayMode === 'quick') {
      setChaseDecayMode('normal');
    }
  }, [mode, tradeableModes, chaseDecayMode]);

  // Refresh volume/fee sync when account or totalFeeRate changes
  useEffect(() => {
    // Only recalculate if account or totalFeeRate actually changed, not on initial mount or other re-renders
    const accountChanged = prevAccountRef.current !== null && prevAccountRef.current !== account;
    const feeRateChanged = prevTotalFeeRateRef.current !== null && prevTotalFeeRateRef.current !== totalFeeRate;
    const isFirstAccountSelection = prevAccountRef.current === null && account !== null;

    if (account && totalFeeRate && (accountChanged || feeRateChanged || isFirstAccountSelection)) {
      isProgrammaticUpdate.current = true;

      // Budget/fee is the anchor UNLESS user manually edited volume
      if (lastEditedField === 'volume' && volumeAmount) {
        // User manually edited volume, so keep volume and recalculate fee
        const numericVolume = parseFloat(String(volumeAmount).replace(/,/g, ''));
        if (numericVolume) {
          const calculatedFee = numericVolume * totalFeeRate;
          setFeeAmount(Math.round(calculatedFee).toString());
        }
      } else if (feeAmount) {
        // Default: keep fee/budget constant and recalculate volume from budget using new fee rate
        const numericFee = parseFloat(String(feeAmount).replace(/,/g, ''));
        if (numericFee) {
          const calculatedVolume = numericFee / totalFeeRate;
          setVolumeAmount(calculatedVolume.toFixed(0));
        }
      } else if (volumeAmount) {
        // No budget set but volume exists - recalculate fee from volume
        const numericVolume = parseFloat(String(volumeAmount).replace(/,/g, ''));
        if (numericVolume) {
          const calculatedFee = numericVolume * totalFeeRate;
          setFeeAmount(Math.round(calculatedFee).toString());
        }
      }

      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 0);
    }

    // Update refs
    prevAccountRef.current = account;
    prevTotalFeeRateRef.current = totalFeeRate;
  }, [account, totalFeeRate, volumeAmount, feeAmount, lastEditedField]);

  // Check if order volume exceeds 20% of 24h volume
  const exceedsVolumeLimit = useMemo(() => {
    if (!derivedNotional || !pairTicker?.volume24hNotional) return false;
    const volume24h = parseFloat(pairTicker.volume24hNotional);
    if (!volume24h || volume24h <= 0) return false; // Skip check if volume is empty/0
    return derivedNotional > volume24h * 0.2;
  }, [derivedNotional, pairTicker]);

  const canSubmit = useMemo(() => {
    // Ensure we only allow submit when all required inputs are present and valid
    // Also check that volume doesn't exceed 10% of 24h volume
    return Boolean(feeAmount && derivedNotional && account && pair && mode && !exceedsVolumeLimit);
  }, [feeAmount, derivedNotional, account, pair, mode, exceedsVolumeLimit]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !derivedNotional) return;

    setIsSubmitting(true);

    const needsApproval = await accountNeedsApproval(account);
    if (needsApproval) {
      openApprovalModal(account);
      setIsSubmitting(false);
      return;
    }

    const selectedMode = tradeableModes.find((m) => m.value === mode);
    // Enforce a mode-specific minimum duration at submission time
    const durationMinutes = selectedMode?.duration
      ? Math.max(selectedMode.minDuration || 0, selectedMode.duration)
      : (selectedMode?.minDuration ?? 5);
    const finalDurationInSec = durationMinutes * 60;

    let exposureTolerance = 0.07;
    if (selectedMode?.passiveness != null) {
      exposureTolerance = selectedMode.passiveness * 2 + 0.01;
    }

    const scheduleDiscretionByMode = { passive: 0.03, normal: 0.03, aggressive: 0.04 };
    const scheduleDiscretion = scheduleDiscretionByMode[mode] ?? 0.03;
    // Use mode default passiveness
    const enginePassiveness = selectedMode?.passiveness ?? 0.04;

    // Get current price from ticker data
    const currentPrice = pairTicker?.lastPrice;
    if (!currentPrice) {
      showToastMessage({ message: 'Unable to get current price for the selected pair', type: 'error' });
      setIsSubmitting(false);
      return;
    }

    // Calculate base quantity from derived notional amount
    const totalBaseQuantity = derivedNotional / currentPrice;
    const halfBaseQuantity = totalBaseQuantity / 2;

    // Derive chase_decay (in seconds) from selected mode:
    // - quick:  1/1000th of order duration
    // - normal: null (use backend defaults)
    // - slow:   1/100th of order duration
    let chaseDecay = null;
    if (chaseDecayMode === 'quick') {
      chaseDecay = Math.max(1, Math.round(finalDurationInSec / 1000));
    } else if (chaseDecayMode === 'slow') {
      chaseDecay = Math.max(1, Math.round(finalDurationInSec / 100));
    }

    const payload = {
      accounts: [account.name],
      strategy: 'TWAP',
      market_maker: true,
      strategy_params: {
        passive_only: true,
        active_limit: true, // Enable active limit for all modes
        cleanup_on_cancel: true, // Auto-close exposure with reduce-only order on cancel
        soft_pause: mode === 'normal' || mode === 'passive' || mode === 'aggressive', // Enable soft pause for all modes
      },
      engine_passiveness: enginePassiveness,
      directional_bias: directionalBias,
      exposure_tolerance: exposureTolerance,
      schedule_discretion: scheduleDiscretion,
      child_orders: [
        { accounts: [account.name], pair, side: 'buy', base_asset_qty: halfBaseQuantity },
        { accounts: [account.name], pair, side: 'sell', base_asset_qty: halfBaseQuantity },
      ],
      duration: finalDurationInSec,
    };
    // Attach chase_decay to the order when a non-default mode is selected.
    // Normal mode explicitly passes null so the backend sees it as unset.
    if (chaseDecayMode === 'normal') {
      payload.chase_decay = null;
    } else if (chaseDecay != null) {
      payload.chase_decay = chaseDecay;
    }

    try {
      const result = await submitMultiOrder(payload);
      const multiOrderId = result?.id || result?.multi_order_id;

      // Apply spread settings if needed (non-zero spread or non-default reference price)
      if (multiOrderId && (spreadBps !== 0 || referencePrice !== 'mid')) {
        try {
          const spreadOptions = {
            reference_price: referencePrice,
          };

          // Only include reference_exchange if using other_exchange
          if (referencePrice === 'other_exchange' && referenceExchange) {
            // Extract exchange name from referenceExchange format (e.g., "BTC:PERP-USDT@Binance" -> "Binance")
            const exchangeMatch = referenceExchange.match(/@(.+)$/);
            if (exchangeMatch) {
              const [, exchangeName] = exchangeMatch;
              spreadOptions.reference_exchange = exchangeName;
            } else {
              // Fallback: use referenceExchange as-is if it doesn't match the expected format
              spreadOptions.reference_exchange = referenceExchange;
            }
          }

          await changeMarketMakerSpread(multiOrderId, spreadBps, spreadOptions);
        } catch (spreadError) {
          // Log error but don't fail the entire submission
          showToastMessage({
            message: `Order created but failed to apply spread settings: ${spreadError}`,
            type: 'warning',
          });
        }
      }

      playOrderSuccess();
      showToastMessage({ message: 'Market maker submitted successfully', type: 'success' });
      resetForm();
      if (typeof onSubmitted === 'function') {
        onSubmitted();
      }
    } catch (error) {
      showToastMessage({ message: `Failed to submit market maker: ${error}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    account,
    derivedNotional,
    pair,
    mode,
    chaseDecayMode,
    canSubmit,
    tradeableModes,
    pairTicker,
    showToastMessage,
    resetForm,
    directionalBias,
    playOrderSuccess,
    onSubmitted,
    spreadBps,
    referencePrice,
    referenceExchange,
  ]);

  return {
    feeAmount,
    setFeeAmount: handleFeeChange,
    volumeAmount,
    setVolumeAmount: handleVolumeChange,
    handleFeeBlur,
    handleVolumeBlur,
    isSyncing,
    activeField,
    derivedNotional,
    account,
    setAccount,
    pair,
    setPair,
    mode,
    setMode,
    chaseDecayMode,
    setChaseDecayMode,
    directionalBias,
    setDirectionalBias,
    referencePrice,
    setReferencePrice,
    referenceExchange,
    setReferenceExchange,
    spreadBps,
    setSpreadBps,
    spreadOptionsByReference,
    availableReferenceExchanges,
    derivedDurationMinutes: tradeableModes.find((m) => m.value === mode)?.duration || null,
    derivedPassiveness: tradeableModes.find((m) => m.value === mode)?.passiveness || null,
    derivedParticipationRate: tradeableModes.find((m) => m.value === mode)?.povTarget || null,
    handleSubmit,
    isSubmitting,
    canSubmit,
    tradeablePairs,
    tradableAccounts,
    tradeableModes,
    exceedsVolumeLimit,
    pairTicker,
  };
};

export default useMarketMakerForm;
