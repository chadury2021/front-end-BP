import {
  getMaintenanceEvents,
  getMaintenanceModeStatus,
  getOrdersOnWatch,
  resolveOrderOnWatch,
  resolveOrdersOnWatchBulk,
  toggleMaintenanceMode,
} from '@/apiServices';
import { useAdminPanelData } from '@/shared/context/AdminPanelDataProvider';
import { useToast } from '@/shared/context/ToastProvider';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MaintenanceModeCard from './components/openOrders/MaintenanceModeCard';
import OpenOrdersTableSection from './components/openOrders/OpenOrdersTableSection';
import OrdersOnWatchSection from './components/openOrders/OrdersOnWatchSection';
import ResumeOrdersDialog from './components/openOrders/ResumeOrdersDialog';

const normalizeNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value).replace(/[^0-9+-.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeDateValue = (value) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return null;
  return String(value).toLowerCase();
};

const logError = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
};

const columns = [
  { id: 'exchanges', label: '', width: 24, align: 'left', sortable: false },
  { id: 'pair', label: 'Pair', width: 80, align: 'left', sortable: true },
  { id: 'side', label: 'Side', width: 80, align: 'left', sortable: true },
  { id: 'target_qty', label: 'Target Qty', width: 80, align: 'left', sortable: true },
  { id: 'pct_filled', label: 'Progress', width: 100, align: 'center', sortable: true },
  { id: 'status', label: 'Status', width: 80, align: 'left', sortable: true },
  { id: 'time_start', label: 'Time Start', width: 100, align: 'left', sortable: true },
  {
    id: 'resume_condition_normal',
    label: 'Resume Condition',
    width: 120,
    align: 'left',
    sortable: true,
  },
  {
    id: 'order_condition_normal',
    label: 'Order Condition',
    width: 120,
    align: 'left',
    sortable: true,
  },
];

