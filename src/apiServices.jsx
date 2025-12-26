const joinUrl = (base, path) => new URL(path, base).href;

const INTERNAL_API_PREFIX = 'internal/';
export const TCA_STATS_URL = `${INTERNAL_API_PREFIX}analytics/tca_stats`;
export const ORDER_SEARCH_URL = `${INTERNAL_API_PREFIX}ems/get_order_table_rows`;
export const MONAD_BASE_URL = 'https://testnet.monadexplorer.com/tx/';
export const ARWEAVE_BASE_URL = 'https://arweave.app/tx/';
const APP_BASE_URL =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BASE_URL) || 'https://app.tread.fi';

export { APP_BASE_URL };

export class ApiError extends Error {}

export const openInNewTab = (url) => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

const getCsrfTokenFromCookies = () => {
  const cookies = document.cookie.split(';');
  const csrfTokenCookie = cookies.find((cookie) => cookie.trim().startsWith('csrftoken='));
  if (!csrfTokenCookie) return null;
  return csrfTokenCookie.split('=')[1];
};

const commonHeaders = ({ csrfToken }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip',
  };

  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new ApiError(e.message);
  }
  if (response.ok) {
    return data;
  }

  const errorBody = data;

  // Handle different error response formats
  if (typeof errorBody === 'string') {
    throw new ApiError(errorBody);
  }

  if (errorBody.error) {
    throw new ApiError(errorBody.error);
  }

  if (errorBody.message) {
    throw new ApiError(errorBody.message);
  }

  if (errorBody.errors) {
    const errorMessage = Array.isArray(errorBody.errors) ? errorBody.errors.join(', ') : errorBody.errors;
    throw new ApiError(errorMessage);
  }

  throw new ApiError('An error occurred. Please try again.');
};

const makeApiCall = async (path, options = {}, baseUrl = null, apiToken = null) => {
  const fetchUrl = baseUrl ? joinUrl(baseUrl, path) : joinUrl(window.location.origin, path);
  const fetchOptions = { ...options };
  fetchOptions.headers = {
    ...options.headers,
    ...commonHeaders({ csrfToken: getCsrfTokenFromCookies() }),
  };

  // Add API token authentication if provided
  if (apiToken) {
    fetchOptions.headers.Authorization = `Token ${apiToken}`;
  }

  try {
    const response = await fetch(fetchUrl, fetchOptions);
    return await handleResponse(response);
  } catch (error) {
    throw new ApiError(error);
  }
};

export const fetchAccountData = ({ startTime, endTime }) => {
  const paramsObj = {
    start_time: startTime,
    end_time: endTime,
  };

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}account/balances_page_data/?${params}`, {
    method: 'GET',
  });
};

export const fetchCachedAccountBalances = (account_names = []) => {
  const paramsObj = {
    account_names: account_names.join(','),
  };

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/get_cached_account_balance?${params}`, {
    method: 'GET',
  });
};

export const fetchOrderEntryFormData = () => {
  return makeApiCall('api/order_form_data', {
    method: 'GET',
  });
};

export const fetchNoUserOrderEntryFormData = () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/no_user_order_form_data`, {
    method: 'GET',
  });
};

export const fetchOptionOrderEntryFormData = () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/option_order_form_data`, {
    method: 'GET',
  });
};

export const fetchOrderDetailData = (order_id) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/order/${order_id}`, {
    method: 'GET',
  });
};

export const fetchSuperOrderDetailData = (orderId) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}ems/order/${orderId}`, {
    method: 'GET',
  });
};

export const fetchPlacements = ({ orderId, statuses = undefined, pageSize = 20, pageNumber = 1 }) => {
  const paramsObj = {
    order_id: orderId,
    page_size: pageSize,
    page_number: pageNumber,
  };

  if (statuses) {
    paramsObj.statuses = statuses;
  }

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`api/placements?${params}`, {
    method: 'GET',
  });
};

export const fetchMultiOrderBenchmarkData = (order_id) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/multi_order_benchmark/${order_id}`, {
    method: 'GET',
  });
};

export const fetchMultiOrderDetailData = (order_id) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/multi_order/${order_id}`, {
    method: 'GET',
  });
};

export const fetchMarketMakerOrders = (page_number, page_size, after, before, statuses) => {
  const paramsObj = {};
  if (page_number) {
    paramsObj.page_number = page_number;
  }
  if (page_size) {
    paramsObj.page_size = page_size;
  }
  if (after) {
    paramsObj.after = after;
  }
  if (before) {
    paramsObj.before = before;
  }
  if (Array.isArray(statuses) && statuses.length > 0) {
    paramsObj.statuses = statuses.join(',');
  }
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`api/market_maker_orders/?${params}`, {
    method: 'GET',
  });
};

