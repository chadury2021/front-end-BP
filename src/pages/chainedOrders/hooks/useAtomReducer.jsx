import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import { atom } from 'jotai';
import defaultStrategySettings from '../../dashboard/defaultStrategySettings';

export const selectedAccountsAtom = atom([]);
export const selectedSideAtom = atom('buy');
export const selectedPairAtom = atom(null);
export const selectedStrategyAtom = atom('');
export const trajectoryAtom = atom('');
export const trajectoryOptionsAtom = atom({});
export const selectedStrategyParamsAtom = atom({});
export const selectedDurationAtom = atom(defaultStrategySettings.duration);
export const updatePairLeverageAtom = atom('');
export const currentLeverageAtom = atom(1);
export const limitPriceAtom = atom('');
export const limitPriceFromOrderBookAtom = atom(false);
export const stopPriceAtom = atom('');
export const selectedLimitPriceQuickSettingAtom = atom(null);
export const isOOLEnabledAtom = atom(false);
export const baseQtyAtom = atom('');
export const quoteQtyAtom = atom('');
export const povTargetAtom = atom('');
export const povLimitAtom = atom('');
export const targetTimeAtom = atom(DateTime.local().plus({ minute: 5 }));
export const initialLoadAtom = atom(false);

export const loadingAtom = atom(true);
export const baseContractQtyAtom = atom('');
export const baseQtyPlaceholderAtom = atom('Base Asset Quantity');
export const quoteQtyPlaceholderAtom = atom('Quote Asset Quantity');
export const basePercentageAtom = atom(0);
export const quotePercentageAtom = atom(0);
export const convertedQtyAtom = atom('');
export const balancesAtom = atom({});
export const convertedQtyLoadingAtom = atom('');
export const relevantExchangePairsAtom = atom([]);

export const durationStartTimeAtom = atom(undefined);
export const durationEndTimeAtom = atom(undefined);
export const volumeChartDataAtom = atom(null);
export const priceChartDataAtom = atom(null);
export const futurePriceVolatilityAtom = atom(null);

export const initialLoadValueAtom = atom({
  accounts: {},
  exchanges: [],
  options: {},
  flat_options: [],
  trajectories: {},
  strategyParams: [],
  superStrategies: [],
  strategies: [],
});

export const passivenessAtom = atom(defaultStrategySettings.passiveness);
export const discretionAtom = atom(defaultStrategySettings.discretion);
export const alphaTiltAtom = atom(defaultStrategySettings.alphaTilt);
export const maxOtcPercentageAtom = atom(defaultStrategySettings.otcPercentage);
export const orderSlicesAtom = atom(defaultStrategySettings.orderSlices);

export const notesAtom = atom('');
export const orderConditionAtom = atom('');
export const isOrderConditionValidatedAtom = atom(false);
export const isAdvancedSettingsOpenAtom = atom(false);

// Exit Conditions atoms
export const isExitConditionsOpenAtom = atom(false);
export const takeProfitPriceAtom = atom('');
export const takeProfitPercentageAtom = atom('');
export const takeProfitTypeAtom = atom('price'); // 'price' or 'percentage'
export const takeProfitExitTypeAtom = atom('price'); // ADDED
export const stopLossPriceAtom = atom('');
export const stopLossPercentageAtom = atom('');
export const stopLossTypeAtom = atom('price'); // 'price' or 'percentage'
export const stopLossExitTypeAtom = atom('price'); // ADDED
export const isTrailingStopEnabledAtom = atom(false); // ADDED

export const preTradeEstimationDataAtom = atom({});
export const preTradeDataLoadingAtom = atom(false);
export const preTradeDataErrorAtom = atom('');

export const orderTemplatesAtom = atom([]);
export const orderTemplateActionAtom = atom('');
export const isTemplateOpenAtom = atom(false);

export const favouritePairsAtom = atom({});
export const tokenPairLookUpAtom = atom({});
export const limitPriceQuickSettingAtom = atom(null);
export const selectedPairPriceAtom = atom({
  pair: '',
  price: 0,
  timestamp: null,
});
export const posSideAtom = atom(null);
export const isReverseLimitPriceAtom = atom(defaultStrategySettings.isReverseLimitPrice);

// 'ChainedOrderPage' || 'DashboardPage'
export const formPageType = atom(null);
export const maxClipSizeAtom = atom(null);

export const qtyLoadingAtom = atom(false);

// Additional atoms needed by OrderFormProvider
export const isEntryEnabledAtom = atom(false);
export const isScaleOrdersOpenAtom = atom(false);
export const scaleOrderCountAtom = atom(2);
export const scaleFromPriceAtom = atom('');
export const scaleToPriceAtom = atom('');
export const scalePriceSkewAtom = atom(0);
export const scaleSizeSkewAtom = atom(0);
export const scalePriceInputModeAtom = atom('percentage');
export const takeProfitUrgencyAtom = atom('MEDIUM');
export const stopLossUrgencyAtom = atom('MEDIUM');
