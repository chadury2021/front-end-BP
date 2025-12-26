import Typography from '@mui/material/Typography';
import { CustomColorStyledTableCell, StyledTableCell } from '@/shared/orderTable/util';
import { formatQty, numberWithCommas, smartRound } from '@/util';
import { getTokenInfo } from '@/shared/dexUtils';
import { CASH_ASSETS } from '@/constants';

const pnlStyleByValue = (val) => {
  if (val >= 0) {
    return 'success.main';
  }

  return 'error.main';
};

const signByValue = (val) => {
  if (val > 0) {
    return '+';
  }
  if (val < 0) {
    return '-';
  }

  return '';
};

// Calculate ROI percentage when the field is missing from backend data
const calculateROI = (row) => {
  // Skip ROI calculation for cash/stablecoin assets
  if (['USDT', 'USDC', 'USD', 'USDK'].includes(row.symbol)) {
    return 0;
  }

  if (row.asset_type === 'token') {
    return 0;
  }

  // Skip if notional is 0 or undefined
  if (!row.notional || row.notional === 0) {
    return 0;
  }

  // % of unrealized PnL over original notional
  return 100 * ((row.unrealized_profit || 0) / Math.abs(Number(row.notional)));
};

// Check if this is a margined spot asset (has margin-related fields)
const isMarginedSpotAsset = (row) => {
  return (
    row.market_type === 'spot' &&
    ((row.maint_margin !== null && row.maint_margin !== undefined) ||
      (row.initial_margin !== null && row.initial_margin !== undefined) ||
      (row.margin_balance !== null && row.margin_balance !== undefined))
  );
};

// Check if this is a cash asset
const isCashAsset = (row) => {
  return CASH_ASSETS.includes(row.symbol) || row.market_type === 'cash';
};

export default function AssetsTableCell({ column, value, row, cellColor, cellRender = StyledTableCell }) {
  let CellRender = cellRender;

  if (column.id === 'symbol') {
    CellRender = CustomColorStyledTableCell(cellColor);
  }

  let cellValue = value;
  let color = 'text.primary';

  // Check if this is a DEX asset (has contract_address:chain_id format)
  const tokenInfo = getTokenInfo(row.symbol);
  const isDexAsset = tokenInfo && tokenInfo.chainId;

  // Check if this is a margined spot asset
  const isMarginedSpot = isMarginedSpotAsset(row);

  if (value === null || value === undefined) {
    cellValue = '-';
  }

  if (column.number) {
    if (column.id === 'amount') {
      if (row.asset_type === 'mixed') {
        cellValue = '-';
      } else {
        cellValue = formatQty(value);
      }
      if (Number(value) > 0) {
        color = 'success.main';
      } else if (Number(value) < 0) {
        color = 'error.main';
      }
    } else if (
      column.id === 'unrealized_profit_percentage' ||
      column.id === 'unrealized_profit' ||
      column.id === 'funding_fee'
    ) {
      if (row.asset_type === 'token' || row.asset_type === 'mixed') {
        cellValue = '-';
      } else if (isCashAsset(row)) {
        // For cash assets, show empty string instead of dash for PnL and ROI
        cellValue = '';
      } else {
        // For ROI percentage, calculate it if the value is missing
        let displayValue = value;
        if (column.id === 'unrealized_profit_percentage' && (value === undefined || value === null)) {
          displayValue = calculateROI(row);
        }

        if (column.id === 'unrealized_profit') {
          // For unrealized PnL, show "-" if not available, otherwise format with dollar sign
          if (displayValue === null || displayValue === undefined) {
            cellValue = '-';
          } else {
            // Apply comma formatting to the entire value including sign
            const roundedValue = smartRound(displayValue, 2);
            const formattedValue = numberWithCommas(roundedValue);
            // Add dollar sign after the sign but before the number
            cellValue = formattedValue.startsWith('-') ? `-$${formattedValue.slice(1)}` : `$${formattedValue}`;
          }
        } else if (displayValue === null || displayValue === undefined) {
          cellValue = '-';
        } else {
          const roundedValue = smartRound(Math.abs(displayValue), 2);
          const decoratedValue = column.id === 'unrealized_profit_percentage' ? `${roundedValue}%` : `$${roundedValue}`;
          cellValue = `${signByValue(displayValue)}${decoratedValue}`;
        }

        // Don't apply green/red colors for DEX assets since you can only go long
        color = isDexAsset ? 'text.primary' : pnlStyleByValue(displayValue);
      }
    } else if (column.id === 'notional') {
      cellValue = `${formatQty(value, true)}`;
      if (Number(value) > 0) {
        color = 'success.main';
      } else if (Number(value) < 0) {
        color = 'error.main';
      }
    } else if (column.id === 'maint_margin') {
      // Handle maintenance margin for margined spot assets
      if (isMarginedSpot && value !== null && value !== undefined) {
        cellValue = `$${numberWithCommas(smartRound(value, 2))}`;
        color = 'text.primary';
      } else {
        cellValue = '-';
      }
    } else if (column.id === 'initial_margin') {
      // Handle initial margin for margined spot assets
      if (isMarginedSpot && value !== null && value !== undefined) {
        cellValue = `$${numberWithCommas(smartRound(value, 2))}`;
        color = 'text.primary';
      } else {
        cellValue = '-';
      }
    } else if (column.id === 'margin_balance') {
      // Handle margin balance for margined spot assets
      if (isMarginedSpot && value !== null && value !== undefined) {
        cellValue = `$${numberWithCommas(smartRound(value, 2))}`;
        color = 'text.primary';
      } else {
        cellValue = '-';
      }
    } else if (column.id === 'leverage') {
      // Handle leverage for margined spot assets
      if (isMarginedSpot && value !== null && value !== undefined) {
        cellValue = `${value}x`;
        color = 'text.primary';
      } else {
        cellValue = '-';
      }
    } else {
      cellValue = `${formatQty(value, true)}`;
    }
  }

  return (
    <CellRender
      align={column.align}
      key={column.id}
      style={{ whiteSpace: 'nowrap' }}
      width={column.width || column.minWidth || '20%'}
    >
      <Typography color={color} variant='body1'>
        {cellValue}
      </Typography>
    </CellRender>
  );
}
