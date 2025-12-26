import { CASH_ASSETS } from '@/constants';
import { OrderEntryType } from '@/pages/dashboard/orderEntry/util';
import resolveExchangeName from './utils/resolveExchangeName';

export const getValues = ({
  setSelectedAccounts,
  setSelectedSide,
  setSelectedPair,
  handleBaseChange,
  handleQuoteChange,
  setPosSide,
  setPovLimit,
  setPovTarget,
  setOrderCondition,
  setAlphaTilt,
  setDiscretion,
  setPassiveness,
  setSelectedStrategy,
  setTrajectory,
  setSelectedStrategyParams,
  setSelectedDuration,
  setUpdatePairLeverage,
  setTargetTime,
  setStopPrice,
  setLimitPrice,
  setIsOOLEnabled,
  setNotes,
  setLoading,
  setLimitPriceQuickSetting,
  setMaxOtcPercentage,
  setMaxClipSize,
  setUrgency,
}) => {
  return {
    accounts: setSelectedAccounts,
    pair: setSelectedPair,
    side: setSelectedSide,
    pos_side: setPosSide,
    buy_token_amount: handleBaseChange,
    sell_token_amount: handleQuoteChange,
    super_strategy: setSelectedStrategy,
    strategy: setTrajectory,
    duration: setSelectedDuration,
    engine_passiveness: setPassiveness,
    alpha_tilt: setAlphaTilt,
    schedule_discretion: setDiscretion,
    strategy_params: setSelectedStrategyParams,
    order_condition: setOrderCondition,
    notes: setNotes,
    limit_price: setLimitPrice,
    pov_limit: setPovLimit,
    pov_target: setPovTarget,
    target_time: setTargetTime,
    stop_price: setStopPrice,
    max_otc: setMaxOtcPercentage,
    is_ool_pause: setIsOOLEnabled,
    max_clip_size: setMaxClipSize,
    urgency: setUrgency,
  };
};

