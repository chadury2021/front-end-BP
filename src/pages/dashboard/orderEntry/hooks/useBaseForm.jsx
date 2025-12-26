/* eslint-disable react-hooks/exhaustive-deps */
import { convertQty, fetchExchangePairs, getPairPrice, calculatePreTradeAnalytics } from '@/apiServices';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { matchPairByBaseAndExchange } from '@/shared/formUtil';
import { useEffect, useContext, useState } from 'react';
import { filterOutFalseyValues, smartRound } from '@/util';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import resolveExchangeName from '@/shared/utils/resolveExchangeName';
import { useAccountBalanceContext } from '../AccountBalanceContext';

export const useBaseForm = ({ options = false, sliderUpdatingRef, currentLeverage = 1 } = {}) => {
  const { calculateMarginBalance } = useAccountBalanceContext();
  const {
    selectedAccounts,
    setSelectedAccounts,
    selectedPair,
    setSelectedPair,
    selectedSide,
    setSelectedSide,
    selectedDuration,
    povTarget,
    relevantExchangePairs,
    setRelevantExchangePairs,
    baseQtyPlaceholder,
    setBaseQtyPlaceholder,
    quoteQtyPlaceholder,
    setQuoteQtyPlaceholder,
    baseQty,
    setBaseQty,
    baseContractQty,
    setBaseContractQty,
    quoteQty,
    setQuoteQty,
    basePercentage,
    setBasePercentage,
    quotePercentage,
    setQuotePercentage,
    convertedQty,
    setConvertedQty,
    balances,
    setBalances,
    convertedQtyLoading,
    setConvertedQtyLoading,
    preTradeEstimationData,
    setPreTradeEstimationData,
    preTradeDataLoading,
    setPreTradeDataLoading,
    setPreTradeDataError,
    initialLoadValue,
    selectedPairPrice,
    setSelectedPairPrice,
    fetchPairAttempts,
    setFetchPairAttempts,
    selectedStrategy,
    setSelectedStrategyParams,
    trajectoryOptions,
    setQtyLoading,
    qtyLoading,
    resetForm,
    handleSelectedAccountsChange,
    handleSelectedSide,
    handleSelectedPair,
  } = useOrderForm();

  const { showAlert } = useContext(ErrorContext);

  const { accounts, autoOrderUrgencies, trajectories, tokenPairs } = initialLoadValue;
  const { user } = useUserMetadata();

  const isBuySide = selectedSide === 'buy';

  // Track which field was manually entered to prevent loops
  const [lastManuallyEnteredField, setLastManuallyEnteredField] = useState(null);
  // Track if conversion is in progress to prevent race conditions
  const [isConversionInProgress, setIsConversionInProgress] = useState(false);

  const fetchTradePrediction = async (duration = selectedDuration) => {
    if (options) {
      return;
    }
    const readyForAnalysis = selectedAccounts.length > 0 && selectedPair && (baseQty || quoteQty);
    if (!readyForAnalysis || Object.keys(preTradeEstimationData) > 0 || preTradeDataLoading || !duration) {
      return;
    }

    try {
      setPreTradeDataLoading(true);

      const exchangeNames = selectedAccounts.map((a) => accounts[a].exchangeName);

      const qty = baseQty || convertedQty;
      const data = await calculatePreTradeAnalytics({
        orderAttrs: [
          {
            exchange_names: exchangeNames,
            pair: selectedPair.id,
            qty,
            duration: selectedDuration,
          },
        ],
        priceLookup: {},
      });

      setPreTradeEstimationData({
        pov: data.pov ?? null,
        volatility: data.volatility ?? null,
        market_volume: data.market_volume ?? null,
        warning: data.warning ?? null,
      });
    } catch (error) {
      setPreTradeDataError(error.message);
    } finally {
      setPreTradeDataLoading(false);
    }
  };

  useEffect(() => {
    // don't trigger calculation pre-trade analytics here if povTarget is set
    // let duration re-calculation trigger it
    if (!povTarget) {
      fetchTradePrediction();
    }
  }, [convertedQty]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTradePrediction();
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedDuration]);

  useEffect(() => {
    const selectedTrajectory = trajectoryOptions[selectedStrategy];

    if (selectedTrajectory) {
      // reset selected strategy params but force active limit on iceberg
      if (selectedTrajectory.name === 'Iceberg') {
        setSelectedStrategyParams({ active_limit: true });
      } else {
        setSelectedStrategyParams({});
      }
    }
  }, [selectedStrategy]);

  useEffect(() => {
    // skip for dex
    if (selectedAccounts.some((a) => accounts[a].exchangeName === 'OKXDEX') || selectedPair?.market_type === 'dex') {
      return;
    }

    const getExchangePairs = async () => {
      const exchangeNames = filterOutFalseyValues(
        selectedAccounts.map((a) => resolveExchangeName(accounts[a]?.exchangeName || ''))
      );

      const pairName = options ? selectedPair?.name : selectedPair?.id;

      try {
        const pairs = await fetchExchangePairs(exchangeNames, pairName);
        setRelevantExchangePairs(pairs);
      } catch (error) {
        // do nothing
      }
    };

    if (selectedAccounts.length > 0 && selectedPair) {
      getExchangePairs();
    }

    const selectedAccountsExchangeNames = selectedAccounts.map((accountId) =>
      resolveExchangeName(accounts[accountId]?.exchangeName || '')
    );

    const doesPairExistInExchange =
      selectedPair && selectedPair.exchanges.some((exchange) => selectedAccountsExchangeNames.includes(exchange));

    const accountNames = Object.keys(accounts);
    const defaultAccount = accountNames.length > 0 ? accounts[accountNames[0]] : null;
    const defaultExchangeNames = defaultAccount ? [resolveExchangeName(defaultAccount?.exchangeName)] : [];

    if (!options && !doesPairExistInExchange && selectedPair && selectedAccounts.length > 0) {
      const matchedPair = matchPairByBaseAndExchange(
        tokenPairs,
        selectedPair.base,
        selectedAccountsExchangeNames.length > 0 ? selectedAccountsExchangeNames : defaultExchangeNames,
        selectedPair.is_contract
      );

      if (!matchedPair && selectedAccounts.length > 0) {
        showAlert({
          message: `${selectedPair.id} does not exist in any exchanges within the selected accounts`,
          severity: 'warning',
        });
        return;
      }

      if (matchedPair) {
        setSelectedPair(matchedPair);
      }
    }
  }, [selectedAccounts, selectedPair]);

  const calculateAssetBalance = (symbol) => {
    let totalAmount = 0;
    const marketType = selectedPair ? selectedPair.market_type : undefined;

    selectedAccounts.forEach((accountIteration) => {
      if (!balances[accounts[accountIteration]?.id]) {
        return;
      }

      balances[accounts[accountIteration]?.id]?.assets?.forEach((asset) => {
        if (asset.wallet_type !== 'unified' && marketType && asset.wallet_type !== marketType) {
          return;
        }

        if (asset.symbol === symbol) {
          const balance = Number(asset.amount);
          const borrowed = Number(asset.borrowed || 0);
          totalAmount += balance - borrowed;
        }
      });
    });
    return totalAmount;
  };

  const totalBaseBalance = () => {
    const baseIdentifier = options ? selectedPair?.name : selectedPair?.id;
    const baseAsset = selectedPair.is_contract ? baseIdentifier : selectedPair.base;
    return calculateAssetBalance(baseAsset);
  };

  const fetchPairPrice = async () => {
    // skip dex pairs for now
    if (!selectedPair || selectedPair?.market_type === 'dex' || fetchPairAttempts > 2) {
      return null;
    }

    // do not fetch if user is not authenticated
    if (!user?.is_authenticated) {
      return null;
    }

    let pairPrice = selectedPairPrice.price;
    const pairName = options ? selectedPair.name : selectedPair.id;

    // only fetch if pair has changed or if the last fetch was more than 5 seconds ago
    if (selectedPairPrice.pair !== pairName || new Date() - selectedPairPrice.timestamp > 5000) {
      try {
        const exchangeName =
          selectedAccounts.length > 0 && resolveExchangeName(accounts[selectedAccounts[0]]?.exchangeName || '');
        const result = await getPairPrice(pairName, exchangeName);
        pairPrice = result[pairName];
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Could not fetch price for pair ${pairName}`,
        });
        setFetchPairAttempts(fetchPairAttempts + 1);
        return null;
      }
      setFetchPairAttempts(0);
      setSelectedPairPrice({
        pair: pairName,
        price: pairPrice,
        timestamp: new Date(),
      });
    }

    return pairPrice;
  };

  const calculateQuoteAssetBalance = (pairPrice) => {
    let balance;
    if (!selectedPair?.is_inverse) {
      balance = calculateAssetBalance(selectedPair?.quote);
    } else {
      balance = calculateAssetBalance(selectedPair?.base) * pairPrice;
    }

    // For perpetual pairs, try to use available margin balance with leverage applied
    if (selectedPair?.market_type === 'perp' && currentLeverage > 1 && balance > 0) {
      // Check if we have margin balance data available for the quote asset
      const marginBalance = calculateMarginBalance(selectedPair?.quote);
      if (marginBalance > 0) {
        // Use available margin balance and apply leverage to it
        balance = marginBalance * currentLeverage;
      } else {
        // Fallback to leverage calculation if no margin data
        balance *= currentLeverage;
      }
    }

    return balance;
  };

  const calculateCurrentBasePercentage = () => {
    if (!selectedPair || !baseQty) return 0;

    const baseIdentifier = options ? selectedPair.name : selectedPair.id;
    const baseAsset = selectedPair.is_contract ? baseIdentifier : selectedPair.base;
    const totalBaseAsset = Math.abs(calculateAssetBalance(baseAsset));

    if (totalBaseAsset === 0) return 0;
    return Number(((100 * Number(baseQty)) / totalBaseAsset).toFixed(2));
  };

  const calculateCurrentQuotePercentage = () => {
    if (!selectedPair || !quoteQty) return 0;

    const pairPrice = selectedPairPrice.price;
    if (!pairPrice) return 0;

    const totalQuoteAsset = calculateQuoteAssetBalance(pairPrice);
    if (totalQuoteAsset === 0) return 0;

    return Number(((100 * Number(quoteQty)) / totalQuoteAsset).toFixed(2));
  };

  // Helper function to determine which field to prioritize for conversion
  const getPriorityField = () => {
    // If we know which field was manually entered, prioritize that one
    if (lastManuallyEnteredField === 'base' && baseQty) {
      return { value: baseQty, isBase: true };
    }
    if (lastManuallyEnteredField === 'quote' && quoteQty) {
      return { value: quoteQty, isBase: false };
    }

    // Fallback to original logic
    if (baseQty && !quoteQty) return { value: baseQty, isBase: true };
    if (quoteQty && !baseQty) return { value: quoteQty, isBase: false };
    if (baseQty && quoteQty) {
      // If both exist and we don't know which was manually entered,
      // don't trigger conversion to avoid conflicts
      return null;
    }
    return null;
  };

  const handleTokenQtyBlur = async (value, isBase, preFetchedPrice) => {
    if (!value || !selectedPair || convertedQtyLoading) {
      return;
    }

    setIsConversionInProgress(true);
    setConvertedQtyLoading(true);

    const selectedPairName = options ? selectedPair.name : selectedPair.id;
    const pairPrice = preFetchedPrice || (await fetchPairPrice());
    const selectedAccountNames = selectedAccounts.map((acc) => accounts[acc]?.name);
    const selectedExchanges = selectedAccounts.map((acc) => resolveExchangeName(accounts[acc]?.exchangeName || ''));

    if (!pairPrice) {
      setConvertedQtyLoading(false);
      setIsConversionInProgress(false);
      return;
    }

    try {
      const result = await convertQty(selectedAccountNames, selectedPairName, value, isBase, pairPrice);
      const qty = isBase ? result.quote_asset_qty : result.base_asset_qty;
      const baseAsset = selectedPair?.is_contract ? selectedPairName : selectedPair?.base;
      const token = isBase ? selectedPair?.quote : baseAsset;

      if (isBase) {
        setQuoteQtyPlaceholder(`${qty} ${token}`);
      } else {
        setBaseQtyPlaceholder(`${smartRound(Number(qty))} ${selectedPair?.base}`);

        if (selectedPair?.is_contract && selectedExchanges.includes('Deribit') && selectedPair?.is_inverse) {
          const convertToNumContracts = true;
          const contractConvertResult = await convertQty(
            selectedAccountNames,
            selectedPairName,
            value,
            isBase,
            pairPrice,
            convertToNumContracts
          );
          const numContracts = contractConvertResult.base_asset_qty;
          setBaseContractQty(numContracts);
        }
      }

      // Only update percentage if slider is not being used
      const isSliderUpdating = sliderUpdatingRef && sliderUpdatingRef.current;
      if (!isSliderUpdating) {
        if (isBuySide) {
          const quoteAssetQty = isBase ? qty : value;
          const totalQuoteAsset = calculateQuoteAssetBalance(pairPrice);

          if (totalQuoteAsset > 0) {
            setQuotePercentage(Number(((100 * quoteAssetQty) / totalQuoteAsset).toFixed(2)));
          }
        } else {
          const baseAssetQty = isBase ? value : qty;
          const totalBaseAsset = Math.abs(calculateAssetBalance(baseAsset));

          if (totalBaseAsset > 0) {
            setBasePercentage(Number(((100 * baseAssetQty) / totalBaseAsset).toFixed(2)));
          }
        }
      }

      setConvertedQty(qty);
    } catch (e) {
      setPreTradeDataError('No price to convert quote to base quantity');
    } finally {
      setConvertedQtyLoading(false);
      setIsConversionInProgress(false);
    }
  };

  useEffect(() => {
    const isSliderUpdating = sliderUpdatingRef && sliderUpdatingRef.current;

    if (!options && !isSliderUpdating && lastManuallyEnteredField && !isConversionInProgress) {
      const priorityField = getPriorityField();
      if (priorityField) {
        handleTokenQtyBlur(priorityField.value, priorityField.isBase);
      }
      // Reset the manual entry tracking after processing
      setLastManuallyEnteredField(null);
    }

    return () => {
      setQtyLoading(false);
    };
  }, [
    baseQty,
    quoteQty,
    selectedAccounts,
    selectedSide,
    selectedPair,
    lastManuallyEnteredField,
    isConversionInProgress,
  ]);

  const handleBaseQtyOnChange = (value) => {
    setQtyLoading(false);

    // Don't process if conversion is in progress
    if (isConversionInProgress) {
      return;
    }

    // Extract just the number from the value (remove asset symbol if present)
    const numericValue = String(value).replace(/[^\d.]/g, '');

    if (numericValue === '') {
      setQuoteQtyPlaceholder('Quote Asset Quantity');
    } else {
      setBaseQty(Number(numericValue));
    }

    // Only track as manual entry if there's an actual value
    if (numericValue !== '') {
      // Track that base field was manually entered
      setLastManuallyEnteredField('base');

      // Only clear quote field if base field is empty or quote field is empty
      if (!quoteQty) {
        setQuoteQty('');
      }
    }

    setPreTradeEstimationData({});
  };

  const handleQuoteQtyOnChange = (value) => {
    setQtyLoading(false);

    // Don't process if conversion is in progress
    if (isConversionInProgress) {
      return;
    }

    // Extract just the number from the value (remove asset symbol if present)
    const numericValue = String(value).replace(/[^\d.]/g, '');

    if (numericValue === '') {
      setBaseQtyPlaceholder('Base Asset Quantity');
    } else {
      setQuoteQty(Number(numericValue));
    }

    // Only track as manual entry if there's an actual value
    if (numericValue !== '') {
      // Track that quote field was manually entered
      setLastManuallyEnteredField('quote');

      // Only clear base field if quote field is empty or base field is empty
      if (!baseQty) {
        setBaseQty('');
      }
    }

    setPreTradeEstimationData({});
  };

  const onBasePercentageChangeCommit = (e, newValue) => {
    e.preventDefault();
    const baseIdentifier = options ? selectedPair.name : selectedPair.id;
    const baseAsset = selectedPair.is_contract ? baseIdentifier : selectedPair.base;
    const assetAmount = Math.abs(calculateAssetBalance(baseAsset));

    const val = smartRound(assetAmount * (newValue / 100));
    // Don't track as manual entry since this is from slider
    setBaseQty(val);
    setQuoteQty(''); // Clear quote field when slider is used
    handleTokenQtyBlur(val, true);
  };

  const onQuotePercentageChangeCommit = async (e, newValue) => {
    e.preventDefault();
    const pairPrice = selectedPair?.is_inverse ? await fetchPairPrice() : null;
    const assetAmount = calculateQuoteAssetBalance(pairPrice);
    const val = smartRound(assetAmount * (newValue / 100));
    // Don't track as manual entry since this is from slider
    setQuoteQty(val);
    setBaseQty(''); // Clear base field when slider is used
    handleTokenQtyBlur(val, false, pairPrice);
  };

  const handleCoreFields = {
    handleSelectedAccountsChange: (value, setCommonExchangeName) =>
      handleSelectedAccountsChange(value, setCommonExchangeName, accounts),
    handleSelectedSide,
    handleSelectedPair,
  };

  const quoteBaseStates = {
    baseQty,
    quoteQty,
    baseQtyPlaceholder,
    quoteQtyPlaceholder,
    baseContractQty,
    basePercentage,
    quotePercentage,
    balances,
    setBalances,
    convertedQtyLoading,
    accounts,
    selectedAccounts,
    selectedPair,
    selectedSide,
    relevantExchangePairs,
    convertedQty,
    setBasePercentage,
    setQuotePercentage,
    setSelectedAccounts,
    setSelectedPair,
    setSelectedSide,
    qtyLoading,
    setQtyLoading,
    setBaseQty,
    setQuoteQty,
    lastManuallyEnteredField,
    isConversionInProgress,
  };

  const handleBaseQuoteFields = {
    handleBaseQtyOnChange,
    handleQuoteQtyOnChange,
    onBasePercentageChangeCommit,
    onQuotePercentageChangeCommit,
    handleTokenQtyBlur,
    fetchTradePrediction,
  };

  const percentageSliderInfo = {
    totalQuoteAsset: () => {
      if (!selectedPairPrice.price) {
        fetchPairPrice();
      }
      return calculateQuoteAssetBalance(selectedPairPrice.price);
    },
    totalBaseAsset: () => totalBaseBalance(),
    calculateCurrentBasePercentage,
    calculateCurrentQuotePercentage,
    getPriorityField,
  };

  return {
    autoOrderUrgencies,
    trajectories,
    handleCoreFields,
    quoteBaseStates,
    handleBaseQuoteFields,
    percentageSliderInfo,
    fetchPairPrice,
  };
};