export const fetchDeltaNeutralOrders = (page_number, page_size, after, before, statuses) => {
  const paramsObj = {};
  if (page_number) {
    paramsObj.page_number = page_number;
  }
  if (page_size) {
    paramsObj.page_size = page_size;
  }
  if (after) {
    paramsObj.after = after;
  }
  if (before) {
    paramsObj.before = before;
  }
  if (Array.isArray(statuses) && statuses.length > 0) {
    paramsObj.statuses = statuses.join(',');
  }
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`api/delta_neutral_orders/?${params}`, {
    method: 'GET',
  });
};

export const fetchDeltaNeutralPositions = (active_only = true) => {
  const paramsObj = { active_only: active_only ? 'true' : 'false' };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`api/delta_neutral_positions/?${params}`, {
    method: 'GET',
  });
};

export const cancelMultiOrder = (multi_order_id) => {
  return makeApiCall(`api/multi_order/${multi_order_id}`, {
    method: 'DELETE',
  });
};

export const pauseMultiOrder = (multi_order_id) => {
  return makeApiCall(`api/pause_multi_order/`, {
    method: 'POST',
    body: JSON.stringify({ multi_order_id }),
  });
};

export const resumeMultiOrder = (multi_order_id) => {
  return makeApiCall(`api/resume_multi_order/`, {
    method: 'POST',
    body: JSON.stringify({ multi_order_id }),
  });
};

export const abandonGuaranteeMultiOrder = (multi_order_id) => {
  return makeApiCall(`api/abandon_guarantee_multi_order/`, {
    method: 'POST',
    body: JSON.stringify({ multi_order_id }),
  });
};

export const applyGuaranteeMultiOrder = (multi_order_id) => {
  return makeApiCall(`api/apply_guarantee_multi_order/`, {
    method: 'POST',
    body: JSON.stringify({ multi_order_id }),
  });
};

export const changeMarketMakerSpread = (multi_order_id, spread_bps, options = {}) => {
  const payload = {
    multi_order_id,
    spread_bps,
    ...options,
  };

  return makeApiCall(`api/change_mm_spread/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const submitChainedOrder = async (fields = {}) => {
  return makeApiCall('api/chained_orders/', {
    method: 'POST',
    body: JSON.stringify({ ...fields }),
  });
};

export const cancelChainedOrder = (chained_order_id) => {
  return makeApiCall(`api/chained_orders/${chained_order_id}`, {
    method: 'DELETE',
  });
};

export const resumeChainedOrder = (chained_order_id) => {
  return makeApiCall('api/resume_chained_order/', {
    method: 'POST',
    body: JSON.stringify({ chained_order_id }),
  });
};

export const cancelBatchOrder = (batch_order_id) => {
  return makeApiCall('api/cancel_batch_order/', {
    method: 'POST',
    body: JSON.stringify({ batch_order_id }),
  });
};

export const pauseBatchOrder = (batch_order_id) => {
  return makeApiCall('api/pause_batch_order/', {
    method: 'POST',
    body: JSON.stringify({ batch_order_id }),
  });
};

export const resumeBatchOrder = (batch_order_id) => {
  return makeApiCall('api/resume_batch_order/', {
    method: 'POST',
    body: JSON.stringify({ batch_order_id }),
  });
};

export const fetchChainedOrderDetailData = (order_id) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/chained_orders/${order_id}`, {
    method: 'GET',
  });
};

export const fetchChainedOrderBenchmarkData = (order_id) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/chained_order_benchmark/${order_id}`, {
    method: 'GET',
  });
};

export const fetchPovOrderChartData = (order_id) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/pov_order_chart_data/${order_id}`, {
    method: 'GET',
  });
};

export const fetchExchangePairs = (exchange_names, pair) => {
  const params = new URLSearchParams({
    exchange_names: exchange_names.join(','),
    pair,
  });

  return makeApiCall(`${INTERNAL_API_PREFIX}sor/exchange_pairs?${params}`, {
    method: 'GET',
  });
};

export const convertQty = (
  accounts,
  pair,
  qty,
  is_base_asset,
  pre_calculated_price = null,
  convert_to_num_contracts = false
) => {
  const paramsObj = { pair };

  if (accounts?.length > 0) {
    paramsObj.accounts = accounts;
  }

  if (pre_calculated_price) {
    paramsObj.pre_calculated_price = pre_calculated_price;
  }

  if (convert_to_num_contracts) {
    paramsObj.convert_to_num_contracts = convert_to_num_contracts;
  }

  if (is_base_asset) {
    paramsObj.base_asset_qty = qty;
  } else {
    paramsObj.quote_asset_qty = qty;
  }

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}account/convert_qty?${params}`, {
    method: 'GET',
  });
};

export const getPairPrice = (pair, exchange_name) => {
  const paramsObj = { pair };
  if (exchange_name) {
    paramsObj.exchange_name = exchange_name;
  }

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/get_pair_price?${params}`, {
    method: 'GET',
  });
};

