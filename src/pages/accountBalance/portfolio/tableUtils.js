import { formatQty, smartRound, titleCase, numberWithCommas } from '@/util';
import { getMarginRatioHexColor, formatMarginRatio } from '@/util/marginRatioUtils';
import { CASH_ASSETS } from '@/constants';

// Grid System - Unified column widths for alignment across all tables
export const GRID_COLUMNS = {
  symbol: { width: '16%', minWidth: 140 },
  quantity: { width: '10%', minWidth: 90 },
  notional: { width: '11%', minWidth: 100 },
  unrealized_pnl: { width: '11%', minWidth: 100 },
  roi: { width: '7%', minWidth: 60 },
  funding_pnl: { width: '11%', minWidth: 100 },
  entry_price: { width: '9%', minWidth: 80 },
  maint_margin: { width: '11%', minWidth: 100 },
  margin_ratio: { width: '9%', minWidth: 80 },
  leverage: { width: '8%', minWidth: 70 },
  share: { width: '3%', minWidth: 30 },
};

// Common column definitions using grid system
export const baseColumns = [
  {
    id: 'symbol',
    label: 'Symbol',
    width: GRID_COLUMNS.symbol.width,
    minWidth: GRID_COLUMNS.symbol.minWidth,
    align: 'left',
  },
  {
    id: 'amount',
    label: 'Quantity',
    width: GRID_COLUMNS.quantity.width,
    minWidth: GRID_COLUMNS.quantity.minWidth,
    align: 'left',
    number: true,
  },
  {
    id: 'notional',
    label: 'Notional',
    width: GRID_COLUMNS.notional.width,
    minWidth: GRID_COLUMNS.notional.minWidth,
    align: 'left',
    number: true
  },
  {
    id: 'share',
    label: '',
    width: GRID_COLUMNS.share.width,
    minWidth: GRID_COLUMNS.share.minWidth,
    align: 'right',
  },
];

// Perp-specific columns
export const perpColumns = [
  ...baseColumns.slice(0, -1), // All base columns except share
  {
    id: 'unrealized_profit',
    label: 'Unrealized PnL',
    width: '12%',
    align: 'left',
    number: true,
  },
  {
    id: 'unrealized_profit_percentage',
    label: 'ROI',
    width: '8%',
    align: 'left',
    number: true,
  },
  {
    id: 'funding_fee',
    label: 'Funding PnL',
    width: '12%',
    align: 'left',
    number: true,
  },
  {
    id: 'entry_price',
    label: 'Entry Price',
    width: '10%',
    align: 'left',
    number: true,
  },
  {
    id: 'maint_margin',
    label: 'Maint Margin',
    width: '12%',
    align: 'left',
    number: true,
  },
  {
    id: 'margin_ratio',
    label: 'Margin Ratio',
    width: '10%',
    align: 'left',
    number: true,
  },
  {
    id: 'leverage',
    label: 'Leverage',
    width: '12%',
    align: 'left',
    number: true,
  },
  baseColumns[baseColumns.length - 1], // Share column
];

// Spot margin columns
export const spotMarginColumns = [
  ...baseColumns.slice(0, -1), // All base columns except share
  {
    id: 'unrealized_profit',
    label: 'Unrealized PnL',
    width: '16%',
    align: 'left',
    number: true,
  },
  {
    id: 'unrealized_profit_percentage',
    label: 'ROI',
    width: '11%',
    align: 'left',
    number: true,
  },
  {
    id: 'maint_margin',
    label: 'Maint Margin',
    width: '16%',
    align: 'left',
    number: true,
  },
  {
    id: 'initial_margin',
    label: 'Initial Margin',
    width: '16%',
    align: 'left',
    number: true,
  },
  baseColumns[baseColumns.length - 1], // Share column
];

// Regular spot columns (no margin)
export const spotColumns = [
  ...baseColumns.slice(0, -1), // All base columns except share
  {
    id: 'unrealized_profit',
    label: 'Unrealized PnL',
    width: '20%',
    align: 'left',
    number: true,
  },
  {
    id: 'unrealized_profit_percentage',
    label: 'ROI',
    width: '15%',
    align: 'left',
    number: true,
  },
  baseColumns[baseColumns.length - 1], // Share column
];

