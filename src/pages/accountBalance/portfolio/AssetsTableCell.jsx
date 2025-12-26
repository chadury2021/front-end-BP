import { Typography } from '@mui/material';
import { StyledTableCell } from '@/shared/orderTable/util';
import { getUnderlying, numberWithCommas, smartRound, titleCase } from '@/util';

function AssetsTableCell({ column, row, value }) {
  const getColor = (val) => {
    if (val > 0) return 'success.main';
    if (val < 0) return 'error.main';
    return 'text.primary';
  };

  const formatValue = (val, symbol) => {
    if (val === null || val === undefined || val === 0) return '-';

    // For unrealized PnL column, apply comma formatting to the entire value including sign
    if (column.id === 'unrealized_profit') {
      const roundedValue = smartRound(val, 2);
      const formattedValue = numberWithCommas(roundedValue);
      // Add dollar sign after the sign but before the number
      return formattedValue.startsWith('-') ? `-$${formattedValue.slice(1)}` : `$${formattedValue}`;
    }

    // For other columns, keep existing logic
    const formattedValue = numberWithCommas(smartRound(Math.abs(val), 2));
    let sign = '';

    if (val < 0) {
      sign = '-';
    } else if (symbol?.includes('PERP')) {
      sign = '+';
    }

    return `${sign}${formattedValue}`;
  };

  return (
    <StyledTableCell
      align={column.align}
      key={column.id}
      row={row}
      style={{
        minWidth: column.minWidth,
        width: column.width || '20%',
      }}
      value={value}
    >
      <Typography
        sx={{
          color: getColor(value),
        }}
        variant='body1'
      >
        {formatValue(value, row.symbol)}
      </Typography>
    </StyledTableCell>
  );
}

export default AssetsTableCell;