export const loadFromOrderEdit = async (
  values,
  setOpen,
  setLoading,
  setters,
  tokenPairs,
  strategies,
  trajectories,
  user,
  accounts,
  setOrderEntryType
) => {
  if (Object.keys(values).length < 1) {
    return;
  }
  setOpen(false);
  setLoading(true);

  const getValuesWithSetters = setters;

  const getValuesKeys = Object.keys(setters);

  await new Promise((r) => {
    setTimeout(r, 2000);
  })
    .then(() => {
      setOrderEntryType(values?.is_auto_order ? OrderEntryType.AUTO.key : OrderEntryType.MANUAL.key);
      // Loop through all the values and set the corresponding setter if it exists
      Object.keys(values).forEach((rowKey) => {
        const setterKey = getValuesKeys.find((ele) => ele === rowKey);

        if (setterKey) {
          if (setterKey === 'side') {
            getValuesWithSetters.side(values.side);
          } else if (setterKey === 'accounts') {
            const accountLookupById = {};
            Object.values(accounts).forEach((acc) => {
              accountLookupById[acc.id] = acc.name;
            });
            const scopedAccountNames = values.accounts.map((id) => accountLookupById[id]);
            getValuesWithSetters.accounts(scopedAccountNames);
          } else if (setterKey === 'pair') {
            const pair = tokenPairs.find((p) => p.id === values.pair || p.name === values.pair);

            getValuesWithSetters.pair(pair);
          } else if (setterKey === 'buy_token_amount' || setterKey === 'sell_token_amount') {
            /* empty */
          } else if (setterKey === 'super_strategy') {
            const strategy_id = Object.values({
              ...strategies,
              ...trajectories,
            }).find((strat) => strat.name === values.super_strategy);
            if (strategy_id) {
              getValuesWithSetters.super_strategy(strategy_id.id);
            }
          } else if (setterKey === 'strategy') {
            const strategy_id = Object.values(trajectories).find((strat) => strat.name === values.strategy);
            if (strategy_id) {
              getValuesWithSetters.strategy(strategy_id.id);
            }
          } else if (setterKey === 'limit_price') {
            if (Object.keys(values).includes('limit_price_options')) {
              getValuesWithSetters.limit_price_options(values.limit_price_options);
            } else {
              getValuesWithSetters[setterKey](values[rowKey]);
            }
          } else if (setterKey === 'max_otc') {
            getValuesWithSetters.max_otc(values.max_otc * 100);
          } else if (setterKey === 'pov_limit') {
            getValuesWithSetters.pov_limit(values.pov_limit * 100);
          } else if (setterKey === 'pov_target') {
            getValuesWithSetters.pov_target(values.pov_target * 100);
          } else if (setterKey === 'strategy_params') {
            getValuesWithSetters.strategy_params(values.strategy_params);

            if (Object.keys(values.strategy_params).length > 0) {
              if (values.strategy_params.ool_pause) {
                getValuesWithSetters.is_ool_pause(true);
              }
              if (values.strategy_params.max_clip_size) {
                getValuesWithSetters.max_clip_size(values.strategy_params.max_clip_size);
              }
            }
          } else {
            getValuesWithSetters[setterKey](values[rowKey]);
          }
        }
        // but if it doesn't exist, then we need exceptional handling
        else if (rowKey === 'order_condition_normal' && getValuesKeys.includes('order_condition')) {
          // this is because there's a mismatch between
          // (a) the order_condition_normal (field name in row data)
          // and (b) order_condition (setter key)
          const valuesToSet = values.order_condition_normal;
          getValuesWithSetters.order_condition(valuesToSet);
        }
      });

      if (values.market_type === 'option') {
        // stupid hack to make it work for options TODO: refactor to use sell_token_amount instead
        getValuesWithSetters.buy_token_amount(values.sell_token_amount);
      } else if (values.side === 'sell') {
        if (values.buy_token_amount) {
          getValuesWithSetters.sell_token_amount(values.buy_token_amount);
        } else {
          getValuesWithSetters.buy_token_amount(values.sell_token_amount);
        }
        // if side is buy
      } else if (values.buy_token_amount) {
        getValuesWithSetters.buy_token_amount(values.buy_token_amount);
      } else {
        getValuesWithSetters.sell_token_amount(values.sell_token_amount);
      }

      if (values.auto_order_metadata?.urgency) {
        getValuesWithSetters.urgency(values.auto_order_metadata.urgency);
      }
    })
    .then(() => {
      setLoading(false);
    });
};

export const matchPair = (pairs, pairId) => {
  const foundPairs = pairs.filter((p) => p.id === pairId);
  return foundPairs.length > 0 ? foundPairs[0] : null;
};

export const matchPairByBaseAndExchange = (pairs, base, exchangeNames, isContract) => {
  const resolvedExchangeNames = exchangeNames.map(resolveExchangeName);
  const foundPairs = pairs.filter(
    (p) =>
      p.base === base &&
      p.exchanges.some((exchange) => resolvedExchangeNames.includes(exchange)) &&
      p.is_contract === isContract
  );

  if (foundPairs.length === 0) {
    return null;
  }

  const quotePriority = CASH_ASSETS;

  foundPairs.sort((a, b) => {
    const quoteA = a.quote;
    const quoteB = b.quote;
    const priorityA = quotePriority.indexOf(quoteA);
    const priorityB = quotePriority.indexOf(quoteB);

    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB;
    }

    if (priorityA !== -1) return -1;
    if (priorityB !== -1) return 1;

    return 0;
  });

  if (foundPairs.length === 0) {
    return null;
  }

  return foundPairs[0];
};

const DEFAULT_PAIRS = {
  Binance: 'BTC:PERP-USDT',
  Bybit: 'BTC:PERP-USDT',
  OKX: 'BTC:PERP-USDT',
  Deribit: 'BTC:PERP-USDC',
  Hyperliquid: 'BTC:PERP-USDC',
  MockExchange: 'BTC:PERP-USDT',
  Gate: 'BTC-USDT',
  Coinbase: 'BTC-USDT',
};

export const getDefaultPairByExchange = (exchange, tokenPairs) => {
  const pairId = DEFAULT_PAIRS[exchange] || 'BTC:PERP-USDT';
  return tokenPairs.find((p) => p.id === pairId);
};