export const getDexQuote = (from_token, to_token, amount, account_id) => {
  const paramsObj = { from_token, to_token, amount, account_id };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/get_quote?${params}`, {
    method: 'GET',
  });
};

export const getDexPrice = (token) => {
  const paramsObj = { token };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/get_price?${params}`, {
    method: 'GET',
  });
};

export const submitOrder = (fields = {}) => {
  return makeApiCall('api/orders/', {
    method: 'POST',
    body: JSON.stringify({ ...fields }),
  });
};

export const createScaleOrders = (fields = {}) => {
  return makeApiCall('api/scale_orders/', {
    method: 'POST',
    body: JSON.stringify({ ...fields }),
  });
};

export const getBulkOrder = (ids) => {
  const paramsObj = { ids };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/bulk_orders?${params}`, {
    method: 'GET',
  });
};

export const getBulkChainedOrders = (ids) => {
  const paramsObj = { ids };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/bulk_chained_orders?${params}`, {
    method: 'GET',
  });
};

export const getBulkBatchedOrders = (ids) => {
  const paramsObj = { ids };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/bulk_batch_orders?${params}`, {
    method: 'GET',
  });
};

export const resubmitOrder = (fields = {}) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/resubmit_order`, {
    method: 'POST',
    body: JSON.stringify({ ...fields }),
  });
};

export const resubmitRemainingOrder = (fields = {}) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/resubmit_remaining_order`, {
    method: 'POST',
    body: JSON.stringify({ ...fields }),
  });
};

export const submitMultiOrder = (fields = {}) => {
  return makeApiCall('api/multi_orders/', {
    method: 'POST',
    body: JSON.stringify({ ...fields }),
  });
};

export const submitCancel = (pk, fields = {}) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/cancel_order/${pk}`, {
    method: 'POST',
    body: JSON.stringify({ ...fields }),
  });
};

export const validateOrderCondition = (order_condition) => {
  return makeApiCall('api/validate_order_condition/', {
    method: 'POST',
    body: JSON.stringify({ order_condition }),
  });
};

export const cancelAllOrders = () => {
  return makeApiCall('api/cancel_all_orders/', {
    method: 'POST',
  });
};

