import { getExplorerUrl } from '@/pages/accountBalance/util';
import { ChainIcon } from '@/shared/components/Icons';
import DataComponent from '@/shared/DataComponent';
import { BigSkeleton } from '@/shared/Loader';
import { formatQty, smartRound } from '@/util';
import { Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import React from 'react';

import { renderPriceWithSubscript } from '@/util/priceFormatting';
import { StyledCardTableCell, StyledHeaderTableCellWithLine, StyledTableCell } from '../orderTable/util';

// Helper function to format failure reasons for better readability
const formatFailureReason = (failureReason) => {
  if (!failureReason) return '-';

  // Handle common backend error patterns with "None" values
  if (failureReason.includes('[None]') || failureReason.includes(': None')) {
    return failureReason.replace(/\[None\]/g, '[Missing Data]').replace(/: None/g, ': Missing Data');
  }

  return failureReason;
};

// Helper function to format time as string
const formatTimeOnly = (timeString) => {
  if (!timeString) return '-';
  const date = new Date(timeString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const getColumns = (type, isDexOrder = false) => {
  switch (type) {
    case 'simple':
      return isDexOrder
        ? [
            // DEX columns for placements
            {
              id: 'external_id',
              label: 'Transaction ID',
              align: 'left',
              isNotNumber: true,
              width: 3, // Make wider
            },
            {
              id: 'created_at',
              label: 'Time',
              align: 'left',
              isNotNumber: true,
            },
            { id: 'qty', label: 'Amount Sent', align: 'right' },
            {
              id: 'status',
              label: 'Status',
              align: 'center',
              isNotNumber: true,
            },
          ]
        : [
            // Non-DEX columns for placements
            { id: 'id', label: 'ID', align: 'left', isNotNumber: true, width: 3 }, // Make wider
            {
              id: 'created_at',
              label: 'Time',
              align: 'left',
              isNotNumber: true,
            },
            { id: 'qty', label: 'Ex Qty', align: 'right' },
            { id: 'base_qty', label: 'Base Quantity', align: 'right' },
            {
              id: 'placement_type',
              label: 'Type',
              align: 'center',
              isNotNumber: true,
            },
            {
              id: 'status',
              label: 'Status',
              align: 'center',
              isNotNumber: true,
            },
          ];
    case 'detail':
      return [
        {
          id: 'created_at',
          label: 'Time',
          align: 'left',
          isNotNumber: true,
        },
        { id: 'qty', label: 'Ex Qty', align: 'right' },
        { id: 'price', label: 'Price', align: 'right' },
        {
          id: 'placement_type',
          label: 'Type',
          align: 'center',
          isNotNumber: true,
        },
        {
          id: 'pct_filled',
          label: 'Filled',
          align: 'center',
          isNotNumber: true,
        },
        {
          id: 'status',
          label: 'Status',
          align: 'center',
          isNotNumber: true,
        },
      ];
    case 'fills':
      return [
        {
          id: 'external_id',
          label: isDexOrder ? 'Transaction ID' : 'External ID',
          align: 'left',
          isNotNumber: true,
          width: 3, // Make wider
        },
        {
          id: 'time',
          label: 'Time',
          align: 'left',
          isNotNumber: true,
        },
        ...(isDexOrder ? [] : [{ id: 'qty', label: 'Ex Qty', align: 'right' }]),
        { id: 'amount_received', label: 'Amount Received', align: 'right' },
        ...(isDexOrder ? [] : [{ id: 'price', label: 'Price', align: 'right' }]),
        {
          id: 'role',
          label: 'Role',
          align: 'center',
          isNotNumber: true,
        },
      ];
    default:
      return isDexOrder
        ? [
            // DEX columns for placements
            {
              id: 'external_id',
              label: 'Transaction ID',
              align: 'left',
              isNotNumber: true,
              width: 3, // Make wider
            },
            {
              id: 'created_at',
              label: 'Time',
              align: 'left',
              isNotNumber: true,
            },
            {
              id: 'status',
              label: 'Status',
              align: 'center',
              isNotNumber: true,
            },
          ]
        : [
            // Non-DEX columns for placements
            { id: 'id', label: 'ID', align: 'left', isNotNumber: true, width: 3 }, // Make wider
            {
              id: 'created_at',
              label: 'Time',
              align: 'left',
              isNotNumber: true,
            },
            { id: 'qty', label: 'Ex Qty', align: 'right' },
            {
              id: 'placement_type',
              label: 'Type',
              align: 'center',
              isNotNumber: true,
            },
            {
              id: 'status',
              label: 'Status',
              align: 'center',
              isNotNumber: true,
            },
          ];
  }
};

const statusColor = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'charts.orange';
    case 'FILLED':
      return 'success.main';
    case 'FAILED':
      return 'error.main';
    case 'MISSING':
      return 'error.main';
    case 'CANCELED':
      return 'error.main';
    default:
      return 'text.offWhite';
  }
};

const typeColor = (type) => {
  switch (type) {
    case 'MAKE':
      return 'success.main';
    case 'TAKE':
      return 'error.main';
    default:
      return 'text.offWhite';
  }
};

const getColumnWidth = (columnId, isDetailOrderView) => {
  switch (columnId) {
    case 'created_at':
      return isDetailOrderView ? 0.5 : 1;
    case 'external_id':
      return 2; // Consistent width for Transaction ID column
    case 'qty':
    case 'price':
    case 'amount_received':
      return 1.5; // 1.5x base width
    case 'placement_type':
    case 'pct_filled':
      return 0.8; // 0.8x base width
    default:
      return 1; // base width
  }
};

const pctFilledColor = (pctFilled) => {
  if (pctFilled === 100) {
    return 'success.main';
  }
  if (pctFilled === 0) {
    return 'text.secondary';
  }
  return 'primary.main';
};

const truncateExternalId = (externalId) => {
  if (!externalId) return '-';
  if (externalId.length <= 12) return externalId;
  return `${externalId.slice(0, 6)}...${externalId.slice(-6)}`;
};

const createTransactionLink = (externalId, network, theme) => {
  if (!externalId) return null;

  const explorerUrl = getExplorerUrl(externalId, network, 'transaction');
  if (!explorerUrl) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ChainIcon chainId={network} style={{ height: '16px', width: '16px' }} />
      <a
        href={explorerUrl}
        rel='noopener noreferrer'
        style={{
          color: theme.palette.common.pureWhite,
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
        target='_blank'
      >
        {truncateExternalId(externalId)}
      </a>
    </Box>
  );
};

function OrderDetailTable({
  data,
  dataLoading,
  isDetailOrderView = false,
  isFillsView = false,
  isSimpleOrderView = false,
  isDexOrder = false,
  network = '1', // Default to Ethereum mainnet
  paginationProps = {},
  title,
  targetBaseToken = null,
  targetToken = null,
}) {
  const theme = useTheme();

  const getType = () => {
    if (isSimpleOrderView) {
      return 'simple';
    }
    if (isDetailOrderView) {
      return 'detail';
    }
    if (isFillsView) {
      return 'fills';
    }
    return 'default';
  };

  const columns = getColumns(getType(), isDexOrder);

  const StyledCell = isDetailOrderView ? StyledCardTableCell : StyledTableCell;

  const cellStyles = {
    padding: '4px 8px', // Reduced vertical padding for subscript notation
  };

  const headerStyles = {
    padding: '8px',
    backgroundColor: isDetailOrderView ? theme.palette.background.card : theme.palette.background.container,
  };

  const renderHeaderRow = () => {
    const totalWeights = columns.reduce(
      (sum, column) => sum + (column.width || getColumnWidth(column.id, isDetailOrderView)),
      0
    );
    const baseWidth = 100 / totalWeights;

    return (
      <TableRow>
        {columns.map((column) => (
          <StyledHeaderTableCellWithLine
            align={column.align}
            key={`${column.id}_header`}
            style={headerStyles}
            width={`${baseWidth * (column.width || getColumnWidth(column.id, isDetailOrderView))}%`}
          >
            <Typography variant='body1'>{column.label}</Typography>
          </StyledHeaderTableCellWithLine>
        ))}
      </TableRow>
    );
  };

  const renderRow = (p, index) => {
    return (
      <TableRow
        key={p.id}
        sx={{
          animation: 'slideInFromTop 0.3s ease-out',
          animationFillMode: 'both',
          animationDelay: `${index * 20}ms`,
        }}
      >
        {columns.map((column) => {
          switch (column.id) {
            case 'created_at':
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography color='text.secondary' variant='body1'>
                    {formatTimeOnly(p.created_at)}
                  </Typography>
                </StyledCell>
              );
            case 'time':
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography color='text.secondary' variant='body1'>
                    {formatTimeOnly(p.time)}
                  </Typography>
                </StyledCell>
              );
            case 'placement_type':
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography color={typeColor(p.placement_type)} variant='body1'>
                    {p.placement_type}
                  </Typography>
                </StyledCell>
              );
            case 'role':
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography color={typeColor(p.role)} variant='body1'>
                    {p.role}
                  </Typography>
                </StyledCell>
              );
            case 'status': {
              let placementStatus = p.status;
              if (placementStatus === 'CANCEL_PENDING') {
                placementStatus = 'CANCEL';
              }
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography color={statusColor(p.status)} variant='body1'>
                    {placementStatus}
                  </Typography>
                </StyledCell>
              );
            }
            case 'pct_filled': {
              const formattedPctFilled = Math.round(Number(p.pct_filled));

              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography color={pctFilledColor(formattedPctFilled)} variant='body1'>
                    {formattedPctFilled}%
                  </Typography>
                </StyledCell>
              );
            }
            case 'exchange': {
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>{p.exchange}</Typography>
                </StyledCell>
              );
            }
            case 'external_id': {
              // Only show transaction links for DEX orders
              if (isDexOrder) {
                const transactionLink = createTransactionLink(p.external_id, network, theme);
                return (
                  <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                    {transactionLink ? (
                      <Typography component='span' variant='body1'>
                        {transactionLink}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChainIcon chainId={network} style={{ height: '16px', width: '16px' }} />
                        <Typography sx={{ color: theme.palette.common.pureWhite }} variant='body1'>
                          {p.external_id || '-'}
                        </Typography>
                      </Box>
                    )}
                  </StyledCell>
                );
              }
              // For non-DEX orders, just show the external ID as plain text
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>{p.external_id || '-'}</Typography>
                </StyledCell>
              );
            }
            case 'failure_reason':
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>{formatFailureReason(p.failure_reason)}</Typography>
                </StyledCell>
              );
            case 'price': {
              const priceValue = p[column.id];

              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>
                    {priceValue ? renderPriceWithSubscript(smartRound(priceValue)) : '-'}
                  </Typography>
                </StyledCell>
              );
            }
            case 'amount_received': {
              // For DEX fills, calculate the amount received
              const isDexFill = p.role === 'SWAP' || p.exchange === 'OKXDEX';
              const tokenSymbol = isDexOrder && targetBaseToken ? targetBaseToken : null;

              if (isDexFill && p.qty && p.price) {
                // For DEX swaps, amount received = executed_qty / executed_price
                const amountReceived = Number(p.qty) / Number(p.price);
                return (
                  <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                    <Typography variant='body1'>
                      {formatQty(amountReceived)}
                      {isDexOrder && tokenSymbol && (
                        <Typography component='span' sx={{ color: 'text.secondary', ml: 0.5 }} variant='body1'>
                          {tokenSymbol}
                        </Typography>
                      )}
                    </Typography>
                  </StyledCell>
                );
              }

              // For non-DEX fills, show '-' or the same as qty
              let displayValue = '-';
              if (!isDexFill && p.qty) {
                displayValue = formatQty(p.qty);
              }

              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>
                    {displayValue}
                    {isDexOrder && tokenSymbol && (
                      <Typography component='span' sx={{ color: 'text.secondary', ml: 0.5 }} variant='body1'>
                        {tokenSymbol}
                      </Typography>
                    )}
                  </Typography>
                </StyledCell>
              );
            }
            case 'qty': {
              const value = p[column.id];
              const tokenSymbol = isDexOrder && targetToken ? targetToken : null;
              return (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>
                    {value ? formatQty(value) : '-'}
                    {isDexOrder && tokenSymbol && (
                      <Typography component='span' sx={{ color: 'text.secondary', ml: 0.5 }} variant='body1'>
                        {tokenSymbol}
                      </Typography>
                    )}
                  </Typography>
                </StyledCell>
              );
            }
            default: {
              const value = p[column.id];
              return column.isNotNumber ? (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>{value}</Typography>
                </StyledCell>
              ) : (
                <StyledCell align={column.align} key={`${column.id}_bodyrow`} style={cellStyles}>
                  <Typography variant='body1'>{value ? formatQty(value) : '-'}</Typography>
                </StyledCell>
              );
            }
          }
        })}
      </TableRow>
    );
  };

  return (
    <Stack
      direction='column'
      sx={{
        height: '100%',
        '@keyframes slideInFromTop': {
          '0%': {
            opacity: 0,
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {!isDetailOrderView && (
        <Typography color='text.offWhite' sx={{ p: 2 }} variant='subtitle2'>
          {title}
        </Typography>
      )}
      <DataComponent
        emptyComponent={
          <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
            <Typography align='center' variant='body3'>
              No {title}
            </Typography>
          </Box>
        }
        isEmpty={data?.length === 0}
        isLoading={dataLoading}
        loadingComponent={
          <Stack spacing={2}>
            <BigSkeleton height='80px' />
            <BigSkeleton height='80px' />
            <BigSkeleton height='80px' />
          </Stack>
        }
      >
        <Stack direction='column' justifyContent='space-between' sx={{ height: '100%' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>{renderHeaderRow()}</TableHead>
              <TableBody>{data.map((p, index) => renderRow(p, index))}</TableBody>
              {paginationProps && Object.keys(paginationProps).length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      count={paginationProps.totalRows || 0}
                      page={paginationProps.currentPageNumber || 0}
                      rowsPerPage={paginationProps.currentPageSize || 10}
                      rowsPerPageOptions={[]}
                      sx={{
                        border: 0,
                        borderTop: `1px solid ${theme.palette.grey[600]}`,
                        overflow: 'visible',
                        '& .MuiTablePagination-displayedRows': {
                          fontSize: '10px',
                        },
                        '& .MuiTablePagination-actions': {
                          marginLeft: '4px',
                        },
                      }}
                      onPageChange={(e, newPage) => paginationProps.setCurrentPageNumber?.(newPage)}
                    />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        </Stack>
      </DataComponent>
    </Stack>
  );
}

export default OrderDetailTable;
