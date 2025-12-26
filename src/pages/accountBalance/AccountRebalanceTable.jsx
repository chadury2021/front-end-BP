/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Modal,
  TableBody,
  MenuItem,
  Tooltip,
  IconButton,
  FormControl,
  Select,
  Table,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useTheme } from '@emotion/react';
import { fetchOrderEntryFormData, getUserFavouritePairs, getPairPrice } from '../../apiServices';
import PairSelector from '../dashboard/orderEntry/PairSelector';
import { msAndKs, truncate, getUnderlying } from '../../util';
import AccountRebalanceDoughnut from './AccountRebalanceDoughnut';
import AccountRebalanceSubmitForm from './AccountRebalanceSubmitForm';
import { getUniqueBases, groupAssetsByBase, mapTokenPairsToAssets } from './util';
import getBaseTokenIcon from '../../../images/tokens';

const RebalanceAssetsColumns = [
  { id: 'underlying', label: 'Underlying', minWidth: 70, align: 'left', style: { fontWeight: 'bold' } },
  { id: 'assetType', label: 'Asset Type', minWidth: 70, align: 'left', style: { fontWeight: 'bold' } },
  {
    id: 'targetWeight',
    label: 'Target Weight(%)',
    minWidth: 60,
    align: 'right',
    number: true,
    style: { fontWeight: 'bold' },
  },
  { id: 'currentWeight', label: 'Current Weight(%)', minWidth: 60, align: 'right', number: true },
  { id: 'targetNotional', label: 'Target Notional ≈ Target Quantity', minWidth: 100, align: 'right', number: true },
  { id: 'currentNotional', label: 'Current Notional ≈ Current Quantity', minWidth: 100, align: 'right', number: true },
  { id: 'proposedTradeNotional', label: 'Proposed Trade Notional', minWidth: 70, align: 'right', number: true },
  { id: 'proposedTradeQuantity', label: 'Proposed Trade Quantity', minWidth: 70, align: 'right', number: true },
  { id: 'diff', label: 'Difference', minWidth: 70, align: 'right', number: true },
];

const filteredAssets = (assets) => {
  return assets.filter(
    (asset) => asset.symbol && typeof asset.symbol === 'string' && !['USDT', 'USD', 'USDC'].includes(asset.symbol)
  );
};

const formattedAssets = (assets) => {
  return assets.map((asset) => ({
    ...asset,
    symbol: asset.symbol.replace(/-USDT|-USDC|-USD$/, ''),
  }));
};

