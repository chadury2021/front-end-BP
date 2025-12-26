import { TokenIcon } from '@/shared/components/Icons';
import { StyledTableCell } from '@/shared/orderTable/util';
import { formatQty } from '@/util';
import { Box, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  optionColumns,
  calculateTotals,
  filterLowNotional,
  formatValue,
  getColor,
  renderWalletLabel,
} from './tableUtils';

export function OptionTable({ exchange, assets }) {
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

  const totals = calculateTotals(assets, false); // No PnL for uncategorized
  const filteredAssets = filterLowNotional(assets);
  const specialOptionNotionalFormat = (asset) => {
    if (exchange === 'Deribit') {
      const base = asset.symbol?.split(':')[0];
      return `${asset.notional} ${base}`;
    }

    return formatValue(asset.notional, true);
  };

  return (
    <TableContainer sx={{ maxHeight: '400px', overflowX: 'auto' }}>
      <Table
        stickyHeader
        aria-label='uncategorized table'
        sx={{
          width: '100%',
          minWidth: '800px',
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
            {optionColumns.map((column) => (
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
                {optionColumns.map((column) => {
                  let value = row[column.id];

                  // Calculate net quantity for amount field (amount - borrowed)
                  if (column.id === 'amount') {
                    const amount = Number(row.amount) || 0;
                    const borrowed = Number(row.borrowed) || 0;
                    value = amount - borrowed;
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
                            <Typography
                              sx={{
                                color: getColor(row.notional, row.symbol),
                              }}
                              variant='body1'
                            >
                              {formatTokenSymbol(row)}
                              {renderWalletLabel(row.wallet_type, exchange, 'uncategorized')}
                            </Typography>
                          </Box>
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
                          {specialOptionNotionalFormat(row)}
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
                          <Typography variant='body1'>
                            {column.id === 'amount' ? formatQty(value) : formatValue(value)}
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
            {optionColumns.map((column) => {
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
                        {exchange === 'Deribit' ? '-' : formatValue(totals.notional, true)}
                      </Typography>
                    </StyledTableCell>
                  );
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