export const getPredictionChartData = ({ exchangeName, pair, startTime, endTime, currentTime }) => {
  const paramsObj = {
    exchange_name: exchangeName,
    pair,
    start_time: startTime,
    end_time: endTime,
    current_time: currentTime,
  };

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}marketdata/get_prediction_chart_data?${params}`, {
    method: 'GET',
  });
};

export const getTradingViewDataFeed = () => {
  return joinUrl(window.location.origin, `${INTERNAL_API_PREFIX}marketdata/get_trading_view_datafeed`);
};

export const calculatePreTradeAnalytics = async ({ orderAttrs, priceLookup }) => {
  const data = {
    order_attrs: orderAttrs,
    price_lookup: priceLookup,
  };

  return makeApiCall(`${INTERNAL_API_PREFIX}marketdata/calculate_pre_trade_analytics`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const addExchangeAccount = async (
  name,
  exchange,
  api_key,
  api_secret,
  password,
  credential_options,
  vault_address = null
) => {
  const data = {
    name,
    exchange,
    api_key,
    api_secret,
    credential_options,
    vault_address,
  };

  if (password) {
    data.password = password;
  }

  return makeApiCall('api/accounts/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const unarchiveCredential = async ({ credential_id, api_key, api_secret, password }) => {
  const data = {
    credential_id,
    api_key,
  };

  if (api_secret) {
    data.api_secret = api_secret;
  }

  if (password) {
    data.password = password;
  }

  return makeApiCall(`${INTERNAL_API_PREFIX}account/unarchive_credential/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteAccount = async (name) => {
  const data = { name };
  return makeApiCall('api/accounts/', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

export const getAccounts = async (includeArchived = false) => {
  const paramsObj = { include_archived: includeArchived };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`api/accounts/?${params}`, {
    method: 'GET',
  });
};

export const getAdminAccounts = async () => {
  return makeApiCall(`api/admin/accounts/`, {
    method: 'GET',
  });
};

export const updateAccount = async ({ id, margin_mode }) => {
  const data = { id, margin_mode };
  return makeApiCall('api/accounts/', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const renameAccount = async ({ account_id, new_name }) => {
  const data = { account_id, new_name };
  return makeApiCall(`${INTERNAL_API_PREFIX}account/rename_account/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const refreshAccountBalanceCache = async (account_id) => {
  const data = { account_id };

  return makeApiCall(`${INTERNAL_API_PREFIX}account/refresh_account_balance_cache/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const refreshAllAccountBalanceCache = async () => {
  try {
    const accounts = await getAccounts();
    const refreshPromises = accounts.map((account) => refreshAccountBalanceCache(account.id));
    await Promise.all(refreshPromises);
  } catch (error) {
    throw new Error(`Failed to refresh account balances: ${error.message}`);
  }
};

export const calculateDurationForPov = async (exchange_names, pair, base_asset_qty, pov_target) => {
  const paramsObj = {
    exchange_names: exchange_names.join(','),
    pair,
    base_asset_qty,
    pov_target,
  };

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}marketdata/calculate_duration_for_pov?${params}`, {
    method: 'GET',
  });
};

export const getOrderBook = async (exchange_name, pair) => {
  const paramsObj = {
    exchange_name,
    pair,
  };

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/get_order_book?${params}`, {
    method: 'GET',
  });
};

export const getLeverage = async (pair, accountIds = []) => {
  const paramsObj = { pair };
  if (accountIds && accountIds.length > 0) {
    paramsObj.account_ids = accountIds.join(',');
  }
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/get_leverage?${params}`, {
    method: 'GET',
  });
};

export const setLeverage = async (leverage, pair, accountIds = [], marginMode = null) => {
  const body = { leverage, pair, account_ids: accountIds };

  // Add margin_mode if provided (for Hyperliquid: "CROSS" or "ISOLATED")
  if (marginMode !== null && marginMode !== undefined) {
    body.margin_mode = marginMode;
  }

  return makeApiCall(`${INTERNAL_API_PREFIX}sor/set_leverage`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const getOrderTemplates = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/order_templates`, {
    method: 'GET',
  });
};

export const createOrderTemplate = async (data) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/order_templates`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteOrderTemplates = async (template_ids) => {
  const data = { template_ids };
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/order_templates`, {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

export const amendOrder = async (order_id, changes) => {
  const data = { order_id, changes };
  return makeApiCall(`api/amend_order/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const pauseOrder = async (order_id) => {
  const data = { order_id };
  return makeApiCall(`api/pause_order/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const pauseAllOrders = async () => {
  return makeApiCall(`api/pause_all_orders/`, {
    method: 'POST',
  });
};

export const resumeOrder = async (order_id) => {
  const data = { order_id };
  return makeApiCall(`api/resume_order/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const resumeAllOrders = async () => {
  return makeApiCall(`api/resume_all_orders/`, {
    method: 'POST',
  });
};

export const emailHelp = async (order_id) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}ems/get_email_help?order_id=${order_id}`, {
    method: 'GET',
  });
};

export const getUserFavouritePairs = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/user_favourite_pairs/`, {
    method: 'GET',
  });
};

export const addUserFavouritePairs = async (pairs) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/user_favourite_pairs/`, {
    method: 'POST',
    body: JSON.stringify({ pairs }),
  });
};

export const deleteUserFavouritePairs = async (pairs) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/user_favourite_pairs/`, {
    method: 'DELETE',
    body: JSON.stringify({ pairs }),
  });
};

export const getOptionData = async (exchange, underlying, date) => {
  const data = {
    exchange,
    underlying,
    date,
  };
  const params = new URLSearchParams(data);

  return makeApiCall(`${INTERNAL_API_PREFIX}sor/get_option_data?${params}`, {
    method: 'GET',
  });
};

export const connectNettingServer = async () => {
  return makeApiCall('dicy/connect/', {
    method: 'POST',
  });
};

export const resetPassword = async (user_id, old_password, new_password, confirm_password) => {
  const data = { user_id, old_password, new_password, confirm_password };
  return makeApiCall(`${INTERNAL_API_PREFIX}account/reset_password/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const logout = async () => {
  // exception for logout path still in django
  return makeApiCall(`account/logout/`, {
    method: 'POST',
  });
};

export const getUserMetadata = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/user_metadata/`, {
    method: 'GET',
  });
};

export const getTelegramMetadata = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/telegram_metadata`, {
    method: 'GET',
  });
};

export const assignAccountPermission = async (account_id, group_id) => {
  const data = { account_id, group_id };

  return makeApiCall(`${INTERNAL_API_PREFIX}account/assign_account_permission/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const unassignAccountPermission = async (account_id, group_id) => {
  const data = { account_id, group_id };
  return makeApiCall(`${INTERNAL_API_PREFIX}account/unassign_account_permission/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getTokenPairLookup = async () => {
  return makeApiCall('api/get_token_pairs/', {
    method: 'GET',
  });
};

export const closeBalances = async (max_notional, account_names) => {
  const data = { max_notional, account_names };
  return makeApiCall(`api/close_balances/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateUserPreferences = async (preferences) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/user_preferences/`, {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
};

export const updateUserProfile = async (data) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/update_user_profile/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const setBetaAgreedAt = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/set_beta_agreed_at/`, {
    method: 'POST',
  });
};

export const getServerIp = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/get_server_ip`, {
    method: 'GET',
  });
};

export const getTableOrders = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}ems/get_order_table_rows`, {
    method: 'GET',
  });
};

export const getMarkoutData = async (orderId) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/get_markout_data?order_id=${orderId}&cut_by=exchange,role`, {
    method: 'GET',
  });
};

