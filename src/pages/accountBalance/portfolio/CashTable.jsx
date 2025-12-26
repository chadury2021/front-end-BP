import { TokenIcon } from '@/shared/components/Icons';
import { StyledTableCell } from '@/shared/orderTable/util';
import { formatQty, smartRound, numberWithCommas } from '@/util';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  getDynamicColumns,
  calculateTotals,
  filterLowNotional,
  formatValue,
  getColor,
  renderWalletLabel,
  isMarginedAsset,
} from './tableUtils';

export function CashTable({ exchange, assets }) {
  const formatTokenSymbol = (asset) => {
    const { name, symbol, token_symbol } = asset;

    if (name && token_symbol) {
      return (
        <Box component='span' sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <Typography sx={{ color: 'text.primary' }} variant='body1'>
            {token_symbol}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.64rem', ml: 0.5 }} variant='caption'>
            ({name})
          </Typography>
        </Box>
      );
    }

    return symbol;
  };

  // Helper function to extract base asset from symbol
  const getBaseAsset = (symbol) => {
    // Handle different symbol formats
    if (symbol.includes('-')) {
      return symbol.split('-')[0];
    }
    if (symbol.includes(':')) {
      return symbol.split(':')[0];
    }
    // For simple symbols, assume it's the base asset
    return symbol;
  };

  // Helper function to calculate mark price and recalculate notional for spot margin
  const calculateSpotMarginValues = (row) => {
    if (!isMarginedAsset(row) || !row.margin_balance) {
      return {
        quantity: Number(row.amount) || 0,
        notional: Number(row.notional) || 0,
        markPrice: null,
      };
    }

    const marginBalance = Number(row.margin_balance);
    const originalNotional = Number(row.notional) || 0;
    const originalQuantity = Number(row.amount) || 0;

    // Calculate mark price: mark_price = notional / quantity
    let markPrice = null;
    if (originalQuantity !== 0) {
      markPrice = originalNotional / originalQuantity;
    }

    // Recalculate notional using margin_balance: notional = mark_price * margin_balance
    let recalculatedNotional = originalNotional;
    if (markPrice !== null) {
      recalculatedNotional = markPrice * marginBalance;
    }

    return {
      quantity: marginBalance,
      notional: recalculatedNotional,
      markPrice,
    };
  };

  // Use dynamic columns based on available data
  const columns = getDynamicColumns(assets, 'cash');

  // Add help icon to quantity column label
  const enhancedColumns = columns.map((column) => {
    if (column.id === 'amount') {
      return {
        ...column,
        label: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Quantity
            <Tooltip title='* indicates quantity replaced by margin balance for spot margin assets'>
              <IconButton size='small' sx={{ p: 0, minWidth: 'auto' }}>
                <HelpOutlineIcon sx={{ fontSize: '14px', color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      };
    }
    return column;
  });

  // Calculate custom totals that account for recalculated notional values
  const customTotals = assets.reduce(
    (acc, row) => {
      const isSpotMargin = isMarginedAsset(row);
      let notionalValue = Number(row.notional) || 0;
      let absNotionalValue = Math.abs(notionalValue);

      if (isSpotMargin && row.margin_balance && row.market_type === 'spot') {
        // Use recalculated notional for spot margin assets (not perps)
        const originalNotional = Number(row.notional) || 0;
        const originalQuantity = Number(row.amount) || 0;
        if (originalQuantity !== 0) {
          const markPrice = originalNotional / originalQuantity;
          notionalValue = markPrice * Number(row.margin_balance);
          absNotionalValue = Math.abs(notionalValue);
        }
      }

      acc.notional += notionalValue;
      acc.absNotional += absNotionalValue; // For exposure calculations
      return acc;
    },
    { notional: 0, absNotional: 0 }
  );

  // For Hyperliquid accounts, add maintenance margin and initial margin to the total notional
  // This ensures the cash table total reflects the full account value including isolated margin
  const isHyperliquid = exchange === 'hyperliquid';
  if (isHyperliquid) {
    const totalMaintenanceMargin = assets
      .filter((row) => row.asset_type === 'position')
      .reduce((sum, row) => sum + Number(row.maint_margin || 0), 0);
    const totalInitialMargin = assets
      .filter((row) => row.asset_type === 'position')
      .reduce((sum, row) => sum + Number(row.initial_margin || 0), 0);
    customTotals.notional += totalMaintenanceMargin + totalInitialMargin;
  }

  const totals = { ...customTotals };

  // Custom filtering that uses margin-adjusted notional values
  const filteredAssets = assets.filter((asset) => {
    // Always show assets with borrowed amounts (negative balance)
    if (asset.borrowed && Number(asset.borrowed) > 0) {
      return true;
    }

    const isSpotMargin = isMarginedAsset(asset);
    let notionalValue = Number(asset.notional) || 0;

    if (isSpotMargin && asset.margin_balance && asset.market_type === 'spot') {
      // Use margin-adjusted notional for filtering (not perps)
      const originalNotional = Number(asset.notional) || 0;
      const originalQuantity = Number(asset.amount) || 0;
      if (originalQuantity !== 0) {
        const markPrice = originalNotional / originalQuantity;
        notionalValue = markPrice * Number(asset.margin_balance);
      }
    }

    // Only show if notional is significant (using margin-adjusted value)
    return !notionalValue || Math.abs(notionalValue) >= 0.01;
  });

  return (
    <TableContainer sx={{ maxHeight: '400px', overflowX: 'auto' }}>
      <Table
        stickyHeader
        aria-label='cash table'
        sx={{
          width: '100%',
          minWidth: '1000px',
          tableLayout: 'fixed',
          '& .MuiTableRow-root': {
            border: 0,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            },
          },
          '& .MuiTableCell-root': {
            border: 0,
            py: 1,
            px: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            fontWeight: 500,
            color: 'var(--text-primary)',
          },
          '& .total-row': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            fontWeight: 600,
            '& .MuiTableCell-root': {
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            },
          },
        }}
      >
        <TableHead>
          <TableRow>
            {enhancedColumns.map((column) => (
              <StyledTableCell
                align={column.align}
                key={column.id}
                style={{
                  minWidth: column.minWidth,
                  width: column.width || undefined,
                }}
              >
                {column.label}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAssets.map((row) => {
            const tokenName = row.symbol;
            const isSpotMargin = isMarginedAsset(row);
            const spotMarginValues = calculateSpotMarginValues(row);

            return (
              <TableRow
                key={row.symbol + row.notional}
                sx={{
                  width: '100%',
                  '& .MuiTableCell-root': {
                    py: 1,
                  },
                }}
              >
                {columns.map((column) => {
                  let value = row[column.id];

                  // Calculate net quantity for amount field (amount - borrowed)
                  if (column.id === 'amount') {
                    if (isSpotMargin && row.margin_balance) {
                      // Use margin_balance for spot margin assets
                      value = Number(row.margin_balance) || 0;
                    } else {
                      const amount = Number(row.amount) || 0;
                      const borrowed = Number(row.borrowed) || 0;
                      value = amount - borrowed;
                    }
                  }

                  // Helper function to format amount values
                  const formatAmountValue = (val, isMarginBalanceUsed = false) => {
                    if (Math.abs(val) < 0.001) return '-';
                    const formattedValue = formatQty(val);
                    return isMarginBalanceUsed ? (
                      <Box component='span' sx={{ display: 'inline-flex', alignItems: 'baseline' }}>
                        {formattedValue}
                        <Typography
                          component='span'
                          sx={{ fontSize: '0.7em', lineHeight: 1, ml: 0.1, verticalAlign: 'super' }}
                        >
                          *
                        </Typography>
                      </Box>
                    ) : (
                      formattedValue
                    );
                  };

                  switch (column.id) {
                    case 'symbol':
                      return (
                        <StyledTableCell
                          align={column.align}
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width || '20%',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TokenIcon
                              useFallback
                              style={{
                                height: '20px',
                                width: '20px',
                              }}
                              tokenName={tokenName}
                            />
                            <Typography
                              sx={{
                                color: getColor(spotMarginValues.notional, row.symbol),
                              }}
                              variant='body1'
                            >
                              {formatTokenSymbol(row)}
                              {renderWalletLabel(row.wallet_type, exchange, 'cash')}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                      );
                    case 'unrealized_profit':
                      return (
                        <StyledTableCell
                          align={column.align}
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width || '20%',
                          }}
                        >
                          <Typography
                            sx={{
                              color: getColor(row.unrealized_profit, row.symbol),
                            }}
                            variant='body1'
                          >
                            {isSpotMargin
                              ? // For spot margin, show in base units without $ symbol
                                (() => {
                                  const formattedValue = formatValue(row.unrealized_profit, false);
                                  // Only show base asset name if value is not 0
                                  if (Number(row.unrealized_profit) !== 0) {
                                    return (
                                      <>
                                        {formattedValue} {getBaseAsset(row.symbol)}
                                      </>
                                    );
                                  }
                                  return formattedValue;
                                })()
                              : // For regular assets, show with $ symbol
                                formatValue(row.unrealized_profit, true)}
                          </Typography>
                        </StyledTableCell>
                      );
                    case 'unrealized_profit_percentage':
                      return (
                        <StyledTableCell
                          align={column.align}
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width || '20%',
                          }}
                        >
                          <Typography
                            sx={{
                              color: getColor(row.unrealized_profit_percentage, row.symbol),
                            }}
                            variant='body1'
                          >
                            {formatValue(row.unrealized_profit_percentage, false, true)}
                          </Typography>
                        </StyledTableCell>
                      );
                    case 'maint_margin':
                      return (
                        <StyledTableCell
                          align={column.align}
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width || '20%',
                          }}
                        >
                          <Typography variant='body1'>{formatValue(row.maint_margin, true)}</Typography>
                        </StyledTableCell>
                      );
                    case 'initial_margin':
                      return (
                        <StyledTableCell
                          align={column.align}
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width || '20%',
                          }}
                        >
                          <Typography variant='body1'>{formatValue(row.initial_margin, true)}</Typography>
                        </StyledTableCell>
                      );

                    default:
                      return (
                        <StyledTableCell
                          align={column.align}
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width || '20%',
                          }}
                        >
                          <Typography
                            sx={{
                              color:
                                column.id === 'notional'
                                  ? getColor(spotMarginValues.notional, row.symbol)
                                  : 'text.primary',
                            }}
                            variant='body1'
                          >
                            {(() => {
                              if (column.id === 'amount') {
                                return formatAmountValue(value, isSpotMargin && row.margin_balance);
                              }
                              if (column.id === 'notional') {
                                // Use recalculated notional for spot margin assets
                                if (isSpotMargin && row.margin_balance) {
                                  return formatValue(spotMarginValues.notional, true);
                                }
                                return formatValue(value, true);
                              }
                              return formatValue(value, column.id === 'notional');
                            })()}
                          </Typography>
                        </StyledTableCell>
                      );
                  }
                })}
              </TableRow>
            );
          })}
          <TableRow
            className='total-row'
            sx={{
              width: '100%',
              '& .MuiTableCell-root': {
                py: 1.5,
                fontWeight: 'bold',
                fontSize: '1.1rem',
              },
            }}
          >
            {columns.map((column) => {
              switch (column.id) {
                case 'symbol':
                  return (
                    <StyledTableCell
                      align={column.align}
                      key={column.id}
                      style={{
                        minWidth: column.minWidth,
                        width: column.width || '20%',
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold' }} variant='body1'>
                        Total
                      </Typography>
                    </StyledTableCell>
                  );
                case 'notional':
                  return (
                    <StyledTableCell
                      align={column.align}
                      key={column.id}
                      style={{
                        minWidth: column.minWidth,
                        width: column.width || '20%',
                      }}
                    >
                      <Typography
                        sx={{
                          color: getColor(totals.notional, ''),
                          fontWeight: 'bold',
                        }}
                        variant='body1'
                      >
                        {formatValue(totals.notional, true)}
                      </Typography>
                    </StyledTableCell>
                  );

                case 'amount':
                  return (
                    <StyledTableCell
                      align={column.align}
                      key={column.id}
                      style={{
                        minWidth: column.minWidth,
                        width: column.width || '20%',
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold' }} variant='body1'>
                        -
                      </Typography>
                    </StyledTableCell>
                  );
                case 'maint_margin':
                case 'initial_margin':
                  return <StyledTableCell key={column.id} />;
                default:
                  return <StyledTableCell key={column.id} />;
              }
            })}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
