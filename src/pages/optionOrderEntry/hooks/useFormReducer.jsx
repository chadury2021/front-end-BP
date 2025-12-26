import dayjs from 'dayjs';
import { atom } from 'jotai';
import defaultStrategySettings from '@/pages/dashboard/defaultStrategySettings';

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
export const isReverseLimitPriceAtom = atom(false);
export const stopPriceAtom = atom('');
export const selectedLimitPriceQuickSettingAtom = atom(null);
export const limitPriceQuickSettingAtom = atom(null);
export const isOOLEnabledAtom = atom(false);
export const isEntryEnabledAtom = atom(false);
export const baseQtyAtom = atom('');
export const quoteQtyAtom = atom('');
export const povTargetAtom = atom('');
export const povLimitAtom = atom('');
export const targetTimeAtom = atom(dayjs().add(5, 'minute'));
export const initialLoadAtom = atom(false);
export const maxClipSizeAtom = atom(null);

export const loadingAtom = atom(false);
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
  tokenPairs: [],
});

export const maxOtcPercentageAtom = atom(defaultStrategySettings.otcPercentage);
export const passivenessAtom = atom(defaultStrategySettings.passiveness);
export const discretionAtom = atom(defaultStrategySettings.discretion);
export const alphaTiltAtom = atom(defaultStrategySettings.alphaTilt);
export const notesAtom = atom('');
export const orderConditionAtom = atom('');
export const isOrderConditionValidatedAtom = atom(false);
export const isAdvancedSettingsOpenAtom = atom(false);

// Exit Conditions atoms
export const isExitConditionsOpenAtom = atom(false);
export const takeProfitPriceAtom = atom('');
export const takeProfitPercentageAtom = atom('');
export const takeProfitTypeAtom = atom('price'); // 'price' or 'percentage'
export const stopLossPriceAtom = atom('');
export const stopLossPercentageAtom = atom('');
export const stopLossTypeAtom = atom('price'); // 'price' or 'percentage'
// Add missing atoms for exit types and trailing stop
export const takeProfitExitTypeAtom = atom('maker'); // 'maker', 'vwap', or 'taker'
export const stopLossExitTypeAtom = atom('maker'); // 'maker', 'vwap', or 'taker'
export const isTrailingStopEnabledAtom = atom(false);

export const preTradeEstimationDataAtom = atom({});
export const preTradeDataLoadingAtom = atom(false);
export const preTradeDataErrorAtom = atom('');

export const orderTemplatesAtom = atom([]);
export const orderTemplateActionAtom = atom('');
export const isTemplateOpenAtom = atom(false);

export const favouritePairsAtom = atom({});
export const tokenPairLookUpAtom = atom({});

export const optionDataAtom = atom([]);
export const selectedPairPriceAtom = atom({
  pair: '',
  price: 0,
  timestamp: null,
});
export const posSideAtom = atom(null);
export const orderSlicesAtom = atom(defaultStrategySettings.orderSlices);

export const formPageType = atom(null);

export const qtyLoadingAtom = atom(false);

// Scale orders
export const isScaleOrdersOpenAtom = atom(false);
export const scaleOrderCountAtom = atom(1);
export const scaleFromPriceAtom = atom(''); // number or percentage string e.g. "+1%"
export const scaleToPriceAtom = atom('');
export const scalePriceSkewAtom = atom(0); // -1..1
export const scaleSizeSkewAtom = atom(0); // -1..1
export const scalePriceInputModeAtom = atom('percentage'); // 'percentage' | 'absolute'

// Urgency atoms
export const takeProfitUrgencyAtom = atom('HIGH'); // 'LOW', 'MEDIUM', 'HIGH', 'ULTRA_HIGH'
export const stopLossUrgencyAtom = atom('HIGH'); // 'LOW', 'MEDIUM', 'HIGH', 'ULTRA_HIGH'