export const getPointsData = async ({ startTime, endTime, activityPage, pageSize }) => {
  const paramsObj = {
    start_time: startTime,
    end_time: endTime,
    page_number: activityPage,
  };

  if (pageSize) {
    paramsObj.page_size = pageSize;
  }

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/get_points_data?${params}`, {
    method: 'GET',
  });
};

export const getPointsV2 = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/get_points`, {
    method: 'GET',
  });
};

export const getPointsLeaderboardData = async ({ page, pageSize, search, timeframe }) => {
  const paramsObj = {
    page_number: page,
  };

  if (pageSize) {
    paramsObj.page_size = pageSize;
  }

  if (search) {
    paramsObj.search = search;
  }

  if (timeframe) {
    paramsObj.timeframe = timeframe;
  }

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/get_points_leaderboard?${params}`, {
    method: 'GET',
  });
};

export const getLeaderboard = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/get_leaderboard`, {
    method: 'GET',
  });
};

export const getAccountExchangeSettings = async (accountIds) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/get_account_exchange_settings`, {
    method: 'POST',
    body: JSON.stringify({ account_ids: accountIds }),
  });
};

export const getContractInfo = async (pair, accountIds) => {
  const paramsObj = { pair, account_ids: accountIds.join(',') };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/get_contract_info?${params}`, {
    method: 'GET',
  });
};

export const getVersionData = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/get_VersionData/`, {
    method: 'GET',
  });
};

export const getCallDynamic = async (url, paramsObj) => {
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${url}?${params}`, {
    method: 'GET',
  });
};

export const getDicyConnectionMetadata = async () => {
  return makeApiCall('dicy/credentials/', {
    method: 'GET',
  });
};

export const getOrderSearchData = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}ems/get_filter_order`, {
    method: 'GET',
  });
};

export const getOrderTableRows = async (paramsObj) => {
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}ems/get_order_table_rows?${params}`, {
    method: 'GET',
  });
};

export const getOptionOrders = async (paramsObj) => {
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}ems/get_option_orders?${params}`, {
    method: 'GET',
  });
};

/**
 * Fetches transaction data from Arweave GraphQL endpoint.
 *
 * @param {number|null} limit - Number of transactions to fetch (default: 10), or null to fetch all
 * @param {string|null} cursor - Pagination cursor for fetching next page
 * @param {Object} filters - Additional filters to apply
 * @param {string[]} [filters.ids] - List of transaction IDs to filter by
 * @param {string} [filters.merkle_root] - Merkle root hash to filter by (must be provided with cid)
 * @param {string} [filters.cid] - CID hash to filter by (must be provided with merkle_root)
 * @param {string} [filters.trader_id] - Trader ID to filter by
 * @param {string|number} [filters.epoch] - Epoch number to filter by
 * @param {string} [filters.protocol] - Protocol to filter by
 * @returns {Promise<{edges: Array<{
 *   cursor: string,
 *   node: {
 *     id: string,
 *     owner: {address: string},
 *     tags: Array<{name: string, value: string}>,
 *     block: {timestamp: number}
 *   }
 * }>>}} Response containing transaction edges with cursor and node data
 * @throws {Error} If the request fails or returns an error response
 */
export const getArweaveData = async (limit, cursor, filters = {}) => {
  const data = {
    ...filters,
  };

  // Only include limit if it's not null
  if (limit !== null) {
    data.limit = limit;
  }

  if (cursor) data.cursor = cursor;

  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/arweave/data/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Fetches raw Arweave transaction data without decryption.
 *
 * @param {string} txId - The Arweave transaction ID to fetch
 * @returns {Promise<{data: {raw_data: string} | {error: string}}>} Response containing:
 *   - On success: {data: {raw_data: string}} - The raw transaction data
 *   - On failure: {data: {error: string}} - Error message if fetch failed
 */
export const getArweaveTransactionRaw = async (txId) => {
  if (!txId) {
    throw new Error('Missing txId');
  }
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/arweave/transactions/${txId}/raw`, {
    method: 'GET',
  });
};

