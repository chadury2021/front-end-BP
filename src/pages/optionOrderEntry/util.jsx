import React, { useEffect, useRef } from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Divider from '@mui/material/Divider';
import { smartRound } from '@/util';
import { StyledIBMTypography, StyledTableOptionCell } from '../../shared/orderTable/util';

export const exchangeQuoteMapping = {
  Binance: 'USDT',
  OKX: 'USDT',
};

export const displayDefaultTableCell = (column, value, style, Cell = StyledTableOptionCell) => {
  let formattedValue = '';

  if (!value) {
    formattedValue = '-';
  } else if (value > 0 && value < 0.0001) {
    formattedValue = Number(value).toExponential(2);
  } else if (value < 0 && value > -0.0001) {
    formattedValue = Number(value).toExponential(2);
  } else if (column.format) {
    formattedValue = column.format(value);
  } else {
    formattedValue = smartRound(value, 4);
  }

  return (
    <Cell
      align={column.align}
      key={`${column.id}defaultCell${value}`}
      style={style}
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {formattedValue}
    </Cell>
  );
};

export const displayColorTableCell = (
  column,
  value,
  ivValue,
  style,
  color,
  percentColor,
  Cell = StyledTableOptionCell
) => {
  const formatValue = (val, iv = false) => {
    if (!value || Math.abs(Number(value).toFixed(2)) === 0.0) {
      return '-';
    }
    return iv ? `${(Number(val) * 100).toFixed(2)}%` : Number(val).toFixed(4);
  };

  return (
    <Cell align={column.align} key={`${column.id}cell${value}`} style={style}>
      <StyledIBMTypography color={color} sx={{ lineHeight: 1.43 }}>
        {formatValue(value)}
      </StyledIBMTypography>
      <StyledIBMTypography color={percentColor} sx={{ lineHeight: 1.43 }}>
        {formatValue(ivValue, true)}
      </StyledIBMTypography>
    </Cell>
  );
};

export function convertBinanceDateToTaas(input) {
  if (typeof input !== 'string' || input.length !== 6) {
    throw new Error('Input must be a string of length 6 in the format YYMMDD');
  }

  const year = input.slice(0, 2);
  const month = input.slice(2, 4);
  const day = input.slice(4, 6);

  // Assuming the input is in the 21st century (20YY)
  const fullYear = `20${year}`;

  return `${fullYear}.${month}.${day}`;
}

export function FocusableDivider({ theme }) {
  const dividerRef = useRef(null);

  useEffect(() => {
    if (dividerRef.current) {
      dividerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  return (
    <TableRow>
      <TableCell colSpan='100%' style={{ padding: 0 }}>
        <Divider ref={dividerRef} sx={{ height: '2px', backgroundColor: theme.palette.primary.main }} />
      </TableCell>
    </TableRow>
  );
}