export default function OpenOrdersPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [ordersOnWatch, setOrdersOnWatch] = useState([]);
  const [maintenanceEvents, setMaintenanceEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showEventsHistory, setShowEventsHistory] = useState(false);
  const [selectedWatchIds, setSelectedWatchIds] = useState([]);
  const [isBulkResolving, setIsBulkResolving] = useState(false);
  const [isBulkResuming, setIsBulkResuming] = useState(false);
  const [excludeResolvedWatched, setExcludeResolvedWatched] = useState(true);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeDialogCandidates, setResumeDialogCandidates] = useState([]);
  const [excludedStatuses, setExcludedStatuses] = useState([]);
  const { openOrders, reload, reloadOpenOrders } = useAdminPanelData();
  const { showToastMessage } = useToast();
  const openOrdersIntervalRef = useRef(null);
  const watchIntervalRef = useRef(null);
  const reloadRef = useRef(reloadOpenOrders);
  const openOrdersInFlightRef = useRef(false);
  const watchInFlightRef = useRef(false);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [sortState, setSortState] = useState({ columnId: null, direction: 'asc' });
  const [maintenanceTargetExchanges, setMaintenanceTargetExchanges] = useState([]);
  const collator = useMemo(() => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }), []);
  useEffect(() => {
    reloadRef.current = reloadOpenOrders;
  }, [reloadOpenOrders]);

  const excludedStatusSet = useMemo(() => new Set(excludedStatuses), [excludedStatuses]);

  const filteredOpenOrders = useMemo(() => {
    const rows = Array.isArray(openOrders) ? openOrders.filter(Boolean) : [];
    if (!excludedStatusSet.size) {
      return rows;
    }
    return rows.filter((row) => row && !excludedStatusSet.has(row.status));
  }, [openOrders, excludedStatusSet]);

  const hasActiveFilters = excludedStatuses.length > 0;

  const refreshWatchedOrders = useCallback(
    async (eventIdOverride) => {
      const targetEventId = typeof eventIdOverride !== 'undefined' ? eventIdOverride : selectedEventId;
      try {
        const data = await getOrdersOnWatch(targetEventId ?? null);
        setOrdersOnWatch(data.orders_on_watch || []);
      } catch (error) {
        logError('Failed to fetch orders on watch:', error);
      }
    },
    [selectedEventId]
  );

  const handleSort = useCallback((columnId) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column?.sortable) {
      return;
    }

    setSortState((prev) => {
      if (prev.columnId !== columnId) {
        return { columnId, direction: 'asc' };
      }

      if (prev.direction === 'asc') {
        return { columnId, direction: 'desc' };
      }

      return { columnId: null, direction: 'asc' };
    });
  }, []);

  const getSortValue = useCallback((row, columnId) => {
    if (!row || !columnId) return null;

    switch (columnId) {
      case 'pair': {
        if (row.pair) {
          return normalizeText(row.pair);
        }
        if (row.pairs) {
          const firstPair = String(row.pairs)
            .split(',')
            .map((part) => part.trim())
            .find(Boolean);
          return normalizeText(firstPair);
        }
        return null;
      }
      case 'side':
      case 'status':
      case 'resume_condition_normal':
      case 'order_condition_normal':
        return normalizeText(row[columnId]);
      case 'target_qty': {
        const value = row[columnId] ?? row.target_order_qty ?? row.targetQty;
        return normalizeNumber(value);
      }
      case 'pct_filled': {
        const value = row[columnId];
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return value;
        const cleaned = String(value).replace(/%/g, '');
        return normalizeNumber(cleaned);
      }
      case 'time_start': {
        const value = row[columnId] ?? row.start_time ?? row.timeStart;
        return normalizeDateValue(value);
      }
      default: {
        const candidate = row[columnId];
        const numeric = normalizeNumber(candidate);
        if (numeric !== null) {
          return numeric;
        }
        return normalizeText(candidate);
      }
    }
  }, []);

  useEffect(() => {
    setSelectedWatchIds((prev) => {
      if (!prev.length) {
        return prev;
      }
      const validIds = new Set(ordersOnWatch.filter((watch) => !watch.resolved).map((watch) => watch.watch_id));
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [ordersOnWatch]);

  useEffect(() => {
    setSelectedWatchIds([]);
  }, [selectedEventId]);

  useEffect(() => {
    // initial fetch so we don't wait for the first interval tick
    reloadRef.current?.();
    refreshWatchedOrders();

    // start 5s polling for open orders; cleanup on unmount
    openOrdersIntervalRef.current = setInterval(() => {
      if (openOrdersInFlightRef.current) return;
      openOrdersInFlightRef.current = true;
      Promise.resolve(reloadRef.current?.())
        .catch(() => {})
        .finally(() => {
          openOrdersInFlightRef.current = false;
          setLastRefreshAt(new Date());
        });
    }, 5000);

    // start 5s polling for watched orders; cleanup on unmount
    watchIntervalRef.current = setInterval(() => {
      if (watchInFlightRef.current) return;
      watchInFlightRef.current = true;
      Promise.resolve(refreshWatchedOrders())
        .catch(() => {})
        .finally(() => {
          watchInFlightRef.current = false;
        });
    }, 5000);

    return () => {
      if (openOrdersIntervalRef.current) {
        clearInterval(openOrdersIntervalRef.current);
        openOrdersIntervalRef.current = null;
      }
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
    };
  }, [refreshWatchedOrders]);

  // Fetch maintenance mode status and events (orders on watch handled by 5s loop)
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const status = await getMaintenanceModeStatus();
        setMaintenanceMode(status.enabled);
      } catch (error) {
        logError('Failed to fetch maintenance mode status:', error);
      }
    };

    const fetchMaintenanceEvents = async () => {
      try {
        const data = await getMaintenanceEvents();
        setMaintenanceEvents(data.events || []);
      } catch (error) {
        logError('Failed to fetch maintenance events:', error);
      }
    };

    fetchMaintenanceStatus();
    fetchMaintenanceEvents();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchMaintenanceStatus();
      fetchMaintenanceEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshWatchedOrders]);

  const handleMaintenanceModeToggle = async (event) => {
    const newValue = event.target.checked;
    try {
      const displayedOrderIds = Array.from(new Set((openOrders || []).map((order) => order?.id).filter(Boolean)));
      const result = await toggleMaintenanceMode(
        newValue,
        newValue ? displayedOrderIds : [],
        newValue ? maintenanceTargetExchanges : []
      );
      setMaintenanceMode(newValue);
      showToastMessage({
        message: result.message || (newValue ? 'Maintenance mode enabled' : 'Maintenance mode disabled'),
        type: 'success',
        anchor: 'top-center',
      });

      // Refresh data
      if (newValue) {
        const eventsData = await getMaintenanceEvents();
        const events = eventsData.events || [];
        setMaintenanceEvents(events);

        const newActiveEvent = events.find((e) => e.is_active);
        if (newActiveEvent?.id) {
          setSelectedEventId(newActiveEvent.id);
          await refreshWatchedOrders(newActiveEvent.id);
        } else {
          await refreshWatchedOrders(null);
        }
      }
    } catch (error) {
      showToastMessage({
        message: `Failed to toggle maintenance mode: ${error.message}`,
        type: 'error',
        anchor: 'top-center',
      });
      // Revert the toggle
      setMaintenanceMode(!newValue);
    }
  };

  const handleResolveWatch = async (watchId) => {
    try {
      await resolveOrderOnWatch(watchId);
      await refreshWatchedOrders();
    } catch (error) {
      showToastMessage({
        message: `Failed to resolve watch record: ${error.message}`,
        type: 'error',
        anchor: 'top-center',
      });
      return;
    }
    setSelectedWatchIds((prev) => prev.filter((id) => id !== watchId));
    showToastMessage({
      message: 'Order watch record resolved',
      type: 'success',
      anchor: 'top-center',
    });
  };

  const activeEvent = maintenanceEvents.find((e) => e.is_active);
  const historicalEvents = maintenanceEvents.filter((e) => !e.is_active);

  useEffect(() => {
    // When there is no active maintenance event, default to showing the most recent
    // historical event so the watch list doesn't appear empty immediately after
    // maintenance mode is turned off.
    if (activeEvent || selectedEventId || !historicalEvents.length) {
      return;
    }

    const sortedByEnabledAtDesc = [...historicalEvents].sort(
      (a, b) => new Date(b.enabled_at).getTime() - new Date(a.enabled_at).getTime()
    );
    const latestEvent = sortedByEnabledAtDesc[0];
    if (latestEvent?.id) {
      setSelectedEventId((prev) => prev || latestEvent.id);
    }
  }, [activeEvent, historicalEvents, selectedEventId]);

  const baseGrouping = useMemo(() => {
    const rows = Array.isArray(filteredOpenOrders) ? filteredOpenOrders : [];
    const groups = new Map();

    rows.forEach((row) => {
      if (!row) return;

      if (row.parent_order_id) {
        if (!groups.has(row.parent_order_id)) {
          groups.set(row.parent_order_id, { parent: null, children: [] });
        }
        groups.get(row.parent_order_id).children.push(row);
        return;
      }

      if (Array.isArray(row.child_order_ids) && row.child_order_ids.length > 0) {
        if (!groups.has(row.id)) {
          groups.set(row.id, { parent: row, children: [] });
        } else {
          const existing = groups.get(row.id);
          existing.parent = row;
          groups.set(row.id, existing);
        }
      }
    });

    const groupedResults = Array.from(groups.entries())
      .filter(([, group]) => group.children.length > 0)
      .map(([parentId, group]) => ({
        parentId,
        parent: group.parent || null,
        children: group.children,
      }));

    const parentIds = new Set(groupedResults.map((group) => group.parentId));
    const standaloneResults = rows.filter((row) => !row?.parent_order_id && !parentIds.has(row?.id));

    return { grouped: groupedResults, standalone: standaloneResults };
  }, [filteredOpenOrders]);

  const sortedGrouping = useMemo(() => {
    if (!baseGrouping) {
      return { grouped: [], standalone: [] };
    }

    if (!sortState.columnId) {
      return baseGrouping;
    }

    const directionMultiplier = sortState.direction === 'desc' ? -1 : 1;

    const compareCore = (a, b) => {
      const valueA = getSortValue(a, sortState.columnId);
      const valueB = getSortValue(b, sortState.columnId);

      if (valueA === null && valueB === null) return 0;
      if (valueA === null) return 1;
      if (valueB === null) return -1;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        if (valueA === valueB) return 0;
        return valueA < valueB ? -1 : 1;
      }

      return collator.compare(String(valueA ?? ''), String(valueB ?? ''));
    };

    const comparator = (a, b) => compareCore(a, b) * directionMultiplier;

    const sortedStandalone = [...baseGrouping.standalone].sort((a, b) => comparator(a, b));

    const groupsWithSortedChildren = baseGrouping.grouped.map((group) => ({
      ...group,
      children: [...group.children].sort((a, b) => comparator(a, b)),
    }));

    const sortedGroups = groupsWithSortedChildren.slice().sort((a, b) => comparator(a.children?.[0], b.children?.[0]));

    return { grouped: sortedGroups, standalone: sortedStandalone };
  }, [baseGrouping, sortState, getSortValue, collator]);

  const { grouped, standalone } = sortedGrouping;

  const selectableWatchIds = useMemo(
    () =>
      (excludeResolvedWatched
        ? ordersOnWatch.filter((watch) => !(watch.resolved_at || watch.resolved))
        : ordersOnWatch
      ).map((watch) => watch.watch_id),
    [excludeResolvedWatched, ordersOnWatch]
  );

  const selectedWatchSet = useMemo(() => new Set(selectedWatchIds), [selectedWatchIds]);

  const selectedWatchRecords = useMemo(
    () =>
      (excludeResolvedWatched
        ? ordersOnWatch.filter((watch) => !(watch.resolved_at || watch.resolved))
        : ordersOnWatch
      ).filter((watch) => selectedWatchSet.has(watch.watch_id)),
    [excludeResolvedWatched, ordersOnWatch, selectedWatchSet]
  );

  const selectedCount = selectedWatchRecords.length;
  const allSelectableCount = selectableWatchIds.length;
  const allSelected = allSelectableCount > 0 && selectedCount === allSelectableCount;
  const resumeEligibleCount = selectedWatchRecords.reduce(
    (count, watch) => (watch.current_status === 'PAUSED' ? count + 1 : count),
    0
  );
  const canResolveSelected = selectedCount > 0;
  const canResumeSelected = resumeEligibleCount > 0;

  const toggleWatchSelection = (watchId) => {
    setSelectedWatchIds((prev) => (prev.includes(watchId) ? prev.filter((id) => id !== watchId) : [...prev, watchId]));
  };

  const handleSelectAllWatched = (event) => {
    const { checked } = event.target;
    setSelectedWatchIds(checked ? selectableWatchIds : []);
  };

  const handleBulkResolve = async () => {
    const unresolvedRecords = selectedWatchRecords.filter((record) => !record.resolved);
    if (!unresolvedRecords.length) {
      showToastMessage({
        message: 'Select unresolved watched orders to resolve',
        type: 'info',
        anchor: 'top-center',
      });
      return;
    }

    const orderIds = Array.from(new Set(unresolvedRecords.map((record) => record.order_id).filter(Boolean)));
    if (!orderIds.length) {
      showToastMessage({
        message: 'No valid order identifiers found for the selected watch records',
        type: 'error',
        anchor: 'top-center',
      });
      return;
    }

    const maintenanceEventIds = Array.from(
      new Set(unresolvedRecords.map((record) => record.maintenance_event_id).filter(Boolean))
    );
    const eventIdForRequest = selectedEventId || maintenanceEventIds[0];

    if (!selectedEventId && maintenanceEventIds.length > 1) {
      showToastMessage({
        message: 'Select orders from a single maintenance event to resolve in bulk',
        type: 'warning',
        anchor: 'top-center',
      });
      return;
    }

    if (!eventIdForRequest) {
      showToastMessage({
        message: 'Unable to determine the maintenance event for the selected orders',
        type: 'error',
        anchor: 'top-center',
      });
      return;
    }

    setIsBulkResolving(true);
    let response;
    try {
      response = await resolveOrdersOnWatchBulk(orderIds, eventIdForRequest);
      await refreshWatchedOrders(selectedEventId ?? eventIdForRequest);
    } catch (error) {
      showToastMessage({
        message: `Failed to resolve selected watch records: ${error.message}`,
        type: 'error',
        anchor: 'top-center',
      });
      return;
    } finally {
      setIsBulkResolving(false);
    }
    setSelectedWatchIds([]);
    showToastMessage({
      message:
        response?.message || `Marked ${orderIds.length} ${orderIds.length === 1 ? 'order' : 'orders'} as resolved`,
      type: 'success',
      anchor: 'top-center',
    });
  };

  const handleBulkResume = async () => {
    const resumeCandidates = selectedWatchRecords.filter((record) => record.current_status === 'PAUSED');
    if (!resumeCandidates.length) {
      showToastMessage({
        message: 'Select paused orders to resume',
        type: 'info',
        anchor: 'top-center',
      });
      return;
    }

    const orderIds = Array.from(new Set(resumeCandidates.map((record) => record.order_id).filter(Boolean)));
    if (!orderIds.length) {
      showToastMessage({
        message: 'No valid order identifiers found for the selected paused orders',
        type: 'error',
        anchor: 'top-center',
      });
      return;
    }

    setResumeDialogCandidates(resumeCandidates);
    setResumeDialogOpen(true);
  };

  return (
    <>
      <ResumeOrdersDialog
        open={resumeDialogOpen}
        ordersOnWatch={ordersOnWatch}
        resumeCandidates={resumeDialogCandidates}
        showToastMessage={showToastMessage}
        onClearSelection={() => setSelectedWatchIds([])}
        onClose={() => setResumeDialogOpen(false)}
        onRefreshWatchedOrders={refreshWatchedOrders}
        onResumingChange={setIsBulkResuming}
      />
      <MaintenanceModeCard
        maintenanceMode={maintenanceMode}
        selectedExchanges={maintenanceTargetExchanges}
        onSelectedExchangesChange={setMaintenanceTargetExchanges}
        onToggle={handleMaintenanceModeToggle}
      />
      <OpenOrdersTableSection
        columns={columns}
        emptyMessage={hasActiveFilters ? 'No open orders match the selected filters' : 'No open orders'}
        excludedStatuses={excludedStatuses}
        grouped={grouped}
        lastRefreshAt={lastRefreshAt}
        sortState={sortState}
        standalone={standalone}
        onExcludedStatusesChange={setExcludedStatuses}
        onReload={reload}
        onSort={handleSort}
      />
      <OrdersOnWatchSection
        activeEvent={activeEvent}
        allSelectableCount={allSelectableCount}
        allSelected={allSelected}
        canResolveSelected={canResolveSelected}
        canResumeSelected={canResumeSelected}
        excludeResolved={excludeResolvedWatched}
        historicalEvents={historicalEvents}
        isBulkResolving={isBulkResolving}
        isBulkResuming={isBulkResuming}
        ordersOnWatch={ordersOnWatch}
        selectedCount={selectedCount}
        selectedEventId={selectedEventId}
        selectedWatchIds={selectedWatchIds}
        showEventsHistory={showEventsHistory}
        onBulkResolve={handleBulkResolve}
        onBulkResume={handleBulkResume}
        onClearSelection={() => setSelectedWatchIds([])}
        onResolveWatch={handleResolveWatch}
        onSelectEvent={setSelectedEventId}
        onToggleExcludeResolved={setExcludeResolvedWatched}
        onToggleHistory={setShowEventsHistory}
        onToggleSelectAll={handleSelectAllWatched}
        onToggleWatch={toggleWatchSelection}
      />
    </>
  );
}