/**
 * Decrypts an Arweave transaction if the user is authorized.
 *
 * @param {string} txId - The Arweave transaction ID to decrypt
 * @param {Object} data - The decryption request data
 * @param {string} data.trader_id - The trader ID associated with the transaction
 * @param {string} data.raw_data - The raw encrypted transaction data to decrypt
 * @returns {Promise<{data: {decrypted_data: any} | {error: string}}>} Response containing:
 *   - On success: {data: {decrypted_data: any}} - The decrypted transaction data
 *   - On failure: {data: {error: string}} - Error message if decryption failed or unauthorized
 */
export const decryptArweaveTransaction = async (txId, data) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/arweave/transactions/${txId}/decrypt`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const setup2FA = async () => {
  const response = await makeApiCall(`${INTERNAL_API_PREFIX}account/setup_2fa/`, {
    method: 'POST',
  });
  return response.qr_code;
};

export const verify2FA = async (token) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/verify_2fa/`, {
    method: 'POST',
    body: JSON.stringify({ token }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const reset2FA = async (token) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/reset_2fa/`, {
    method: 'POST',
    body: JSON.stringify({ token }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const verify_login_2FA = async (token, username) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/verify_2fa_login/`, {
    method: 'POST',
    body: JSON.stringify({ token, username }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const verifyPassword = async (password) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/verify_password/`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
};

export const link_telegram = async (telegramUsername) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/link_telegram/`, {
    method: 'POST',
    body: JSON.stringify({ telegramUsername }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const link_telegram_oauth = async (authData) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/link_telegram_oauth/`, {
    method: 'POST',
    body: JSON.stringify(authData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const unlink_telegram = async (telegramUsername) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/unlink_telegram/`, {
    method: 'POST',
    body: JSON.stringify({ telegramUsername }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const getNettingStats = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/netting_stats/`, {
    method: 'GET',
  });
};

export const startRebalance = async (fields = {}) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/start_rebalance`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });
};

export const checkRebalance = (account_id) => {
  const paramsObj = { account_id };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}account/check_rebalance?${params}`, {
    method: 'GET',
  });
};

export const checkAccountRebalance = (account_id) => {
  const paramsObj = { account_id };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}account/check_account_rebalance?${params}`, {
    method: 'GET',
  });
};

export const stopRebalance = async (taskId) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/stop_rebalance`, {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const stopScheduled = async (taskId) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/stop_scheduled`, {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const getUserReferrals = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/user_referrals`, {
    method: 'GET',
  });
};

export const getAutoOrderConfig = async (urgency, exchange_names, pair, base_asset_qty, side) => {
  const paramsObj = { urgency, exchange_names, pair, base_asset_qty, side };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/get_auto_order_config?${params}`, {
    method: 'GET',
  });
};

export const getDexAutoOrderConfig = async (urgency, from_token, to_token, amount) => {
  const paramsObj = { urgency, from_token, to_token, amount };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/get_dex_auto_order_config?${params}`, {
    method: 'GET',
  });
};

export const getKeyManagementFormData = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/key_management_form_data/`, {
    method: 'GET',
  });
};

export const getStaticChartingLibraryPath = () => {
  return joinUrl(window.location.origin, 'static/libs/charting_library/charting_library/');
};

export const cancelOrdersWithParams = async (paramsObj) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}oms/cancel_orders`, {
    body: JSON.stringify(paramsObj),
    method: 'POST',
  });
};

export const getExchangeTickerData = ({ exchangeName }) => {
  const paramsObj = {
    exchange_name: exchangeName,
  };

  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}marketdata/get_exchange_ticker_data?${params}`, {
    method: 'GET',
  });
};

export const getMinQty = async ({ pair, exchange_names, is_base }) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/get_min_qty`, {
    method: 'POST',
    body: JSON.stringify({ pair, exchange_names, is_base }),
  });
};

export const updateVcefiStatus = async (accountId, vcefiEnabled) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/update_vcefi_status/`, {
    method: 'POST',
    body: JSON.stringify({
      account_id: accountId,
      vcefi_enabled: vcefiEnabled,
    }),
  });
};

export const walletAuth = async (address, signature, nonce, walletType, referralCode = null) => {
  const payload = { address, signature, nonce, wallet_type: walletType };
  if (referralCode) {
    payload.referralCode = referralCode;
  }
  return makeApiCall(`${INTERNAL_API_PREFIX}account/wallet_auth/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
  });
};

export const getNonce = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/get_nonce/`, {
    method: 'GET',
  });
};

export const login = async (username, password) => {
  return makeApiCall(`account/login/`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });
};

