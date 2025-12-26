import { TokenIcon } from '@/shared/components/Icons';
import { StyledTableCell } from '@/shared/orderTable/util';
import { formatQty, smartRound, numberWithCommas } from '@/util';
import { getMarginRatioHexColor, formatMarginRatio, getMarginModeDescription } from '@/util/marginRatioUtils';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import useLiquidationRisk from '@/hooks/useLiquidationRisk';
import {
  getGridAlignedColumns,
  calculateTotals,
  filterLowNotional,
  formatValue,
  getColor,
  renderWalletLabel,
} from './tableUtils';

export function PerpTable({ exchange, assets }) {
  const theme = useTheme();
  const positionRiskData = useLiquidationRisk({ assets });
  const perPositionMap =
    positionRiskData?.perPosition?.reduce((acc, pos) => {
      acc[pos.symbol] = pos;
      return acc;
    }, {}) || {};

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

  // Use grid-aligned columns for perpendicular futures with all perp-specific columns
  const columns = getGridAlignedColumns('perp', [
    'unrealized_profit',
    'roi',
    'funding_pnl',
    'entry_price',
    'maint_margin',
    'margin_ratio',
    'leverage',
  ]);

  const totals = calculateTotals(assets, true);
  const filteredAssets = filterLowNotional(assets);

  return (
    <TableContainer sx={{ maxHeight: '400px', overflowX: 'auto' }}>
      <Table
        stickyHeader
        aria-label='perp table'
        sx={{
          width: '100%',
          minWidth: '1400px',
          tableLayout: 'fixed',
          '& .MuiTableRow-root': {
            border: 0,
            '&:hover': {
              backgroundColor: `${theme.palette.grey[800]}05`,
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
            {columns.map((column) => (
              <StyledTableCell
                align={column.align}
                key={column.id}
                style={{
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
            const positionRisk = perPositionMap[row.symbol];

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
                    const amount = Number(row.amount) || 0;
                    const borrowed = Number(row.borrowed) || 0;
                    value = amount - borrowed;
                  }

                  // Handle placeholder columns for grid alignment
                  if (column.placeholder) {
                    return (
                      <StyledTableCell
                        align={column.align}
                        key={column.id}
                        style={{
                          minWidth: column.minWidth,
                          width: column.width,
                        }}
                      >
                        {/* Empty cell for grid alignment */}
                      </StyledTableCell>
                    );
                  }

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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                  sx={{
                                    color: getColor(row.notional, row.symbol),
                                  }}
                                  variant='body1'
                                >
                                  {formatTokenSymbol(row)}
                                  {renderWalletLabel(row.wallet_type, exchange, 'perp')}
                                </Typography>
                                {(exchange === 'Hyperliquid' || exchange?.toLowerCase() === 'hyperliquid') && (
                                  <Typography
                                    sx={{
                                      color: 'text.secondary',
                                      ml: 0.5,
                                    }}
                                    variant='body1'
                                  >
                                    ({getMarginModeDescription(row.margin_mode)})
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </StyledTableCell>
                      );
                    case 'leverage':
                      if (positionRisk) {
                        return (
                          <StyledTableCell
                            align={column.align}
                            key={column.id}
                            style={{
                              width: column.width || '20%',
                            }}
                          >
                            <Typography
                              title={
                                positionRisk.leverage > 0
                                  ? `Leverage: ${smartRound(positionRisk.leverage, 2)}x`
                                  : 'No leverage'
                              }
                              variant='body1'
                            >
                              {positionRisk.leverage > 0 ? `${smartRound(positionRisk.leverage, 2)}x` : '-'}
                            </Typography>
                          </StyledTableCell>
                        );
                      }
                      return <StyledTableCell key={column.id} />;
                    case 'entry_price':
                      if (positionRisk) {
                        return (
                          <StyledTableCell
                            align={column.align}
                            key={column.id}
                            style={{
                              minWidth: column.minWidth,
                              width: column.width || '20%',
                            }}
                          >
                            <Typography variant='body1'>
                              {positionRisk.avgEntryPrice > 0
                                ? `$${numberWithCommas(smartRound(positionRisk.avgEntryPrice, 2))}`
                                : '-'}
                            </Typography>
                          </StyledTableCell>
                        );
                      }
                      return <StyledTableCell key={column.id} />;
                    case 'maint_margin':
                      if (positionRisk) {
                        return (
                          <StyledTableCell
                            align={column.align}
                            key={column.id}
                            style={{
                              minWidth: column.minWidth,
                              width: column.width || '20%',
                            }}
                          >
                            <Typography variant='body1'>
                              ${numberWithCommas(smartRound(positionRisk.maintMargin, 2))}
                            </Typography>
                          </StyledTableCell>
                        );
                      }
                      return <StyledTableCell key={column.id} />;
                    case 'margin_ratio':
                      if (positionRisk) {
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
                                color: getMarginRatioHexColor(positionRisk.marginRatioPct, theme),
                              }}
                              variant='body1'
                            >
                              {formatMarginRatio(positionRisk.marginRatioPct)}
                            </Typography>
                          </StyledTableCell>
                        );
                      }
                      return <StyledTableCell key={column.id} />;
                    case 'unrealized_profit_percentage': {
                      // Calculate individual position ROI
                      const unrealizedProfit = Number(row.unrealized_profit) || 0;
                      const notional = Math.abs(Number(row.notional)) || 0;

                      if (notional === 0) {
                        return (
                          <StyledTableCell
                            align={column.align}
                            key={column.id}
                            style={{
                              minWidth: column.minWidth,
                              width: column.width || '20%',
                            }}
                          >
                            <Typography variant='body1'>-</Typography>
                          </StyledTableCell>
                        );
                      }

                      // Calculate individual position ROI: (Unrealized PnL / |Notional|) × 100
                      const positionROI = (unrealizedProfit / notional) * 100;

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
                              color: getColor(positionROI, row.symbol),
                            }}
                            variant='body1'
                          >
                            {formatValue(positionROI, false, true)}
                          </Typography>
                        </StyledTableCell>
                      );
                    }
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
                                column.id === 'unrealized_profit' ||
                                column.id === 'funding_fee' ||
                                column.id === 'notional'
                                  ? getColor(value, row.symbol)
                                  : 'text.primary',
                            }}
                            variant='body1'
                          >
                            {column.id === 'amount'
                              ? formatQty(value)
                              : formatValue(
                                  value,
                                  column.id === 'unrealized_profit' ||
                                    column.id === 'funding_fee' ||
                                    column.id === 'notional',
                                  false
                                )}
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
              // Handle placeholder columns for grid alignment
              if (column.placeholder) {
                return (
                  <StyledTableCell
                    align={column.align}
                    key={column.id}
                    style={{
                      minWidth: column.minWidth,
                      width: column.width,
                    }}
                  >
                    {/* Empty cell for grid alignment */}
                  </StyledTableCell>
                );
              }

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
                          color: getColor(totals.unrealized_profit, ''),
                          fontWeight: 'bold',
                        }}
                        variant='body1'
                      >
                        {formatValue(totals.unrealized_profit, true)}
                      </Typography>
                    </StyledTableCell>
                  );
                case 'funding_fee':
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
                          color: getColor(totals.funding_fee, ''),
                          fontWeight: 'bold',
                        }}
                        variant='body1'
                      >
                        {formatValue(totals.funding_fee, true)}
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
                          color: getColor(totals.roi_percentage, ''),
                          fontWeight: 'bold',
                        }}
                        variant='body1'
                      >
                        {formatValue(totals.roi_percentage, false, true)}
                      </Typography>
                    </StyledTableCell>
                  );
                case 'entry_price':
                case 'maint_margin':
                case 'margin_ratio':
                case 'leverage':
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
