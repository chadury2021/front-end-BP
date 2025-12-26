import { useTheme } from '@emotion/react';
import {
  Box,
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import { useSound } from '@/hooks/useSound';
import { MultiOrderConfirmationModal } from '@/pages/dashboard/orderEntry/OrderConfirmationModal';
import {
  ApiError,
  cancelMultiOrder,
  cancelChainedOrder,
  cancelBatchOrder,
  submitCancel,
  fetchOrderDetailData,
  submitMultiOrder,
  openInNewTab,
} from '../../apiServices';
import { OPEN_NEW_TAB_ON_SUBMIT, OPEN_VIEW_STATUS_IN_NEW_TAB } from '../../constants';
import { BasicModal } from '../Modal';
import { ErrorContext } from '../context/ErrorProvider';
import { useUserMetadata } from '../context/UserMetadataProvider';
import CollapsedRow from './CollapsedRow';
import TableOrderConfirmationModel from './TableOrderConfirmationModel';
import { StyledHeaderTableCellWithLine, StyledPaddingTableCell, StyledTableCell, getOrderPath } from './util';
import CollapsedChildsRow from './CollapsedChildsRow';
import CollapsedChainedRow from './CollapsedChainedRow';
import CollapsedBatchedRow from './CollapsedBatchedRow';
import DisplayRowDetails from './DisplayRowDetails';
import ShareableImageModal from '../shareable/ShareableImageModal';
import { hydrateMultiOrderResubmit } from './multiOrderResubmitUtils';

import { OrderTableColumnFilterButton } from './OrderTableColumnFilter';
import {
  ResubmitOrderButton,
  ResubmitRemainingOrderButton,
  ViewOrderButton,
  PauseOrderButton,
  ResumeOrderButton,
  CancelOrderButton,
  ShareOrderButton,
} from './tableActions';
import { reSubmitAction, reSubmitRemainingAction } from '../orderDetail/util/orderActionUtils';
import useViewport from '../hooks/useViewport';

const DEFAULT_VISIBLE_COLUMNS = {
  arrival_cost: false,
  arrival_price: false,
  duration: false,
  executed_notional: false,
  executed_price: false,
  executed_qty: false,
  pair: true,
  pct_filled: true,
  pov: false,
  side: true,
  status: true,
  super_strategy: true,
  target_qty: true,
  time_start: true,
  unique_venues: true,
  vwap_cost: false,
};
const visibleColumnsAtom = atomWithStorage('visibleOrderTableColumns', DEFAULT_VISIBLE_COLUMNS);

const getColumns = (dashboardView) => {
  return [
    {
      id: 'unique_venues',
      label: 'Exchanges',
      width: 20,
      align: 'left',
      showDefault: dashboardView,
    },
    {
      id: 'account_names',
      label: 'Accounts',
      width: 100,
      align: 'left',
      showDefault: !dashboardView,
    },
    {
      id: 'custom_order_id',
      label: 'Custom Order ID',
      width: 100,
      align: 'left',
      showDefault: false,
    },
    {
      id: 'pair' || 'pairs',
      label: 'Pair',
      width: 160,
      align: 'left',
      showDefault: true,
    },
    {
      id: 'side',
      label: 'Side',
      width: 60,
      align: 'left',
      showDefault: true,
    },
    {
      id: 'executed_notional',
      label: 'Exec Notional',
      width: 150,
      align: 'left',
      showDefault: !dashboardView,
    },
    {
      id: 'target_qty',
      label: 'Target Qty',
      width: 180,
      align: 'left',
      showDefault: true,
    },
    {
      id: 'executed_qty',
      label: 'Executed Qty',
      width: 180,
      align: 'left',
      showDefault: false,
    },
    {
      id: 'executed_price',
      label: 'Avg Entry Price',
      width: 100,
      align: 'left',
      showDefault: !dashboardView,
    },
    {
      id: 'arrival_price',
      label: 'Entry Price',
      width: 100,
      align: 'left',
      showDefault: false,
    },
    {
      id: 'pct_filled',
      label: 'Filled',
      width: 30,
      align: 'center',
      showDefault: true,
    },
    {
      id: 'time_start',
      label: 'Time Start',
      width: 170,
      align: 'left',
      showDefault: true,
    },
    {
      id: 'super_strategy',
      label: 'Strategy',
      width: 140,
      align: 'left',
      showDefault: true,
    },
    {
      id: 'status',
      label: 'Status',
      width: 30,
      align: 'left',
      showDefault: true,
    },
    {
      id: 'duration',
      label: 'Duration',
      width: 100,
      align: 'left',
      showDefault: false,
    },
    {
      id: 'pov',
      label: 'POV',
      width: 100,
      align: 'left',
      showDefault: false,
    },
    {
      id: 'vwap_cost',
      label: 'VWAP Slippage',
      width: 140,
      align: 'left',
      showDefault: false,
    },
    {
      id: 'arrival_cost',
      label: 'Slippage',
      width: 140,
      align: 'left',
      showDefault: false,
    },
    {
      id: 'limit_price',
      label: 'Limit Price',
      width: 140,
      align: 'left',
      showDefault: false,
    },
  ];
};

const getOrderType = (row) => {
  if (row.side === 'Multi') {
    return 'Multi';
  }
  if (row.side === 'Chained') {
    return 'Chained';
  }
  if (row.side === 'Batch') {
    return 'Batch';
  }
  return 'Single';
};

// Move ViewOrderButtonWithPreferences outside of DisplayRow to fix react/no-unstable-nested-components
function ViewOrderButtonWithPreferences({ openViewStatusInNewTab, ...props }) {
  return <ViewOrderButton {...props} openInNewTabPreference={openViewStatusInNewTab} />;
}

function DisplayRow({
  row,
  columns,
  visibleColumns,
  setCancelModalData,
  dashboardView,
  setIsResubmit,
  setRowData,
  setOpenModal,
  theme,
  handleShareClick,
  orderRefresh,
  orderRefreshTick,
  onPairClick,
  tokenPairs,
  handleMultiResubmit,
  openViewStatusInNewTab,
}) {
  const orderRow = row;

  const [open, setOpen] = useState(false);
  const { isMobile } = useViewport();
  const navigate = useNavigate();
  const StyledCell = dashboardView ? StyledPaddingTableCell : StyledTableCell;

  const isMultiChainedBatchOrder =
    orderRow.side === 'Multi' || orderRow.side === 'Chained' || orderRow.side === 'Batch';

  let isTerminalStatus = ['COMPLETE', 'CANCELED'].includes(orderRow.status);
  if (isMultiChainedBatchOrder && orderRow.calculated_status) {
    isTerminalStatus = ['COMPLETE', 'CANCELED'].includes(orderRow.calculated_status);
    orderRow.status = orderRow.calculated_status;
  }

  const handleClick = useCallback(() => {
    if (isMobile) {
      const url = getOrderPath(orderRow);
      navigate(url);
    }
    setOpen(!open);
  }, [isMobile, open, setOpen, orderRow]);

  const orderType = getOrderType(orderRow);

  const ViewOrderTooltipCallback = useCallback(
    (props) => <ViewOrderButtonWithPreferences {...props} openViewStatusInNewTab={openViewStatusInNewTab} />,
    [openViewStatusInNewTab]
  );

  const renderCollapsable = () => {
    if (orderType === 'Multi') {
      return (
        <CollapsedChildsRow
          childOrders={orderRow.child_order_ids}
          columns={columns}
          open={open}
          row={orderRow}
          StyledCell={StyledCell}
          ViewOrderTooltip={ViewOrderTooltipCallback}
          visibleColumns={visibleColumns}
        />
      );
    }
    if (orderType === 'Chained') {
      return (
        <CollapsedChainedRow
          columns={columns}
          open={open}
          ordersInChain={orderRow.orders_in_chain}
          StyledCell={StyledCell}
          ViewOrderTooltip={ViewOrderTooltipCallback}
          visibleColumns={visibleColumns}
        />
      );
    }
    if (orderType === 'Batch') {
      return (
        <CollapsedBatchedRow
          columns={columns}
          open={open}
          orderRefresh={orderRefresh}
          orderRefreshTick={orderRefreshTick}
          ordersInBatch={orderRow.child_order_ids}
          StyledCell={StyledCell}
          ViewOrderTooltip={ViewOrderTooltipCallback}
          visibleColumns={visibleColumns}
        />
      );
    }
    return <CollapsedRow dashboardView={dashboardView} open={open} row={orderRow} style={{ padding: 0 }} />;
  };

  const renderPauseResumeButton = () => {
    if (orderRow.status === 'PAUSED') {
      return <ResumeOrderButton orderRefresh={orderRefresh} orderRow={orderRow} orderType={orderType} />;
    }
    return <PauseOrderButton orderRefresh={orderRefresh} orderRow={orderRow} orderType={orderType} />;
  };

  return (
    <>
      <TableRow hover key={`table row${orderRow.id}`} onClick={handleClick}>
        {columns.map(
          (column) =>
            visibleColumns[column.id] &&
            DisplayRowDetails({
              row: orderRow,
              column,
              StyledCell,
              theme,
              onPairClick,
              tokenPairs,
            })
        )}
        <StyledCell
          sx={{
            minWidth: 160,
            height: 32,
            justifyContent: 'flex-end', // Aligns the content to the right
            alignItems: 'center', // Aligns the content to the center
            textAlign: 'end',
          }}
        >
          <ResubmitRemainingOrderButton
            disabled={!isTerminalStatus || isMultiChainedBatchOrder || orderRow.pct_filled > 99}
            onClick={(event) => {
              event.stopPropagation();
              setIsResubmit(false);
              setRowData(orderRow);
              setOpenModal(true);
            }}
          />

          <ResubmitOrderButton
            disabled={!isTerminalStatus || orderRow.side === 'Chained' || orderRow.side === 'Batch'}
            onClick={(event) => {
              event.stopPropagation();
              if (orderRow.side === 'Multi') {
                handleMultiResubmit(orderRow);
                return;
              }
              setIsResubmit(true);
              setRowData(orderRow);
              setOpenModal(true);
            }}
          />

          <ViewOrderButtonWithPreferences disabled={orderRow.side === 'Batch'} orderRow={orderRow} />
          {renderPauseResumeButton()}
          <CancelOrderButton
            disabled={isTerminalStatus}
            onClick={(event) => {
              event.stopPropagation();
              setCancelModalData({
                open: true,
                orderId: orderRow.id,
                orderType,
              });
            }}
          />

          <ShareOrderButton
            disabled={orderRow.status !== 'COMPLETE'}
            sx={{ marginLeft: '10px' }}
            onClick={(event) => {
              event.stopPropagation();
              handleShareClick(orderRow);
            }}
          />
        </StyledCell>
      </TableRow>

      <TableRow>
        {/* + 1 for colSpan is for actions */}
        <TableCell colSpan={getColumns(dashboardView).length + 1} style={{ padding: 0 }}>
          {renderCollapsable()}
        </TableCell>
      </TableRow>
    </>
  );
}

function SharedOrderTable({
  orderData = [],
  orderRefresh,
  dashboardView = false,
  FormAtoms,
  page = 0,
  totalPages = -1,
  setPage = () => {},
  onPairClick,
  tokenPairs = [],
  loading = false,
}) {
  const [orderRefreshTick, setOrderRefreshTick] = useState(0);

  useEffect(() => {
    setOrderRefreshTick((tick) => tick + 1);
  }, [orderData]);

  const { user, isRetail, referralCode } = useUserMetadata();
  const { playOrderSuccess } = useSound();

  // Share modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const shareableImageRef = useRef(null);

  const [initialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);

  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  const [cancelModalData, setCancelModalData] = useState({
    open: false,
    orderId: null,
    orderType: null,
  });
  const { showAlert } = useContext(ErrorContext);
  const { openLoginModal, openSignupModal } = useAuthModal();
  const [openModal, setOpenModal] = useState(false);
  const [submitModalMessage, setSubmitModalMessage] = useState('');

  const [rowData, setRowData] = useState({ side: 'buy' });

  // refactor this to reducers
  const [isResubmit, setIsResubmit] = useState(true);
  const [multiModalOpen, setMultiModalOpen] = useState(false);
  const [multiConfirmationData, setMultiConfirmationData] = useState(null);
  const [multiSubmitPayload, setMultiSubmitPayload] = useState(null);
  const [multiEntryPrefill, setMultiEntryPrefill] = useState(null);
  const [multiConfirmDisabled, setMultiConfirmDisabled] = useState(true);
  const [multiSubmitLoading, setMultiSubmitLoading] = useState(false);

  const routerNavigate = useNavigate();
  const theme = useTheme();
  const cancelModalOpen = cancelModalData.open;
  const openNewTabOnSubmit = user.preferences ? user.preferences[OPEN_NEW_TAB_ON_SUBMIT] : false;
  const openViewStatusInNewTabPreference = dashboardView && Boolean(user?.preferences?.[OPEN_VIEW_STATUS_IN_NEW_TAB]);

  const handleCancel = async (rowId, orderType) => {
    setCancelModalData({ open: false, orderId: null, orderType: null });
    try {
      if (orderType === 'Multi') {
        await cancelMultiOrder(rowId);
      } else if (orderType === 'Chained') {
        await cancelChainedOrder(rowId);
      } else if (orderType === 'Batch') {
        await cancelBatchOrder(rowId);
      } else {
        await submitCancel(rowId);
      }
      showAlert({
        severity: 'success',
        message: 'Successfully canceled the specified order.',
      });
      await orderRefresh(false);
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ severity: 'error', message: e.message });
      } else {
        throw e;
      }
    }
  };

  const reSubmit = async (row) => {
    reSubmitAction({
      row,
      openNewTabOnSubmit,
      showAlert,
      onSuccess: playOrderSuccess,
    });
    setOpenModal(false);
  };

  const reSubmitRemaining = async (row) => {
    reSubmitRemainingAction({
      row,
      openNewTabOnSubmit,
      showAlert,
      onSuccess: playOrderSuccess,
    });
    setOpenModal(false);
  };

  const handleMultiResubmit = async (row) => {
    setMultiModalOpen(true);
    setMultiSubmitLoading(true);
    setMultiConfirmDisabled(true);
    setMultiConfirmationData(null);
    setMultiSubmitPayload(null);
    setMultiEntryPrefill(null);

    try {
      const { confirmationData, submitPayload, entryPrefill } = await hydrateMultiOrderResubmit(row.id);
      setMultiConfirmationData(confirmationData);
      setMultiSubmitPayload(submitPayload);
      setMultiEntryPrefill(entryPrefill);
      setMultiConfirmDisabled(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : error?.message || 'Unable to load multi order details.';
      showAlert({ severity: 'error', message: `Failed to load multi order details: ${message}` });
      setMultiModalOpen(false);
    } finally {
      setMultiSubmitLoading(false);
    }
  };

  const handleMultiConfirm = async () => {
    if (!multiSubmitPayload) return;
    setMultiSubmitLoading(true);
    try {
      const response = await submitMultiOrder(multiSubmitPayload);
      showAlert({ severity: 'success', message: 'Multi order resubmitted successfully.' });
      playOrderSuccess();
      setMultiModalOpen(false);
      await orderRefresh(false);
      if (response?.id) {
        const destination = `/multi_order/${response.id}`;
        if (openNewTabOnSubmit) {
          openInNewTab(destination);
        } else {
          routerNavigate(destination);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert({ severity: 'error', message: error.message });
      } else {
        showAlert({ severity: 'error', message: 'Failed to resubmit multi order.' });
      }
    } finally {
      setMultiSubmitLoading(false);
    }
  };

  const handleMultiEdit = () => {
    if (!multiEntryPrefill) return;
    setMultiModalOpen(false);
    routerNavigate('/enter_multi_order', { state: { multiOrderPrefill: multiEntryPrefill } });
  };

  useEffect(() => {
    if (!multiModalOpen) {
      setMultiConfirmationData(null);
      setMultiSubmitPayload(null);
      setMultiEntryPrefill(null);
      setMultiConfirmDisabled(true);
      setMultiSubmitLoading(false);
    }
  }, [multiModalOpen]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle share button click
  const handleShareClick = async (orderRow) => {
    let benchmarkDetails = {};
    let detailedData = null;
    try {
      detailedData = await fetchOrderDetailData(orderRow.id);
      benchmarkDetails = detailedData?.benchmark || {};
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch details for sharing: ${error.message}`,
      });
      return;
    }

    // Extract fills and find the last fill's price
    const aggroFills = detailedData?.aggro_fills || [];
    const passiveFills = detailedData?.passive_fills || [];
    const fills =
      detailedData?.fills ||
      // if no fills, use aggro and passive fills
      [...aggroFills, ...passiveFills].sort(
        // most recent first
        (a, b) => b.x - a.x
      ) ||
      // if that fails, then empty array
      [];
    const lastFill = fills.length > 0 ? fills[fills.length - 1] : null;
    const lastFillPrice = lastFill ? lastFill.price : null;

    // Correctly extract the first account ID
    const accountId = detailedData?.order_summary?.accounts?.[0] || null;
    const uniqueVenues = detailedData?.order_summary?.unique_venues || [];

    const orderForSharing = {
      ...orderRow,
      // account, // Remove the potentially incorrect account object
      maker_percentage: orderRow.maker_percentage || 0,
      taker_percentage: orderRow.taker_percentage || 100 - (orderRow.maker_percentage || 0),
      referralLink: referralCode ? `https://app.tread.fi/referral/${referralCode}` : null,
      shareType: 'order',
      accountId, // Add the extracted accountId
      unique_venues: uniqueVenues, // Add unique_venues
      arrival_cost: benchmarkDetails.arrival_cost,
      vwap_cost: benchmarkDetails.vwap_cost,
      arrival_bps_notional: benchmarkDetails.arrival_bps_notional,
      arrival_price: benchmarkDetails.arrival_price,
      last_fill_price: lastFillPrice,
      fee_cost: benchmarkDetails.fee_cost,
      pov: benchmarkDetails.pov,
    };

    setSelectedOrderData(orderForSharing);
    setImageDataUrl(null);
    setIsGenerating(true);
    setModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrderData(null);
    setImageDataUrl(null);
    setIsGenerating(false);
  };

  const columns = getColumns(dashboardView);

  const [visibleColumns, setVisibleColumns] = useAtom(visibleColumnsAtom);

  const tableContainerHeight = dashboardView ? '100%' : 'calc(100% - 60px)';

  // Orders are now grouped by the backend, no need for frontend grouping
  const groupedOrderData = orderData;

  // Debug logging for batch order issues

  return (
    <Box sx={{ height: '100%' }}>
      <TableContainer style={{ height: tableContainerHeight }}>
        <Table stickyHeader aria-label='sticky table' size='small'>
          <TableHead sx={{ backgroundColor: theme.palette.background.card }}>
            <TableRow>
              {columns.map(
                (column) =>
                  visibleColumns[column.id] && (
                    <StyledHeaderTableCellWithLine
                      align={column.align}
                      key={`main header${column.id}`}
                      sx={{
                        minWidth: column.minWidth,
                        width: column.width || undefined,
                        padding: column.id === 'unique_venues' ? '0px 8px' : '0px 16px',
                      }}
                    >
                      {column.id === 'unique_venues' ? '' : column.label}
                    </StyledHeaderTableCellWithLine>
                  )
              )}
              <StyledHeaderTableCellWithLine align='right' key='actions' sx={{ width: 190 }}>
                <OrderTableColumnFilterButton
                  columns={columns}
                  dashboardView={dashboardView}
                  setVisibleColumns={setVisibleColumns}
                  visibleColumns={visibleColumns}
                />
              </StyledHeaderTableCellWithLine>
            </TableRow>
          </TableHead>
          <TableBody sx={{ overflow: 'auto' }}>
            {loading
              ? // Render skeleton rows when loading
                Array.from({ length: 10 }).map(() => (
                  <TableRow
                    key={`skeleton-row-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}
                    sx={{
                      '& .MuiTableCell-root': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    {columns.map(
                      (column) =>
                        visibleColumns[column.id] && (
                          <StyledTableCell key={column.id} style={{ padding: '8px 16px' }}>
                            <Skeleton animation='wave' height='20px' variant='rounded' width='80%' />
                          </StyledTableCell>
                        )
                    )}
                    <StyledTableCell style={{ padding: '8px 16px' }}>
                      <Skeleton animation='wave' height='20px' variant='rounded' width='60%' />
                    </StyledTableCell>
                  </TableRow>
                ))
              : // Render actual data when not loading
                groupedOrderData
                  .filter((row) => row && row.id) // Filter out null/undefined rows or rows without id
                  .map((row) => {
                    const enrichedRow = row;
                    return (
                      <DisplayRow
                        columns={columns}
                        dashboardView={dashboardView}
                        handleMultiResubmit={handleMultiResubmit}
                        handleShareClick={handleShareClick}
                        key={`displayed row${row.id}`}
                        openViewStatusInNewTab={openViewStatusInNewTabPreference}
                        orderRefresh={orderRefresh}
                        orderRefreshTick={orderRefreshTick}
                        row={enrichedRow}
                        setCancelModalData={setCancelModalData}
                        setIsResubmit={setIsResubmit}
                        setOpenModal={setOpenModal}
                        setRowData={setRowData}
                        theme={theme}
                        tokenPairs={tokenPairs}
                        visibleColumns={visibleColumns}
                        onPairClick={onPairClick}
                      />
                    );
                  })}
          </TableBody>
        </Table>
        {!loading && groupedOrderData.length === 0 && (
          <Box alignItems='center' display='flex' height='calc(100% - 60px)' justifyContent='center' sx={{ p: 2 }}>
            {user && user.is_authenticated ? (
              <Typography variant='subtitle1'>No orders found</Typography>
            ) : (
              <Stack alignItems='center' direction='row' gap={1}>
                <Button
                  size='small'
                  sx={{ backgroundColor: theme.palette.primary.main }}
                  variant='contained'
                  onClick={openLoginModal}
                >
                  <Typography color={theme.palette.text.offBlack} variant='button1'>
                    Login
                  </Typography>
                </Button>
                {isRetail && (
                  <>
                    <Typography variant='subtitle1'>or</Typography>
                    <Button color='primary' size='small' variant='contained' onClick={openSignupModal}>
                      <Typography color={theme.palette.text.offBlack} variant='subtitle1'>
                        Sign up
                      </Typography>
                    </Button>
                  </>
                )}
                <Typography variant='subtitle2'>to see orders</Typography>
              </Stack>
            )}
          </Box>
        )}
      </TableContainer>

      {!dashboardView ? (
        <TablePagination
          component='div'
          count={totalPages * rowsPerPage}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
          sx={{ height: '60px' }}
          onPageChange={handleChangePage}
        />
      ) : null}
      <BasicModal
        confirmButtonText='Yes'
        handleConfirm={() => handleCancel(cancelModalData.orderId, cancelModalData.orderType)}
        message='Are you sure you want to cancel this order?'
        open={cancelModalOpen}
        setOpen={(e) =>
          setCancelModalData((prev) => {
            return { ...prev, open: e };
          })
        }
      />
      <TableOrderConfirmationModel
        dashboardView={dashboardView}
        data={rowData}
        FormAtoms={FormAtoms}
        handleResubmit={reSubmit}
        handleResubmitRemaining={reSubmitRemaining}
        initialLoadValue={initialLoadValue}
        isBuy={rowData.side === 'buy'}
        isResubmit={isResubmit}
        modalText={submitModalMessage}
        open={openModal}
        setOpen={setOpenModal}
      />
      <MultiOrderConfirmationModal
        confirmDisabled={multiConfirmDisabled}
        data={multiConfirmationData}
        handleConfirm={handleMultiConfirm}
        handleEdit={handleMultiEdit}
        mode='resubmit'
        open={multiModalOpen}
        setOpen={setMultiModalOpen}
        submitLoading={multiSubmitLoading}
      />

      {/* Share Order Image Modal */}
      <ShareableImageModal
        accounts={[]}
        headerTitle='Proof of Order'
        imageDataUrl={imageDataUrl}
        isGenerating={isGenerating}
        open={modalOpen}
        setImageDataUrl={setImageDataUrl}
        setIsGenerating={setIsGenerating}
        shareableRef={shareableImageRef}
        shareData={selectedOrderData}
        showAlert={showAlert}
        onClose={handleCloseModal}
      />
    </Box>
  );
}

export { SharedOrderTable };
