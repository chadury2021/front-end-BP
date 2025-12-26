import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { OrderEntryType } from '@/pages/dashboard/orderEntry/util';

export const OrderFormContext = createContext({});

const orderEntryTypeAtom = atomWithStorage('orderEntryType', OrderEntryType.MANUAL.key);

const fetchPairAttemptsAtom = atom(0);

const urgencyAtom = atom('MEDIUM');
/**
 * Context provider for the order form atoms.
 */
export function OrderFormProvider({ FormAtoms, children }) {
  const [selectedAccounts, setSelectedAccounts] = useAtom(FormAtoms.selectedAccountsAtom);
  const [selectedSide, setSelectedSide] = useAtom(FormAtoms.selectedSideAtom);
  const [selectedPair, setSelectedPair] = useAtom(FormAtoms.selectedPairAtom);
  const [selectedStrategy, setSelectedStrategy] = useAtom(FormAtoms.selectedStrategyAtom);
  const [trajectory, setTrajectory] = useAtom(FormAtoms.trajectoryAtom);
  const [selectedStrategyParams, setSelectedStrategyParams] = useAtom(FormAtoms.selectedStrategyParamsAtom);
  const [selectedDuration, setSelectedDuration] = useAtom(FormAtoms.selectedDurationAtom);
  const [updatePairLeverage, setUpdatePairLeverage] = useAtom(FormAtoms.updatePairLeverageAtom);
  const [currentLeverage, setCurrentLeverage] = useAtom(FormAtoms.currentLeverageAtom);
  const [limitPrice, setLimitPrice] = useAtom(FormAtoms.limitPriceAtom);
  const [stopPrice, setStopPrice] = useAtom(FormAtoms.stopPriceAtom);
  const [selectedLimitPriceQuickSetting, setSelectedLimitPriceQuickSetting] = useAtom(
    FormAtoms.selectedLimitPriceQuickSettingAtom
  );
  const [isOOLEnabled, setIsOOLEnabled] = useAtom(FormAtoms.isOOLEnabledAtom);
  const [isEntryEnabled, setIsEntryEnabled] = useAtom(FormAtoms.isEntryEnabledAtom);
  const [baseQty, setBaseQty] = useAtom(FormAtoms.baseQtyAtom);
  const [quoteQty, setQuoteQty] = useAtom(FormAtoms.quoteQtyAtom);
  const [povTarget, setPovTarget] = useAtom(FormAtoms.povTargetAtom);
  const [povLimit, setPovLimit] = useAtom(FormAtoms.povLimitAtom);
  const [targetTime, setTargetTime] = useAtom(FormAtoms.targetTimeAtom);
  const [initialLoad, setInitialLoad] = useAtom(FormAtoms.initialLoadAtom);
  const [maxClipSize, setMaxClipSize] = useAtom(FormAtoms.maxClipSizeAtom);
  const [loading, setLoading] = useAtom(FormAtoms.loadingAtom);
  const [baseContractQty, setBaseContractQty] = useAtom(FormAtoms.baseContractQtyAtom);
  const [baseQtyPlaceholder, setBaseQtyPlaceholder] = useAtom(FormAtoms.baseQtyPlaceholderAtom);
  const [quoteQtyPlaceholder, setQuoteQtyPlaceholder] = useAtom(FormAtoms.quoteQtyPlaceholderAtom);
  const [basePercentage, setBasePercentage] = useAtom(FormAtoms.basePercentageAtom);
  const [quotePercentage, setQuotePercentage] = useAtom(FormAtoms.quotePercentageAtom);
  const [convertedQty, setConvertedQty] = useAtom(FormAtoms.convertedQtyAtom);
  const [balances, setBalances] = useAtom(FormAtoms.balancesAtom);
  const [convertedQtyLoading, setConvertedQtyLoading] = useAtom(FormAtoms.convertedQtyLoadingAtom);
  const [relevantExchangePairs, setRelevantExchangePairs] = useAtom(FormAtoms.relevantExchangePairsAtom);
  const [durationStartTime, setDurationStartTime] = useAtom(FormAtoms.durationStartTimeAtom);
  const [durationEndTime, setDurationEndTime] = useAtom(FormAtoms.durationEndTimeAtom);
  const [volumeChartData, setVolumeChartData] = useAtom(FormAtoms.volumeChartDataAtom);
  const [priceChartData, setPriceChartData] = useAtom(FormAtoms.priceChartDataAtom);
  const [futurePriceVolatility, setFuturePriceVolatility] = useAtom(FormAtoms.futurePriceVolatilityAtom);
  const [initialLoadValue, setInitialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);
  const [passiveness, setPassiveness] = useAtom(FormAtoms.passivenessAtom);
  const [discretion, setDiscretion] = useAtom(FormAtoms.discretionAtom);
  const [alphaTilt, setAlphaTilt] = useAtom(FormAtoms.alphaTiltAtom);
  const [maxOtcPercentage, setMaxOtcPercentage] = useAtom(FormAtoms.maxOtcPercentageAtom);
  const [orderSlices, setOrderSlices] = useAtom(FormAtoms.orderSlicesAtom);
  const [notes, setNotes] = useAtom(FormAtoms.notesAtom);
  const [orderCondition, setOrderCondition] = useAtom(FormAtoms.orderConditionAtom);
  const [isOrderConditionValidated, setIsOrderConditionValidated] = useAtom(FormAtoms.isOrderConditionValidatedAtom);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useAtom(FormAtoms.isAdvancedSettingsOpenAtom);
  const [preTradeEstimationData, setPreTradeEstimationData] = useAtom(FormAtoms.preTradeEstimationDataAtom);
  const [preTradeDataLoading, setPreTradeDataLoading] = useAtom(FormAtoms.preTradeDataLoadingAtom);
  const [preTradeDataError, setPreTradeDataError] = useAtom(FormAtoms.preTradeDataErrorAtom);
  const [orderTemplates, setOrderTemplates] = useAtom(FormAtoms.orderTemplatesAtom);
  const [orderTemplateAction, setOrderTemplateAction] = useAtom(FormAtoms.orderTemplateActionAtom);
  const [isTemplateOpen, setIsTemplateOpen] = useAtom(FormAtoms.isTemplateOpenAtom);
  const [favouritePairs, setFavouritePairs] = useAtom(FormAtoms.favouritePairsAtom);
  const [tokenPairLookUp, setTokenPairLookUp] = useAtom(FormAtoms.tokenPairLookUpAtom);
  const [limitPriceQuickSetting, setLimitPriceQuickSetting] = useAtom(FormAtoms.limitPriceQuickSettingAtom);
  const [selectedPairPrice, setSelectedPairPrice] = useAtom(FormAtoms.selectedPairPriceAtom);
  const [posSide, setPosSide] = useAtom(FormAtoms.posSideAtom);
  const [isReverseLimitPrice, setIsReverseLimitPrice] = useAtom(FormAtoms.isReverseLimitPriceAtom);
  const [formPageType, setFormPageType] = useAtom(FormAtoms.formPageType);
  const [orderEntryType, setOrderEntryType] = useAtom(orderEntryTypeAtom);
  const [qtyLoading, setQtyLoading] = useAtom(FormAtoms.qtyLoadingAtom);

  // Scale orders
  const [isScaleOrdersOpen, setIsScaleOrdersOpen] = useAtom(FormAtoms.isScaleOrdersOpenAtom);
  const [scaleOrderCount, setScaleOrderCount] = useAtom(FormAtoms.scaleOrderCountAtom);
  const [scaleFromPrice, setScaleFromPrice] = useAtom(FormAtoms.scaleFromPriceAtom);
  const [scaleToPrice, setScaleToPrice] = useAtom(FormAtoms.scaleToPriceAtom);
  const [scalePriceSkew, setScalePriceSkew] = useAtom(FormAtoms.scalePriceSkewAtom);
  const [scaleSizeSkew, setScaleSizeSkew] = useAtom(FormAtoms.scaleSizeSkewAtom);
  const [scalePriceInputMode, setScalePriceInputMode] = useAtom(FormAtoms.scalePriceInputModeAtom);

  // Exit conditions
  const [takeProfitPrice, setTakeProfitPrice] = useAtom(FormAtoms.takeProfitPriceAtom);
  const [stopLossPrice, setStopLossPrice] = useAtom(FormAtoms.stopLossPriceAtom);

  const [takeProfitPercentage, setTakeProfitPercentage] = useAtom(FormAtoms.takeProfitPercentageAtom);
  const [stopLossPercentage, setStopLossPercentage] = useAtom(FormAtoms.stopLossPercentageAtom);
  const [takeProfitUrgency, setTakeProfitUrgency] = useAtom(FormAtoms.takeProfitUrgencyAtom);
  const [stopLossUrgency, setStopLossUrgency] = useAtom(FormAtoms.stopLossUrgencyAtom);

  const [urgency, setUrgency] = useAtom(urgencyAtom);
  const [trajectoryOptions, setTrajectoryOptions] = useAtom(FormAtoms.trajectoryOptionsAtom);
  const [fetchPairAttempts, setFetchPairAttempts] = useAtom(fetchPairAttemptsAtom);

  const resetForm = () => {
    setBasePercentage(0);
    setQuotePercentage(0);
    setBaseQty('');
    setQuoteQty('');
    setConvertedQty('');
    setBaseContractQty('');
    setPreTradeEstimationData({});
    setSelectedPairPrice({ pair: '', price: 0, timestamp: null });
    setFetchPairAttempts(0);

    // Reset scale order parameters
    setScaleOrderCount(1);
    setScaleFromPrice('');
    setScaleToPrice('');
    setScalePriceSkew(0);
    setScaleSizeSkew(0);
    setScalePriceInputMode('percentage');
  };

  // Core form handlers (merged from CoreFormHandlers)
  const handleSelectedAccountsChange = useCallback(
    (value, setCommonExchangeName, accounts) => {
      // Ensure value is always an array
      const valueArray = Array.isArray(value) ? value : [value];

      // Only allow single account from OKXDEX
      const hasOKXDEXAccount = valueArray.some((accountName) => accounts?.[accountName]?.exchangeName === 'OKXDEX');
      if (hasOKXDEXAccount) {
        setSelectedAccounts(valueArray.slice(-1));
      } else {
        setSelectedAccounts(valueArray);
      }
    },
    [setSelectedAccounts]
  );

  const handleSelectedSide = useCallback(
    (event, newSide) => {
      if (newSide === null || selectedSide === newSide) {
        return;
      }

      if (!selectedPair) {
        setBaseQtyPlaceholder('Base Asset Qty');
        setQuoteQtyPlaceholder('Quote Asset Qty');
      } else {
        setBaseQtyPlaceholder(selectedPair.base);
        setQuoteQtyPlaceholder(selectedPair.quote);
      }

      setSelectedSide(newSide);
    },
    [selectedSide, selectedPair, setBaseQtyPlaceholder, setQuoteQtyPlaceholder, setSelectedSide]
  );

  const handleSelectedPair = useCallback(
    async (newPair) => {
      if (newPair) {
        setBaseQtyPlaceholder(newPair.base);
        setQuoteQtyPlaceholder(newPair.quote);
      }
      setSelectedPair(newPair);
      resetForm();
    },
    [setBaseQtyPlaceholder, setQuoteQtyPlaceholder, setSelectedPair, resetForm]
  );

  const value = useMemo(
    () => ({
      FormAtoms, // For backwards compatibility, remove once all components are updated to use context
      selectedAccounts,
      setSelectedAccounts,
      selectedSide,
      setSelectedSide,
      selectedPair,
      setSelectedPair,
      selectedStrategy,
      setSelectedStrategy,
      trajectory,
      setTrajectory,
      selectedStrategyParams,
      setSelectedStrategyParams,
      selectedDuration,
      setSelectedDuration,
      updatePairLeverage,
      setUpdatePairLeverage,
      currentLeverage,
      setCurrentLeverage,
      limitPrice,
      setLimitPrice,
      stopPrice,
      setStopPrice,
      selectedLimitPriceQuickSetting,
      setSelectedLimitPriceQuickSetting,
      isOOLEnabled,
      setIsOOLEnabled,
      isEntryEnabled,
      setIsEntryEnabled,
      baseQty,
      setBaseQty,
      quoteQty,
      setQuoteQty,
      povTarget,
      setPovTarget,
      povLimit,
      setPovLimit,
      targetTime,
      setTargetTime,
      initialLoad,
      setInitialLoad,
      maxClipSize,
      setMaxClipSize,
      loading,
      setLoading,
      baseContractQty,
      setBaseContractQty,
      baseQtyPlaceholder,
      setBaseQtyPlaceholder,
      quoteQtyPlaceholder,
      setQuoteQtyPlaceholder,
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
      relevantExchangePairs,
      setRelevantExchangePairs,
      durationStartTime,
      setDurationStartTime,
      durationEndTime,
      setDurationEndTime,
      volumeChartData,
      setVolumeChartData,
      priceChartData,
      setPriceChartData,
      futurePriceVolatility,
      setFuturePriceVolatility,
      initialLoadValue,
      setInitialLoadValue,
      passiveness,
      setPassiveness,
      discretion,
      setDiscretion,
      alphaTilt,
      setAlphaTilt,
      maxOtcPercentage,
      setMaxOtcPercentage,
      orderSlices,
      setOrderSlices,
      notes,
      setNotes,
      orderCondition,
      setOrderCondition,
      isOrderConditionValidated,
      setIsOrderConditionValidated,
      isAdvancedSettingsOpen,
      setIsAdvancedSettingsOpen,
      preTradeEstimationData,
      setPreTradeEstimationData,
      preTradeDataLoading,
      setPreTradeDataLoading,
      preTradeDataError,
      setPreTradeDataError,
      orderTemplates,
      setOrderTemplates,
      orderTemplateAction,
      setOrderTemplateAction,
      isTemplateOpen,
      setIsTemplateOpen,
      favouritePairs,
      setFavouritePairs,
      tokenPairLookUp,
      setTokenPairLookUp,
      limitPriceQuickSetting,
      setLimitPriceQuickSetting,
      selectedPairPrice,
      setSelectedPairPrice,
      posSide,
      setPosSide,
      isReverseLimitPrice,
      setIsReverseLimitPrice,
      formPageType,
      setFormPageType,
      orderEntryType,
      setOrderEntryType,
      urgency,
      setUrgency,
      trajectoryOptions,
      setTrajectoryOptions,
      fetchPairAttempts,
      setFetchPairAttempts,
      qtyLoading,
      setQtyLoading,
      // Scale orders
      isScaleOrdersOpen,
      setIsScaleOrdersOpen,
      scaleOrderCount,
      setScaleOrderCount,
      scaleFromPrice,
      setScaleFromPrice,
      scaleToPrice,
      setScaleToPrice,
      scalePriceSkew,
      setScalePriceSkew,
      scaleSizeSkew,
      setScaleSizeSkew,
      scalePriceInputMode,
      setScalePriceInputMode,
      // Exit conditions
      takeProfitPrice,
      setTakeProfitPrice,
      stopLossPrice,
      setStopLossPrice,

      takeProfitPercentage,
      setTakeProfitPercentage,
      stopLossPercentage,
      setStopLossPercentage,
      takeProfitUrgency,
      setTakeProfitUrgency,
      stopLossUrgency,
      setStopLossUrgency,
      resetForm,
      // Core form handlers
      handleSelectedAccountsChange,
      handleSelectedSide,
      handleSelectedPair,
    }),
    [
      FormAtoms,
      selectedAccounts,
      setSelectedAccounts,
      selectedSide,
      setSelectedSide,
      selectedPair,
      setSelectedPair,
      selectedStrategy,
      setSelectedStrategy,
      trajectory,
      setTrajectory,
      selectedStrategyParams,
      setSelectedStrategyParams,
      selectedDuration,
      setSelectedDuration,
      updatePairLeverage,
      setUpdatePairLeverage,
      currentLeverage,
      setCurrentLeverage,
      limitPrice,
      setLimitPrice,
      stopPrice,
      setStopPrice,
      selectedLimitPriceQuickSetting,
      setSelectedLimitPriceQuickSetting,
      isOOLEnabled,
      setIsOOLEnabled,
      baseQty,
      setBaseQty,
      quoteQty,
      setQuoteQty,
      povTarget,
      setPovTarget,
      povLimit,
      setPovLimit,
      targetTime,
      setTargetTime,
      initialLoad,
      setInitialLoad,
      maxClipSize,
      setMaxClipSize,
      loading,
      setLoading,
      baseContractQty,
      setBaseContractQty,
      baseQtyPlaceholder,
      setBaseQtyPlaceholder,
      quoteQtyPlaceholder,
      setQuoteQtyPlaceholder,
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
      relevantExchangePairs,
      setRelevantExchangePairs,
      durationStartTime,
      setDurationStartTime,
      durationEndTime,
      setDurationEndTime,
      volumeChartData,
      setVolumeChartData,
      priceChartData,
      setPriceChartData,
      futurePriceVolatility,
      setFuturePriceVolatility,
      initialLoadValue,
      setInitialLoadValue,
      passiveness,
      setPassiveness,
      discretion,
      setDiscretion,
      alphaTilt,
      setAlphaTilt,
      maxOtcPercentage,
      setMaxOtcPercentage,
      orderSlices,
      setOrderSlices,
      notes,
      setNotes,
      orderCondition,
      setOrderCondition,
      isOrderConditionValidated,
      setIsOrderConditionValidated,
      isAdvancedSettingsOpen,
      setIsAdvancedSettingsOpen,
      preTradeEstimationData,
      setPreTradeEstimationData,
      preTradeDataLoading,
      setPreTradeDataLoading,
      preTradeDataError,
      setPreTradeDataError,
      orderTemplates,
      setOrderTemplates,
      orderTemplateAction,
      setOrderTemplateAction,
      isTemplateOpen,
      setIsTemplateOpen,
      favouritePairs,
      setFavouritePairs,
      tokenPairLookUp,
      setTokenPairLookUp,
      limitPriceQuickSetting,
      setLimitPriceQuickSetting,
      selectedPairPrice,
      setSelectedPairPrice,
      posSide,
      setPosSide,
      isReverseLimitPrice,
      setIsReverseLimitPrice,
      formPageType,
      setFormPageType,
      orderEntryType,
      setOrderEntryType,
      urgency,
      setUrgency,
      trajectoryOptions,
      setTrajectoryOptions,
      fetchPairAttempts,
      setFetchPairAttempts,
      qtyLoading,
      setQtyLoading,
      // Scale orders
      isScaleOrdersOpen,
      setIsScaleOrdersOpen,
      scaleOrderCount,
      setScaleOrderCount,
      scaleFromPrice,
      setScaleFromPrice,
      scaleToPrice,
      setScaleToPrice,
      scalePriceSkew,
      setScalePriceSkew,
      scaleSizeSkew,
      setScaleSizeSkew,
      scalePriceInputMode,
      setScalePriceInputMode,
      // Exit conditions
      takeProfitPrice,
      setTakeProfitPrice,
      stopLossPrice,
      setStopLossPrice,

      takeProfitPercentage,
      setTakeProfitPercentage,
      stopLossPercentage,
      setStopLossPercentage,
      takeProfitUrgency,
      setTakeProfitUrgency,
      stopLossUrgency,
      setStopLossUrgency,
      resetForm,
      // Core form handlers
      handleSelectedAccountsChange,
      handleSelectedSide,
      handleSelectedPair,
    ]
  );

  return <OrderFormContext.Provider value={value}>{children}</OrderFormContext.Provider>;
}

export const useOrderForm = () => useContext(OrderFormContext);