function AccountRebalanceTable({
  balanceData,
  counterAsset,
  fetchRebalanceStatus,
  isFloating,
  isScheduled,
  multiOrderFormProps,
  parentOrder,
  rebalanceMode,
  rebalanceProgress,
  selectedAccount,
  selectedAccountFull,
  setCounterAsset,
  setInProgress,
  setIsFloating,
  setIsScheduled,
  setParentOrder,
  setRebalanceMode,
  setRebalanceProgress,
  setTaskId,
  showAlert,
  taskId,
  localTolerance,
  setLocalTolerance,
  selectedDuration,
  rebalanceFrequencyValue,
  rebalanceFrequency,
  setSelectedDuration,
  setRebalanceFrequencyValue,
  setRebalanceFrequency,
  inProgress,
  assetOrdering,
  currentAssets,
  nextRebalance,
  setNextRebalance,
  loadOrderData,
  localBalanceNotional,
  setLocalBalanceNotional,
  localTargetWeights,
  SetLocalTargetWeights,
  setStartTime,
  startTime,
  orderId,
  setOrderId,
  setTimeLeft,
  timeLeft,
  isStarting,
  setIsStarting,
}) {
  const [tolerance, setTolerance] = useState(1);
  const [targetWeights, setTargetWeights] = useState({});
  const [ourAssets, setOurAssets] = useState([]);
  const [netBalance, setNetBalance] = useState({ assets: [] });
  const [tokenPairs, setTokenPairs] = useState([]);
  const [favouritePairs, setFavouritePairs] = useState([]);
  const [BalanceNotional, setBalanceNotional] = useState([]);
  const [positionTypes, setPositionTypes] = useState({});
  const [showCashRow, setShowCashRow] = useState(true);
  const [targetWeightEnabled, setTargetWeightEnabled] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [showPairSelectorModal, setShowPairSelectorModal] = useState(false);
  const [newRowIndex, setNewRowIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPrices, setCurrentPrices] = useState({});
  const [pricesFetchedDuringRebalance, setPricesFetchedDuringRebalance] = useState(false);
  const [sortOption, setSortOption] = useState('underlying');
  const theme = useTheme();

  useEffect(() => {
    setBalanceNotional(localBalanceNotional);
    setTolerance(localTolerance);
  }, [localTolerance, localBalanceNotional]);

  const netBalanceAssets = netBalance.assets;
  const normalizeSymbol = (symbol) => {
    return `${symbol.replace(/-USDT|-USDC|-USD$/, '')}-${counterAsset}`;
  };

  const fetchPairPrice = async (symbol) => {
    if (!symbol || ['USDT', 'USD', 'USDC'].includes(symbol)) {
      return null;
    }

    const exchangeName = selectedAccount?.exchangeName || '';

    const pair = symbol.includes(counterAsset) ? symbol : `${symbol}-${counterAsset}`;
    try {
      const result = await getPairPrice(pair, exchangeName);
      const fetchedPrice = result[pair] || 0;

      if (fetchedPrice === 0) {
        showAlert({ severity: 'error', message: `Price not found for asset: ${symbol}` });
      }

      const normalizedSymbol = symbol.includes(':PERP')
        ? symbol.split('-')[0]
        : symbol.replace(/-USDT|-USDC|-USD$/, '');

      setCurrentPrices((prev) => {
        const updatedPrices = { ...prev, [normalizedSymbol]: fetchedPrice };
        return updatedPrices;
      });

      return fetchedPrice;
    } catch (error) {
      showAlert({ severity: 'error', message: `Failed to fetch price for asset: ${symbol}` });
      return 0;
    }
  };

  useEffect(() => {
    const fetchTokenPairs = async () => {
      try {
        const data = await fetchOrderEntryFormData();
        const pairs = data.pairs
          .filter((pair) => pair.quote === counterAsset)
          .map((pair) => ({
            base: pair.base,
            quote: pair.quote,
            label: pair.name,
            id: pair.name,
            is_contract: pair.is_contract,
            is_inverse: pair.is_inverse,
            exchanges: pair.exchanges,
            market_type: pair.market_type,
          }));
        setTokenPairs(pairs);
      } catch (error) {
        showAlert({ severity: 'error', message: `Failed to fetch token pairs: ${error.message}` });
      }
    };

    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchTokenPairs()]);
      setLoading(false);
    };

    loadInitialData();
  }, [counterAsset]);

  const filterAssetsByMarketType = (assets, tokenPairs, marketType) => {
    return assets
      .filter((asset) => {
        const assetIdentifier = asset.pair || asset.symbol;
        if (!assetIdentifier) return false;
        const normalizedSymbol = normalizeSymbol(assetIdentifier);
        const tokenPair = tokenPairs.find((pair) => pair.label === normalizedSymbol);
        return tokenPair && tokenPair.market_type === marketType;
      })
      .map((asset) => ({
        symbol: asset.pair || asset.symbol,
      }));
  };

  const fetchFavouritePairs = async () => {
    try {
      setLoading(true);
      const response = await getUserFavouritePairs();
      const { pairs } = response;

      const favouritePairs = pairs
        .filter((pair) => {
          const [base, quote] = pair.split(/[-]/);
          return quote === counterAsset;
        })
        .reduce((acc, pair) => ({ ...acc, [pair]: true }), {});

      setFavouritePairs(favouritePairs);
    } catch (error) {
      showAlert({ severity: 'error', message: 'Failed to fetch favourite pairs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId && selectedAccount.accountId !== 'All Accounts') {
      fetchFavouritePairs();
    }
  }, [selectedAccount, counterAsset]);

  const filteredSelectedAssets = filteredAssets(netBalanceAssets);
  const selectedAssets = netBalanceAssets.map((asset) => ({
    ...asset,
    symbol: asset.symbol.replace(/-USDT|-USDC|-USD$/, ''),
  }));

  const combinedAllAssets = [...selectedAssets, ...ourAssets];
  const combinedAssets = [...filteredSelectedAssets, ...ourAssets];
  const inProgressAssets = [...combinedAssets];
  Object.keys(targetWeights).forEach((symbolOrPair) => {
    const trimmedSymbolOrPair = symbolOrPair.replace(/-USDT|-USDC|-USD$/, '');
    const existingAsset = combinedAssets.find(
      (asset) => asset.symbol === trimmedSymbolOrPair || asset.pair === trimmedSymbolOrPair
    );

    if (!existingAsset) {
      inProgressAssets.push({
        symbol: trimmedSymbolOrPair,
        currentQuantity: 0,
        currentNotional: 0,
      });
    }
  });

  const filteredInprogressAssets = inProgressAssets.filter((asset, index, self) => {
    const symbolOrPair = asset.symbol || asset.pair;
    const normalizedSymbol = symbolOrPair.replace(/-USDT|-USDC|-USD$/, '');
    const suffixedSymbol = `${normalizedSymbol}-${counterAsset}`;
    const hasTargetWeight =
      Object.keys(targetWeights).includes(normalizedSymbol) || Object.keys(targetWeights).includes(suffixedSymbol);
    const isUnique =
      index === self.findIndex((a) => (a.symbol || a.pair).replace(/-USDT|-USDC|-USD$/, '') === normalizedSymbol);

    if (hasTargetWeight && isUnique) {
      /* empty */
    }

    return hasTargetWeight && isUnique;
  });

  const combinedSymbols = combinedAllAssets.map((asset) => asset.symbol);
  const extendedCombinedAssets = [
    ...combinedAllAssets,
    ...filteredInprogressAssets.filter((asset) => !combinedSymbols.includes(asset.symbol)),
  ];

  const bases = getUniqueBases(combinedAllAssets);
  const basesInprogress = getUniqueBases(filteredInprogressAssets);

  const underlyingAssets = mapTokenPairsToAssets(tokenPairs, bases, selectedAccountFull);
  const underlyingAssetsInprogress = mapTokenPairsToAssets(tokenPairs, basesInprogress, selectedAccountFull);

  const groupedUnderlyingAssets = groupAssetsByBase(underlyingAssets);
  const groupedUnderlyingAssetsInprogress = groupAssetsByBase(underlyingAssetsInprogress);

  const spotAssetPairs = filterAssetsByMarketType(extendedCombinedAssets, tokenPairs, 'spot');
  const perpAssetPairs = filterAssetsByMarketType(extendedCombinedAssets, tokenPairs, 'perp');

  const formattedSpotAssetPairs = formattedAssets(spotAssetPairs);
  const formattedPerpAssetPairs = formattedAssets(perpAssetPairs);

  const normalizedSymbol = (symbol) => symbol.replace(/-USDT|-USDC|-USD$/, '');
  const spotSymbols = formattedSpotAssetPairs.map((pair) => pair.symbol);
  const perpSymbols = formattedPerpAssetPairs.map((pair) => pair.symbol);

  const allFormattedSymbols = new Set([...spotSymbols, ...perpSymbols]);
  const remainingTokenPairs = tokenPairs.filter((pair) => {
    const normalizedLabel = normalizedSymbol(pair.label);
    return !allFormattedSymbols.has(normalizedLabel);
  });

  const filteredCombinedAssets = filteredAssets(combinedAssets);

  const fetchPricesForAssets = async () => {
    const assetsToFetch = inProgress ? filteredInprogressAssets : netBalance.assets;

    await Promise.all(assetsToFetch.map((asset) => fetchPairPrice(asset.symbol)));
  };

  const targetWeightsWithAssetType = Object.entries(targetWeights).reduce((acc, [symbol, weight]) => {
    const normalizedSymbol = normalizeSymbol(symbol);
    const tokenPair = tokenPairs.find((pair) => pair.label === normalizedSymbol);

    const marketType = tokenPair ? tokenPair.market_type : 'unknown';

    acc[symbol] = {
      targetWeight: weight,
      marketType,
    };

    return acc;
  }, {});

  useEffect(() => {
    if (inProgress && filteredInprogressAssets.length > 0 && !pricesFetchedDuringRebalance) {
      fetchPricesForAssets();
      setPricesFetchedDuringRebalance(true);
    }
  }, [inProgress, pricesFetchedDuringRebalance]);

  useEffect(() => {
    if (!inProgress) {
      setPricesFetchedDuringRebalance(false);
    }
  }, [inProgress]);

  const fetchMissingPrices = async (assets, currentPrices, fetchPairPrice, counterAsset) => {
    const fetchedSymbols = new Set();
    const missingPrices = assets.filter((asset) => {
      const symbol = asset.symbol || asset.pair;
      const normalizedSymbol = symbol.includes(':PERP')
        ? symbol.split('-')[0]
        : symbol.replace(/-USDT|-USDC|-USD$/, '');

      const isMissing =
        normalizedSymbol &&
        (!(normalizedSymbol in currentPrices) || currentPrices[normalizedSymbol] === 0) &&
        !fetchedSymbols.has(normalizedSymbol);
      return isMissing;
    });
    const fetchPromises = missingPrices.map(async (asset) => {
      const symbol = asset.symbol || asset.pair;
      const fullSymbol = symbol.includes(':PERP')
        ? symbol.replace(/-USDT|-USDC|-USD$/, `-${counterAsset}`)
        : `${symbol}-${counterAsset}`;
      if (symbol) {
        const normalizedSymbol = symbol.includes(':PERP')
          ? symbol.split('-')[0]
          : symbol.replace(/-USDT|-USDC|-USD$/, '');

        fetchedSymbols.add(normalizedSymbol);
        try {
          const price = await fetchPairPrice(fullSymbol);
          return { symbol: normalizedSymbol, price };
        } catch (error) {
          return { symbol: normalizedSymbol, price: null };
        }
      }
      return null;
    });
    const results = await Promise.all(fetchPromises);
    const filteredResults = results.filter(Boolean);
    return filteredResults;
  };

  const handleToleranceChange = (e) => {
    setTolerance(parseFloat(e.target.value) || 0);
  };

  useEffect(() => {
    const assets = inProgress ? filteredInprogressAssets : filteredCombinedAssets;
    fetchMissingPrices(assets, currentPrices, fetchPairPrice, counterAsset).then((results) => {});
  }, [targetWeights]);

  useEffect(() => {
    const assets = inProgress ? filteredInprogressAssets : filteredCombinedAssets;
    fetchMissingPrices(assets, currentPrices, fetchPairPrice, counterAsset).then((results) => {});
  }, [counterAsset]);

  const calculateProposedTrade = (targetWeight, currentNotional, currentPrice, totalNotional) => {
    if (
      targetWeight === undefined ||
      targetWeight === null ||
      targetWeight === '' ||
      Number.isNaN(targetWeight) ||
      currentPrice === 0
    ) {
      return { proposedTradeNotional: 0, proposedTradeQuantity: 0, targetNotional: 0 };
    }
    if (targetWeight === 0) {
      return {
        targetNotional: 0,
        proposedTradeNotional: -currentNotional,
        proposedTradeQuantity: currentPrice > 0 ? -currentNotional / currentPrice : 0,
      };
    }
    const effectiveBalanceNotional = inProgress ? localBalanceNotional : BalanceNotional;
    const targetNotional = (targetWeight / 100) * effectiveBalanceNotional;
    const proposedTradeNotional = targetNotional - currentNotional;
    const proposedTradeQuantity = currentPrice > 0 ? proposedTradeNotional / currentPrice : 0;

    return { proposedTradeNotional, proposedTradeQuantity, targetNotional };
  };

  const calculateDiff = (targetWeight, currentWeight, targetNotional, currentNotional) => {
    if (targetWeight === 0) {
      return (-currentWeight).toFixed(2);
    }
    if (!targetWeight || targetWeight === '' || Number.isNaN(targetWeight)) {
      return '0.00';
    }
    if (!currentNotional || currentNotional === 0 || Number.isNaN(currentNotional)) {
      return targetWeight.toFixed(2);
    }
    const diff = (targetNotional / currentNotional - 1) * 100;
    return diff.toFixed(2) === '-0.00' ? '0.00' : diff.toFixed(2);
  };
  const calculateCurrentWeight = (currentNotional, totalCurrentNotional) => {
    const weight = (currentNotional / totalCurrentNotional) * 100;
    return weight.toFixed(2);
  };
  const handleRowCalculations = (asset) => {
    const fullSymbol = asset.symbol;
    const fetchSymbol = fullSymbol.includes(':PERP')
      ? fullSymbol.replace(/-USDT|-USDC|-USD$/, '')
      : fullSymbol.replace(/-USDT|-USDC|-USD$/, '');
    const currentPrice = currentPrices[fetchSymbol] || 0;
    const currentNotional = asset.currentNotional || 0;
    const totalCurrentNotional = combinedAssets.reduce((sum, asset) => sum + (asset.currentNotional || 0), 0);
    const currentWeight = calculateCurrentWeight(currentNotional, totalCurrentNotional);
    const normalizedSymbol = fullSymbol.replace(/-USDT|-USDC|-USD$/, '');
    const tableSymbol = fullSymbol.includes(':PERP') ? fullSymbol : fullSymbol.replace(/-USDT|-USDC|-USD$/, '');
    const targetWeight = Object.prototype.hasOwnProperty.call(targetWeights, normalizedSymbol)
      ? parseFloat(targetWeights[normalizedSymbol])
      : undefined;
    const { proposedTradeNotional, proposedTradeQuantity, targetNotional } = calculateProposedTrade(
      targetWeight,
      currentNotional,
      currentPrice,
      totalCurrentNotional
    );

    const diff = calculateDiff(targetWeight, currentWeight, targetNotional, currentNotional);
    const targetQuantity = Math.abs(targetNotional / currentPrice).toFixed(2);
    const currentQuantity = Math.abs(currentNotional / currentPrice).toFixed(2);
    return {
      currentPrice,
      currentWeight,
      targetNotional,
      currentNotional,
      proposedTradeNotional,
      proposedTradeQuantity,
      diff,
      targetQuantity,
      currentQuantity,
      tableSymbol,
    };
  };

  const filteredCombinedAllAssets = filteredAssets(combinedAllAssets);
  const assetsToUse = inProgress ? inProgressAssets : combinedAllAssets;

  let totalCurrentNotional;

  if (inProgress) {
    totalCurrentNotional = assetsToUse.reduce((sum, asset) => {
      const symbol = asset.symbol || (asset.pair && asset.pair.split('-')[0]);
      const hasTargetWeight =
        Object.prototype.hasOwnProperty.call(targetWeights, symbol) && parseFloat(targetWeights[symbol]) !== 0;

      const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === symbol);
      const currentNotional = isPerp ? Math.abs(asset.currentNotional || 0) : asset.currentNotional || 0;

      return hasTargetWeight ? sum + currentNotional : sum;
    }, 0);
  } else {
    totalCurrentNotional = filteredCombinedAllAssets.reduce((sum, asset) => {
      const symbol = asset.symbol || (asset.pair && asset.pair.split('-')[0]);

      const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === symbol);
      const currentNotional = isPerp ? Math.abs(asset.currentNotional || 0) : asset.currentNotional || 0;

      return sum + currentNotional;
    }, 0);
  }
  const totalCurrentNotionalWithTargetWeight = assetsToUse.reduce((sum, asset) => {
    let symbol = asset.symbol || (asset.pair && asset.pair.split('-')[0]);
    if (symbol.includes(':PERP')) {
      symbol = `${symbol}-${counterAsset}`;
    }
    const hasTargetWeight =
      Object.prototype.hasOwnProperty.call(targetWeights, symbol) && parseFloat(targetWeights[symbol]) !== 0;

    const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === symbol);
    const currentNotional = isPerp ? Math.abs(asset.currentNotional || 0) : asset.currentNotional || 0;
    const updatedSum = hasTargetWeight ? sum + currentNotional : sum;
    return updatedSum;
  }, 0);

  const totalTargetWeight = assetsToUse
    .reduce((sum, asset) => {
      const symbol = asset.symbol || (asset.pair && asset.pair.split('-')[0]);
      const targetWeight = Math.abs(parseFloat(targetWeights[symbol] || 0));
      return targetWeight ? sum + targetWeight : sum;
    }, 0)
    .toFixed(2);

  let totalCurrentWeight;

  if (inProgress) {
    totalCurrentWeight = assetsToUse
      .reduce((sum, asset) => {
        const symbol = asset.symbol || (asset.pair && asset.pair.split('-')[0]);
        const hasTargetWeight =
          Object.prototype.hasOwnProperty.call(targetWeights, symbol) && parseFloat(targetWeights[symbol]) !== 0;

        if (!hasTargetWeight) {
          return sum;
        }

        const currentNotional = asset.currentNotional || 0;
        const totalCurrentNotional = combinedAllAssets.reduce((totalSum, a) => {
          return totalSum + (a.currentNotional || 0);
        }, 0);

        const currentWeight =
          currentNotional > 0 && totalCurrentNotional > 0 ? (currentNotional / totalCurrentNotional) * 100 : 0;

        return sum + currentWeight;
      }, 0)
      .toFixed(2);
  } else {
    totalCurrentWeight = combinedAllAssets
      .reduce((sum, asset) => {
        const currentNotional = asset.currentNotional || 0;
        const totalCurrentNotional = combinedAllAssets.reduce((totalSum, a) => {
          return totalSum + (a.currentNotional || 0);
        }, 0);

        const currentWeight =
          currentNotional > 0 && totalCurrentNotional > 0 ? (currentNotional / totalCurrentNotional) * 100 : 0;
        return sum + currentWeight;
      }, 0)
      .toFixed(2);
  }

  const totalProposedTradeNotional = assetsToUse
    .reduce((sum, asset) => {
      const baseSymbol = asset.pair ? asset.pair.split('-')[0] : asset.symbol;
      const currentPrice = currentPrices[baseSymbol] || 0;
      const currentNotional = asset.currentNotional || 0;
      const normalizedSymbol = baseSymbol;
      const targetWeight = Object.prototype.hasOwnProperty.call(targetWeights, normalizedSymbol)
        ? parseFloat(targetWeights[normalizedSymbol])
        : NaN;

      const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === baseSymbol);
      if (Number.isNaN(targetWeight) || currentPrice === 0) {
        return sum;
      }

      let proposedTradeNotional = 0;
      if (targetWeight === 0) {
        proposedTradeNotional = -currentNotional;
      } else {
        const effectiveBalanceNotional = inProgress ? localBalanceNotional : BalanceNotional;
        const targetNotional = (targetWeight / 100) * effectiveBalanceNotional;

        proposedTradeNotional = isPerp
          ? Math.abs(targetNotional) - Math.abs(currentNotional)
          : targetNotional - currentNotional;
      }

      return sum + proposedTradeNotional;
    }, 0)
    .toFixed(2);

  const totalTargetNotional = assetsToUse
    .reduce((sum, asset) => {
      const baseSymbol = asset.pair ? asset.pair.split('-')[0] : asset.symbol;
      const targetWeight = Object.prototype.hasOwnProperty.call(targetWeights, baseSymbol)
        ? parseFloat(targetWeights[baseSymbol])
        : NaN;

      if (Number.isNaN(targetWeight)) {
        return sum;
      }
      const effectiveBalanceNotional = inProgress ? localBalanceNotional : BalanceNotional;
      const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === baseSymbol);
      let targetNotional = targetWeight === 0 ? 0 : (targetWeight / 100) * effectiveBalanceNotional;

      if (isPerp) {
        targetNotional = Math.abs(targetNotional);
      }

      return sum + targetNotional;
    }, 0)
    .toFixed(2);

  const totalCurrentNotionalAll = combinedAllAssets.reduce((sum, asset) => {
    return sum + (asset.currentNotional || 0);
  }, 0);

  const hasTargetWeights = Object.values(targetWeights).some((weight) => weight && parseFloat(weight) !== 0);

  let totalDiff = 0;

  if (hasTargetWeights) {
    if (totalCurrentNotional === 0) {
      totalDiff = parseFloat(totalTargetNotional) || 0;
    } else {
      totalDiff = (parseFloat(totalTargetNotional) / totalCurrentNotionalWithTargetWeight - 1) * 100;
    }
  }

  const formattedTotalDiff =
    typeof totalDiff !== 'number' || Number.isNaN(totalDiff) || totalDiff === null ? '0.00' : totalDiff.toFixed(2);

  const formattedTotalProposedTradeNotional =
    totalProposedTradeNotional === '-0.00' ? '0.00' : totalProposedTradeNotional;
  const totalCurrentNotionalAllFormatted = msAndKs(truncate(totalCurrentNotionalAll), 2);

  const calculateCashCurrentNotional = () => {
    const selectedAccountBalances = balanceData[selectedAccount.accountId];
    if (!selectedAccountBalances) return 0;
    const cashAssets = ['USDT', 'USDC', 'USD'];
    return cashAssets.reduce((total, asset) => {
      const assetData = selectedAccountBalances[asset];
      if (assetData && assetData.length > 0) {
        return total + (assetData[0].notional || 0);
      }
      return total;
    }, 0);
  };

  const trimSymbol = (symbol) => {
    if (typeof symbol === 'string') {
      return symbol.replace(/-USDT|-USDC|-USD$/, '');
    }
    return symbol;
  };

  const initializeNetBalance = (selectedAccountBalances) => {
    const netBalance = { assets: [] };

    Object.keys(selectedAccountBalances).forEach((symbol) => {
      if (['USDT', 'USD', 'USDC'].includes(symbol)) {
        return;
      }

      const assetBalances = selectedAccountBalances[symbol];
      const lastBalance = assetBalances[assetBalances.length - 1] || {};
      const normalizedSymbol = symbol.includes(':PERP') ? symbol.replace(/-USDT|-USDC|-USD$/, '') : symbol;
      const currentPrice = currentPrices[normalizedSymbol] || 0;

      const currentNotional = lastBalance.notional || 0;
      const currentQuantity = currentPrice > 0 ? currentNotional / currentPrice : 0;

      netBalance.assets.push({
        symbol,
        currentQuantity,
        currentNotional,
      });
    });

    return netBalance;
  };

  const handleInputChange = (symbol, event) => {
    const value = event.target.value === '' ? '' : parseFloat(event.target.value);
    const normalizedSymbol = symbol.replace(/-USDT|-USDC|-USD$/, '');

    setTargetWeights((prev) => {
      const updatedWeights = { ...prev };
      if (value === '' || Number.isNaN(value)) {
        delete updatedWeights[normalizedSymbol];
      } else {
        updatedWeights[normalizedSymbol] = Math.abs(value);
      }
      return updatedWeights;
    });
  };

  useEffect(() => {
    if (selectedAccount && balanceData[selectedAccount.accountId]) {
      const initialNetBalance = initializeNetBalance(balanceData[selectedAccount.accountId]);
      setNetBalance(initialNetBalance);
      fetchPricesForAssets(initialNetBalance.assets);

      const initialTargetWeightEnabled = initialNetBalance.assets.reduce((acc, asset) => {
        const normalizedSymbols = (symbol) => symbol.replace(/-USDT|-USDC|-USD$/, '');
        const normalizedSymbol = normalizedSymbols(asset.symbol);
        acc[normalizedSymbol] = !!asset.isPerp || true;
        return acc;
      }, {});

      setTargetWeightEnabled(initialTargetWeightEnabled);
    }
  }, [selectedAccount, balanceData]);

  const handlePairChange = async (index, selectedPair) => {
    const updatedAssets = [...ourAssets];
    const newSymbol = selectedPair.split('-')[0];
    updatedAssets[index] = {
      ...updatedAssets[index],
      pair: selectedPair,
    };
    setOurAssets(updatedAssets);
    await fetchPairPrice(selectedPair);
    setTargetWeights((prevWeights) => ({
      ...prevWeights,
      [newSymbol]: prevWeights[newSymbol] || 0,
    }));
    setShowPairSelectorModal(false);
    setNewRowIndex(null);
  };

  const groupAssetsByPairBase = (assets) => {
    return assets.reduce((acc, asset) => {
      const symbolOrPair = asset.pair || asset.symbol;
      if (!symbolOrPair) return acc;
      const base = symbolOrPair.split(':')[0].split('-')[0];
      const perpPair = `${base}:PERP-${counterAsset}`;
      const spotPair = `${base}-${counterAsset}`;
      if (!acc[base]) {
        acc[base] = [];
      }
      if (!acc[base].includes(spotPair)) acc[base].push(spotPair);
      if (!acc[base].includes(perpPair)) acc[base].push(perpPair);

      return acc;
    }, {});
  };

  const handleAddRow = () => {
    const newAsset = { pair: '', targetWeight: '', currentNotional: 0 };
    setOurAssets((prevAssets) => [...prevAssets, newAsset]);
    setNewRowIndex(ourAssets.length);
    setShowPairSelectorModal(true);
  };
  const SymbolOurAssets = ourAssets.map((asset) => {
    const { pair, ...rest } = asset;

    const normalizedSymbol = pair.includes(':PERP') ? pair : `${pair.replace(/-USDT|-USDC|-USD$/, '')}-${counterAsset}`;

    return {
      symbol: normalizedSymbol,
      ...rest,
    };
  });

  const groupedAssetTypes = {
    Spot: [],
    Perp: [],
  };

  Object.entries(groupedUnderlyingAssets).forEach(([baseSymbol, childSymbols]) => {
    childSymbols.forEach((symbol) => {
      const normalizedSymbol = symbol.includes(':PERP')
        ? symbol.replace(/-USDT|-USDC|-USD$/, '')
        : symbol.replace(/-USDT|-USDC|-USD$/, '');

      if (formattedSpotAssetPairs.some((pair) => pair.symbol === normalizedSymbol)) {
        groupedAssetTypes.Spot.push(symbol);
      } else if (formattedPerpAssetPairs.some((pair) => pair.symbol === normalizedSymbol)) {
        groupedAssetTypes.Perp.push(symbol);
      }
    });
  });

  const groupedAssetTypesInprogress = {
    Spot: [],
    Perp: [],
  };

  Object.entries(groupedUnderlyingAssetsInprogress).forEach(([baseSymbol, childSymbols]) => {
    childSymbols.forEach((symbol) => {
      const normalizedSymbol = symbol.includes(':PERP')
        ? symbol.replace(/-USDT|-USDC|-USD$/, '')
        : symbol.replace(/-USDT|-USDC|-USD$/, '');

      if (formattedSpotAssetPairs.some((pair) => pair.symbol === normalizedSymbol)) {
        groupedAssetTypesInprogress.Spot.push(symbol);
      } else if (formattedPerpAssetPairs.some((pair) => pair.symbol === normalizedSymbol)) {
        groupedAssetTypesInprogress.Perp.push(symbol);
      }
    });
  });

  const groupedUnderlyingOurAssets = groupAssetsByPairBase(ourAssets);
  const groupedOurAssetTypes = {
    Spot: [],
    Perp: [],
  };

  Object.entries(groupedUnderlyingOurAssets).forEach(([baseSymbol, childSymbols]) => {
    childSymbols.forEach((symbol) => {
      const normalizedSymbol = symbol.includes(':PERP')
        ? symbol.replace(/-USDT|-USDC|-USD$/, '')
        : symbol.replace(/-USDT|-USDC|-USD$/, '');

      if (formattedSpotAssetPairs.some((pair) => pair.symbol === normalizedSymbol)) {
        groupedOurAssetTypes.Spot.push(symbol);
      } else if (formattedPerpAssetPairs.some((pair) => pair.symbol === normalizedSymbol)) {
        groupedOurAssetTypes.Perp.push(symbol);
      }
    });
  });

  const getGroupedAssets = () => {
    if (!inProgress) {
      if (sortOption === 'assetType') {
        return {
          Spot: [...groupedAssetTypes.Spot, ...groupedOurAssetTypes.Spot],
          Perp: [...groupedAssetTypes.Perp, ...groupedOurAssetTypes.Perp],
        };
      }
      return groupedUnderlyingAssets;
    }
    return sortOption === 'assetType' ? groupedAssetTypesInprogress : groupedUnderlyingAssetsInprogress;
  };
  const handleRemoveRow = (childSymbol) => {
    const updatedAssets = ourAssets.filter((asset) => asset.pair !== childSymbol);
    const normalizedSymbol = childSymbol.replace(/-USDT|-USDC|-USD$/, '');
    setTargetWeights((prevWeights) => {
      const { [normalizedSymbol]: _, ...remainingWeights } = prevWeights;
      return remainingWeights;
    });
    setOurAssets(updatedAssets);
  };

  const selectedAccountData = [selectedAccountFull];
  const transformedAccountData = {
    [selectedAccountFull.account_name]: {
      displayName: `${selectedAccountFull.exchange_name} - ${selectedAccountFull.account_name}`,
      exchangeName: selectedAccountFull.exchange_name,
      id: selectedAccountFull.account_id,
      name: selectedAccountFull.account_name,
    },
  };
  const transformedBalanceData = {
    [selectedAccountFull.account_id]: {
      account_id: selectedAccountFull.account_id,
      account_name: selectedAccountFull.account_name,
      assets: selectedAccountFull.assets,
      exchange_name: selectedAccountFull.exchange_name,
      timestamp_millis: selectedAccountFull.timestamp_millis,
      user_id: selectedAccountFull.user_id,
      username: selectedAccountFull.username,
    },
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const loadData = async () => {
        if (selectedAccount?.accountId === 'All Accounts') {
          return;
        }

        try {
          setLoading(true);
          await fetchRebalanceStatus();
        } catch (error) {
          showAlert({ severity: 'info', message: 'Rebalance not in progress.' });
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedAccount]);

  const getFormattedTotalDiffColor = (diff) => {
    if (diff > 0) return theme.palette.semantic.success;
    if (diff < 0) return theme.palette.semantic.error;
    return theme.palette.text.primary;
  };

  const getAssetQuantityForCounterAsset = () => {
    if (selectedAccount && balanceData[selectedAccount.accountId]) {
      const selectedAccountBalances = balanceData[selectedAccount.accountId];
      const assetBalances = selectedAccountBalances[counterAsset];
      if (assetBalances && assetBalances.length > 0) {
        const lastBalance = assetBalances[assetBalances.length - 1];
        if (lastBalance.amount) {
          return parseFloat(lastBalance.amount).toFixed(2);
        }
        if (lastBalance.notional) {
          return parseFloat(lastBalance.notional).toFixed(2);
        }
      }
    }
    return '0.00';
  };

  const cashCurrntNotional = calculateCashCurrentNotional();
  const cashTargetWeight = 100 - totalTargetWeight;
  const reverseTotalProposedTradeNotional = -totalProposedTradeNotional;
  const cashTargetNotional = cashCurrntNotional + reverseTotalProposedTradeNotional;

  useEffect(() => {
    const updatedPositionTypes = {};
    Object.entries(targetWeights).forEach(([symbolOrPair, weight]) => {
      updatedPositionTypes[symbolOrPair] = weight >= 0 ? 'long' : 'short';
    });
    setPositionTypes(updatedPositionTypes);
  }, [targetWeights]);

  const handleCheckboxChange = (symbol) => {
    setTargetWeightEnabled((prev) => {
      const isEnabled = !prev[symbol];
      const updatedEnabled = { ...prev, [symbol]: isEnabled };
      setTargetWeights((prevWeights) => {
        const updatedWeights = { ...prevWeights };
        if (!isEnabled) {
          delete updatedWeights[symbol];
        }
        return updatedWeights;
      });

      return updatedEnabled;
    });
  };

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId) {
      const savedWeights = localStorage.getItem(`targetWeights_${selectedAccount.accountId}`);
      if (savedWeights) {
        setTargetWeights(JSON.parse(savedWeights));
      } else {
        setTolerance(1);
        setTargetWeights({});
      }
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId) {
      localStorage.setItem(`targetWeights_${selectedAccount.accountId}`, JSON.stringify(targetWeights));
    }
  }, [targetWeights, selectedAccount]);

  const handleBalanceNotionalChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setBalanceNotional(value);
  };
  useEffect(() => {
    if (totalCurrentNotional) {
      setBalanceNotional(parseFloat(totalCurrentNotional).toFixed(2));
    }
  }, [totalCurrentNotional]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId !== 'All Accounts') {
      fetchRebalanceStatus();

      setTolerance(1);
      setBalanceNotional([]);
      setOurAssets([]);
    }
  }, [selectedAccount]);

  const RebalanceSubmitProps = {
    balanceData,
    counterAsset,
    fetchRebalanceStatus,
    isFloating,
    isScheduled,
    multiOrderFormProps,
    parentOrder,
    rebalanceMode,
    rebalanceProgress,
    selectedAccount,
    selectedAccountFull,
    setCounterAsset,
    setInProgress,
    setIsFloating,
    setIsScheduled,
    setParentOrder,
    setRebalanceMode,
    setRebalanceProgress,
    setTaskId,
    showAlert,
    taskId,
    tolerance,
    selectedDuration,
    rebalanceFrequencyValue,
    rebalanceFrequency,
    setTolerance,
    setSelectedDuration,
    setRebalanceFrequencyValue,
    setRebalanceFrequency,
    ourAssets,
    setOurAssets,
    positionTypes,
    setPositionTypes,
    BalanceNotional,
    setBalanceNotional,
    targetWeights,
    setTargetWeights,
    calculateCurrentWeight,
    calculateDiff,
    calculateProposedTrade,
    currentPrices,
    formattedPerpAssetPairs,
    formattedSpotAssetPairs,
    formattedTotalProposedTradeNotional,
    inProgress,
    netBalance,
    setCurrentPrices,
    targetWeightsWithAssetType,
    totalCurrentNotional,
    totalCurrentNotionalAllFormatted,
    totalTargetNotional,
    nextRebalance,
    setNextRebalance,
    loadOrderData,
    setStartTime,
    startTime,
    orderId,
    setOrderId,
    setTimeLeft,
    timeLeft,
    getAssetQuantityForCounterAsset,
    isStarting,
    setIsStarting,
  };

  return (
    <Box sx={{}}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <AccountRebalanceSubmitForm {...RebalanceSubmitProps} />
      </Box>
      <Typography
        sx={{
          color: 'text.primary',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '10px',
          marginTop: '10px',
        }}
        variant='body2'
      >
        1. Set target weight (%)
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
        <ToggleButtonGroup
          exclusive
          sx={{
            backgroundColor: 'transparent',
            border: '1px solid ui.border',
            borderRadius: '4px',
          }}
          value={sortOption}
          onChange={(event, newSortOption) => {
            if (newSortOption !== null) {
              setSortOption(newSortOption);
            }
          }}
        >
          <ToggleButton
            sx={{
              color: sortOption === 'underlying' ? 'primary.main' : 'text.primary',
              fontWeight: sortOption === 'underlying' ? 600 : 400,
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                borderColor: 'primary.main',
                color: 'primary.main',
              },
              '&:hover': {
                backgroundColor: `${theme.palette.grey[600]}1A`, // 10% opacity
              },
            }}
            value='underlying'
          >
            Sort by underlying
          </ToggleButton>
          <ToggleButton
            sx={{
              color: sortOption === 'assetType' ? 'primary.main' : 'text.primary',
              fontWeight: sortOption === 'assetType' ? 600 : 400,
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                borderColor: 'primary.main',
                color: 'primary.main',
              },
              '&:hover': {
                backgroundColor: `${theme.palette.grey[600]}1A`, // 10% opacity
              },
            }}
            value='assetType'
          >
            Sort by asset type
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <FormControlLabel
        control={<Checkbox checked={showCashRow} color='primary' onChange={(e) => setShowCashRow(e.target.checked)} />}
        label='Exclude Cash'
        sx={{ marginBottom: '20px' }}
      />
      <TableContainer
        sx={{
          width: '95%',
          maxHeight:
            (!inProgress ? filteredCombinedAssets.length : filteredInprogressAssets.length) > 5 ? '423px' : 'auto',
          overflowY:
            (!inProgress ? filteredCombinedAssets.length : filteredInprogressAssets.length) > 5 ? 'auto' : 'visible',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {RebalanceAssetsColumns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    color: 'text.primary',
                    border: '1px solid ui.border',
                    minWidth: column.minWidth,
                    textAlign: column.align,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(getGroupedAssets()).map(([parentKey, childSymbols]) => {
              const childCalculations = childSymbols.map((symbol) => {
                const normalizedSymbol = symbol.includes(':PERP') ? symbol : symbol.replace(/-USDT|-USDC|-USD$/, '');
                let asset;
                if (sortOption === 'underlying') {
                  asset = [...filteredCombinedAssets, ...filteredInprogressAssets].find(
                    (a) => a.symbol === normalizedSymbol
                  );
                } else if (sortOption === 'assetType') {
                  asset =
                    [...filteredCombinedAssets, ...filteredInprogressAssets].find(
                      (a) => a.symbol === normalizedSymbol
                    ) || SymbolOurAssets.find((a) => a.symbol === symbol);
                }
                if (!asset) {
                  return {
                    currentPrice: 0,
                    currentWeight: 0,
                    targetNotional: 0,
                    currentNotional: 0,
                    proposedTradeNotional: 0,
                    proposedTradeQuantity: 0,
                    diff: 0,
                    targetQuantity: 0,
                    currentQuantity: 0,
                  };
                }

                const {
                  currentPrice,
                  currentWeight,
                  targetNotional,
                  currentNotional,
                  proposedTradeNotional,
                  proposedTradeQuantity,
                  diff,
                  targetQuantity,
                  currentQuantity,
                  tableSymbol,
                } = handleRowCalculations(asset, currentPrices, BalanceNotional);
                return {
                  currentPrice,
                  currentWeight,
                  targetNotional,
                  currentNotional,
                  targetQuantity,
                  currentQuantity,
                  proposedTradeNotional,
                  proposedTradeQuantity,
                  diff,
                  tableSymbol,
                };
              });

              const parentCalculations = childCalculations.reduce(
                (totals, child) => {
                  return {
                    currentPrice: totals.currentPrice + (Number(child.currentPrice) || 0),
                    currentWeight: totals.currentWeight + (Number(child.currentWeight) || 0),
                    targetNotional: totals.targetNotional + (Number(child.targetNotional) || 0),
                    currentNotional: totals.currentNotional + (Number(child.currentNotional) || 0),
                    targetQuantity: totals.targetQuantity + (Number(child.targetQuantity) || 0),
                    currentQuantity: totals.currentQuantity + (Number(child.currentQuantity) || 0),
                    proposedTradeNotional: totals.proposedTradeNotional + (Number(child.proposedTradeNotional) || 0),
                    proposedTradeQuantity: totals.proposedTradeQuantity + (Number(child.proposedTradeQuantity) || 0),
                    diff: 0,
                  };
                },
                {
                  currentPrice: 0,
                  currentWeight: 0,
                  targetNotional: 0,
                  currentNotional: 0,
                  targetQuantity: 0,
                  currentQuantity: 0,
                  proposedTradeNotional: 0,
                  proposedTradeQuantity: 0,
                  diff: 0,
                }
              );
              const parentRowCurrentNotionalWithTargetWeight = childCalculations
                .filter((child) => {
                  const tableSymbol = child.tableSymbol || '';
                  const normalizedSymbol = tableSymbol.includes(':PERP')
                    ? tableSymbol.replace(/-USDT|-USDC|-USD$/, '')
                    : tableSymbol;
                  const targetWeight = targetWeights[normalizedSymbol] || 0;
                  const includeInCalculation = parseFloat(targetWeight) !== 0;
                  return includeInCalculation;
                })
                .reduce((sum, child) => {
                  const childCurrentNotional = child.currentNotional || 0;
                  return sum + childCurrentNotional;
                }, 0);
              const parentDiff = (
                (parentCalculations.targetNotional / parentRowCurrentNotionalWithTargetWeight - 1) *
                100
              ).toFixed(2);
              const finalParentDiff = parentDiff === '-0.00' ? '0.00' : parentDiff;
              parentCalculations.diff = finalParentDiff;
              const parentDiffStyle = {};
              const getTargetWeightInputWithButtons = (asset) => {
                const symbolOrPair = asset.symbol ? trimSymbol(asset.symbol) : asset.pair;
                const positionType =
                  positionTypes[symbolOrPair] || (targetWeights[symbolOrPair] < 0 ? 'short' : 'long');
                const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === symbolOrPair);
                const isSpot = formattedSpotAssetPairs.some((pair) => pair.symbol === symbolOrPair);
                let positionAsset = null;
                if (sortOption === 'assetType') {
                  positionAsset = SymbolOurAssets.find((a) => a.symbol === (asset.symbol || asset.pair));
                }
                const disableTargetWeight =
                  sortOption === 'assetType'
                    ? (!positionAsset && !targetWeightEnabled[symbolOrPair]) || inProgress || isScheduled || isStarting
                    : !targetWeightEnabled[symbolOrPair] || inProgress || isScheduled || isStarting;
                const handlePositionTypeChange = (type) => {
                  setPositionTypes((prev) => ({
                    ...prev,
                    [symbolOrPair]: type,
                  }));
                  const currentWeight = parseFloat(targetWeights[symbolOrPair] || 0);
                  const adjustedWeight = type === 'long' ? Math.abs(currentWeight) : -Math.abs(currentWeight);
                  setTargetWeights((prev) => ({
                    ...prev,
                    [symbolOrPair]: adjustedWeight,
                  }));
                };
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      autoComplete='off'
                      disabled={disableTargetWeight}
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        min: 0,
                        max: 100,
                        style: {
                          backgroundColor: 'ui.inputBackground',
                          color: 'text.primary',
                          padding: '5px',
                        },
                      }}
                      type='text'
                      value={
                        targetWeights[symbolOrPair] === undefined || targetWeights[symbolOrPair] === ''
                          ? ''
                          : Math.abs(targetWeights[symbolOrPair])
                      }
                      onChange={(e) => handleInputChange(symbolOrPair, e)}
                    />
                    {isPerp && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          marginLeft: '15px',
                          marginRight: '-10px',
                        }}
                      >
                        <Tooltip title='Set position to Long'>
                          <span>
                            <Button
                              color='success'
                              disabled={disableTargetWeight}
                              size='small'
                              sx={{
                                minWidth: '24px',
                                height: '24px',
                                padding: '2px',
                                fontSize: '12px',
                              }}
                              variant={positionType === 'long' ? 'contained' : 'outlined'}
                              onClick={() => handlePositionTypeChange('long')}
                            >
                              <TrendingUpIcon fontSize='inherit' />
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title='Set position to Short'>
                          <span>
                            <Button
                              color='error'
                              disabled={disableTargetWeight}
                              size='small'
                              sx={{
                                marginTop: '3px',
                                minWidth: '24px',
                                height: '24px',
                                padding: '2px',
                                fontSize: '12px',
                              }}
                              variant={positionType === 'short' ? 'contained' : 'outlined'}
                              onClick={() => handlePositionTypeChange('short')}
                            >
                              <TrendingDownIcon fontSize='inherit' />
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                );
              };
              const renderTableCellContent = (
                column,
                assetOrBaseSymbol,
                diff,
                diffStyle,
                isParent = false,
                childCalculation = null
              ) => {
                const normalizedSymbol = isParent
                  ? assetOrBaseSymbol
                  : assetOrBaseSymbol.symbol.replace(/-USDT|-USDC|-USD$/, '');
                const isPerp = !isParent && formattedPerpAssetPairs.some((pair) => pair.symbol === normalizedSymbol);
                const isSpot = !isParent && formattedSpotAssetPairs.some((pair) => pair.symbol === normalizedSymbol);
                const notShowCheck =
                  !isParent &&
                  sortOption === 'assetType' &&
                  SymbolOurAssets.some((a) => a.symbol === assetOrBaseSymbol.symbol);
                switch (column.id) {
                  case 'underlying': {
                    if (sortOption === 'underlying') {
                      const tokenIcon = isParent ? getBaseTokenIcon(getUnderlying(normalizedSymbol)) : null;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isParent ? (
                            <>
                              {tokenIcon && (
                                <img
                                  alt={`${normalizedSymbol} Icon`}
                                  src={tokenIcon}
                                  style={{ height: '30px', width: '30px', marginRight: '8px' }}
                                />
                              )}
                              <Typography>{`${normalizedSymbol}`}</Typography>
                            </>
                          ) : (
                            <>
                              {!inProgress && (
                                <Tooltip
                                  arrow
                                  title={
                                    targetWeightEnabled[normalizedSymbol]
                                      ? 'Enabled - Asset will be included in rebalancing'
                                      : 'Disabled - Asset will not be included in rebalancing'
                                  }
                                >
                                  <Checkbox
                                    checked={targetWeightEnabled[normalizedSymbol] || false}
                                    onChange={() => handleCheckboxChange(normalizedSymbol)}
                                  />
                                </Tooltip>
                              )}
                              {isSpot && <Typography>{trimSymbol(assetOrBaseSymbol.symbol)}</Typography>}
                              {isPerp && <Typography>{trimSymbol(assetOrBaseSymbol.symbol)}</Typography>}
                            </>
                          )}
                        </Box>
                      );
                    }
                    if (sortOption === 'assetType') {
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isParent ? (
                            <Typography>{`${normalizedSymbol}`}</Typography>
                          ) : (
                            <>
                              {!inProgress && !notShowCheck && (
                                <Tooltip
                                  arrow
                                  title={
                                    targetWeightEnabled[normalizedSymbol]
                                      ? 'Enabled - Asset will be included in rebalancing'
                                      : 'Disabled - Asset will not be included in rebalancing'
                                  }
                                >
                                  <Checkbox
                                    checked={targetWeightEnabled[normalizedSymbol] || false}
                                    onChange={() => handleCheckboxChange(normalizedSymbol)}
                                  />
                                </Tooltip>
                              )}
                              {isSpot && <Typography>{trimSymbol(assetOrBaseSymbol.symbol)}</Typography>}
                              {isPerp && <Typography>{trimSymbol(assetOrBaseSymbol.symbol)}</Typography>}
                            </>
                          )}
                        </Box>
                      );
                    }
                    return null;
                  }
                  case 'assetType': {
                    return isParent ? (
                      <span />
                    ) : (
                      <span>
                        {isSpot && 'spot'}
                        {isPerp && 'perp'}
                      </span>
                    );
                  }
                  case 'targetWeight':
                    return isParent ? (
                      <>
                        {childSymbols
                          .map((childSymbol) => {
                            const normalizedChildSymbol = childSymbol.replace(/-USDT|-USDC|-USD$/, '');
                            if (
                              targetWeights[normalizedChildSymbol] &&
                              typeof targetWeights[normalizedChildSymbol] === 'number'
                            ) {
                              return targetWeights[normalizedChildSymbol];
                            }
                            return 0;
                          })
                          .reduce((sum, weight) => sum + weight, 0)
                          .toFixed(2)}
                      </>
                    ) : (
                      getTargetWeightInputWithButtons(assetOrBaseSymbol)
                    );
                  case 'currentWeight': {
                    if (isParent) {
                      const displayValue = Math.abs(parentCalculations.currentWeight).toFixed(2);
                      return `${displayValue}%`;
                    }
                    if (childCalculations && childCalculations.length > 0) {
                      let searchSymbol = normalizedSymbol;
                      if (normalizedSymbol.includes(':PERP')) {
                        searchSymbol = `${normalizedSymbol}-${counterAsset}`;
                      }
                      const calculation = childCalculations.find((calc) => calc.tableSymbol === searchSymbol);
                      if (calculation) {
                        const currentWeight = parseFloat(calculation.currentWeight).toFixed(2);
                        return `${currentWeight}%`;
                      }
                    }
                    return '0.00%';
                  }
                  case 'diff': {
                    if (isParent) {
                      const totalTargetWeight = childSymbols
                        .map((childSymbol) => {
                          const normalizedChildSymbol = childSymbol.replace(/-USDT|-USDC|-USD$/, '');
                          const targetWeight = targetWeights[normalizedChildSymbol];
                          return typeof targetWeight === 'number' ? targetWeight : 0;
                        })
                        .reduce((sum, weight) => sum + weight, 0);
                      const displayValue =
                        totalTargetWeight === 0 ? '0.00' : Math.abs(parentCalculations.diff).toFixed(2);
                      if (displayValue === '0.00') {
                        parentDiffStyle.color = theme.palette.text.primary;
                      } else if (parentCalculations.diff > 0) {
                        parentDiffStyle.color = theme.palette.semantic.success;
                      } else if (parentCalculations.diff < 0) {
                        parentDiffStyle.color = theme.palette.semantic.error;
                      }
                      return <span style={parentDiffStyle}>{displayValue}%</span>;
                    }
                    const displayValue = Math.abs(diff).toFixed(2);
                    return <span style={diffStyle}>{displayValue}%</span>;
                  }
                  case 'currentNotional': {
                    if (sortOption === 'underlying') {
                      if (isParent) {
                        const currentNotionalValue = Math.abs(parentCalculations.currentNotional).toFixed(2);
                        const currentQuantityValue = Math.abs(parentCalculations.currentQuantity).toFixed(2);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{`${currentNotionalValue} ${counterAsset}`}</span>
                            <span
                              style={{ fontSize: '0.85em', color: 'text.secondary' }}
                            >{`≈ ${currentQuantityValue} ${normalizedSymbol}`}</span>
                          </div>
                        );
                      }
                    }
                    if (sortOption === 'assetType') {
                      if (isParent) {
                        const currentNotionalValue = Math.abs(parentCalculations.currentNotional).toFixed(2);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{`${currentNotionalValue} ${counterAsset}`}</span>
                          </div>
                        );
                      }
                    }
                    if (childCalculations && childCalculations.length > 0) {
                      let searchSymbol = normalizedSymbol;
                      if (normalizedSymbol.includes(':PERP')) {
                        searchSymbol = `${normalizedSymbol}-${counterAsset}`;
                      }
                      const calculation = childCalculations.find((calc) => calc.tableSymbol === searchSymbol);
                      if (calculation) {
                        const currentNotional = parseFloat(calculation.currentNotional).toFixed(2);
                        const currentQuantity = parseFloat(calculation.currentQuantity).toFixed(2);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{`${currentNotional} ${counterAsset}`}</span>
                            <span
                              style={{ fontSize: '0.85em', color: 'text.secondary' }}
                            >{`≈ ${currentQuantity} ${normalizedSymbol}`}</span>
                          </div>
                        );
                      }
                    }
                    return '0.00';
                  }
                  case 'targetNotional': {
                    if (sortOption === 'underlying') {
                      if (isParent) {
                        const targetNotionalValue = Math.abs(parentCalculations.targetNotional).toFixed(2);
                        const targetQuantityValue = Math.abs(parentCalculations.targetQuantity).toFixed(2);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{`${targetNotionalValue} ${counterAsset}`}</span>
                            <span
                              style={{ fontSize: '0.85em', color: 'text.secondary' }}
                            >{`≈ ${targetQuantityValue} ${normalizedSymbol}`}</span>
                          </div>
                        );
                      }
                    }
                    if (sortOption === 'assetType') {
                      if (isParent) {
                        const targetNotionalValue = Math.abs(parentCalculations.targetNotional).toFixed(2);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{`${targetNotionalValue} ${counterAsset}`}</span>
                          </div>
                        );
                      }
                    }
                    if (childCalculations && childCalculations.length > 0) {
                      let searchSymbol = normalizedSymbol;
                      if (normalizedSymbol.includes(':PERP')) {
                        searchSymbol = `${normalizedSymbol}-${counterAsset}`;
                      }
                      const calculation = childCalculations.find((calc) => calc.tableSymbol === searchSymbol);
                      if (calculation) {
                        const targetNotional = parseFloat(calculation.targetNotional).toFixed(2);
                        const targetQuantity = parseFloat(calculation.targetQuantity).toFixed(2);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{`${targetNotional} ${counterAsset}`}</span>
                            <span
                              style={{ fontSize: '0.85em', color: 'text.secondary' }}
                            >{`≈ ${targetQuantity} ${normalizedSymbol}`}</span>
                          </div>
                        );
                      }
                    }
                    return '0.00';
                  }
                  case 'proposedTradeNotional': {
                    if (isParent) {
                      const displayValue = parentCalculations.proposedTradeNotional.toFixed(2);
                      return `${displayValue} ${counterAsset}`;
                    }
                    if (childCalculations && childCalculations.length > 0) {
                      let searchSymbol = normalizedSymbol;
                      if (normalizedSymbol.includes(':PERP')) {
                        searchSymbol = `${normalizedSymbol}-${counterAsset}`;
                      }
                      const matchedCalculation = childCalculations.find((calc) => calc.tableSymbol === searchSymbol);
                      if (matchedCalculation) {
                        const proposedTradeNotional = parseFloat(matchedCalculation.proposedTradeNotional).toFixed(2);
                        return `${proposedTradeNotional} ${counterAsset}`;
                      }
                    }
                    return '0.00';
                  }
                  case 'proposedTradeQuantity': {
                    if (sortOption === 'underlying') {
                      if (isParent) {
                        const displayValue = parentCalculations.proposedTradeQuantity.toFixed(2);
                        return `${displayValue} ${normalizedSymbol}`;
                      }
                    }
                    if (sortOption === 'assetType') {
                      if (isParent) {
                        return ``;
                      }
                    }
                    if (childCalculations && childCalculations.length > 0) {
                      let searchSymbol = normalizedSymbol;
                      if (normalizedSymbol.includes(':PERP')) {
                        searchSymbol = `${normalizedSymbol}-${counterAsset}`;
                      }
                      const calculation = childCalculations.find((calc) => calc.tableSymbol === searchSymbol);
                      if (calculation) {
                        const proposedTradeQuantity = parseFloat(calculation.proposedTradeQuantity).toFixed(2);
                        return `${proposedTradeQuantity} ${normalizedSymbol}`;
                      }
                    }
                    return '0.00';
                  }
                  default:
                    return assetOrBaseSymbol[column.id] || 0;
                }
              };
              const handleRowClick = (parentSymbol) => {
                setExpandedRows((prevState) => ({
                  ...prevState,
                  [parentSymbol]: !prevState[parentSymbol],
                }));
              };

              const renderTableRow = (type, assetOrBaseSymbol, calculations, diffStyle) => {
                const isParent = type === 'parent';
                const showDeleteButton =
                  !isParent &&
                  sortOption === 'assetType' &&
                  SymbolOurAssets.some((a) => a.symbol === assetOrBaseSymbol.symbol);
                return (
                  <TableRow
                    key={isParent ? assetOrBaseSymbol : assetOrBaseSymbol.symbol}
                    style={{
                      cursor: isParent ? 'pointer' : 'default',
                      backgroundColor: isParent ? 'ui.inputBackground' : undefined,
                    }}
                    onClick={isParent ? () => handleRowClick(assetOrBaseSymbol) : undefined}
                  >
                    {RebalanceAssetsColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: column.align }}
                      >
                        {renderTableCellContent(column, assetOrBaseSymbol, calculations.diff, diffStyle, isParent)}
                      </TableCell>
                    ))}
                    {!isParent && showDeleteButton && (
                      <TableCell
                        sx={{
                          textAlign: 'center',
                          padding: '4px',
                        }}
                      >
                        <IconButton
                          color='error'
                          size='small'
                          onClick={() => handleRemoveRow(assetOrBaseSymbol.symbol)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              };
              return (
                <React.Fragment key={parentKey}>
                  {(() => {
                    if (sortOption === 'underlying') {
                      const normalizedParentKey = parentKey.includes(':PERP') ? parentKey : `${parentKey}:PERP`;
                      const isParentPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === normalizedParentKey);
                      const isParentSpot = formattedSpotAssetPairs.some((pair) => pair.symbol === parentKey);
                      if (!isParentPerp && !isParentSpot) {
                        return null;
                      }
                      return renderTableRow('parent', parentKey, parentCalculations, parentDiffStyle);
                    }
                    if (sortOption === 'assetType') {
                      return renderTableRow('parent', parentKey, parentCalculations, parentDiffStyle);
                    }
                    return null;
                  })()}
                  {expandedRows[parentKey] &&
                    childSymbols.map((symbol) => {
                      const normalizedSymbol = symbol.includes(':PERP')
                        ? symbol.replace(/-USDT|-USDC|-USD$/, '-USDT')
                        : symbol.replace(/-USDT|-USDC|-USD$/, '');
                      let asset;
                      if (sortOption === 'underlying') {
                        asset = [...filteredCombinedAssets, ...filteredInprogressAssets].find(
                          (a) => a.symbol === normalizedSymbol
                        );
                      } else if (sortOption === 'assetType') {
                        asset =
                          [...filteredCombinedAssets, ...filteredInprogressAssets].find(
                            (a) => a.symbol === normalizedSymbol
                          ) || SymbolOurAssets.find((a) => a.symbol === symbol);
                      }
                      if (!asset) {
                        return null;
                      }
                      const {
                        currentPrice,
                        currentWeight,
                        targetNotional,
                        currentNotional,
                        proposedTradeNotional,
                        proposedTradeQuantity,
                        diff,
                        targetQuantity,
                        currentQuantity,
                      } = handleRowCalculations(asset, currentPrices, BalanceNotional);

                      const childDiffStyle = {};
                      if (diff > 0) {
                        childDiffStyle.color = theme.palette.semantic.success;
                      } else if (diff < 0) {
                        childDiffStyle.color = theme.palette.semantic.error;
                      }

                      const childCalculations = {
                        currentPrice,
                        currentWeight: parseFloat(currentWeight),
                        targetNotional,
                        currentNotional,
                        proposedTradeNotional,
                        proposedTradeQuantity,
                        diff,
                        targetQuantity,
                        currentQuantity,
                      };

                      return renderTableRow('child', asset, childCalculations, childDiffStyle);
                    })}
                </React.Fragment>
              );
            })}
            {!inProgress &&
              Object.entries(groupedUnderlyingOurAssets).map(([baseSymbol, childSymbols]) => {
                const childCalculations = childSymbols.map((symbol) => {
                  let asset;
                  if (sortOption === 'underlying') {
                    asset = SymbolOurAssets.find((a) => a.symbol === symbol);
                  }
                  if (!asset) {
                    return {
                      currentPrice: 0,
                      currentWeight: 0,
                      targetNotional: 0,
                      currentNotional: 0,
                      proposedTradeNotional: 0,
                      proposedTradeQuantity: 0,
                      diff: 0,
                      targetQuantity: 0,
                      currentQuantity: 0,
                    };
                  }

                  const {
                    currentPrice,
                    currentWeight,
                    targetNotional,
                    currentNotional,
                    proposedTradeNotional,
                    proposedTradeQuantity,
                    diff,
                    targetQuantity,
                    currentQuantity,
                  } = handleRowCalculations(asset, currentPrices, BalanceNotional);

                  return {
                    currentPrice,
                    currentWeight,
                    targetNotional,
                    currentNotional,
                    targetQuantity,
                    currentQuantity,
                    proposedTradeNotional,
                    proposedTradeQuantity,
                    diff,
                  };
                });

                const parentCalculations = childCalculations.reduce(
                  (totals, child) => ({
                    currentPrice: totals.currentPrice + (Number(child.currentPrice) || 0),
                    currentWeight: totals.currentWeight + (Number(child.currentWeight) || 0),
                    targetNotional: totals.targetNotional + (Number(child.targetNotional) || 0),
                    currentNotional: totals.currentNotional + (Number(child.currentNotional) || 0),
                    targetQuantity: totals.targetQuantity + (Number(child.targetQuantity) || 0),
                    currentQuantity: totals.currentQuantity + (Number(child.currentQuantity) || 0),
                    proposedTradeNotional: totals.proposedTradeNotional + (Number(child.proposedTradeNotional) || 0),
                    proposedTradeQuantity: totals.proposedTradeQuantity + (Number(child.proposedTradeQuantity) || 0),
                    diff: 0,
                  }),
                  {
                    currentPrice: 0,
                    currentWeight: 0,
                    targetNotional: 0,
                    currentNotional: 0,
                    targetQuantity: 0,
                    currentQuantity: 0,
                    proposedTradeNotional: 0,
                    proposedTradeQuantity: 0,
                    diff: 0,
                  }
                );

                let parentDiff;
                const targetWeight = parseFloat(parentCalculations.targetWeight) || 0;
                const targetNotional = parseFloat(parentCalculations.targetNotional) || 0;
                const currentNotional = parseFloat(parentCalculations.currentNotional) || 1;
                if (!currentNotional || Number.isNaN(currentNotional)) {
                  parentDiff = targetWeight.toFixed(2);
                } else {
                  parentDiff = ((targetNotional / currentNotional - 1) * 100).toFixed(2);
                }
                parentCalculations.diff = parentDiff === '-0.00' ? '0.00' : parentDiff;

                const parentDiffStyle = {};
                if (parentCalculations.diff > 0) {
                  parentDiffStyle.color = theme.palette.semantic.success;
                } else if (parentCalculations.diff < 0) {
                  parentDiffStyle.color = theme.palette.semantic.error;
                }

                const getTargetWeightInputWithButtons = (asset) => {
                  const symbolOrPair = asset.symbol ? trimSymbol(asset.symbol) : asset.pair;
                  const positionType =
                    positionTypes[symbolOrPair] || (targetWeights[symbolOrPair] < 0 ? 'short' : 'long');
                  const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === symbolOrPair);
                  const isSpot = formattedSpotAssetPairs.some((pair) => pair.symbol === symbolOrPair);

                  const handlePositionTypeChange = (type) => {
                    setPositionTypes((prev) => ({
                      ...prev,
                      [symbolOrPair]: type,
                    }));
                    const currentWeight = parseFloat(targetWeights[symbolOrPair] || 0);
                    const adjustedWeight = type === 'long' ? Math.abs(currentWeight) : -Math.abs(currentWeight);
                    setTargetWeights((prev) => ({
                      ...prev,
                      [symbolOrPair]: adjustedWeight,
                    }));
                  };

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        autoComplete='off'
                        disabled={inProgress || isScheduled || isStarting}
                        inputProps={{
                          inputMode: 'numeric',
                          pattern: '[0-9]*',
                          min: 0,
                          max: 100,
                          style: {
                            backgroundColor: 'ui.inputBackground',
                            color: 'text.primary',
                            padding: '5px',
                          },
                        }}
                        type='text'
                        value={
                          targetWeights[symbolOrPair] === undefined || targetWeights[symbolOrPair] === ''
                            ? ''
                            : Math.abs(targetWeights[symbolOrPair])
                        }
                        onChange={(e) => handleInputChange(symbolOrPair, e)}
                      />
                      {isPerp && (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginLeft: '15px',
                            marginRight: '-10px',
                          }}
                        >
                          <Tooltip title='Set position to Long'>
                            <span>
                              <Button
                                color='success'
                                disabled={inProgress || isScheduled || isStarting}
                                size='small'
                                sx={{
                                  minWidth: '24px',
                                  height: '24px',
                                  padding: '2px',
                                  fontSize: '12px',
                                }}
                                variant={positionType === 'long' ? 'contained' : 'outlined'}
                                onClick={() => handlePositionTypeChange('long')}
                              >
                                <TrendingUpIcon fontSize='inherit' />
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip title='Set position to Short'>
                            <span>
                              <Button
                                color='error'
                                disabled={inProgress || isScheduled || isStarting}
                                size='small'
                                sx={{
                                  marginTop: '3px',
                                  minWidth: '24px',
                                  height: '24px',
                                  padding: '2px',
                                  fontSize: '12px',
                                }}
                                variant={positionType === 'short' ? 'contained' : 'outlined'}
                                onClick={() => handlePositionTypeChange('short')}
                              >
                                <TrendingDownIcon fontSize='inherit' />
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  );
                };
                const renderTableCellContent = (
                  column,
                  assetOrBaseSymbol,
                  diff,
                  diffStyle,
                  isParent = false,
                  childCalculation = null
                ) => {
                  const normalizedSymbol = isParent
                    ? assetOrBaseSymbol
                    : assetOrBaseSymbol.symbol.replace(/-USDT|-USDC|-USD$/, '');

                  const isPerp = !isParent && formattedPerpAssetPairs.some((pair) => pair.symbol === normalizedSymbol);
                  const isSpot = !isParent && formattedSpotAssetPairs.some((pair) => pair.symbol === normalizedSymbol);
                  switch (column.id) {
                    case 'underlying': {
                      if (sortOption === 'underlying') {
                        const tokenIcon = isParent ? getBaseTokenIcon(getUnderlying(normalizedSymbol)) : null;
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isParent && tokenIcon && (
                              <img
                                alt={`${normalizedSymbol} Icon`}
                                src={tokenIcon}
                                style={{ height: '30px', width: '30px', marginRight: '8px' }}
                              />
                            )}
                            <Typography>
                              {isParent ? `${normalizedSymbol}` : trimSymbol(assetOrBaseSymbol.symbol)}
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    }
                    case 'assetType': {
                      return isParent ? (
                        <span />
                      ) : (
                        <span>
                          {isSpot && 'spot'}
                          {isPerp && 'perp'}
                        </span>
                      );
                    }
                    case 'targetWeight':
                      return isParent ? (
                        <>
                          {childSymbols
                            .map((childSymbol) => {
                              const normalizedChildSymbol = childSymbol.replace(/-USDT|-USDC|-USD$/, '');
                              if (
                                targetWeights[normalizedChildSymbol] &&
                                typeof targetWeights[normalizedChildSymbol] === 'number'
                              ) {
                                return targetWeights[normalizedChildSymbol];
                              }
                              return 0;
                            })
                            .reduce((sum, weight) => sum + weight, 0)
                            .toFixed(2)}
                        </>
                      ) : (
                        getTargetWeightInputWithButtons(assetOrBaseSymbol)
                      );
                    case 'currentWeight': {
                      if (isParent) {
                        const displayValue = Math.abs(parentCalculations.currentWeight).toFixed(2);
                        return `${displayValue}%`;
                      }
                      if (sortOption === 'underlying') {
                        if (childCalculations && childCalculations.length > 0) {
                          const spotCalculation = childCalculations[0];
                          const spotWeight = spotCalculation
                            ? parseFloat(spotCalculation.currentWeight).toFixed(2)
                            : '0.00';
                          const perpCalculation = childCalculations[1];
                          const perpWeight = perpCalculation
                            ? parseFloat(perpCalculation.currentWeight).toFixed(2)
                            : '0.00';
                          if (normalizedSymbol.includes(':PERP')) {
                            return `${perpWeight}%`;
                          }
                          return `${spotWeight}%`;
                        }
                      }
                      return '0.00%';
                    }
                    case 'diff': {
                      if (isParent) {
                        const totalTargetWeight = childSymbols
                          .map((childSymbol) => {
                            const normalizedChildSymbol = childSymbol.replace(/-USDT|-USDC|-USD$/, '');
                            const targetWeight = targetWeights[normalizedChildSymbol];
                            return typeof targetWeight === 'number' ? targetWeight : 0;
                          })
                          .reduce((sum, weight) => sum + weight, 0);
                        const displayValue =
                          totalTargetWeight === 0 ? '0.00' : Math.abs(parentCalculations.diff).toFixed(2);
                        if (displayValue === '0.00') {
                          parentDiffStyle.color = theme.palette.text.primary;
                        } else if (parentCalculations.diff > 0) {
                          parentDiffStyle.color = theme.palette.semantic.success;
                        } else if (parentCalculations.diff < 0) {
                          parentDiffStyle.color = theme.palette.semantic.error;
                        }
                        return <span style={parentDiffStyle}>{displayValue}%</span>;
                      }
                      const displayValue = Math.abs(diff).toFixed(2);
                      return <span style={diffStyle}>{displayValue}%</span>;
                    }
                    case 'currentNotional': {
                      if (sortOption === 'underlying') {
                        if (isParent) {
                          const currentNotionalValue = Math.abs(parentCalculations.currentNotional).toFixed(2);
                          const currentQuantityValue = Math.abs(parentCalculations.currentQuantity).toFixed(2);
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span>{`${currentNotionalValue} ${counterAsset}`}</span>
                              <span
                                style={{ fontSize: '0.85em', color: 'text.secondary' }}
                              >{`≈ ${currentQuantityValue} ${normalizedSymbol}`}</span>
                            </div>
                          );
                        }
                      }
                      if (sortOption === 'underlying') {
                        if (childCalculations && childCalculations.length > 0) {
                          const spotCalculation = childCalculations[0];
                          const perpCalculation = childCalculations[1];

                          const spotNotional = spotCalculation
                            ? parseFloat(spotCalculation.currentNotional).toFixed(2)
                            : '0.00';
                          const spotQuantity = spotCalculation
                            ? parseFloat(spotCalculation.currentQuantity).toFixed(2)
                            : '0.00';

                          const perpNotional = perpCalculation
                            ? parseFloat(perpCalculation.currentNotional).toFixed(2)
                            : '0.00';
                          const perpQuantity = perpCalculation
                            ? parseFloat(perpCalculation.currentQuantity).toFixed(2)
                            : '0.00';

                          if (normalizedSymbol.includes(':PERP')) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span>{`${perpNotional} ${counterAsset}`}</span>
                                <span
                                  style={{ fontSize: '0.85em', color: 'text.secondary' }}
                                >{`≈ ${perpQuantity} ${normalizedSymbol}`}</span>
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span>{`${spotNotional} ${counterAsset}`}</span>
                              <span
                                style={{ fontSize: '0.85em', color: 'text.secondary' }}
                              >{`≈ ${spotQuantity} ${normalizedSymbol}`}</span>
                            </div>
                          );
                        }
                      }
                      return '0.00';
                    }
                    case 'targetNotional': {
                      if (sortOption === 'underlying') {
                        if (isParent) {
                          const targetNotionalValue = Math.abs(parentCalculations.targetNotional).toFixed(2);
                          const targetQuantityValue = Math.abs(parentCalculations.targetQuantity).toFixed(2);
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span>{`${targetNotionalValue} ${counterAsset}`}</span>
                              <span
                                style={{ fontSize: '0.85em', color: 'text.secondary' }}
                              >{`≈ ${targetQuantityValue} ${normalizedSymbol}`}</span>
                            </div>
                          );
                        }
                      }
                      if (sortOption === 'underlying') {
                        if (childCalculations && childCalculations.length > 0) {
                          const spotCalculation = childCalculations[0];
                          const perpCalculation = childCalculations[1];

                          const spotNotional = spotCalculation
                            ? parseFloat(spotCalculation.targetNotional).toFixed(2)
                            : '0.00';
                          const spotQuantity = spotCalculation
                            ? parseFloat(spotCalculation.targetQuantity).toFixed(2)
                            : '0.00';

                          const perpNotional = perpCalculation
                            ? parseFloat(perpCalculation.targetNotional).toFixed(2)
                            : '0.00';
                          const perpQuantity = perpCalculation
                            ? parseFloat(perpCalculation.targetQuantity).toFixed(2)
                            : '0.00';

                          if (normalizedSymbol.includes(':PERP')) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span>{`${perpNotional} ${counterAsset}`}</span>
                                <span
                                  style={{ fontSize: '0.85em', color: 'text.secondary' }}
                                >{`≈ ${perpQuantity} ${normalizedSymbol}`}</span>
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span>{`${spotNotional} ${counterAsset}`}</span>
                              <span
                                style={{ fontSize: '0.85em', color: 'text.secondary' }}
                              >{`≈ ${spotQuantity} ${normalizedSymbol}`}</span>
                            </div>
                          );
                        }
                      }
                      return '0.00';
                    }
                    case 'proposedTradeNotional': {
                      if (isParent) {
                        const displayValue = parentCalculations.proposedTradeNotional.toFixed(2);
                        return `${displayValue} ${counterAsset}`;
                      }
                      if (sortOption === 'underlying') {
                        if (childCalculations && childCalculations.length > 0) {
                          const spotCalculation = childCalculations[0];
                          const spotProposedTradeNotional = spotCalculation
                            ? parseFloat(spotCalculation.proposedTradeNotional).toFixed(2)
                            : '0.00';
                          const perpCalculation = childCalculations[1];
                          const perpProposedTradeNotional = perpCalculation
                            ? parseFloat(perpCalculation.proposedTradeNotional).toFixed(2)
                            : '0.00';
                          if (normalizedSymbol.includes(':PERP')) {
                            return `${perpProposedTradeNotional} ${counterAsset}`;
                          }
                          return `${spotProposedTradeNotional} ${counterAsset}`;
                        }
                      }
                      return '0.00';
                    }
                    case 'proposedTradeQuantity': {
                      if (sortOption === 'underlying') {
                        if (isParent) {
                          const displayValue = parentCalculations.proposedTradeQuantity.toFixed(2);
                          return `${displayValue} ${normalizedSymbol}`;
                        }
                      }
                      if (sortOption === 'underlying') {
                        if (childCalculations && childCalculations.length > 0) {
                          const spotCalculation = childCalculations[0];
                          const spotProposedTradeQuantity = spotCalculation
                            ? parseFloat(spotCalculation.proposedTradeQuantity).toFixed(2)
                            : '0.00';
                          const perpCalculation = childCalculations[1];
                          const perpProposedTradeQuantity = perpCalculation
                            ? parseFloat(perpCalculation.proposedTradeQuantity).toFixed(2)
                            : '0.00';
                          if (normalizedSymbol.includes(':PERP')) {
                            return `${perpProposedTradeQuantity} ${normalizedSymbol}`;
                          }
                          return `${spotProposedTradeQuantity} ${normalizedSymbol}`;
                        }
                      }
                      return '0.00';
                    }
                    default:
                      return assetOrBaseSymbol[column.id] || 0;
                  }
                };
                const handleRowClick = (parentSymbol) => {
                  setExpandedRows((prevState) => {
                    const newState = {
                      ...prevState,
                      [parentSymbol]: !prevState[parentSymbol],
                    };
                    return newState;
                  });
                };
                if (sortOption === 'underlying') {
                  const renderTableRow = (type, assetOrBaseSymbol, calculations, diffStyle) => {
                    const isParent = type === 'parent';
                    return (
                      <TableRow
                        key={isParent ? assetOrBaseSymbol : assetOrBaseSymbol.symbol}
                        style={{
                          cursor: isParent ? 'pointer' : 'default',
                          backgroundColor: isParent ? 'ui.inputBackground' : undefined,
                        }}
                        onClick={isParent ? () => handleRowClick(assetOrBaseSymbol) : undefined}
                      >
                        {RebalanceAssetsColumns.map((column) => (
                          <TableCell
                            key={column.id}
                            sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: column.align }}
                          >
                            {renderTableCellContent(column, assetOrBaseSymbol, calculations.diff, diffStyle, isParent)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  };

                  return (
                    <React.Fragment key={baseSymbol}>
                      {renderTableRow('parent', baseSymbol, parentCalculations, parentDiffStyle)}
                      {expandedRows[baseSymbol] &&
                        childSymbols.map((symbol) => {
                          const asset = SymbolOurAssets.find((a) => a.symbol === symbol);

                          if (!asset) {
                            return null;
                          }

                          const {
                            currentPrice,
                            currentWeight,
                            targetNotional,
                            currentNotional,
                            proposedTradeNotional,
                            proposedTradeQuantity,
                            diff,
                            targetQuantity,
                            currentQuantity,
                          } = handleRowCalculations(asset, currentPrices, BalanceNotional);

                          const childDiffStyle = {};
                          if (diff > 0) {
                            childDiffStyle.color = theme.palette.semantic.success;
                          } else if (diff < 0) {
                            childDiffStyle.color = theme.palette.semantic.error;
                          }

                          const childCalculations = {
                            currentPrice,
                            currentWeight: parseFloat(currentWeight),
                            targetNotional,
                            currentNotional,
                            proposedTradeNotional,
                            proposedTradeQuantity,
                            diff,
                            targetQuantity,
                            currentQuantity,
                          };
                          return (
                            <TableRow key={symbol}>
                              {RebalanceAssetsColumns.map((column) => (
                                <TableCell
                                  key={column.id}
                                  sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: column.align }}
                                >
                                  {renderTableCellContent(column, asset, childCalculations.diff, childDiffStyle)}
                                </TableCell>
                              ))}
                              <TableCell
                                sx={{
                                  textAlign: 'center',
                                  padding: '4px',
                                }}
                              >
                                <IconButton color='error' size='small' onClick={() => handleRemoveRow(symbol)}>
                                  <Delete />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </React.Fragment>
                  );
                }
                return null;
              })}
            {showCashRow && (
              <TableRow>
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {counterAsset && (
                      <img
                        alt={`${counterAsset} Icon`}
                        src={getBaseTokenIcon(counterAsset)}
                        style={{ height: '20px', width: '20px', marginRight: '8px' }}
                      />
                    )}
                    <Typography>Cash {counterAsset}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }} />
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                  {cashTargetWeight}%
                </TableCell>
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }} />
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                  {cashTargetNotional.toFixed(2)} {counterAsset}
                </TableCell>
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                  {cashCurrntNotional.toFixed(2)} {counterAsset}
                </TableCell>
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                  {-formattedTotalProposedTradeNotional} {counterAsset}
                </TableCell>
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }} />
                <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }} />
              </TableRow>
            )}
            <TableRow>
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'left' }}>
                Total
              </TableCell>
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }} />
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                {showCashRow
                  ? `${(parseFloat(totalTargetWeight) + parseFloat(cashTargetWeight)).toFixed(2)}%`
                  : `${parseFloat(totalTargetWeight).toFixed(2)}%`}
              </TableCell>
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                {totalCurrentWeight}%
              </TableCell>
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                {totalTargetNotional} {counterAsset}
              </TableCell>
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                {totalCurrentNotional.toFixed(2)} {counterAsset}
              </TableCell>
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                {formattedTotalProposedTradeNotional} {counterAsset}
              </TableCell>
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }} />
              <TableCell sx={{ color: 'text.primary', border: '1px solid ui.border', textAlign: 'right' }}>
                <span style={{ color: getFormattedTotalDiffColor(formattedTotalDiff) }}>{formattedTotalDiff}%</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!inProgress && !isScheduled && (
            <>
              <Tooltip arrow title='Click to add a new asset row for rebalancing'>
                <Button
                  color='primary'
                  disabled={inProgress || isScheduled || isStarting}
                  sx={{ marginBottom: '10px' }}
                  variant='outlined'
                  onClick={handleAddRow}
                >
                  + Add new assets
                </Button>
              </Tooltip>
              <AccountRebalanceDoughnut
                assetsToUse={assetsToUse}
                cashCurrntNotional={cashCurrntNotional}
                cashTargetWeight={cashTargetWeight}
                counterAsset={counterAsset}
                selectedAccount={selectedAccount}
                setShowCashRow={setShowCashRow}
                showCashRow={showCashRow}
                targetWeights={targetWeights}
              />
              <Box
                sx={{
                  width: '100%',
                  marginTop: '10px',
                  marginBottom: '20px',
                }}
              />
              {showPairSelectorModal && (
                <Modal
                  aria-describedby='pair-selector-modal-description'
                  aria-labelledby='pair-selector-modal'
                  open={showPairSelectorModal}
                  onClose={() => {
                    setShowPairSelectorModal(false);
                    setNewRowIndex(null);
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[700],
                      padding: '20px',
                      borderRadius: '5px',
                      margin: 'auto',
                      marginTop: '10%',
                      width: '400px',
                    }}
                  >
                    <Typography id='pair-selector-modal' sx={{ color: 'text.primary' }} variant='h6'>
                      Select a Pair
                    </Typography>
                    <PairSelector
                      multiOrder
                      accounts={transformedAccountData}
                      balances={transformedBalanceData}
                      favourites={favouritePairs}
                      pairs={remainingTokenPairs}
                      selectedAccounts={selectedAccountData.map((acc) => acc.account_name)}
                      selectedPairName=''
                      setFavourites={setFavouritePairs}
                      setSelectedPair={(pair) => handlePairChange(newRowIndex, pair.label)}
                      showAlert={showAlert}
                    />
                  </Box>
                </Modal>
              )}
            </>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          <Box>
            <Typography
              sx={{
                color: 'text.primary',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '10px',
              }}
              variant='body2'
            >
              2. Rebalance amount
            </Typography>
            <TextField
              autoComplete='off'
              disabled={inProgress || isScheduled || isStarting}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                min: 0,
                style: {
                  backgroundColor: theme.palette.grey[750],
                  color: 'text.primary',
                  padding: '10px',
                },
              }}
              // eslint-disable-next-line react/jsx-no-duplicate-props
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <FormControl>
                      <Select
                        disabled={inProgress || isScheduled || isStarting}
                        sx={{
                          color: 'text.primary',
                          '.MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                          '.MuiSelect-select': {
                            padding: 0,
                          },
                        }}
                        value={counterAsset}
                        onChange={(e) => setCounterAsset(e.target.value)}
                      >
                        <MenuItem value='USDT'>USDT</MenuItem>
                        <MenuItem value='USD'>USD</MenuItem>
                        <MenuItem value='USDC'>USDC</MenuItem>
                      </Select>
                    </FormControl>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '100%',
                maxWidth: '250px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: theme.palette.grey[750],
                },
              }}
              type='text'
              value={BalanceNotional}
              onChange={handleBalanceNotionalChange}
            />
            <Box sx={{ marginTop: '10px' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
                Available: {msAndKs(truncate(getAssetQuantityForCounterAsset()), 2)} {counterAsset}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
                Total Balance: {totalCurrentNotionalAllFormatted} {counterAsset}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <Typography
              sx={{
                color: 'text.primary',
                fontSize: '12px',
                fontWeight: 600,
              }}
              variant='body2'
            >
              4. Tolerance and Duration
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TextField
                autoComplete='off'
                disabled={inProgress || isScheduled || isStarting}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  min: 0,
                  style: {
                    backgroundColor: theme.palette.grey[750],
                    color: 'text.primary',
                    padding: '4px 6px',
                    fontSize: '12px',
                  },
                }}
                label='Tolerance (%)'
                sx={{
                  width: '100px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    backgroundColor: theme.palette.grey[750],
                    height: '30px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '10px',
                    top: '-5px',
                  },
                }}
                type='text'
                value={tolerance}
                onChange={!inProgress || !isScheduled || !isStarting ? handleToleranceChange : null}
              />
              {[1, 3, 5].map((value) => (
                <Box
                  key={value}
                  sx={{
                    width: '40px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: tolerance === value ? theme.palette.grey[600] : theme.palette.grey[750],
                    color: tolerance === value ? theme.palette.common.pureWhite : theme.palette.grey[400],
                    border:
                      tolerance === value
                        ? `1px solid ${theme.palette.common.pureWhite}`
                        : `1px solid ${theme.palette.grey[600]}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: inProgress || isScheduled ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: !inProgress && !isScheduled && !isStarting ? theme.palette.grey[700] : undefined,
                    },
                  }}
                  onClick={() => !inProgress && !isScheduled && !isStarting && setTolerance(value)}
                >
                  {value}%
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TextField
                autoComplete='off'
                disabled={inProgress || isScheduled || isStarting}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  min: 0,
                  style: {
                    backgroundColor: theme.palette.grey[750],
                    color: 'text.primary',
                    padding: '4px 6px',
                    fontSize: '12px',
                  },
                }}
                label={
                  <Tooltip title='The length of time an order is active for'>
                    <a
                      href='https://tread-labs.gitbook.io/api-docs/submitting-orders'
                      rel='noopener noreferrer'
                      style={{ textDecoration: 'underline dotted', color: 'inherit' }}
                      target='_blank'
                    >
                      Duration (mins)
                    </a>
                  </Tooltip>
                }
                sx={{
                  width: '100px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    backgroundColor: theme.palette.grey[750],
                    height: '30px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '10px',
                    top: '-5px',
                  },
                }}
                type='text'
                value={selectedDuration}
                onChange={
                  !inProgress && !isScheduled
                    ? (e) => {
                        const inputValue = e.target.value.trim();
                        const parsedValue = parseInt(inputValue, 10);

                        if (inputValue === '' || Number.isNaN(parsedValue)) {
                          setSelectedDuration(0);
                        } else {
                          setSelectedDuration(parsedValue);
                        }
                      }
                    : null
                }
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
export default AccountRebalanceTable;
