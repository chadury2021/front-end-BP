import React, { useCallback, useEffect, useState } from 'react';
import { Typography, Button, Stack, Paper, Skeleton } from '@mui/material';
import { useTheme } from '@mui/system';
import AccountDropdown from '@/shared/fields/AccountDropdown';
import { smartRound } from '@/util';
import DataComponent from '@/shared/DataComponent';
import EmptyBar from '@/shared/components/EmptyBar';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { getDefaultPairByExchange } from '@/shared/formUtil';
import LabelTooltip from '@/shared/components/LabelTooltip';
import { useBaseForm } from './hooks/useBaseForm';
import { SwapQtyInputField } from './SwapQtyInputField';
import OrderUrgencyPicker from './OrderUrgencyPicker';
import useAutoOrderEntryForm from './hooks/useAutoOrderEntryForm';
import { useSubmitForm } from './hooks/useSubmitForm';
import { SimpleOrderConfirmationModal } from './SimpleOrderConfirmationModal';
import { SimpleOrderExecutionModal } from './SimpleOrderExecutionModal';
import usePreTradeAnayltics from './hooks/usePreTradeAnalytics';

function SimpleOrderEntryStats({ duration, strategy, preTradeEstimationData, loading }) {
  const theme = useTheme();
  const { displayPov, displayPovColor, displayVolatility, displayMarketVolume, displayMarketVolumeColor } =
    usePreTradeAnayltics(preTradeEstimationData);

  const isMarket = strategy === 'Market';
  return (
    <Paper elevation={1} sx={{ py: 1, px: 2, bgcolor: theme.palette.background.card }}>
      <Stack direction='column' spacing={0.5}>
        {!isMarket && (
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <Typography variant='small1'>Duration</Typography>
            <DataComponent isLoading={loading} loadingComponent={<EmptyBar />}>
              <Typography variant='small1'>{duration ? `${smartRound(duration / 60, 2)}` : '0.00'} mins</Typography>
            </DataComponent>
          </Stack>
        )}
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <Typography variant='small1'>Strategy</Typography>
          <DataComponent isLoading={loading} loadingComponent={<EmptyBar />}>
            <Typography variant='small1'>{strategy || 'N/A'}</Typography>
          </DataComponent>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <LabelTooltip
            label='Participation Rate'
            labelTextVariant='small1'
            link='https://docs.tread.fi/submitting-orders/algo-swap-mode'
            placement='left'
            title='The estimated percentage of the total market volume your order will represent. High participation can impact the price.'
          />
          <DataComponent isLoading={loading} loadingComponent={<EmptyBar />}>
            <Typography color={displayPovColor} variant='small1'>
              {displayPov}
            </Typography>
          </DataComponent>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <LabelTooltip
            label='Order Volatility'
            labelTextVariant='small1'
            link='https://docs.tread.fi/submitting-orders/algo-swap-mode'
            placement='left'
            title='The expected price fluctuation during the execution of your order.'
          />
          <DataComponent isLoading={loading} loadingComponent={<EmptyBar />}>
            <Typography variant='small1'>{displayVolatility}</Typography>
          </DataComponent>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <LabelTooltip
            label='Market Volume'
            labelTextVariant='small1'
            link='https://docs.tread.fi/submitting-orders/algo-swap-mode'
            placement='left'
            title='An indicator of current liquidity.'
          />
          <DataComponent isLoading={loading} loadingComponent={<EmptyBar />}>
            <Typography color={displayMarketVolumeColor} variant='small1'>
              {displayMarketVolume}
            </Typography>
          </DataComponent>
        </Stack>
      </Stack>
    </Paper>
  );
}

function SimpleOrderEntrySkeleton() {
  return (
    <Stack direction='column' spacing={4}>
      <Skeleton animation='wave' height='50px' variant='rounded' />
      <Skeleton animation='wave' height='100px' variant='rounded' />
      <Skeleton animation='wave' height='100px' variant='rounded' />
      <Skeleton animation='wave' height='60px' variant='rounded' />
      <Skeleton animation='wave' height='140px' variant='rounded' />
      <Skeleton animation='wave' height='35px' variant='rounded' />
    </Stack>
  );
}