export const optionColumns = [
  ...baseColumns.slice(0, -1),
  {
    id: 'unrealized_profit',
    label: 'Unrealized PnL',
    width: '16%',
    align: 'left',
    number: true,
  },
  baseColumns[baseColumns.length - 1],
];

// Cash columns (no PnL/ROI)
export const cashColumns = [
  ...baseColumns.slice(0, -1), // All base columns except share
  baseColumns[baseColumns.length - 1], // Share column
];

// Utility functions
export const isCashAsset = (symbol) => CASH_ASSETS.includes(symbol);

export const isMarginedAsset = (asset) => {
  const maintMargin = Number(asset.maint_margin) || 0;
  const initialMargin = Number(asset.initial_margin) || 0;
  const marginBalance = Number(asset.margin_balance) || 0;

  return Math.abs(maintMargin) > 0.001 || Math.abs(initialMargin) > 0.001 || Math.abs(marginBalance) > 0.001;
};

export const calculateTotals = (assets, includePnL = true) => {
  // Check if PnL data actually exists in the assets
  const hasPnLData = assets.some(asset =>
    asset.unrealized_profit !== null && asset.unrealized_profit !== undefined ||
    asset.unrealized_profit_percentage !== null && asset.unrealized_profit_percentage !== undefined
  );

  // Only include PnL if explicitly requested AND data exists
  const shouldIncludePnL = includePnL && hasPnLData;

  const totals = assets.reduce(
    (acc, row) => {
      if (!isCashAsset(row.symbol)) {
        if (shouldIncludePnL) {
          acc.unrealized_profit += Number(row.unrealized_profit) || 0;
          acc.funding_fee += Number(row.funding_fee) || 0;
          acc.absNotional += Math.abs(Number(row.notional)) || 0;
        }
      }
      acc.notional += Number(row.notional) || 0;
      return acc;
    },
    { notional: 0, unrealized_profit: 0, funding_fee: 0, absNotional: 0 }
  );

  if (shouldIncludePnL) {
    totals.roi_percentage = totals.absNotional > 0 ? (100 * totals.unrealized_profit) / totals.absNotional : 0;
  }

  return totals;
};

export const filterLowNotional = (assets) => assets.filter((asset) => {
  // Always show assets with borrowed amounts (negative balance)
  if (asset.borrowed && Number(asset.borrowed) > 0) {
    return true;
  }
  // For other assets, only show if notional is significant
  return !asset.notional || Math.abs(asset.notional) >= 0.01;
});

export const getColor = (value, symbol) => {
  if (value > 0) return 'success.main';
  if (value < 0) return 'error.main';
  return 'text.primary';
};

export const formatValue = (value, isDollar = false, isPercentage = false) => {
  if (value === null || value === undefined) {
    return '-';
  }

  // Convert to number and check if it's effectively 0 (including very small values)
  const numValue = Number(value);
  if (Math.abs(numValue) < 0.001) {
    return '-';
  }

  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '+';

  if (isDollar) {
    return `${sign}${formatQty(absValue, true)}`;
  }

  if (isPercentage) {
    return `${sign}${smartRound(absValue, 2)}%`;
  }

  return `${sign}${formatQty(absValue)}`;
};

export const renderWalletLabel = (walletType, exchange, marketType) => {
  if (marketType === 'perp') {
    return '';
  }

  if (!['BinancePM', 'Binance', 'Hyperliquid'].includes(exchange)) {
    return '';
  }

  let type = titleCase(walletType);
  if (walletType === 'perp') type = 'Futures';

  return ` (${type})`;
};

// Helper function to map column IDs to grid keys
const getGridKey = (columnId) => {
  switch (columnId) {
    case 'unrealized_profit':
      return 'unrealized_pnl';
    case 'funding_pnl':
      return 'funding_pnl';
    default:
      return columnId;
  }
};

