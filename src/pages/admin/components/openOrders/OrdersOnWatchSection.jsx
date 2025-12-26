import { ExchangeIcon } from '@/shared/components/Icons';
import {
  StyledHeaderTableCellWithLine,
  StyledTableCell,
  getOrderPath,
  parseStatus,
  parseSide,
} from '@/shared/orderTable/util';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { formatQty } from '@/util';

function StatusTransition({ fromStatus, toStatus, resolved }) {
  const isDifferent = fromStatus !== toStatus;

  // dont parseStatus so that we can see the raw status i.e. FINISHER instead of Active
  return (
    <Stack alignItems='center' direction='row' spacing={1} sx={{ fontWeight: 500 }}>
      <Box>{fromStatus}</Box>
      {isDifferent && (
        <Typography color='text.disabled' fontSize='0.75rem'>
          ⟶
        </Typography>
      )}
      {isDifferent && <Box>{toStatus}</Box>}
      {resolved && (
        <Typography color='success.main' fontSize='0.75rem' fontWeight={600}>
          Resolved
        </Typography>
      )}
    </Stack>
  );
}

export default function OrdersOnWatchSection({
  ordersOnWatch,
  selectedWatchIds,
  selectedCount,
  allSelected,
  allSelectableCount,
  canResolveSelected,
  canResumeSelected,
  isBulkResolving,
  isBulkResuming,
  excludeResolved,
  onToggleExcludeResolved,
  showEventsHistory,
  onToggleHistory,
  historicalEvents,
  activeEvent,
  selectedEventId,
  onSelectEvent,
  onClearSelection,
  onToggleSelectAll,
  onToggleWatch,
  onBulkResolve,
  onBulkResume,
  onResolveWatch,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedWatchSet = useMemo(() => new Set(selectedWatchIds), [selectedWatchIds]);

  const visibleOrders = useMemo(
    () => (excludeResolved ? ordersOnWatch.filter((watch) => !(watch.resolved_at || watch.resolved)) : ordersOnWatch),
    [excludeResolved, ordersOnWatch]
  );

  const handleToggleHistory = () => {
    if (onToggleHistory) {
      onToggleHistory(!showEventsHistory);
    }
  };

  const handleSelectChange = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event.target.value || null);
    }
  };

  return (
    <>
      <Card sx={{ mt: 2 }}>
        <CardHeader
          action={
            <Stack alignItems='center' direction='row' spacing={2}>
              {historicalEvents.length > 0 && (
                <Button
                  size='small'
                  startIcon={showEventsHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  variant='outlined'
                  onClick={handleToggleHistory}
                >
                  {showEventsHistory ? 'Hide' : 'Show'} History ({historicalEvents.length})
                </Button>
              )}
              {(historicalEvents.length > 0 || activeEvent) && (
                <FormControl size='small' sx={{ minWidth: 250 }}>
                  <InputLabel>View Event</InputLabel>
                  <Select label='View Event' value={selectedEventId || ''} onChange={handleSelectChange}>
                    {activeEvent && (
                      <MenuItem value=''>
                        <em>Current Active Event</em>
                      </MenuItem>
                    )}
                    {historicalEvents.map((event) => (
                      <MenuItem key={event.id} value={event.id}>
                        {new Date(event.enabled_at).toLocaleString()}
                        {event.disabled_at && ` - ${new Date(event.disabled_at).toLocaleString()}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Stack alignItems='center' direction='row' spacing={1}>
                <Checkbox
                  checked={excludeResolved}
                  color='primary'
                  size='small'
                  onChange={(event) => onToggleExcludeResolved?.(event.target.checked)}
                />
                <Typography color='text.secondary' variant='body2'>
                  Exclude resolved
                </Typography>
              </Stack>
            </Stack>
          }
          title={
            <Stack alignItems='center' direction='row' spacing={2}>
              <Typography variant='h6'>
                Orders on Watch ({ordersOnWatch.length}){activeEvent && !selectedEventId && ' - Current Event'}
                {selectedEventId && ' - Historical Event'}
              </Typography>
            </Stack>
          }
        />
        {visibleOrders.length > 0 ? (
          <CardContent>
            <Stack
              alignItems='center'
              direction={{ xs: 'column', md: 'row' }}
              justifyContent='flex-start'
              spacing={1.5}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.light, 0.08),
              }}
            >
              <Stack alignItems='center' direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <LoadingButton
                  color='success'
                  disabled={!canResolveSelected || isBulkResuming}
                  loading={isBulkResolving}
                  loadingPosition='start'
                  size='medium'
                  startIcon={<CheckCircleIcon />}
                  variant='contained'
                  onClick={onBulkResolve}
                >
                  Resolve Selected
                </LoadingButton>
                <LoadingButton
                  color='primary'
                  disabled={!canResumeSelected || isBulkResolving || isBulkResuming}
                  loading={isBulkResuming}
                  loadingPosition='start'
                  size='medium'
                  startIcon={<PlayCircleOutlineIcon />}
                  variant='contained'
                  onClick={onBulkResume}
                >
                  Resume Selected
                </LoadingButton>
              </Stack>
            </Stack>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <StyledHeaderTableCellWithLine align='center' sx={{ width: 56 }}>
                      <Checkbox checked={allSelected} size='small' onChange={onToggleSelectAll} />
                    </StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Exchanges</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Pair</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Side</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Target Qty</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Executed Qty</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Status</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine align='right'>Actions</StyledHeaderTableCellWithLine>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleOrders.map((watch) => {
                    let exchanges = [];
                    if (Array.isArray(watch.exchanges)) {
                      exchanges = watch.exchanges;
                    } else if (watch.exchange) {
                      exchanges = [watch.exchange];
                    }
                    const isResolved = Boolean(watch.resolved_at || watch.resolved);
                    const isSelected = selectedWatchSet.has(watch.watch_id);
                    const formattedTargetQty = watch.target_order_qty
                      ? `${formatQty(watch.target_order_qty)} ${watch.target_token || ''}`.trim()
                      : '—';
                    const formattedExecutedQty = watch.target_executed_qty
                      ? `${formatQty(watch.target_executed_qty)} ${watch.target_token || ''}`.trim()
                      : '—';

                    const orderForPath = {
                      id: watch.order_id,
                      is_simple: watch.is_simple,
                      side: watch.side,
                      // Treat multi orders as parent containers when building the path.
                      child_order_ids: watch.order_type === 'Multi' ? [] : null,
                    };

                    return (
                      <TableRow
                        hover
                        key={watch.watch_id}
                        sx={{
                          backgroundColor: isResolved ? alpha(theme.palette.success.main, 0.08) : 'inherit',
                          transition: 'background-color 0.2s ease',
                          '&:hover': {
                            backgroundColor: isResolved
                              ? alpha(theme.palette.success.main, 0.16)
                              : theme.palette.action.hover,
                          },
                        }}
                      >
                        <StyledTableCell align='center'>
                          <Checkbox
                            checked={isSelected}
                            size='small'
                            onChange={() => onToggleWatch?.(watch.watch_id)}
                          />
                        </StyledTableCell>
                        <StyledTableCell>
                          {exchanges.length ? (
                            <Stack direction='row' spacing={0.5}>
                              {exchanges.map((exchange) => (
                                <ExchangeIcon
                                  exchangeName={exchange}
                                  key={`exchange-${exchange}`}
                                  style={{ height: '24.75px', width: '24.75px' }}
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Typography color='text.secondary' variant='caption'>
                              —
                            </Typography>
                          )}
                        </StyledTableCell>
                        <StyledTableCell>{watch.pair}</StyledTableCell>
                        <StyledTableCell>{parseSide(watch.side)}</StyledTableCell>
                        <StyledTableCell>{formattedTargetQty}</StyledTableCell>
                        <StyledTableCell>{formattedExecutedQty}</StyledTableCell>
                        <StyledTableCell>
                          <StatusTransition
                            fromStatus={watch.order_status_at_watch}
                            resolved={isResolved}
                            toStatus={watch.current_status}
                          />
                        </StyledTableCell>
                        <StyledTableCell align='right'>
                          <Tooltip title='View order detail'>
                            <span>
                              <IconButton
                                size='small'
                                sx={{ mr: 0.5 }}
                                onAuxClick={(event) => {
                                  event.stopPropagation();
                                  const url = getOrderPath(orderForPath);
                                  if (url) {
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  const url = getOrderPath(orderForPath);
                                  if (url) {
                                    navigate(url);
                                  }
                                }}
                              >
                                <QueryStatsIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={isResolved ? 'Already resolved' : 'Mark as resolved'}>
                            <span>
                              <IconButton
                                disabled={isResolved}
                                size='small'
                                onClick={() => onResolveWatch?.(watch.watch_id)}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </StyledTableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        ) : (
          <CardContent>
            <Box alignItems='center' display='flex' justifyContent='center' sx={{ p: 4 }}>
              <Typography color='text.secondary'>
                {selectedEventId && 'No watched orders for this event'}
                {!selectedEventId && activeEvent && 'No unresolved watched orders'}
                {!selectedEventId && !activeEvent && 'No watched orders'}
              </Typography>
            </Box>
          </CardContent>
        )}
      </Card>

      <Collapse in={showEventsHistory}>
        <Card sx={{ mt: 2 }}>
          <CardHeader
            title={
              <Stack alignItems='center' direction='row' spacing={1}>
                <HistoryIcon />
                <Typography variant='h6'>Maintenance Event History</Typography>
              </Stack>
            }
          />
          <CardContent>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <StyledHeaderTableCellWithLine>Enabled At</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Disabled At</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Duration</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Watched Orders</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine>Resolved</StyledHeaderTableCellWithLine>
                    <StyledHeaderTableCellWithLine align='right'>Actions</StyledHeaderTableCellWithLine>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historicalEvents.map((event) => {
                    const durationMinutes = event.duration_seconds ? Math.round(event.duration_seconds / 60) : null;
                    return (
                      <TableRow hover key={event.id}>
                        <StyledTableCell>{new Date(event.enabled_at).toLocaleString()}</StyledTableCell>
                        <StyledTableCell>
                          {event.disabled_at ? new Date(event.disabled_at).toLocaleString() : 'Active'}
                        </StyledTableCell>
                        <StyledTableCell>{durationMinutes ? `${durationMinutes} min` : '-'}</StyledTableCell>
                        <StyledTableCell>{event.watched_orders_count}</StyledTableCell>
                        <StyledTableCell>{event.resolved_orders_count}</StyledTableCell>
                        <StyledTableCell align='right'>
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => {
                              onSelectEvent?.(event.id);
                              onToggleHistory?.(false);
                            }}
                          >
                            View Orders
                          </Button>
                        </StyledTableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Collapse>
    </>
  );
}
