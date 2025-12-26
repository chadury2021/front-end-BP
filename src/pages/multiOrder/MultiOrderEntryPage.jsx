/* eslint-disable react/no-array-index-key */
/* eslint-disable no-param-reassign */
import {
  ApiError,
  calculatePreTradeAnalytics,
  getAccountExchangeSettings,
  getFundingRates,
  getUserFavouritePairs,
  openInNewTab,
  submitMultiOrder,
} from '@/apiServices';
import { MultiOrderConfirmationModal } from '@/pages/dashboard/orderEntry/OrderConfirmationModal';
import { Loader } from '@/shared/Loader';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ExchangeTickerProvider } from '@/shared/context/ExchangeTickerProvider';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import useQueryParams from '@/shared/hooks/useQueryParams';
import { theme as defaultTheme } from '@/theme/theme';
import { BASEURL, removeFalsyAndEmptyKeys, smartRound } from '@/util';
import { useTheme } from '@emotion/react';
import { AddCircleOutline } from '@mui/icons-material';
import { Box, Divider, IconButton, Paper, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useAtom } from 'jotai';
import { debounce } from 'lodash';
import { DateTime } from 'luxon';
import { memo, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccountBalanceContext } from '../dashboard/orderEntry/AccountBalanceContext';
import MultiOrderSubmitForm from './MultiOrderSubmitForm';
import OrderFormItem from './OrderFormItem';
import HighchartsSplineChart from './components/HighchartsSplineChart';
import MultiFavoritePairs from './components/MultiFavoritePairs';
import MultiPairInfoBar from './components/MultiPairInfoBar';
import * as multiPageAtoms from './hooks/multiOrderAtoms';
import { fetchPreviewPrice } from './util';