function SimpleOrderEntryForm({ dashboard = false, isAuthenticated = false }) {
  const [activeOrderId, setActiveOrderId] = useState(null);

  const { initialLoadValue } = useOrderForm();
  const { tokenPairs } = initialLoadValue;

  const {
    autoOrderUrgencies,
    trajectories,
    handleCoreFields,
    quoteBaseStates,
    handleBaseQuoteFields,
    percentageSliderInfo,
  } = useBaseForm();

  const {
    baseQty,
    quoteQty,
    baseQtyPlaceholder,
    quoteQtyPlaceholder,
    convertedQtyLoading,
    accounts,
    selectedAccounts,
    selectedPair,
    selectedSide,
    setSelectedPair,
  } = quoteBaseStates;

  const { handleBaseQtyOnChange, handleQuoteQtyOnChange } = handleBaseQuoteFields;

  const { totalQuoteAsset, totalBaseAsset } = percentageSliderInfo;

  const {
    urgency,
    setUrgency,
    enableUrgency,
    isAutoOrderFormLoading,
    autoOrderConfig,
    configFields,
    preTradeEstimationData,
    preTradeDataLoading,
  } = useAutoOrderEntryForm({
    trajectories,
    accounts,
  });
  const { submitCheck, confirmationModalProps, isSubmitted } = useSubmitForm({ allowOpenNewTabOnSubmit: false });
  const { handleSelectedAccountsChange, handleSelectedSide } = handleCoreFields;
  const { trajectory, selectedDuration } = configFields;
  const isBuySide = selectedSide === 'buy';
  const canSubmit = enableUrgency && autoOrderConfig && !isAutoOrderFormLoading;

  const handleSwap = useCallback(
    (e) => {
      const newpair = isBuySide ? 'sell' : 'buy';
      handleSelectedSide(e, newpair, selectedSide, selectedPair);
    },
    [selectedSide]
  );

  const onFormSubmit = (e) => {
    submitCheck(e);
  };

  // Reusing placeholder states in BaseForm where pattern can be a full string or "{qty} {asset}"
  // We only want the {qty} or '0.00' if no qty.
  const [_basePrice, _baseAsset] = baseQtyPlaceholder.split(selectedPair.base);
  const [_quotePrice, _quoteAsset] = quoteQtyPlaceholder.split(selectedPair.quote);
  const basePrice = (_baseAsset !== undefined && _basePrice?.trim()) || null;
  const quotePrice = (_quoteAsset !== undefined && _quotePrice?.trim()) || null;

  const baseBalance = selectedAccounts.length > 0 ? totalBaseAsset() : 0;
  const quoteBalance = selectedAccounts.length > 0 ? totalQuoteAsset() : 0;

  const handleConfirmCallback = useCallback(
    async (event) => {
      const orderId = await confirmationModalProps.handleConfirm(event);
      setActiveOrderId(orderId);
    },
    [confirmationModalProps]
  );

  const handleCloseExecution = useCallback(() => {
    setActiveOrderId(null);
  }, []);

  // On initial load, fix selected pair and accounts if was dex
  useEffect(() => {
    if (selectedPair?.market_type === 'dex') {
      const firstExchange = selectedAccounts.length > 0 ? accounts[selectedAccounts[0]].exchangeName : null;
      const defaultPair = getDefaultPairByExchange(firstExchange, tokenPairs);
      if (defaultPair) {
        setSelectedPair(defaultPair);
      }
    }
  }, []);

  return (
    <>
      <form onSubmit={onFormSubmit}>
        <Stack direction='column' spacing={4}>
          <AccountDropdown
            multiple
            simpleChip
            accounts={accounts}
            extraStyling={{ height: '50px' }}
            handleSelectedAccountsChange={(e) => handleSelectedAccountsChange(e.target.value)}
            handleSelectedAccountsDelete={(value) => handleSelectedAccountsChange(value)}
            selectedAccounts={selectedAccounts}
          />

          <SwapQtyInputField
            baseBalance={baseBalance}
            baseQty={baseQty}
            baseQtyPlaceholder={basePrice}
            convertedQtyLoading={convertedQtyLoading}
            dashboard={dashboard}
            handleBaseQtyOnChange={handleBaseQtyOnChange}
            handleQuoteQtyOnChange={handleQuoteQtyOnChange}
            isAuthenticated={isAuthenticated}
            isBuySide={isBuySide}
            quoteBalance={quoteBalance}
            quoteQty={quoteQty}
            quoteQtyPlaceholder={quotePrice}
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
            tokenPairs={tokenPairs}
            onSwap={handleSwap}
          />
          <OrderUrgencyPicker
            disabled={!enableUrgency || isAutoOrderFormLoading}
            setUrgency={setUrgency}
            urgencies={autoOrderUrgencies}
            urgency={urgency}
          />

          <Stack direction='column' sx={{ height: '140px', justifyContent: 'flex-end' }}>
            <SimpleOrderEntryStats
              duration={autoOrderConfig && selectedDuration}
              loading={isAutoOrderFormLoading || preTradeDataLoading}
              preTradeEstimationData={preTradeEstimationData}
              strategy={autoOrderConfig && trajectory && trajectories[trajectory].name}
            />
          </Stack>

          <Button
            fullWidth
            color='success'
            disabled={!canSubmit}
            size='large'
            sx={{ color: '#000000' }}
            type='submit'
            variant='contained'
          >
            Submit Order
          </Button>
        </Stack>
      </form>
      {canSubmit && (
        <SimpleOrderConfirmationModal
          props={{ ...confirmationModalProps, handleConfirm: handleConfirmCallback, isSubmitted }}
        />
      )}
      {activeOrderId && <SimpleOrderExecutionModal handleClose={handleCloseExecution} orderId={activeOrderId} />}
    </>
  );
}

export default SimpleOrderEntryForm;
export { SimpleOrderEntrySkeleton };
