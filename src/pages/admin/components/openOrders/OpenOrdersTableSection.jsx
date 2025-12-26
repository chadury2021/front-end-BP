import {
  CancelOrderButton,
  PauseOrderButton,
  ResumeOrderButton,
  ViewOrderButton,
} from '@/shared/orderTable/tableActions';
import DisplayRowDetails from '@/shared/orderTable/DisplayRowDetails';
import { StyledHeaderTableCellWithLine, StyledTableCell } from '@/shared/orderTable/util';
import {
  ApiError,
  cancelBatchOrder,
  cancelChainedOrder,
  cancelMultiOrder,
  submitCancel,
  pauseMultiOrder,
  resumeMultiOrder,
} from '@/apiServices';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  Badge,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton as MuiIconButton,
  List,
  ListItem,
  ListItemText,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';

const getOrderType = (row) => {
  if (row.side === 'Multi') return 'Multi';
  if (row.side === 'Chained') return 'Chained';
  if (row.side === 'Batch') return 'Batch';
  return 'Single';
};

export default function OpenOrdersTableSection({
  columns,
  excludedStatuses,
  grouped,
  standalone,
  sortState,
  onSort,
  lastRefreshAt,
  onReload,
  onExcludedStatusesChange,
  emptyMessage = 'No open orders',
}) {
  const theme = useTheme();

  const handleSortClick = (columnId) => {
    if (onSort) {
      onSort(columnId);
    }
  };

  const handleToggleExclude = (statusValue) => {
    if (!onExcludedStatusesChange) return;
    const list = Array.isArray(excludedStatuses) ? excludedStatuses : [];
    const next = list.includes(statusValue) ? list.filter((s) => s !== statusValue) : [...list, statusValue];
    onExcludedStatusesChange(next);
  };

  return (
    <Card>
      <CardHeader
        action={
          lastRefreshAt ? (
            <Stack alignItems='center' direction='row' marginRight={2} spacing={1}>
              <Typography sx={{ color: 'primary.main', display: 'inline-flex', gap: 1 }} variant='subtitle2'>
                <span>Updated</span>
                <AnimatePresence initial={false} mode='wait'>
                  <motion.span
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    initial={{ y: 6, opacity: 0 }}
                    key={new Date(lastRefreshAt).toLocaleTimeString()}
                    style={{ display: 'inline-block' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    {new Date(lastRefreshAt).toLocaleTimeString()}
                  </motion.span>
                </AnimatePresence>
              </Typography>
            </Stack>
          ) : null
        }
        title={<Typography variant='h6'>Open Orders</Typography>}
      />
      <CardContent>
        <Stack spacing={1} sx={{ mb: 1.5 }}>
          <Typography color='text.secondary' variant='body2'>
            Excluded statuses
          </Typography>
          <Stack alignItems='center' direction='row' flexWrap='wrap' gap={1}>
            <Chip
              color={excludedStatuses?.includes('ACTIVE') ? 'warning' : 'default'}
              icon={<DoNotDisturbOnOutlinedIcon fontSize='small' />}
              label='Active'
              size='small'
              sx={{ borderRadius: 999, fontWeight: 600 }}
              variant={excludedStatuses?.includes('ACTIVE') ? 'filled' : 'outlined'}
              onClick={() => handleToggleExclude('ACTIVE')}
            />
            <Chip
              color={excludedStatuses?.includes('PAUSED') ? 'warning' : 'default'}
              icon={<DoNotDisturbOnOutlinedIcon fontSize='small' />}
              label='Paused'
              size='small'
              sx={{ borderRadius: 999, fontWeight: 600 }}
              variant={excludedStatuses?.includes('PAUSED') ? 'filled' : 'outlined'}
              onClick={() => handleToggleExclude('PAUSED')}
            />
            <Chip
              color={excludedStatuses?.includes('SCHEDULED') ? 'warning' : 'default'}
              icon={<DoNotDisturbOnOutlinedIcon fontSize='small' />}
              label='Scheduled'
              size='small'
              sx={{ borderRadius: 999, fontWeight: 600 }}
              variant={excludedStatuses?.includes('SCHEDULED') ? 'filled' : 'outlined'}
              onClick={() => handleToggleExclude('SCHEDULED')}
            />
          </Stack>
        </Stack>
        <TableContainer>
          <Table stickyHeader size='small'>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledHeaderTableCellWithLine
                    align={column.align}
                    key={`open-orders-header-${column.id}`}
                    sx={{ width: column.width || undefined, minWidth: column.width || undefined, whiteSpace: 'nowrap' }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortState.columnId === column.id}
                        direction={sortState.columnId === column.id && sortState.direction === 'desc' ? 'desc' : 'asc'}
                        hideSortIcon={!column.label}
                        onClick={() => handleSortClick(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </StyledHeaderTableCellWithLine>
                ))}
                <StyledHeaderTableCellWithLine align='right' key='actions' sx={{ width: 100, whiteSpace: 'nowrap' }}>
                  Actions
                </StyledHeaderTableCellWithLine>
              </TableRow>
            </TableHead>
            <TableBody>
              {grouped.map(({ parent, parentId, children }) => {
                const parentOrderForView = parent || { id: parentId, child_order_ids: [] };
                return (
                  <React.Fragment key={`parent-group-${parentId}`}>
                    <TableRow>
                      <StyledTableCell
                        colSpan={columns.length + 1}
                        sx={{ backgroundColor: alpha(theme.palette.primary.light, 0.12) }}
                      >
                        <Stack alignItems='center' direction='row' justifyContent='flex-start' spacing={1}>
                          <Typography sx={{ fontWeight: 600 }} variant='subtitle2'>
                            <Link
                              color='primary'
                              href={`/multi_order/${parentId}`}
                              rel='noopener noreferrer'
                              target='_blank'
                              underline='hover'
                            >
                              {`MULTI - ${String(parentId).slice(0, 8)}`}
                            </Link>
                          </Typography>
                          <Stack alignItems='center' direction='row' spacing={1} sx={{ ml: 2 }}>
                            <Tooltip title='Pause Parent'>
                              <span>
                                <IconButton
                                  aria-label='pause-parent'
                                  size='small'
                                  sx={{ p: 0 }}
                                  onClick={async () => {
                                    await pauseMultiOrder(parentId);
                                    await onReload?.();
                                  }}
                                >
                                  <PauseCircleOutlineIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title='Resume Parent'>
                              <span>
                                <IconButton
                                  aria-label='resume-parent'
                                  size='small'
                                  sx={{ p: 0 }}
                                  onClick={async () => {
                                    await resumeMultiOrder(parentId);
                                    await onReload?.();
                                  }}
                                >
                                  <PlayCircleOutlineIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title='Cancel Parent'>
                              <span>
                                <IconButton
                                  aria-label='cancel-parent'
                                  color='error'
                                  size='small'
                                  sx={{ p: 0 }}
                                  onClick={async () => {
                                    await cancelMultiOrder(parentId);
                                    await onReload?.();
                                  }}
                                >
                                  <HighlightOffIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </StyledTableCell>
                    </TableRow>
                    {children.map((row) => {
                      const orderType = getOrderType(row);
                      const isPaused = row.status === 'PAUSED';
                      return (
                        <TableRow hover key={`open-order-row-${row.id}`}>
                          {columns.map((column) => (
                            <DisplayRowDetails
                              column={column}
                              key={`open-order-row-${row.id}-${column.id}`}
                              row={row}
                              StyledCell={StyledTableCell}
                              theme={theme}
                            />
                          ))}
                          <StyledTableCell align='right' sx={{ minWidth: 100 }}>
                            <Stack alignItems='center' direction='row' justifyContent='flex-end' spacing={1}>
                              <ViewOrderButton orderRow={row} />
                              {isPaused ? (
                                <ResumeOrderButton orderRefresh={onReload} orderRow={row} orderType={orderType} />
                              ) : (
                                <PauseOrderButton orderRefresh={onReload} orderRow={row} orderType={orderType} />
                              )}
                              <CancelOrderButton
                                disabled={['COMPLETE', 'CANCELED'].includes(row.status)}
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  try {
                                    if (orderType === 'Multi') {
                                      await cancelMultiOrder(row.id);
                                    } else if (orderType === 'Chained') {
                                      await cancelChainedOrder(row.id);
                                    } else if (orderType === 'Batch') {
                                      await cancelBatchOrder(row.id);
                                    } else {
                                      await submitCancel(row.id);
                                    }
                                    await onReload?.();
                                  } catch (error) {
                                    if (!(error instanceof ApiError)) throw error;
                                  }
                                }}
                              />
                            </Stack>
                          </StyledTableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {standalone.map((row) => {
                const orderType = getOrderType(row);
                const isPaused = row.status === 'PAUSED';
                return (
                  <TableRow hover key={`open-order-row-${row.id}`}>
                    {columns.map((column) => (
                      <DisplayRowDetails
                        column={column}
                        key={`standalone-open-order-${row.id}-${column.id}`}
                        row={row}
                        StyledCell={StyledTableCell}
                        theme={theme}
                      />
                    ))}
                    <StyledTableCell align='right' sx={{ minWidth: 100 }}>
                      <Stack alignItems='center' direction='row' justifyContent='flex-end' spacing={1}>
                        <ViewOrderButton orderRow={row} />
                        {isPaused ? (
                          <ResumeOrderButton orderRefresh={onReload} orderRow={row} orderType={orderType} />
                        ) : (
                          <PauseOrderButton orderRefresh={onReload} orderRow={row} orderType={orderType} />
                        )}
                        <CancelOrderButton
                          disabled={['COMPLETE', 'CANCELED'].includes(row.status)}
                          onClick={async (event) => {
                            event.stopPropagation();
                            try {
                              if (orderType === 'Multi') {
                                await cancelMultiOrder(row.id);
                              } else if (orderType === 'Chained') {
                                await cancelChainedOrder(row.id);
                              } else if (orderType === 'Batch') {
                                await cancelBatchOrder(row.id);
                              } else {
                                await submitCancel(row.id);
                              }
                              await onReload?.();
                            } catch (error) {
                              if (!(error instanceof ApiError)) throw error;
                            }
                          }}
                        />
                      </Stack>
                    </StyledTableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {standalone.length === 0 && grouped.length === 0 && (
            <Box alignItems='center' display='flex' justifyContent='center' sx={{ p: 4 }}>
              <Typography color='text.secondary'>{emptyMessage}</Typography>
            </Box>
          )}
        </TableContainer>
      </CardContent>
    </Card>
  );
}