function orderFormStateReducer(state, action) {
  switch (action.type) {
    case 'ADD_ROW':
      return {
        ...state,
        [action.payload.side]: [...state[action.payload.side], action.payload],
      };
    case 'UPDATE_ROW':
      return {
        ...state,
        [action.payload.side]: state[action.payload.side].map((item, index) =>
          index === action.payload.rowIndex ? { ...item, ...action.payload } : item
        ),
      };
    case 'REMOVE_ROW': {
      const filteredAndReIndexed = state[action.payload.side]
        .filter((_, index) => index !== action.payload.rowIndex)
        .map((item, index) => ({ ...item, rowIndex: index })); // Reassign rowIndex based on new array positions
      return {
        ...state,
        [action.payload.side]: filteredAndReIndexed,
      };
    }
    case 'SET_STATE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

const CombinedTradingViewSection = memo(({ buyOrderItems, sellOrderItems, timeframe = 'day' }) => {
  const allOrderItems = useMemo(() => {
    const buyItems = buyOrderItems || [];
    const sellItems = sellOrderItems || [];
    return [...buyItems, ...sellItems];
  }, [buyOrderItems, sellOrderItems]);

  const isSameBase = useMemo(() => {
    return (
      buyOrderItems.length > 0 &&
      sellOrderItems.length > 0 &&
      new Set(buyOrderItems.map((item) => item.pair.id.split('-')[0])).size === 1 &&
      new Set(sellOrderItems.map((item) => item.pair.id.split('-')[0])).size === 1 &&
      buyOrderItems[0].pair.id.split('-')[0] === sellOrderItems[0].pair.id.split('-')[0]
    );
  }, [buyOrderItems, sellOrderItems]);

  const basketItems = useMemo(() => {
    // Check if this is a funding rate arbitrage trade
    const isFundingArb =
      buyOrderItems.length > 0 &&
      sellOrderItems.length > 0 &&
      ((buyOrderItems.every((item) => item.pair.id.includes('-USDT') && !item.pair.id.includes(':PERP')) &&
        sellOrderItems.every((item) => item.pair.id.includes(':PERP-USDT'))) ||
        (sellOrderItems.every((item) => item.pair.id.includes('-USDT') && !item.pair.id.includes(':PERP')) &&
          buyOrderItems.every((item) => item.pair.id.includes(':PERP-USDT')))) &&
      new Set(buyOrderItems.map((item) => item.pair.id.split('-')[0])).size === 1 &&
      new Set(sellOrderItems.map((item) => item.pair.id.split('-')[0])).size === 1;

    return allOrderItems
      .map((item) => {
        if (!item || !item.pair || !item.accounts?.[0]?.exchangeName) return null;

        let notional = item.isBaseAsset
          ? parseFloat(item.qty) || 0
          : parseFloat(item.qty) / parseFloat(item.pair?.price) || 0;
        if (!notional && (isFundingArb || isSameBase)) {
          notional = 100 / (item.pair?.price || 1); // Default to 100 USDT
        }

        return {
          symbol: `${item.accounts[0].exchangeName}:${item.pair.id}`,
          weight: 1, // Equal weight for now
          // warning: actually not notional, but asset qty
          notional: item.side === 'sell' ? -notional : notional, // Make sell orders negative
        };
      })
      .filter((item) => item && item.symbol && item.notional !== 0);
  }, [allOrderItems, buyOrderItems, sellOrderItems, isSameBase]);

  const [debouncedInputs, setDebouncedInputs] = useState({
    basketItems: [],
    pair: undefined,
    exchange: undefined,
    base: undefined,
  });

  useEffect(() => {
    const update = debounce(() => {
      const firstItem = allOrderItems[0];
      const exchangeName = firstItem?.accounts?.[0]?.exchangeName;
      const firstItemPairId = firstItem?.pair?.id;
      const baseToken = firstItemPairId?.split('-')[0]?.split(':')[0];
      if (!allOrderItems.every((item) => item.pair?.price)) {
        return;
      }
      setDebouncedInputs({
        basketItems,
        pair: firstItemPairId,
        exchange: exchangeName,
        base: baseToken,
      });
    }, 500);
    update();
    return () => update.cancel();
  }, [basketItems, allOrderItems]);

  return (
    <Box sx={{ width: '100%', height: 420 }}>
      <HighchartsSplineChart
        basketItems={debouncedInputs.basketItems}
        pair={debouncedInputs.pair}
        relevantExchangeName={debouncedInputs.exchange}
        side='combined'
        timeframe={timeframe}
        title={
          debouncedInputs.exchange && debouncedInputs.base
            ? `${debouncedInputs.exchange} ${debouncedInputs.base} Spread`
            : ''
        }
      />
    </Box>
  );
});

CombinedTradingViewSection.displayName = 'CombinedTradingViewSection';

const AggregatePreTradeAnalytics = memo(({ data, orderItems, theme }) => {
  const analytics = data || {};
  const isDataAvailable = data && Object.keys(data).length > 0;

  const calculateTotalNotional = (items) => {
    return (
      items?.reduce((sum, item) => {
        if (item.qty && item.pair?.price) {
          const qty = Number(item.qty);
          if (!item.isBaseAsset) {
            return sum + qty;
          }
          const price = Number(item.pair.price);
          if (!Number.isNaN(qty) && !Number.isNaN(price)) {
            return sum + qty * price;
          }
        }
        return sum;
      }, 0) || 0
    );
  };

  const totalNotional = calculateTotalNotional(orderItems);
  // Make notional negative for sell orders
  const displayNotional = orderItems[0]?.side === 'sell' ? -totalNotional : totalNotional;

  const getAggregatePov = () => {
    if (!isDataAvailable) return null;
    const pov = analytics.pov || 0;
    return pov;
  };

  const aggregatePov = getAggregatePov();

  let povColor = theme.palette.text.primary;
  if (aggregatePov < 0.5) {
    povColor = theme.palette.success.main;
  } else if (aggregatePov < 1) {
    povColor = theme.palette.warning.main;
  } else {
    povColor = theme.palette.error.main;
  }

  const getNotionalColor = (value) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='body1'>Total Notional</Typography>
          <Typography color={getNotionalColor(displayNotional)} variant='body1'>
            {displayNotional < 0 ? '-' : ''}$
            {Math.abs(displayNotional).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Box>

        <Box display='flex' justifyContent='space-between'>
          <TreadTooltip
            labelTextVariant='body1'
            placement='top'
            title='Maximum participation rate across both legs.'
            variant='participation_rate'
          />
          <Typography variant='body1'>{aggregatePov ? `${aggregatePov.toFixed(4)}%` : '-'}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
});

AggregatePreTradeAnalytics.displayName = 'AggregatePreTradeAnalytics';

export default function MultiOrderEntryPage() {
  const theme = useTheme();
  const [queryParams, setQueryParams] = useQueryParams();
  const { balances } = useAccountBalanceContext();

  const updateMultiOrderQueryParams = (formState) => {
    const { buy, sell } = formState;

    const buyParam = buy
      .filter((item) => item.pair?.id)
      .map((item) => {
        const hasAccount = item.accounts && item.accounts.length > 0;
        return hasAccount ? `${item.pair.id}@${item.accounts[0].exchangeName}` : item.pair.id;
      })
      .join(',');

    const sellParam = sell
      .filter((item) => item.pair?.id)
      .map((item) => {
        const hasAccount = item.accounts && item.accounts.length > 0;
        return hasAccount ? `${item.pair.id}@${item.accounts[0].exchangeName}` : item.pair.id;
      })
      .join(',');

    const newParams = {};
    if (buyParam) newParams.buy = buyParam;
    if (sellParam) newParams.sell = sellParam;

    setQueryParams(newParams);
  };

  // Create a wrapped reducer that calls updateMultiOrderQueryParams
  const wrappedReducer = (state, action) => {
    const newState = orderFormStateReducer(state, action);
    updateMultiOrderQueryParams(newState);
    return newState;
  };

  const [accounts, setAccounts] = useState([]);
  const [tokenPairs, setTokenPairs] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [strategyParams, setStrategyParams] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [superStrategies, setSuperStrategies] = useState({});
  const [selectedStrategyParams, setSelectedStrategyParams] = useState({});
  const [selectedDuration, setSelectedDuration] = useState(900);
  const [passiveness, setPassiveness] = useState(0.02);
  const [discretion, setDiscretion] = useState(0.06);
  const [exposureTolerance, setExposureTolerance] = useState(0.1);
  const [orderCondition, setOrderCondition] = useState('');
  const [isOrderConditionValidated, setIsOrderConditionValidated] = useState(false);
  const [formState, dispatch] = useReducer(wrappedReducer, {
    buy: [],
    sell: [],
  });
  const [alphaTilt, setAlphaTilt] = useState(0);
  const [directionalBias, setDirectionalBias] = useState(0);
  const [limitPriceSpread, setLimitPriceSpread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [favouritePairs, setFavouritePairs] = useState({});
  const [exchangeSettingsByAccount, setExchangeSettingsByAccount] = useState({});
  const [maxClipSize, setMaxClipSize] = useState(null);

  const { showAlert } = useContext(ErrorContext);

  const [dynamicLimitBPSFormat] = useAtom(multiPageAtoms.dynamicLimitBPSFormat);
  const [timeStart, setTimeStart] = useState(null);
  const [isSpreadCollapsed, setIsSpreadCollapsed] = useState(true);
  const [preTradeEstimationData, setPreTradeEstimationData] = useState({});
  const [preTradeDataLoading, setPreTradeDataLoading] = useState(false);
  const [preTradeDataError, setPreTradeDataError] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({});

  const [fundingRates, setFundingRates] = useState([]);
  const [fundingRatesLoading, setFundingRatesLoading] = useState(true);

  const [fundingRateFavorites] = useAtom(multiPageAtoms.fundingRateFavoritesAtom);
  const [timeframe, setTimeframe] = useState('day');
  const [navigationPrefill, setNavigationPrefill] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.multiOrderPrefill) {
      setNavigationPrefill(location.state.multiOrderPrefill);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  const addBuyRow = (pairId = '', exchange = '') => {
    let selectedAccounts = [];
    if (exchange) {
      // Find the first account for the specified exchange
      const exchangeAccounts = Object.values(accounts).filter((acc) => acc.exchangeName === exchange);
      if (exchangeAccounts.length > 0) {
        selectedAccounts = [exchangeAccounts[0]];
      }
    }

    dispatch({
      type: 'ADD_ROW',
      payload: {
        accounts: selectedAccounts,
        pair: {
          base: '',
          id: pairId,
          label: pairId,
          quote: '',
          is_inverse: false,
          is_contract: false,
        },
        side: 'buy',
        qty: '',
        posSide: '',
        isBaseAsset: false,
      },
    });
  };

  const addSellRow = (pairId = '', exchange = '') => {
    let selectedAccounts = [];
    if (exchange) {
      // Find the first account for the specified exchange
      const exchangeAccounts = Object.values(accounts).filter((acc) => acc.exchangeName === exchange);
      if (exchangeAccounts.length > 0) {
        selectedAccounts = [exchangeAccounts[0]];
      }
    }

    dispatch({
      type: 'ADD_ROW',
      payload: {
        accounts: selectedAccounts,
        pair: {
          base: '',
          id: pairId,
          label: pairId,
          quote: '',
          is_inverse: false,
          is_contract: false,
        },
        side: 'sell',
        qty: '',
        posSide: '',
        isBaseAsset: false,
      },
    });
  };

  const buyOrderItems = formState.buy;
  const sellOrderItems = formState.sell;

  const { initialLoadValue, loading: orderFormLoading } = useOrderForm();

  useEffect(() => {
    const loadFavouritePairs = async () => {
      let pairs;

      try {
        const result = await getUserFavouritePairs();
        pairs = result.pairs;
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Unable to load favourite pairs: ${e.message}`,
        });
        return;
      }

      setFavouritePairs(
        pairs.reduce((acc, pair) => {
          return { ...acc, [pair]: true };
        }, {})
      );
    };
    loadFavouritePairs();
  }, []);

  useEffect(() => {
    const loadAccountExchangeSettings = async (account_ids) => {
      try {
        const exchangeSettings = await getAccountExchangeSettings(account_ids);
        setExchangeSettingsByAccount(exchangeSettings);
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Could not load account exchange settings: ${e.message}`,
        });
      }
    };

    const loadFromProvider = () => {
      if (orderFormLoading || !initialLoadValue) {
        setIsLoading(true);
        return;
      }

      // Strategies (trajectories) minus VWAP
      const trajectories = initialLoadValue.trajectories || {};
      const indexedStrategies = Object.fromEntries(
        Object.entries(trajectories).filter(([, item]) => item?.name !== 'VWAP')
      );
      setStrategies(indexedStrategies);

      // Super strategies
      setSuperStrategies(initialLoadValue.superStrategies || {});

      // Accounts and token pairs from provider
      const providedAccounts = initialLoadValue.accounts || {};
      const pairs = initialLoadValue.tokenPairs || [];

      setAccounts(providedAccounts);
      setTokenPairs(pairs);
      setStrategyParams(initialLoadValue.strategyParams || []);

      const accountIds = Object.values(providedAccounts)
        .map((acc) => acc.id)
        .filter(Boolean);
      if (accountIds.length > 0) {
        loadAccountExchangeSettings(accountIds);
      }

      // Default strategy: prefer TWAP
      const twapEntry = Object.entries(trajectories).find(([, s]) => s?.name === 'TWAP');
      if (twapEntry) {
        setSelectedStrategy(twapEntry[0]);
      } else if (Object.keys(indexedStrategies).length > 0) {
        setSelectedStrategy(Object.keys(indexedStrategies)[0]);
      }

      // Handle URL parameters after data is loaded
      const { buy: buyParams, sell: sellParams } = queryParams;

      const getFullPairObj = (pairId) =>
        pairs.find((p) => p.id === pairId) || {
          base: '',
          id: pairId,
          label: pairId,
          quote: '',
          is_inverse: false,
          is_contract: false,
        };

      const newFormState = { buy: [], sell: [] };

      const buyPairs = buyParams
        ? buyParams.split(',').filter((p) => pairs.find((pair) => pair.id === p.split('@')[0]))
        : [];
      if (buyPairs.length > 0) {
        newFormState.buy = buyPairs.map((buyPair) => {
          const [pair, exchange] = buyPair.split('@');
          const exchangeAccounts = Object.values(providedAccounts).filter(
            (acc) => acc.exchangeName.toLowerCase() === exchange?.toLowerCase()
          );
          return {
            accounts: exchangeAccounts.length > 0 ? [exchangeAccounts[0]] : [],
            pair: getFullPairObj(pair),
            side: 'buy',
            qty: '',
            posSide: '',
            isBaseAsset: false,
          };
        });
      } else {
        newFormState.buy.push({
          accounts: [],
          pair: { base: '', id: '', label: '', quote: '', is_inverse: false, is_contract: false },
          side: 'buy',
          qty: '',
          posSide: '',
          isBaseAsset: false,
        });
      }

      const sellPairs = sellParams
        ? sellParams.split(',').filter((p) => pairs.find((pair) => pair.id === p.split('@')[0]))
        : [];
      if (sellPairs.length > 0) {
        newFormState.sell = sellPairs.map((sellPair) => {
          const [pair, exchange] = sellPair.split('@');
          const exchangeAccounts = Object.values(providedAccounts).filter(
            (acc) => acc.exchangeName.toLowerCase() === exchange?.toLowerCase()
          );
          return {
            accounts: exchangeAccounts.length > 0 ? [exchangeAccounts[0]] : [],
            pair: getFullPairObj(pair),
            side: 'sell',
            qty: '',
            posSide: '',
            isBaseAsset: false,
          };
        });
      } else {
        newFormState.sell.push({
          accounts: [],
          pair: { base: '', id: '', label: '', quote: '', is_inverse: false, is_contract: false },
          side: 'sell',
          qty: '',
          posSide: '',
          isBaseAsset: false,
        });
      }

      dispatch({ type: 'SET_STATE', payload: newFormState });
      setIsLoading(false);
    };

    loadFromProvider();
  }, [initialLoadValue]);

  useEffect(() => {
    const fetchFundingRates = async () => {
      setFundingRatesLoading(true);
      try {
        const result = await getFundingRates();
        setFundingRates(result);
      } catch (error) {
        setFundingRates([]);
      } finally {
        setFundingRatesLoading(false);
      }
    };
    fetchFundingRates();
  }, []);

  let formattedTimeStart = null;

  const clearPreTradeEstimationDataSide = (side) => {
    setPreTradeEstimationData((prevData) => ({
      ...prevData,
      [side]: null,
    }));
  };

  const fetchPreTradeAnalytics = async (orderAttrs, key) => {
    try {
      setPreTradeDataLoading(true);

      const data = await calculatePreTradeAnalytics({
        orderAttrs,
        // usable in the foreseeable future to speed up the calculation if we've already looked up the price
        priceLookup: {},
      });

      setPreTradeEstimationData((prevData) => ({
        ...prevData,
        [key]: data,
      }));
    } catch (error) {
      setPreTradeDataError(error.message);
      // user doesn't need to know pretrade analytics failed to calculate
    } finally {
      setPreTradeDataLoading(false);
    }
  };

  const isOrderAttrsValidForAnalytics = (orderAttrs) => {
    return (
      orderAttrs &&
      orderAttrs.length > 0 &&
      orderAttrs.every((item) => item.qty && item.accounts && item.pair && item.side)
    );
  };

  const serializePreTradeAnalyticsData = (orderAttrs) => {
    return orderAttrs.map((item) => {
      const qty = item.isBaseAsset ? item.qty : item.qty / item.pair.price;
      return {
        qty,
        pair: item.pair.id,
        exchange_names: item.accounts.map((acc) => acc.exchangeName),
        duration: selectedDuration,
      };
    });
  };

  const debouncedFetchBuyAnalytics = useCallback(
    debounce((items) => {
      if (isOrderAttrsValidForAnalytics(items)) {
        fetchPreTradeAnalytics(serializePreTradeAnalyticsData(items), 'buy');
      } else {
        clearPreTradeEstimationDataSide('buy');
      }
    }, 1000),
    [selectedDuration, buyOrderItems]
  );

  const debouncedFetchSellAnalytics = useCallback(
    debounce((items) => {
      if (isOrderAttrsValidForAnalytics(items)) {
        fetchPreTradeAnalytics(serializePreTradeAnalyticsData(items), 'sell');
      } else {
        clearPreTradeEstimationDataSide('sell');
      }
    }, 1000),
    [selectedDuration, sellOrderItems]
  );

  useEffect(() => {
    debouncedFetchBuyAnalytics(buyOrderItems);
    return () => debouncedFetchBuyAnalytics.cancel();
  }, [buyOrderItems]);

  useEffect(() => {
    debouncedFetchSellAnalytics(sellOrderItems);
    return () => debouncedFetchSellAnalytics.cancel();
  }, [sellOrderItems]);

  useEffect(() => {
    if (isLoading || !navigationPrefill) {
      return;
    }

    const toPair = (pairId) => {
      if (!pairId) {
        return {
          base: '',
          id: '',
          label: '',
          quote: '',
          is_inverse: false,
          is_contract: false,
        };
      }

      const matchedPair = tokenPairs.find((pair) => pair.id === pairId);
      if (matchedPair) {
        return matchedPair;
      }

      const [base = '', quote = ''] = pairId.split('-');
      return {
        base,
        id: pairId,
        label: pairId,
        quote,
        is_inverse: false,
        is_contract: pairId.includes(':'),
      };
    };

    const toAccountObjects = (names = []) => {
      return names.map((name) => accounts?.[name] || navigationPrefill.accounts?.[name]).filter(Boolean);
    };

    if (navigationPrefill.accounts) {
      setAccounts((prev) => ({ ...navigationPrefill.accounts, ...prev }));
    }

    const mapRow = (row, index, side) => {
      return {
        accounts: toAccountObjects(row.accountNames),
        pair: toPair(row.pairId),
        qty: row.qty ?? '',
        side,
        isBaseAsset: !!row.isBaseAsset,
        posSide: row.posSide || '',
        rowIndex: index,
      };
    };

    const buyRows = (navigationPrefill.buy || []).map((row, index) => mapRow(row, index, 'buy'));
    const sellRows = (navigationPrefill.sell || []).map((row, index) => mapRow(row, index, 'sell'));

    if (buyRows.length > 0 || sellRows.length > 0) {
      dispatch({
        type: 'SET_STATE',
        payload: {
          buy: buyRows,
          sell: sellRows,
        },
      });
    }

    const resolveStrategyId = () => {
      if (!navigationPrefill.strategy) {
        return null;
      }
      if (strategies && strategies[navigationPrefill.strategy]) {
        return navigationPrefill.strategy;
      }
      if (!strategies) {
        return null;
      }
      const matchedEntry = Object.entries(strategies).find(
        ([, strategy]) => strategy?.name === navigationPrefill.strategy
      );
      return matchedEntry ? matchedEntry[0] : null;
    };

    const resolvedStrategyId = resolveStrategyId();
    if (resolvedStrategyId) {
      setSelectedStrategy(resolvedStrategyId);
    }

    if (navigationPrefill.strategyParams) {
      setSelectedStrategyParams(navigationPrefill.strategyParams);
      if (navigationPrefill.strategyParams.max_clip_size !== undefined) {
        setMaxClipSize(navigationPrefill.strategyParams.max_clip_size);
      } else {
        setMaxClipSize(null);
      }
    } else {
      setSelectedStrategyParams({});
      setMaxClipSize(null);
    }

    if (navigationPrefill.duration !== undefined) {
      const normalizedDuration = Number(navigationPrefill.duration);
      setSelectedDuration(Number.isFinite(normalizedDuration) ? normalizedDuration : navigationPrefill.duration);
    }

    if (navigationPrefill.passiveness !== undefined) {
      setPassiveness(navigationPrefill.passiveness);
    }

    if (navigationPrefill.discretion !== undefined) {
      setDiscretion(navigationPrefill.discretion);
    }

    if (navigationPrefill.exposureTolerance !== undefined) {
      setExposureTolerance(navigationPrefill.exposureTolerance);
    }

    if (navigationPrefill.alphaTilt !== undefined) {
      setAlphaTilt(navigationPrefill.alphaTilt);
    }

    if (navigationPrefill.limitPriceSpread !== undefined) {
      setLimitPriceSpread(navigationPrefill.limitPriceSpread);
    }

    if (navigationPrefill.orderCondition !== undefined) {
      setOrderCondition(navigationPrefill.orderCondition);
      setIsOrderConditionValidated(false);
    }

    setNavigationPrefill(null);
  }, [accounts, dispatch, isLoading, navigationPrefill, strategies, tokenPairs]);

  useEffect(() => {
    if (selectedDuration) {
      debouncedFetchBuyAnalytics(buyOrderItems);
    }
    if (selectedDuration) {
      debouncedFetchSellAnalytics(sellOrderItems);
    }
  }, [selectedDuration]);

  if (timeStart) {
    formattedTimeStart =
      typeof timeStart === 'string' ? DateTime.fromISO(timeStart).setZone('utc') : timeStart.setZone('utc');
  }

  const parseFormData = async () => {
    const orderRowToFields = (row) => {
      let fields = {
        accounts: row.accounts.map((acc) => acc.name),
        pair: row.pair.id,
        side: row.side,
      };

      if (row.isBaseAsset) {
        fields = { ...fields, base_asset_qty: row.qty };
      } else {
        fields = { ...fields, quote_asset_qty: row.qty };
      }

      if (row.posSide) {
        fields = { ...fields, pos_side: row.posSide };
      }

      return fields;
    };

    // Detect if this should be a market maker strategy
    const isMarketMakerStrategy = () => {
      const buyOrders = formState.buy.filter((row) => row.pair?.id && row.qty);
      const sellOrders = formState.sell.filter((row) => row.pair?.id && row.qty);

      // Check if we have both buy and sell orders for the same pairs
      const buyPairs = new Set(buyOrders.map((row) => row.pair.id));
      const sellPairs = new Set(sellOrders.map((row) => row.pair.id));
      const commonPairs = [...buyPairs].filter((pair) => sellPairs.has(pair));

      // Market maker if:
      // 1. Has both buy and sell orders for at least one pair
      // 2. Strategy is TWAP or similar
      // 3. Has reasonable passiveness value (indicating passive trading)
      const hasBidirectionalOrders = commonPairs.length > 0;
      const isTwapStrategy = selectedStrategy === 'TWAP' || selectedStrategy === 'POV' || selectedStrategy === 'VWAP';
      const isPassiveStrategy = passiveness >= 0.01; // Reasonable passiveness threshold

      return hasBidirectionalOrders && (isTwapStrategy || isPassiveStrategy);
    };

    let newLimitPriceSpread = limitPriceSpread;
    if (dynamicLimitBPSFormat && limitPriceSpread) {
      let sellPrice;
      try {
        sellPrice = await fetchPreviewPrice(
          formState.sell[0].accounts[0].exchangeName,
          formState.sell[0].pair.id,
          showAlert
        );
        newLimitPriceSpread = smartRound((limitPriceSpread / 10000) * sellPrice, 10);
      } catch (e) {
        showAlert({
          message: `Unable to calculate BPS conversion for DynamicLimitSpread, Submit denied`,
          severity: 'error',
        });
        return {};
      }
    }

    const isMarketMaker = isMarketMakerStrategy();

    return {
      ...removeFalsyAndEmptyKeys({
        alpha_tilt: alphaTilt,
        directional_bias: directionalBias,
        duration: selectedDuration,
        engine_passiveness: passiveness,
        schedule_discretion: discretion,
        strategy: selectedStrategy,
        strategy_params: {
          ...selectedStrategyParams,
          max_clip_size: maxClipSize,
        },
        order_condition: orderCondition,
        exposure_tolerance: exposureTolerance,
        limit_price_spread: newLimitPriceSpread,
        start_datetime: formattedTimeStart ? formattedTimeStart.toISO() : null,
        market_maker: isMarketMaker,
        child_orders: [
          ...formState.buy.map((row) => orderRowToFields(row)),
          ...formState.sell.map((row) => orderRowToFields(row)),
        ],
      }),
      alpha_tilt: alphaTilt,
      directional_bias: directionalBias,
      engine_passiveness: passiveness,
      schedule_discretion: discretion,
      exposure_tolerance: exposureTolerance,
      strategies,
      accounts,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = await parseFormData();
    setFormData(data);
    setOpenModal(true);
  };

  const handleConfirm = async (event) => {
    event.preventDefault();
    setSubmitLoading(true);

    // Js falsy includes 0, need a better way to ignore 0 as a falsy
    const orderFields = await parseFormData();

    try {
      const response = await submitMultiOrder(orderFields);
      if (response.id) {
        // Show success notification
        showAlert({
          severity: 'success',
          message: 'Multi-order submitted successfully!',
        });
        openInNewTab(`${BASEURL}/multi_order/${response.id}`);
      } else {
        showAlert({ severity: 'error', message: response });
      }
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ severity: 'error', message: e.message });
      } else {
        throw e;
      }
    } finally {
      setSubmitLoading(false);
      setOpenModal(false);
    }
  };

  // Helper to get the first available pair for a base
  const findPair = (base, quote) => {
    return tokenPairs.find((p) => {
      return [base, quote].join('-') === p.id;
    });
  };

  // Handler for clicking a favorite base
  const handlePairSelect = (base, exchange = 'Binance') => {
    const quoteCurrency = exchange === 'Hyperliquid' ? 'USDC' : 'USDT';
    const spotPair = findPair(base, quoteCurrency);
    const perpPair = findPair(`${base}:PERP`, quoteCurrency);
    if (!spotPair || !perpPair) return;
    // Set both buy and sell panels to this base (with default pair)

    const exchangeAccounts = Object.values(accounts).filter(
      (acc) => acc.exchangeName.toLowerCase() === exchange.toLowerCase()
    );
    const accts = exchangeAccounts.length > 0 ? [exchangeAccounts[0]] : [];

    dispatch({
      type: 'SET_STATE',
      payload: {
        buy: [
          {
            ...formState.buy[0],
            accounts: accts,
            pair: spotPair,
          },
        ],
        sell: [
          {
            ...formState.sell[0],
            accounts: accts,
            pair: perpPair,
          },
        ],
      },
    });
  };

  const multiOrderFormProps = {
    strategies,
    strategyParams,
    selectedStrategy,
    setSelectedStrategy,
    selectedDuration,
    selectedStrategyParams,
    setSelectedStrategyParams,
    setSelectedDuration,
    passiveness,
    setPassiveness,
    discretion,
    setDiscretion,
    exposureTolerance,
    setExposureTolerance,
    orderCondition,
    setOrderCondition,
    isOrderConditionValidated,
    setIsOrderConditionValidated,
    superStrategies,
    handleSubmit,
    showAlert,
    formState,
    alphaTilt,
    setAlphaTilt,
    directionalBias,
    setDirectionalBias,
    maxClipSize,
    setMaxClipSize,
    submitLoading,
    timeStart,
    setTimeStart,
    limitPriceSpread,
    setLimitPriceSpread,
    isSpreadCollapsed,
    setIsSpreadCollapsed,
  };

  if (isLoading) {
    return (
      <Box height='100%'>
        <Card>
          <CardContent>
            <Loader />
          </CardContent>
        </Card>
      </Box>
    );
  }

  const exchangeName = buyOrderItems[0]?.accounts?.[0]?.exchangeName || 'Binance';
  return (
    <ExchangeTickerProvider exchangeName={exchangeName}>
      {/* Main content */}
      <Grid container spacing={1} sx={{ height: '100%', minHeight: 900, width: '100%', m: 0 }}>
        <Grid item md={9} sx={{ height: { md: '100%', xs: 'auto' } }} xs={12}>
          <Stack spacing={1} sx={{ height: { md: '100%', xs: 'auto' } }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MultiFavoritePairs
                  buyOrderItems={buyOrderItems}
                  fundingRateFavorites={fundingRateFavorites}
                  handleFavoriteClick={handlePairSelect}
                  sellOrderItems={sellOrderItems}
                  tokenPairs={tokenPairs}
                />
              </Grid>
              <Grid item xs={12}>
                <MultiPairInfoBar
                  buyOrderItems={buyOrderItems}
                  exchange={exchangeName}
                  fundingRates={fundingRates}
                  fundingRatesLoading={fundingRatesLoading}
                  pair={buyOrderItems[0]?.pair}
                  sellOrderItems={sellOrderItems}
                  setTimeframe={setTimeframe}
                  timeframe={timeframe}
                  tokenPairs={tokenPairs}
                  onPairSelect={handlePairSelect}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ boxSizing: 'border-box' }}>
                  <CombinedTradingViewSection
                    buyOrderItems={buyOrderItems}
                    sellOrderItems={sellOrderItems}
                    timeframe={timeframe}
                  />
                </Paper>
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ flex: { md: 1, xs: 'unset' }, minHeight: { md: 0, xs: 'unset' } }}>
              <Grid item md={6} sx={{ height: { md: '100%', xs: 'auto' } }} xs={12}>
                <Paper elevation={0} sx={{ height: { md: '100%', xs: 'auto' }, boxSizing: 'border-box' }}>
                  <Stack direction='column' justifyContent='space-between' sx={{ height: { md: '100%', xs: 'auto' } }}>
                    <Stack
                      direction='column'
                      spacing={3}
                      sx={{ p: 3, flex: { md: 1, xs: 'unset' }, minHeight: { md: 0, xs: 'unset' } }}
                    >
                      <Typography sx={{ color: 'success.main' }} variant='h6'>
                        Buy
                      </Typography>
                      <Divider />
                      <Stack
                        direction='column'
                        spacing={3}
                        sx={{
                          flex: { md: 1, xs: 'unset' },
                          overflowY: { md: 'auto', xs: 'unset' },
                          pt: '5px',
                        }}
                      >
                        {buyOrderItems.map((formStateRow, rowIndex) => (
                          <>
                            <OrderFormItem
                              accounts={accounts}
                              balances={balances}
                              dispatch={dispatch}
                              exchangeSettingsByAccount={exchangeSettingsByAccount}
                              favouritePairs={favouritePairs}
                              index={rowIndex}
                              key={`buy${rowIndex}`}
                              orderItemState={formStateRow}
                              setFavouritePairs={setFavouritePairs}
                              showAlert={showAlert}
                              tokenPairs={tokenPairs}
                            />
                            <Divider />
                          </>
                        ))}
                        <Box display='flex' sx={{ marginTop: '5px', justifyContent: 'center' }}>
                          <IconButton onClick={() => addBuyRow()}>
                            <AddCircleOutline sx={{ fontSize: 25, color: defaultTheme.palette.grey.main }} />
                          </IconButton>
                        </Box>
                      </Stack>
                    </Stack>
                    <AggregatePreTradeAnalytics
                      data={preTradeEstimationData?.buy}
                      orderItems={buyOrderItems}
                      theme={theme}
                    />
                  </Stack>
                </Paper>
              </Grid>
              <Grid item md={6} sx={{ height: { md: '100%', xs: 'auto' } }} xs={12}>
                <Paper elevation={0} sx={{ height: { md: '100%', xs: 'auto' }, boxSizing: 'border-box' }}>
                  <Stack direction='column' justifyContent='space-between' sx={{ height: { md: '100%', xs: 'auto' } }}>
                    <Stack
                      direction='column'
                      spacing={3}
                      sx={{ p: 3, flex: { md: 1, xs: 'unset' }, minHeight: { md: 0, xs: 'unset' } }}
                    >
                      <Typography sx={{ color: 'error.main' }} variant='h6'>
                        Sell
                      </Typography>
                      <Divider />
                      <Stack
                        direction='column'
                        spacing={3}
                        sx={{
                          flex: { md: 1, xs: 'unset' },
                          overflowY: { md: 'auto', xs: 'unset' },
                          pt: '5px',
                        }}
                      >
                        {sellOrderItems.map((formStateRow, rowIndex) => (
                          <>
                            <OrderFormItem
                              accounts={accounts}
                              balances={balances}
                              dispatch={dispatch}
                              exchangeSettingsByAccount={exchangeSettingsByAccount}
                              favouritePairs={favouritePairs}
                              index={rowIndex}
                              key={`sell${rowIndex}`}
                              orderItemState={formStateRow}
                              setFavouritePairs={setFavouritePairs}
                              showAlert={showAlert}
                              tokenPairs={tokenPairs}
                            />
                            <Divider />
                          </>
                        ))}
                        <Box display='flex' sx={{ marginTop: '5px', justifyContent: 'center' }}>
                          <IconButton onClick={() => addSellRow()}>
                            <AddCircleOutline sx={{ fontSize: 25, color: defaultTheme.palette.grey.main }} />
                          </IconButton>
                        </Box>
                      </Stack>
                    </Stack>
                    <AggregatePreTradeAnalytics
                      data={preTradeEstimationData?.sell}
                      orderItems={sellOrderItems}
                      theme={theme}
                    />
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Grid>
        <Grid item md={3} xs={12}>
          <Paper elevation={0} sx={{ height: '100%', boxSizing: 'border-box' }}>
            <MultiOrderSubmitForm
              {...multiOrderFormProps}
              buyData={preTradeEstimationData?.buy}
              buyOrderItems={buyOrderItems}
              sellData={preTradeEstimationData?.sell}
              sellOrderItems={sellOrderItems}
            />
          </Paper>
        </Grid>
      </Grid>
      <MultiOrderConfirmationModal
        data={formData}
        handleConfirm={handleConfirm}
        open={openModal}
        setOpen={setOpenModal}
        submitLoading={submitLoading}
      />
    </ExchangeTickerProvider>
  );
}