export const forgotPassword = async (email) => {
  return makeApiCall(`account/forgot_password/`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const resetPasswordWithToken = async ({ uidb64, token, new_password, confirm_password }) => {
  return makeApiCall(`account/reset_password_with_token/`, {
    method: 'POST',
    body: JSON.stringify({ uidb64, token, new_password, confirm_password }),
  });
};

export const signup = async ({ username, email, password, confirmPassword, referralCode }) => {
  return makeApiCall(`account/signup/`, {
    method: 'POST',
    body: JSON.stringify({ username, email, password, confirmPassword, referralCode }),
  });
};

export const getFundingRates = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}marketdata/get_funding_rates`, {
    method: 'GET',
  });
};

export const getAccountBalanceHistory = async (accountId) => {
  const paramsObj = { account_id: accountId };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}account/account_balance_history?${params}`, {
    method: 'GET',
  });
};

export const getOKXDEXNonce = async ({ address, walletType }) => {
  const data = { address, wallet_type: walletType };
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/get_nonce`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const addOKXDEXAccount = async ({ message, signature, address, walletType, name, walletProvider }) => {
  const data = { message, signature, address, wallet_type: walletType, name, wallet_provider: walletProvider };
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/create_account`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteOKXDEXAccount = async (accountId) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/remove_account`, {
    method: 'POST',
    body: JSON.stringify({ account_id: accountId }),
  });
};

export const getOKXDEXWallets = async (accountId) => {
  const paramsObj = { account_id: accountId };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/wallets?${params}`, {
    method: 'GET',
  });
};

export const okxDexWithdraw = async (data) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/withdraw`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getWalletTokenBalances = async (address, chainId) => {
  const paramsObj = { address, chain_id: chainId };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/wallet_token_balances?${params}`, {
    method: 'GET',
  });
};

export const getDexTradingHistoryInfo = async (tokenId, timeRange) => {
  const paramsObj = { tokenId, timeRange };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/get_trading_history_info?${params}`, {
    method: 'GET',
  });
};

export const searchTokens = async (chains, search) => {
  const paramsObj = { chains, search };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/search_tokens?${params}`, {
    method: 'GET',
  });
};

export const getTokenPair = async (tokenId) => {
  const paramsObj = { tokenId };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/get_token_pair?${params}`, {
    method: 'GET',
  });
};

export const getTokenTradingInfo = async (tokenIds) => {
  const paramsObj = { tokenIds };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/get_token_trading_info?${params}`, {
    method: 'GET',
  });
};

export const getTokenRanking = async (chains, sortBy = '2', timeFrame = '2') => {
  const paramsObj = { chains, sortBy, timeFrame };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/okx_dex/get_token_ranking?${params}`, {
    method: 'GET',
  });
};

export const getFundingOverview = async ({ accountId, days, exchangeName, startMs, endMs }) => {
  const paramsObj = { account_id: accountId };
  if (startMs) paramsObj.start_ms = startMs;
  if (endMs) paramsObj.end_ms = endMs;
  if (days) paramsObj.days = days;
  if (exchangeName) paramsObj.exchange_name = exchangeName;
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/funding_overview?${params}`, {
    method: 'GET',
  });
};

export const getMaxLeverageTable = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}sor/max_leverage`, {
    method: 'GET',
  });
};

export const getEnabledFeatures = async () => {
  return makeApiCall(`api/features/`, {
    method: 'GET',
  });
};

export const claimFeatureCode = async (code) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}account/claim_feature_code/`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
};

export const getUsers = async ({ include_memberships = false }) => {
  const paramsObj = { include_memberships };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`api/users/?${params}`, { method: 'GET' });
};

export const updateUser = async (user_id, changes) => {
  return makeApiCall(`api/users/${user_id}`, { method: 'PATCH', body: JSON.stringify({ changes }) });
};

export const deleteUser = async (user_id) => {
  return makeApiCall(`api/users/${user_id}`, { method: 'DELETE' });
};

export const createUser = async ({ username, email, password, is_staff = false, is_superuser = false }) => {
  return makeApiCall('api/users/', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, is_staff, is_superuser }),
  });
};

export const getTradingGroups = async () => {
  return makeApiCall('api/trading_groups/', { method: 'GET' });
};

export const createTradingGroup = async ({
  name,
  description = '',
  exchange_credential_ids = [],
  memberships = [],
}) => {
  const data = { name, description };
  if (exchange_credential_ids && exchange_credential_ids.length > 0) {
    data.exchange_credential_ids = exchange_credential_ids;
  }
  if (memberships && memberships.length > 0) {
    data.memberships = memberships;
  }
  return makeApiCall('api/trading_groups/', { method: 'POST', body: JSON.stringify(data) });
};

