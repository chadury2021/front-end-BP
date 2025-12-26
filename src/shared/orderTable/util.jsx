import { styled } from '@mui/material/styles';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LabelTooltip, { TreadTooltip } from '@/shared/components/LabelTooltip';
import { titleCase, smartRound } from '../../util';
import EmptyBar from '../components/EmptyBar';

// Data cells (numbers, prices, quantities) - use IBM Plex Mono
export const StyledDataTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledDataTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledDataTableCell}-body`]: {
      border: 'none',
      color: 'var(--text-primary)',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    padding: '1px 16px',
    color: 'var(--text-primary)',
  };
});

// Text cells (pair names, strategy names, labels) - use Helvetica
export const StyledTextTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledTextTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledTextTableCell}-body`]: {
      border: 'none',
      color: 'var(--text-primary)',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    padding: '1px 16px',
    color: 'var(--text-primary)',
  };
});

// Backward compatibility - default to text cells (most order table columns are text)
export const StyledTableCell = StyledTextTableCell;

export const AccountSettingTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledTableCell}-body`]: {
      border: 'none',
    },
    border: 'none',
    padding: '8px 0px 8px 0px',
  };
});

export const AccountSettingsLabelTableCell = styled(AccountSettingTableCell)(({ theme }) => {
  return {
    width: '40%',
  };
});

export const StyledSmallDataTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledSmallDataTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledSmallDataTableCell}-body`]: {
      border: 'none',
      color: 'var(--text-primary)',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    padding: '4px 8px',
    color: 'var(--text-primary)',
  };
});

// Backward compatibility - default to text cells
export const StyledSmallTableCell = StyledTextTableCell;

export const StyledSummaryTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledSummaryTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledSummaryTableCell}-body`]: {
      border: 'none',
      color: 'var(--text-primary)',
    },
    padding: '4px',
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    color: 'var(--text-primary)',
  };
});

export const StyledBenchmarkTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledSummaryTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledSummaryTableCell}-body`]: {
      border: 'none',
      color: 'var(--text-primary)',
    },
    padding: '8px',
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    color: 'var(--text-primary)',
  };
});

export const StyledPaddingTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledTableCell}-body`]: {
      border: 'none',
      color: 'var(--text-primary)',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    padding: '1px 16px 1px 16px',
    color: 'var(--text-primary)',
  };
});

export const StyledHeaderTableCellWithLine = styled(TableCell)(({ theme }) => {
  return {
    '&.MuiTableCell-head': {
      backgroundColor: theme.palette.background.card,
      color: theme.palette.text.secondary,
      border: 'none',
    },
    '&.MuiTableCell-body': {
      border: 'none',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontSize: theme.typography.body1.fontSize,
    padding: '0px 16px',
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
  };
});

export const CustomColorStyledTableCell = (color) =>
  styled(TableCell)(({ theme }) => {
    return {
      [`&.${StyledTableCell}-head`]: {
        backgroundColor: theme.palette.background.base,
        color: theme.palette.text.primary,
        border: 'none',
      },
      [`&.${StyledTableCell}-body`]: {
        border: 'none',
      },
      borderBottom: `1px solid ${theme.palette.grey[800]}`,
      borderLeft: `1px solid ${color}`,
      fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
      fontSize: '0.90rem',
    };
  });

export const ConditonalStyledTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledTableCell}-body`]: {
      border: 'none',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    borderLeft: `1px solid ${theme.palette.brand?.[500] || theme.palette.primary.main}`,
    fontSize: '0.95rem',
  };
});

export const StyledBorderTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledBorderTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
    },
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    borderBottom: 'none',
    paddingTop: 0,
  };
});

export const StyledNoBorderTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledBorderTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
    },
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    borderBottom: 'none',
  };
});

export const StyledHeaderTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledBorderTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
    },
    fontSize: theme.typography.body1.fontSize,
    borderBottom: 'none',
    paddingBottom: 0,
  };
});

export const StyledBorderTopTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledBorderTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
    },
    borderTop: `1px solid ${theme.palette.grey[800]}`,
    fontSize: '0.95rem',
    borderBottom: 'none',
  };
});

export const StyledIBMTypography = styled(Typography)(({ theme }) => {
  return {
    fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
    fontSize: '0.80rem',
  };
});

// Numeric data cells - use IBM Plex Mono for numbers
export const StyledNumericTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledNumericTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledNumericTableCell}-body`]: {
      border: 'none',
      color: 'var(--text-primary)',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for numbers
    fontSize: theme.typography.body1.fontSize,
    padding: '1px 16px',
    color: 'var(--text-primary)',
  };
});

// Options table

export const StyledStrikeTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledTableCell}-body`]: {
      border: 'none',
    },
    borderBottom: 'none',
    borderTop: 'none',
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: '0.80rem',
  };
});

export const StyledTableOptionCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledTableCell}-head`]: {
      backgroundColor: theme.palette.background.base,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledTableCell}-body`]: {
      border: 'none',
    },
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    borderRight: `1px solid ${theme.palette.grey[800]}`,
    borderLeft: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: '0.80rem',
  };
});

// Card View Cells