// Grid-aligned column generation for uniform layout across tables
export const getGridAlignedColumns = (baseType = 'base', includeSpecificColumns = []) => {
  const columns = [];

  // Always include base columns
  columns.push(
    {
      id: 'symbol',
      label: 'Symbol',
      width: GRID_COLUMNS.symbol.width,
      minWidth: GRID_COLUMNS.symbol.minWidth,
      align: 'left',
    },
    {
      id: 'amount',
      label: 'Quantity',
      width: GRID_COLUMNS.quantity.width,
      minWidth: GRID_COLUMNS.quantity.minWidth,
      align: 'left',
      number: true,
    },
    {
      id: 'notional',
      label: 'Notional',
      width: GRID_COLUMNS.notional.width,
      minWidth: GRID_COLUMNS.notional.minWidth,
      align: 'left',
      number: true,
    }
  );

  // Add columns based on table type and specific requirements
  const columnOrder = ['unrealized_profit', 'roi', 'funding_pnl', 'entry_price', 'maint_margin', 'margin_ratio', 'leverage'];

  columnOrder.forEach(columnId => {
    if (includeSpecificColumns.includes(columnId)) {
      switch (columnId) {
        case 'unrealized_profit':
          columns.push({
            id: 'unrealized_profit',
            label: 'Unrealized PnL',
            width: GRID_COLUMNS.unrealized_pnl.width,
            minWidth: GRID_COLUMNS.unrealized_pnl.minWidth,
            align: 'left',
            number: true,
          });
          break;
        case 'roi':
          columns.push({
            id: 'unrealized_profit_percentage',
            label: 'ROI',
            width: GRID_COLUMNS.roi.width,
            minWidth: GRID_COLUMNS.roi.minWidth,
            align: 'left',
            number: true,
          });
          break;
        case 'funding_pnl':
          columns.push({
            id: 'funding_fee',
            label: 'Funding PnL',
            width: GRID_COLUMNS.funding_pnl.width,
            minWidth: GRID_COLUMNS.funding_pnl.minWidth,
            align: 'left',
            number: true,
          });
          break;
        case 'entry_price':
          columns.push({
            id: 'entry_price',
            label: 'Entry Price',
            width: GRID_COLUMNS.entry_price.width,
            minWidth: GRID_COLUMNS.entry_price.minWidth,
            align: 'left',
            number: true,
          });
          break;
        case 'maint_margin':
          columns.push({
            id: 'maint_margin',
            label: 'Maint Margin',
            width: GRID_COLUMNS.maint_margin.width,
            minWidth: GRID_COLUMNS.maint_margin.minWidth,
            align: 'left',
            number: true,
          });
          break;
        case 'margin_ratio':
          columns.push({
            id: 'margin_ratio',
            label: 'Margin Ratio',
            width: GRID_COLUMNS.margin_ratio.width,
            minWidth: GRID_COLUMNS.margin_ratio.minWidth,
            align: 'left',
            number: true,
          });
          break;
        case 'leverage':
          columns.push({
            id: 'leverage',
            label: 'Leverage',
            width: GRID_COLUMNS.leverage.width,
            minWidth: GRID_COLUMNS.leverage.minWidth,
            align: 'left',
            number: true,
          });
          break;
        default:
          // No action needed for unmatched columnId
          break;
      }
    } else {
      // Add empty placeholder column to maintain grid alignment
      const gridKey = getGridKey(columnId);
      columns.push({
        id: `placeholder_${columnId}`,
        label: '',
        width: GRID_COLUMNS[gridKey].width,
        minWidth: GRID_COLUMNS[gridKey].minWidth,
        align: 'left',
        placeholder: true,
      });
    }
  });

  // Always add share column at the end
  columns.push({
    id: 'share',
    label: '',
    width: GRID_COLUMNS.share.width,
    minWidth: GRID_COLUMNS.share.minWidth,
    align: 'right',
  });

  return columns;
};

// Legacy function for backward compatibility - now uses grid system
export const getDynamicColumns = (assets, baseType = 'base') => {
  const hasMarginData = assets.some(asset => isMarginedAsset(asset));
  const hasPnLData = assets.some(asset =>
    asset.unrealized_profit !== null && asset.unrealized_profit !== undefined ||
    asset.unrealized_profit_percentage !== null && asset.unrealized_profit_percentage !== undefined
  );
  const hasFundingData = assets.some(asset =>
    asset.funding_fee !== null && asset.funding_fee !== undefined
  );

  const includeColumns = [];

  if (hasPnLData) {
    includeColumns.push('unrealized_profit', 'roi');
  }

  if (hasFundingData) {
    includeColumns.push('funding_pnl');
  }

  // Only include maint_margin for perpetual futures, not for spot or cash
  if (hasMarginData && baseType === 'perp') {
    includeColumns.push('maint_margin');
  }

  return getGridAlignedColumns(baseType, includeColumns);
};
