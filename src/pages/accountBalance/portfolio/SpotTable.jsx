import { TokenIcon } from '@/shared/components/Icons';
import { StyledTableCell } from '@/shared/orderTable/util';
import { formatQty } from '@/util';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  getGridAlignedColumns,
  calculateTotals,
  filterLowNotional,
  formatValue,
  getColor,
  renderWalletLabel,
  isMarginedAsset,
} from './tableUtils';

export function SpotTable({ exchange, assets }) {
  const theme = useTheme();
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

  // Use grid-aligned columns for spot table (includes PnL but no funding/margin data)
  const columns = getGridAlignedColumns('spot', ['unrealized_profit', 'roi']);

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
      if (row.unrealized_profit !== null && row.unrealized_profit !== undefined) {
        acc.unrealized_profit += Number(row.unrealized_profit) || 0;
      }
      return acc;
    },
    { notional: 0, unrealized_profit: 0, absNotional: 0 }
  );

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
        aria-label='spot table'
        sx={{
          width: '100%',
          minWidth: '1000px',
          tableLayout: 'fixed',
          '& .MuiTableRow-root': {
            border: 0,
            '&:hover': {
              backgroundColor: `${theme.palette.grey[800]}05`, // 2% opacity
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
                {enhancedColumns.map((column) => {
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
                              logoUrl={row.logo_url}
                              style={{
                                height: '20px',
                                width: '20px',
                              }}
                              tokenName={tokenName}
                            />
                            <Typography
                              sx={{
                                color: getColor(row.notional, row.symbol),
                              }}
                              variant='body1'
                            >
                              {formatTokenSymbol(row)}
                              {renderWalletLabel(row.wallet_type, exchange, 'spot')}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                      );
                    case 'maint_margin':
                      if (row.maint_margin !== null && row.maint_margin !== undefined) {
                        return (
                          <StyledTableCell
                            align={column.align}
                            key={column.id}
                            style={{
                              minWidth: column.minWidth,
                              width: column.width || '20%',
                            }}
                          >
                            <Typography variant='body1'>${formatValue(row.maint_margin, true)}</Typography>
                          </StyledTableCell>
                        );
                      }
                      return <StyledTableCell key={column.id} />;
                    case 'initial_margin':
                      if (row.initial_margin !== null && row.initial_margin !== undefined) {
                        return (
                          <StyledTableCell
                            align={column.align}
                            key={column.id}
                            style={{
                              minWidth: column.minWidth,
                              width: column.width || '20%',
                            }}
                          >
                            <Typography variant='body1'>${formatValue(row.initial_margin, true)}</Typography>
                          </StyledTableCell>
                        );
                      }
                      return <StyledTableCell key={column.id} />;

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
                              color: (() => {
                                if (column.id === 'unrealized_profit' || column.id === 'unrealized_profit_percentage') {
                                  return getColor(value, row.symbol);
                                }
                                if (column.id === 'notional') {
                                  let notionalValue = row.notional;
                                  if (isSpotMargin && row.margin_balance && row.market_type === 'spot') {
                                    const originalNotional = Number(row.notional) || 0;
                                    const originalQuantity = Number(row.amount) || 0;
                                    if (originalQuantity !== 0) {
                                      const markPrice = originalNotional / originalQuantity;
                                      notionalValue = markPrice * Number(row.margin_balance);
                                    }
                                  }
                                  return getColor(notionalValue, row.symbol);
                                }
                                return 'text.primary';
                              })(),
                            }}
                            variant='body1'
                          >
                            {(() => {
                              if (column.id === 'amount') {
                                const formattedValue = formatQty(value);
                                return isSpotMargin && row.margin_balance ? (
                                  <Box component='span' sx={{ display: 'inline-flex', alignItems: 'baseline' }}>
                                    {formattedValue}
                                    <Typography
                                      component='span'
                                      sx={{ fontSize: '0.7em', lineHeight: 1, ml: 0.1, mb: 1, verticalAlign: 'super' }}
                                    >
                                      *
                                    </Typography>
                                  </Box>
                                ) : (
                                  formattedValue
                                );
                              }
                              if (column.id === 'unrealized_profit' && isSpotMargin) {
                                // For spot margin, show in base units without $ symbol
                                const formattedValue = formatValue(value, false);
                                // Only show base asset name if value is not 0
                                if (Number(value) !== 0) {
                                  return (
                                    <>
                                      {formattedValue} {getBaseAsset(row.symbol)}
                                    </>
                                  );
                                }
                                return formattedValue;
                              }
                              if (column.id === 'unrealized_profit') {
                                return formatValue(value, false);
                              }
                              if (column.id === 'unrealized_profit_percentage') {
                                return formatValue(value, false, true);
                              }
                              if (column.id === 'notional') {
                                // Use recalculated notional for spot margin assets (not perps)
                                if (isSpotMargin && row.margin_balance && row.market_type === 'spot') {
                                  // Calculate mark price and recalculate notional
                                  const originalNotional = Number(row.notional) || 0;
                                  const originalQuantity = Number(row.amount) || 0;
                                  let recalculatedNotional = originalNotional;

                                  if (originalQuantity !== 0) {
                                    const markPrice = originalNotional / originalQuantity;
                                    recalculatedNotional = markPrice * Number(row.margin_balance);
                                  }

                                  return formatValue(recalculatedNotional, true);
                                }
                                return formatValue(value, true);
                              }
                              return formatValue(value, false);
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
