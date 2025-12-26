import { fetchMultiOrderDetailData } from '@/apiServices';

const parseJsonField = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const buildAccountMap = (childOrders) => {
  return childOrders.reduce((accumulator, child) => {
    (child.accounts || []).forEach((account) => {
      if (!account || !account.name) return;
      if (!accumulator[account.name]) {
        accumulator[account.name] = {
          id: account.id,
          name: account.name,
          exchangeName: account.exchange,
          displayName: `${account.exchange} - ${account.name}`,
          logo: account.exchange ? account.exchange.toLowerCase() : undefined,
        };
      }
    });
    return accumulator;
  }, {});
};

const hasValue = (value) => value !== null && value !== undefined && value !== '';

const determineTargetFields = (child) => {
  const buyTokenAmount = hasValue(child.buy_token_amount) ? child.buy_token_amount : null;
  const sellTokenAmount = hasValue(child.sell_token_amount) ? child.sell_token_amount : null;
  const targetBaseQty = hasValue(child.target_base_qty) ? child.target_base_qty : null;
  const targetNotional = hasValue(child.target_notional) ? child.target_notional : null;

  const isTargetBase = child.side === 'buy' ? !!buyTokenAmount : !buyTokenAmount;

  if (isTargetBase) {
    const baseValue =
      child.side === 'buy'
        ? buyTokenAmount ?? targetBaseQty ?? sellTokenAmount
        : sellTokenAmount ?? targetBaseQty ?? buyTokenAmount;

    return {
      qty: baseValue,
      isBaseAsset: true,
      baseField: baseValue,
      quoteField: null,
    };
  }

  const quoteValue =
    child.side === 'buy'
      ? sellTokenAmount ?? targetNotional ?? buyTokenAmount
      : buyTokenAmount ?? targetNotional ?? sellTokenAmount;

  return {
    qty: quoteValue,
    isBaseAsset: false,
    baseField: null,
    quoteField: quoteValue,
  };
};

const normalizeQty = (value) => {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
};

const normalizeDuration = (duration) => {
  if (duration === null || duration === undefined) {
    return undefined;
  }
  const numericDuration = Number(duration);
  return Number.isFinite(numericDuration) ? numericDuration : duration;
};

const normalizeLimitPriceSpread = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'none') {
      return undefined;
    }
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : trimmed;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  return undefined;
};

const buildChildTransforms = (childOrders) => {
  return childOrders.map((child) => {
    const accountNames = (child.accounts || []).map((account) => account.name);
    const { qty, isBaseAsset, baseField, quoteField } = determineTargetFields(child);
    const normalizedQty = normalizeQty(qty);
    const normalizedBase = normalizeQty(baseField);
    const normalizedQuote = normalizeQty(quoteField);

    const submitPayload = {
      accounts: accountNames,
      pair: child.pair,
      side: child.side,
    };
    const hasBaseValue = normalizedBase !== '';
    const hasQuoteValue = normalizedQuote !== '';

    if (isBaseAsset && hasBaseValue) {
      submitPayload.base_asset_qty = normalizedBase;
    } else if (!isBaseAsset && hasQuoteValue) {
      submitPayload.quote_asset_qty = normalizedQuote;
    }
    if (child.pos_side) {
      submitPayload.pos_side = child.pos_side;
    }

    const confirmationPayload = {
      ...submitPayload,
      base_asset_qty: isBaseAsset && hasBaseValue ? normalizedBase : undefined,
      quote_asset_qty: !isBaseAsset && hasQuoteValue ? normalizedQuote : undefined,
    };

    const formRow = {
      accountNames,
      pairId: child.pair,
      qty: normalizedQty,
      side: child.side,
      isBaseAsset,
      posSide: child.pos_side || null,
      accounts: accountNames,
    };

    return {
      submit: submitPayload,
      confirmation: confirmationPayload,
      form: formRow,
    };
  });
};

export const hydrateMultiOrderResubmit = async (orderId) => {
  const detail = await fetchMultiOrderDetailData(orderId);
  const order = detail.order || {};
  const childOrders = detail.child_orders || [];
  const accountMap = buildAccountMap(childOrders);
  const strategyParams = parseJsonField(order.strategy_params);
  const strategyKey = order.strategy || 'Existing Strategy';

  const childTransforms = buildChildTransforms(childOrders);
  const allAccountNames = Array.from(
    new Set(childTransforms.flatMap((item) => item.form.accountNames).filter(Boolean))
  );

  const resolvedCondition = order.order_condition || order.order_condition_normal;
  const normalizedCondition = (() => {
    if (!resolvedCondition) return undefined;
    if (typeof resolvedCondition === 'string') {
      const trimmed = resolvedCondition.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return resolvedCondition;
  })();

  const includeOrderConditionVars = normalizedCondition ? order.order_condition_vars : undefined;

  const normalizedLimitSpread = normalizeLimitPriceSpread(order.limit_price_spread);

  const submitPayload = {
    alpha_tilt: order.alpha_tilt,
    duration: normalizeDuration(order.duration),
    engine_passiveness: order.engine_passiveness,
    schedule_discretion: order.schedule_discretion,
    directional_bias: order.directional_bias,
    strategy: order.strategy,
    strategy_params: strategyParams,
    exposure_tolerance: order.exposure_tolerance,
    ...(normalizedLimitSpread !== undefined ? { limit_price_spread: normalizedLimitSpread } : {}),
    pov_limit: order.pov_limit,
    child_orders: childTransforms.map((item) => item.submit),
    accounts: allAccountNames,
    ...(normalizedCondition ? { order_condition: normalizedCondition } : {}),
    ...(includeOrderConditionVars ? { order_condition_vars: includeOrderConditionVars } : {}),
  };

  const confirmationData = {
    ...submitPayload,
    strategies: {
      [strategyKey]: {
        name: order.strategy,
      },
    },
    strategy: strategyKey,
    accounts: accountMap,
    child_orders: childTransforms.map((item) => item.confirmation),
  };

  const entryPrefill = {
    buy: childTransforms
      .filter((item) => item.form.side === 'buy')
      .map((item) => item.form),
    sell: childTransforms
      .filter((item) => item.form.side === 'sell')
      .map((item) => item.form),
    accounts: accountMap,
    strategy: strategyKey,
    strategyName: order.strategy,
    duration: normalizeDuration(order.duration),
    strategyParams,
    passiveness: order.engine_passiveness,
    discretion: order.schedule_discretion,
    exposureTolerance: order.exposure_tolerance,
    alphaTilt: order.alpha_tilt,
    limitPriceSpread: normalizedLimitSpread ?? null,
    orderCondition: normalizedCondition || '',
    orderConditionVars: includeOrderConditionVars,
  };

  return {
    detail,
    submitPayload,
    confirmationData,
    entryPrefill,
  };
};
