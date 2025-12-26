import { Box, Stack } from '@mui/material';
import { useContext, useState } from 'react';

import { reSubmitAction, reSubmitRemainingAction } from '@/shared/orderDetail/util/orderActionUtils';

import {
  ApiError,
  cancelMultiOrder,
  pauseMultiOrder,
  pauseOrder,
  changeMarketMakerSpread,
  resumeMultiOrder,
  resumeOrder,
  submitCancel,
} from '@/apiServices';
import { AmendOrderDialog } from '@/shared/AmendOrderDialog';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { BasicModal } from '@/shared/Modal';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { AmendButton, CancelButton, GridAndSpreadButton, PauseResumeButton, ResubmitButton } from './OrderButtons';

function OrderActions({ OrderSummaryData, loadOrderData, multiDetailView = false, childOrders = [] }) {
  const { showAlert } = useContext(ErrorContext);
  const { maintenanceModeEnabled } = useUserMetadata();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [handleConfirm, setHandleConfirm] = useState(() => {});
  const [confirmModalText, setConfirmModalText] = useState('');
  const [amendDialogOpen, setAmendDialogOpen] = useState(false);

  const isLoading = !OrderSummaryData || Object.keys(OrderSummaryData).length === 0;

  const OrderData = OrderSummaryData;

  const {
    id,
    account_names,
    pair,
    side,
    parent_order,
    pov_target,
    status,
    trajectory_name,
    super_strategy_name,
    unique_venues,
    strategy_params,
    resume_condition_normal,
    is_simple,
    guarantee_pnl,
    market_maker,
  } = OrderSummaryData;

  // Calculate current spread from child orders if available
  const calculateCurrentSpreadBps = () => {
    if (guarantee_pnl || childOrders.length === 0) {
      return null;
    }

    const buyOrders = childOrders.filter((o) => o.side === 'buy');
    const sellOrders = childOrders.filter((o) => o.side === 'sell');

    if (buyOrders.length !== 1 || sellOrders.length !== 1) {
      return null;
    }

    const buyOrder = buyOrders[0];
    const sellOrder = sellOrders[0];

    if (!buyOrder?.limit_price || !sellOrder?.limit_price) {
      return null;
    }

    try {
      // Parse multiplier format: "PAIR@EXCHANGE * 0.9999" or "PAIR@EXCHANGE * 1.0001"
      const buyMatch = buyOrder.limit_price.match(/\*\s*([\d.]+)$/);
      const sellMatch = sellOrder.limit_price.match(/\*\s*([\d.]+)$/);

      if (buyMatch && sellMatch) {
        const buyMultiplier = parseFloat(buyMatch[1]);
        const sellMultiplier = parseFloat(sellMatch[1]);
        // Spread in bps = (sellMultiplier - buyMultiplier) * 10000
        const spreadBps = (sellMultiplier - buyMultiplier) * 10000;
        return spreadBps;
      }
    } catch (e) {
      // If parsing fails, return null
    }

    return null;
  };

  const handleCancel = async () => {
    setConfirmModalOpen(false);
    try {
      if (multiDetailView) {
        await cancelMultiOrder(id);
      } else {
        await submitCancel(id);
      }
      showAlert({
        severity: 'success',
        message: 'Successfully canceled the specified order.',
      });
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ severity: 'error', message: e.message });
      } else {
        throw e;
      }
    }

    loadOrderData(id);
  };

  const handlePause = async () => {
    setConfirmModalOpen(false);
    try {
      if (multiDetailView) {
        await pauseMultiOrder(id);
      } else {
        await pauseOrder(id);
      }
      showAlert({
        severity: 'success',
        message: 'Pause request submitted.',
      });
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ severity: 'error', message: e.message });
      } else {
        throw e;
      }
    }

    loadOrderData(id);
  };

  const handleResume = async () => {
    setConfirmModalOpen(false);
    try {
      if (multiDetailView) {
        await resumeMultiOrder(id);
      } else {
        await resumeOrder(id);
      }
      showAlert({
        severity: 'success',
        message: 'Resume request submitted.',
      });
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ severity: 'error', message: e.message });
      } else {
        throw e;
      }
    }

    loadOrderData(id);
  };

  const handleResubmit = async () => {
    reSubmitAction({
      row: OrderData,
      openNewTabOnSubmit: false,
      showAlert,
    });
  };
  const handleResubmitRemaining = async () => {
    reSubmitRemainingAction({
      row: OrderData,
      openNewTabOnSubmit: false,
      showAlert,
    });
  };

  const referencePriceDefault = guarantee_pnl ? 'grid' : 'mid';
  const availableExchanges = Array.from(
    new Set((childOrders || []).flatMap((o) => o?.unique_venues || o?.exchanges || []).filter(Boolean))
  );

  const currentSpreadBps = calculateCurrentSpreadBps();

  const handleApplyReferenceSpread = async ({ referencePrice, referenceExchange, spreadBps }) => {
    try {
      await changeMarketMakerSpread(id, spreadBps, {
        reference_price: referencePrice,
        reference_exchange: referencePrice === 'other_exchange' ? referenceExchange : undefined,
      });
      showAlert({
        severity: 'success',
        message: 'Reference price and spread updated.',
      });
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ severity: 'error', message: e.message });
      } else {
        throw e;
      }
    }

    loadOrderData(id);
  };

  return (
    <Box alignItems='center' justifyContent='center' sx={{ width: '100%', height: '50px' }}>
      <Stack
        alignItems='center'
        backgroundColor='background.paper'
        direction='row'
        justifyContent='center'
        spacing={1}
        sx={{
          height: '50px',
        }}
      >
        {!multiDetailView && (
          <ResubmitButton
            handleResubmit={handleResubmit}
            handleResubmitRemaining={handleResubmitRemaining}
            maintenanceModeEnabled={maintenanceModeEnabled}
            setConfirmModalOpen={setConfirmModalOpen}
            setConfirmModalText={setConfirmModalText}
          />
        )}
        {!multiDetailView && !is_simple && (
          <AmendButton parentOrder={parent_order} setAmendDialogOpen={setAmendDialogOpen} status={status} />
        )}
        <PauseResumeButton
          allowPauseWhenCanceled={multiDetailView}
          handlePause={handlePause}
          handleResume={handleResume}
          isOOLPaused={status === 'PAUSED' && strategy_params.ool_pause && resume_condition_normal && !is_simple}
          isPaused={status === 'PAUSED'}
          maintenanceModeEnabled={maintenanceModeEnabled}
          parent_order={parent_order}
          setConfirmModalOpen={setConfirmModalOpen}
          setConfirmModalText={setConfirmModalText}
          setHandleConfirm={setHandleConfirm}
          status={status}
          super_strategy_name={super_strategy_name}
        />
        {multiDetailView && market_maker && (
          <GridAndSpreadButton
            availableExchanges={availableExchanges}
            initialReferenceExchange={availableExchanges[0]}
            initialReferencePrice={referencePriceDefault}
            initialSpreadBps={currentSpreadBps ?? (referencePriceDefault === 'grid' ? 0 : 1)}
            maintenanceModeEnabled={maintenanceModeEnabled}
            marketMaker={market_maker}
            status={status}
            onApply={handleApplyReferenceSpread}
          />
        )}
        <CancelButton
          handleCancel={handleCancel}
          parentOrder={parent_order}
          setConfirmModalOpen={setConfirmModalOpen}
          setConfirmModalText={setConfirmModalText}
          setHandleConfirm={setHandleConfirm}
          status={status}
        />
      </Stack>
      <BasicModal
        confirmButtonText='Yes'
        handleConfirm={handleConfirm}
        message={confirmModalText}
        open={confirmModalOpen}
        setOpen={setConfirmModalOpen}
      />
      {!multiDetailView && !isLoading && (
        <AmendOrderDialog
          amendDialogOpen={amendDialogOpen}
          exchangeNames={unique_venues}
          orderAccounts={account_names}
          orderId={id}
          OrderSummaryData={OrderSummaryData}
          pair={pair}
          pov_target={pov_target}
          setAmendDialogOpen={setAmendDialogOpen}
          showAlert={showAlert}
          side={side}
        />
      )}
    </Box>
  );
}

export { OrderActions };