export const updateTradingGroup = async (groupId, updates) => {
  return makeApiCall(`api/trading_groups/${groupId}`, { method: 'PATCH', body: JSON.stringify(updates) });
};

export const deleteTradingGroup = async (groupId) => {
  return makeApiCall(`api/trading_groups/${groupId}`, { method: 'DELETE' });
};

export const getGroupMembers = async (groupId) => {
  return makeApiCall(`api/trading_groups/${groupId}/members`, { method: 'GET' });
};

export const upsertGroupMember = async (groupId, userId, permissions) => {
  return makeApiCall(`api/trading_groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user: userId, permissions }),
  });
};

export const updateGroupMember = async (groupId, userId, permissions) => {
  return makeApiCall(`api/trading_groups/${groupId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions }),
  });
};

export const removeGroupMember = async (groupId, userId) => {
  return makeApiCall(`api/trading_groups/${groupId}/members/${userId}`, { method: 'DELETE' });
};

export const addTradingGroupCredentials = async (groupId, exchangeCredentialIds) => {
  return makeApiCall(`api/trading_groups/${groupId}/credentials/add`, {
    method: 'POST',
    body: JSON.stringify({ exchange_credential_ids: exchangeCredentialIds }),
  });
};

export const removeTradingGroupCredentials = async (groupId, exchangeCredentialIds) => {
  return makeApiCall(`api/trading_groups/${groupId}/credentials/remove`, {
    method: 'POST',
    body: JSON.stringify({ exchange_credential_ids: exchangeCredentialIds }),
  });
};

export const getOpenOrders = async ({
  exclude_paused = false,
  include_conditions = false,
  include_fills = false,
  include_meta = false,
}) => {
  const paramsObj = {
    exclude_paused: exclude_paused ? 'true' : 'false',
    include_conditions: include_conditions ? 'true' : 'false',
    include_fills: include_fills ? 'true' : 'false',
    include_meta: include_meta ? 'true' : 'false',
  };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`api/active_orders/?${params}`, {
    method: 'GET',
  });
};

export const toggleMaintenanceMode = async (enabled, orderIds = [], targetExchanges = []) => {
  return makeApiCall(`api/maintenance_mode/toggle`, {
    method: 'POST',
    body: JSON.stringify({ enabled, order_ids: orderIds, target_exchanges: targetExchanges }),
  });
};

export const getMaintenanceModeStatus = async () => {
  return makeApiCall(`api/maintenance_mode/status`, { method: 'GET' });
};

export const getOrdersOnWatch = async (maintenanceEventId = null) => {
  const params = maintenanceEventId ? `?maintenance_event_id=${maintenanceEventId}` : '';
  return makeApiCall(`api/orders_on_watch${params}`, { method: 'GET' });
};

export const resolveOrderOnWatch = async (watchId) => {
  return makeApiCall(`api/orders_on_watch`, {
    method: 'POST',
    body: JSON.stringify({ watch_id: watchId }),
  });
};

export const resolveOrdersOnWatchBulk = async (orderIds, eventId) => {
  return makeApiCall(`api/orders_on_watch/bulk_resolve`, {
    method: 'POST',
    body: JSON.stringify({ order_ids: orderIds, event_id: eventId }),
  });
};

export const resumeOrdersOnWatchBulk = async (orderIds) => {
  return makeApiCall(`api/orders_on_watch/bulk_resume`, {
    method: 'POST',
    body: JSON.stringify({ order_ids: orderIds }),
  });
};

export const getMaintenanceEvents = async () => {
  return makeApiCall(`api/maintenance_mode/events`, { method: 'GET' });
};

export const needsApproval = async (accountId) => {
  const paramsObj = { account_id: accountId };
  const params = new URLSearchParams(paramsObj);
  return makeApiCall(`${INTERNAL_API_PREFIX}account/needs_approval?${params}`, { method: 'GET' });
};

export const getExchangeIntegrationVotes = async () => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/get_exchange_integration_votes`, {
    method: 'GET',
  });
};

export const delegatePointsToExchange = async (exchangeIntegrationId, points) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/delegate_points_to_exchange`, {
    method: 'POST',
    body: JSON.stringify({
      exchange_integration_id: exchangeIntegrationId,
      points,
    }),
  });
};

export const createExchangeIntegration = async (data) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/create_exchange_integration`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateExchangeIntegration = async (integrationId, data) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/update_exchange_integration/${integrationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteExchangeIntegration = async (integrationId) => {
  return makeApiCall(`${INTERNAL_API_PREFIX}analytics/delete_exchange_integration/${integrationId}`, {
    method: 'DELETE',
  });
};
