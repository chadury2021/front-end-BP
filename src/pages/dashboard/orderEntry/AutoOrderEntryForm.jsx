import React, { useEffect } from 'react';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { Typography, Button, Divider, Stack } from '@mui/material';
import AccountDropdown from '@/shared/fields/AccountDropdown';
import { BuySellButtons } from '@/pages/dashboard/orderEntry/BuySellButtons';
import PreTradeAnalyticsComponent from '@/shared/PreTradeAnalyticsComponent';
import { smartRound } from '@/util';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import DataComponent from '@/shared/DataComponent';
import { Loader } from '@/shared/Loader';
import { useBaseForm } from './hooks/useBaseForm';
import { QtyInputField } from './QtyInputField';
import OrderUrgencyPicker from './OrderUrgencyPicker';
import useAutoOrderEntryForm from './hooks/useAutoOrderEntryForm';
import { useSubmitForm } from './hooks/useSubmitForm';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import AutoOrderExplanation from './AutoOrderExplanation';

function AutoOrderEntryForm() {
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
    convertedQty,
    baseQtyPlaceholder,
    quoteQtyPlaceholder,
    baseContractQty,
    basePercentage,
    quotePercentage,
    convertedQtyLoading,
    accounts,
    selectedAccounts,
    selectedPair,
    selectedSide,
    setSelectedAccounts,
    setBasePercentage,
    setQuotePercentage,
    setQtyLoading,
    setBaseQty,
    setQuoteQty,
  } = quoteBaseStates;

  const { handleBaseQtyOnChange, handleQuoteQtyOnChange, onBasePercentageChangeCommit, onQuotePercentageChangeCommit } =
    handleBaseQuoteFields;

  const { totalQuoteAsset, totalBaseAsset } = percentageSliderInfo;

  const {
    urgency,
    setUrgency,
    enableUrgency,
    isAutoOrderFormLoading,
    autoOrderConfig,
    configFields,
    autoOrderExplanation,
    preTradeEstimationData,
    preTradeDataError,
    preTradeDataLoading,
  } = useAutoOrderEntryForm({
    trajectories,
    accounts,
  });

  const { submitCheck, confirmationModalProps } = useSubmitForm({});

  const isBuySide = selectedSide === 'buy';
  const isReadyToPickQty =
    !isAutoOrderFormLoading && selectedAccounts.length > 0 && selectedPair && Object.keys(selectedPair).length > 0;

  const { handleSelectedAccountsChange, handleSelectedSide } = handleCoreFields;

  const { passiveness, alphaTilt, trajectory, selectedDuration } = configFields;

  const canSubmit = enableUrgency && autoOrderConfig && !isAutoOrderFormLoading;
  const isSimple = trajectory && ['Market', 'IOC'].includes(trajectories[trajectory]?.name);

  // If there is only one account, select it by default
  useEffect(() => {
    const account_names = Object.keys(accounts);
    if (account_names.length === 1) {
      setSelectedAccounts([account_names[0]]);
    }
  }, []);

  const onFormSubmit = (e) => {
    submitCheck(e);
  };

  return (
    <>
      <form style={{ height: '100%' }} onSubmit={onFormSubmit}>
        <Stack direction='column' height='100%' justifyContent='space-between' width='100%'>
          <Grid
            container
            spacing={4}
            sx={{
              overflowY: 'auto',
            }}
          >
            <Grid xs={6}>
              <AccountDropdown
                multiple
                accounts={accounts}
                extraStyling={{ height: '50.25px' }}
                handleSelectedAccountsChange={(e) => handleSelectedAccountsChange(e.target.value)}
                handleSelectedAccountsDelete={(value) => handleSelectedAccountsChange(value)}
                selectedAccounts={selectedAccounts}
              />
            </Grid>
            <Grid xs={6}>
              <BuySellButtons
                disabled={isAutoOrderFormLoading}
                handleSelectedSide={handleSelectedSide}
                isBuySide={isBuySide}
                selectedPair={selectedPair}
                selectedSide={selectedSide}
              />
            </Grid>

            <Grid xs={6}>
              <QtyInputField
                isBase
                contractQty={baseContractQty}
                convertedQtyLoading={convertedQtyLoading}
                handleQtyOnChange={handleBaseQtyOnChange}
                isBuySide={isBuySide}
                isReadyToPickQty={isReadyToPickQty}
                oppositeQtyExists={!!quoteQty}
                percentage={basePercentage}
                qty={baseQty}
                qtyPlaceholder={baseQtyPlaceholder}
                selectedPair={selectedPair}
                setBaseQty={setBaseQty}
                setPercentage={setBasePercentage}
                setQtyLoading={setQtyLoading}
                setQuoteQty={setQuoteQty}
                totalBaseAsset={totalBaseAsset}
                totalQuoteAsset={totalQuoteAsset}
                onPercentageChangeCommit={onBasePercentageChangeCommit}
              />
            </Grid>
            <Grid xs={6}>
              <QtyInputField
                convertedQtyLoading={convertedQtyLoading}
                handleQtyOnChange={handleQuoteQtyOnChange}
                isBase={false}
                isBuySide={isBuySide}
                isReadyToPickQty={isReadyToPickQty}
                oppositeQtyExists={!!baseQty}
                percentage={quotePercentage}
                qty={quoteQty}
                qtyPlaceholder={quoteQtyPlaceholder}
                selectedPair={selectedPair}
                setBaseQty={setBaseQty}
                setPercentage={setQuotePercentage}
                setQtyLoading={setQtyLoading}
                setQuoteQty={setQuoteQty}
                totalBaseAsset={totalBaseAsset}
                totalQuoteAsset={totalQuoteAsset}
                onPercentageChangeCommit={onQuotePercentageChangeCommit}
              />
            </Grid>

            <Grid xs={12}>
              <OrderUrgencyPicker
                disabled={!enableUrgency || isAutoOrderFormLoading}
                setUrgency={setUrgency}
                urgencies={autoOrderUrgencies}
                urgency={urgency}
              />
            </Grid>

            <Grid xs={12}>
              <Stack direction='column' spacing={2}>
                <DataComponent isLoading={isAutoOrderFormLoading} loadingComponent={<Loader />}>
                  <Stack direction='column' spacing={4}>
                    <Stack direction='column' spacing={2}>
                      <Typography variant='subtitle2'>Configuration</Typography>
                      <Stack direction='row' justifyContent='space-between'>
                        <TreadTooltip placement='left' variant='strategy' />
                        <Typography variant='body1'>
                          {autoOrderConfig && trajectory ? trajectories[trajectory].name : '-'}
                        </Typography>
                      </Stack>
                      {!isSimple && (
                        <>
                          <Stack direction='row' justifyContent='space-between'>
                            <TreadTooltip placement='left' variant='duration' />
                            <Typography variant='body1'>
                              {autoOrderConfig ? `${smartRound(selectedDuration / 60, 2)} mins` : '-'}
                            </Typography>
                          </Stack>
                          <Stack direction='row' justifyContent='space-between'>
                            <TreadTooltip placement='left' variant='passiveness' />
                            <Typography variant='body1'>{autoOrderConfig ? passiveness : 'N/A'}</Typography>
                          </Stack>
                          <Stack direction='row' justifyContent='space-between'>
                            <TreadTooltip placement='left' variant='alpha_tilt' />
                            <Typography variant='body1'>{autoOrderConfig ? alphaTilt : 'N/A'}</Typography>
                          </Stack>
                        </>
                      )}
                    </Stack>

                    {autoOrderConfig && (
                      <>
                        <Divider />

                        <Stack direction='column' spacing={2}>
                          <Typography variant='subtitle2'>Explanation</Typography>
                          {autoOrderExplanation.map((explanation) => (
                            <AutoOrderExplanation
                              key={explanation}
                              orderParams={{
                                side: selectedSide,
                                qty: baseQty || convertedQty,
                                pair: selectedPair.label,
                                duration: selectedDuration,
                                urgency: autoOrderUrgencies.filter((aou) => aou.key === urgency)[0],
                                strategy: trajectory && trajectories[trajectory]?.name,
                                pov: preTradeEstimationData.pov,
                                volatility: preTradeEstimationData.volatility,
                              }}
                              side={selectedSide}
                              variant={explanation}
                            />
                          ))}
                        </Stack>
                      </>
                    )}
                  </Stack>
                </DataComponent>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction='column' spacing={2}>
            <PreTradeAnalyticsComponent
              data={preTradeEstimationData}
              dataError={preTradeDataError}
              loading={preTradeDataLoading}
            />
            <Button
              fullWidth
              color={isBuySide ? 'success' : 'error'}
              disabled={!canSubmit}
              size='large'
              sx={isBuySide ? { color: '#000000' } : {}}
              type='submit'
              variant='contained'
            >
              Submit {isBuySide ? 'Buy' : 'Sell'} Order
            </Button>
          </Stack>
        </Stack>
      </form>
      <OrderConfirmationModal props={confirmationModalProps} />
    </>
  );
}

export default AutoOrderEntryForm;
