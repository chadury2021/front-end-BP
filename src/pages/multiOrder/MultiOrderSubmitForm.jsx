import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import React, { memo } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { useTheme } from '@emotion/react';
import { ConditionValidateField, StrategyParamSelect } from '@/shared/fields/StrategyParamSelect';
import {
  AlphaTiltSlider,
  DiscretionSlider,
  ExposureToleranceSlider,
  PassivenessSlider,
  DirectionalBiasSlider,
} from '../../shared/fields/Sliders';
import * as FormAtoms from '../dashboard/orderEntry/hooks/useFormReducer';
import DurationField from '../dashboard/orderEntry/AlgoOrderFieldsComponents/DurationField';
import MaxClipSizeField from '../dashboard/orderEntry/AlgoOrderFieldsComponents/MaxClipSizeField';
import DynamicLimitSpread from './fields/DynamicLimitSpread';
import BorderedStack from '../dashboard/orderEntry/AlgoOrderFieldsComponents/BorderedStack';
import AggregatePreTradeAnalytics from './AggregatePreTradeAnalytics';

const MultiOrderSubmitForm = memo(
  ({
    strategies,
    strategyParams,
    selectedStrategy,
    setSelectedStrategy,
    selectedStrategyParams,
    setSelectedStrategyParams,
    selectedDuration,
    setSelectedDuration,
    passiveness,
    setPassiveness,
    discretion,
    setDiscretion,
    exposureTolerance,
    setExposureTolerance,
    orderCondition,
    setOrderCondition,
    isOrderConditionValidated,
    setIsOrderConditionValidated,
    handleSubmit,
    showAlert,
    formState,
    alphaTilt,
    setAlphaTilt,
    maxClipSize,
    setMaxClipSize,
    submitLoading,
    setTimeStart,
    limitPriceSpread,
    setLimitPriceSpread,
    isSpreadCollapsed,
    setIsSpreadCollapsed,
    buyData,
    sellData,
    buyOrderItems,
    sellOrderItems,
    directionalBias,
    setDirectionalBias,
  }) => {
    const theme = useTheme();
    const areOrderItemsValid = Object.values(formState).every((side) => {
      return side.every((item) => item.accounts.length > 0 && item.pair && item.qty);
    });

    const enoughItems = buyOrderItems.length + sellOrderItems.length > 1;

    const orderConditionValid = !orderCondition || isOrderConditionValidated;
    const isReadyToSubmit = areOrderItemsValid && enoughItems && orderConditionValid;

    const handleStrategyParamChange = (event) => {
      setSelectedStrategyParams({
        ...selectedStrategyParams,
        [event.target.name]: event.target.checked,
      });
    };

    const setDefaultParams = () => {
      setPassiveness(0.02);
      setDiscretion(0.06);
      setAlphaTilt(0);
      setExposureTolerance(0.1);
      setMaxClipSize(null);
      setSelectedStrategyParams({});
    };

    return (
      <form style={{ height: '100%', display: 'flex', flexDirection: 'column' }} onSubmit={handleSubmit}>
        <Stack direction='column' justifyContent='space-between' sx={{ p: 3, height: '100%' }}>
          <Stack direction='column' spacing={3}>
            <DurationField
              FormAtoms={FormAtoms}
              isCalculatingDuration={false}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              setTimeStart={setTimeStart}
              useMarketData={false}
            />

            <BorderedStack spacing={2} title={<TreadTooltip variant='strategy_parameters' />}>
              <ExposureToleranceSlider
                exposureTolerance={exposureTolerance}
                setExposureTolerance={setExposureTolerance}
              />
              <PassivenessSlider passiveness={passiveness} setPassiveness={setPassiveness} />
              <DiscretionSlider discretion={discretion} setDiscretion={setDiscretion} />
              <AlphaTiltSlider alphaTilt={alphaTilt} setAlphaTilt={setAlphaTilt} />
              <DirectionalBiasSlider directionalBias={directionalBias} setDirectionalBias={setDirectionalBias} />
              <MaxClipSizeField
                maxClipSize={maxClipSize}
                setMaxClipSize={setMaxClipSize}
                style={{ marginTop: '16px' }}
              />
              <Stack alignItems='flex-end' direction='row' justifyContent='space-between'>
                <StrategyParamSelect
                  isMulti
                  handleStrategyParamChange={handleStrategyParamChange}
                  selectedStrategyParams={selectedStrategyParams}
                  showHeading={false}
                  strategyParams={strategyParams}
                />
                <Button sx={{ textAlign: 'right', cursor: 'pointer' }} onClick={setDefaultParams}>
                  <Typography color='primary'>Reset Default</Typography>
                </Button>
              </Stack>
            </BorderedStack>

            <ConditionValidateField
              isOrderConditionValidated={isOrderConditionValidated}
              orderCondition={orderCondition}
              rows={2}
              setIsOrderConditionValidated={setIsOrderConditionValidated}
              setOrderCondition={setOrderCondition}
              showAlert={showAlert}
            />

            <DynamicLimitSpread
              formState={formState}
              isCollapsed={isSpreadCollapsed}
              limitPriceSpread={limitPriceSpread}
              setIsCollapsed={setIsSpreadCollapsed}
              setLimitPriceSpread={setLimitPriceSpread}
              showAlert={showAlert}
            />
          </Stack>
          <Paper
            elevation={0}
            minHeight='140px'
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 1,
            }}
          >
            <Stack direction='column' sx={{ pb: 2, position: 'relative' }}>
              <AggregatePreTradeAnalytics
                buyData={buyData}
                buyOrderItems={buyOrderItems}
                sellData={sellData}
                sellOrderItems={sellOrderItems}
                theme={theme}
              />
            </Stack>
            <Button
              fullWidth
              color='success'
              disabled={!isReadyToSubmit || submitLoading}
              size='large'
              sx={{ height: '40px' }}
              type='submit'
              variant='contained'
            >
              {submitLoading ? <CircularProgress color='inherit' size={24} /> : 'Submit Multi Order'}
            </Button>
          </Paper>
        </Stack>
      </form>
    );
  }
);

MultiOrderSubmitForm.displayName = 'MultiOrderSubmitForm';

export default MultiOrderSubmitForm;