export const StyledCardTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledTableCell}-head`]: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: 'none',
    },
    [`&.${StyledTableCell}-body`]: {
      border: 'none',
    },
    border: '0px 0px 0px 0px',
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    fontFamily: theme.typography.fontFamilyConfig.text, // Use Inter/Helvetica for text
    fontSize: theme.typography.body1.fontSize,
    padding: '1px 16px 1px 16px',
  };
});

const HeaderTypography = styled(Typography)(({ theme }) => {
  return {
    color: theme.palette.text.secondary,
    fontSize: '10px',
    paddingBottom: '4px',
  };
});

export function StrategyParamsParsed({
  alpha_tilt,
  engine_passiveness,
  schedule_discretion,
  exposure_tolerance,
  strategy_params,
  pov_limit,
  pov_target,
}) {
  const { max_clip_size } = strategy_params;

  const strategyParamsKeys = Object.keys(strategy_params);

  const spanStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '160px',
  };

  return (
    <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
      {parseFloat(alpha_tilt) !== 0 && (
        <li key='alpha_tilt'>
          <span style={spanStyle}>
            <TreadTooltip placement='left' variant='alpha_tilt' />
            <Typography>{parseFloat(alpha_tilt).toFixed(2)}</Typography>
          </span>
        </li>
      )}
      <li key='engine_passiveness'>
        <span style={spanStyle}>
          <TreadTooltip placement='left' variant='passiveness' />
          <Typography>{parseFloat(engine_passiveness).toFixed(2)}</Typography>
        </span>
      </li>
      <li key='schedule_discretion'>
        <span style={spanStyle}>
          <TreadTooltip placement='left' variant='discretion' />
          <Typography>{parseFloat(schedule_discretion).toFixed(2)}</Typography>
        </span>
      </li>
      {max_clip_size && (
        <li>
          <span style={spanStyle}>
            <TreadTooltip placement='left' variant='max_clip_size' />
            <Typography>{parseFloat(max_clip_size)}</Typography>
          </span>
        </li>
      )}
      {exposure_tolerance && (
        <li>
          <span style={spanStyle}>
            <TreadTooltip placement='left' variant='exposure_tolerance' />
            <Typography>{parseFloat(exposure_tolerance).toFixed(2)}</Typography>
          </span>
        </li>
      )}
      {pov_limit && pov_limit > 0 && (
        <li>
          <span style={spanStyle}>
            <LabelTooltip label='Participation Limit:' />
            <Typography>{smartRound(parseFloat(pov_limit) * 100)}%</Typography>
          </span>
        </li>
      )}
      {pov_target && pov_target > 0 && (
        <li>
          <span style={spanStyle}>
            <LabelTooltip label='Participation Target:' />
            <Typography>{smartRound(parseFloat(pov_target) * 100)}%</Typography>
          </span>
        </li>
      )}
      {strategyParamsKeys.length !== 0 &&
        Object.values(strategy_params).includes(true) &&
        strategyParamsKeys
          .filter((x) => x !== 'max_clip_size' && strategy_params[x])
          .map((key) => (
            <li key={key}>
              <span style={spanStyle}>
                {titleCase(key)}
                <Typography>{String(strategy_params[key])}</Typography>
              </span>
            </li>
          ))}
    </ul>
  );
}

export function buySellToBaseQuote(row) {
  const rowData = { ...row };

  if (rowData.side === 'buy') {
    if (rowData.buy_token_amount) {
      rowData.buy_token_amount -= rowData.executed_buy_qty;
    } else {
      rowData.sell_token_amount -= rowData.executed_qty;
    }
  } else if (rowData.buy_token_amount) {
    rowData.buy_token_amount -= rowData.executed_buy_qty;
  } else {
    rowData.sell_token_amount -= rowData.executed_qty;
  }

  return rowData;
}

export const displayDefaultTableCell = (column, value, style, CustomCell = StyledTableCell) => {
  let formattedValue = value;
  if (!value && column.hasLoader) {
    formattedValue = (
      <div
        style={{
          display: 'flex',
          justifyContent: column.align === 'right' && 'flex-end',
        }}
      >
        <EmptyBar />
      </div>
    );
  }
  if (column.format && typeof value === 'number') {
    formattedValue = column.format(value);
  }

  return (
    <CustomCell align={column.align} key={column.id} style={style} width={column.width}>
      {formattedValue}
    </CustomCell>
  );
};
export function formatDateTime(timeString, omitDate = false) {
  const date = new Date(timeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return (
    <span>
      {!omitDate && <span style={{ color: 'var(--text-secondary)' }}>{`${year}-${month}-${day} `}</span>}
      <span style={{ color: 'var(--text-secondary)' }}>{`${hours}:${minutes}:${seconds}`}</span>
    </span>
  );
}

export const getOrderPath = (order) => {
  let url = null;
  if (order.child_order_ids !== null && order.child_order_ids !== undefined) {
    url = `/multi_order/${order.id}`;
  } else if (order.is_simple) {
    url = `/simple_order/${order.id}`;
  } else if (order.side === 'Chained') {
    url = `/chained_orders/${order.id}`;
  } else {
    url = `/order/${order.id}`;
  }

  return url;
};

export const parseStatus = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return <Typography color='primary.main'>Submitted</Typography>;
    case 'CANCELED':
      return <Typography color='error.main'>Canceled</Typography>;
    case 'COMPLETE':
      return <Typography color='success.main'>Finished</Typography>;
    case 'SCHEDULED':
      return <Typography color='secondary.main'>Scheduled</Typography>;
    case 'PAUSED':
      return <Typography color='info.main'>Paused</Typography>;
    default:
      return <Typography color='primary.main'>Active</Typography>;
  }
};

export const parseSide = (side) => {
  if (side === 'buy') {
    return <Typography color='success.main'>Buy</Typography>;
  }
  if (side === 'sell') {
    return <Typography color='error.main'>Sell</Typography>;
  }
  return <Typography color='primary.main'>{side}</Typography>;
};
