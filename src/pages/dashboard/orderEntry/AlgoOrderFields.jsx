/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Stack, Typography, useTheme, Box } from '@mui/material';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { calculateDurationForPov } from '../../../apiServices';
import {
  AlphaTiltSlider,
  DiscretionSlider,
  MaxOtcPercentageSlider,
  PassivenessSlider,
} from '../../../shared/fields/Sliders';
import { ConditionValidateField, StrategyParamSelect } from '../../../shared/fields/StrategyParamSelect';
import useStrategyContainer from '../../../shared/fields/SuperStrategyView';

import { PovLimitField, PovTargetField } from '../../../shared/fields/ParticipationRate';
import BorderedStack from './AlgoOrderFieldsComponents/BorderedStack';
import DurationField from './AlgoOrderFieldsComponents/DurationField';
import TrajectoryDropdown from '../../../shared/fields/TrajectoryDropdown';
import MaxClipSizeField from './AlgoOrderFieldsComponents/MaxClipSizeField';

function AlgoOrderFields({
  baseAssetQty,
  exchanges,
  fetchTradePrediction,
  isBuySide,
  isOrderConditionValidated,
  isPovLoading,
  notes,
  orderCondition,
  povLimit,
  povTarget,
  preTradeDataLoading,
  selectedAccountExchangeNames,
  selectedDuration,
  selectedPairName,
  selectedStrategy,
  selectedStrategyName,
  selectedStrategyParams,
  setIsOrderConditionValidated,
  setLimitPrice,
  setNotes,
  setOrderCondition,
  setPovLimit,
  setPovTarget,
  setSelectedDuration,
  setSelectedStrategyParams,
  setTrajectory,
  setUpdatePairLeverage,
  showAlert,
  sliderProps,
  strategies,
  strategyParams,
  trajectory,
  trajectories,
  tokenPairs,
  updatePairLeverage,

  targetTime,
  setTargetTime,

  FormAtoms,
}) {
  const theme = useTheme();

  const { passiveness, setPassiveness, discretion, setDiscretion, alphaTilt, setAlphaTilt } = sliderProps;
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);
  const [maxOtcPercentage, setMaxOtcPercentage] = useAtom(FormAtoms.maxOtcPercentageAtom);
  const [maxClipSize, setMaxClipSize] = useAtom(FormAtoms.maxClipSizeAtom);
  const [formPageType] = useAtom(FormAtoms.formPageType);

  const handleStrategyParamChange = (event) => {
    setSelectedStrategyParams({
      ...selectedStrategyParams,
      [event.target.name]: event.target.checked,
    });
  };

  const calculateDuration = async (newPovTarget = null) => {
    const value = Number(newPovTarget || povTarget);

    if (!value || !baseAssetQty) {
      return;
    }

    setIsCalculatingDuration(true);

    let duration;
    try {
      const result = await calculateDurationForPov(
        selectedAccountExchangeNames,
        selectedPairName,
        baseAssetQty,
        value / 100 // convert from percent to ratio
      );
      duration = result.duration;
    } catch (e) {
      return;
    } finally {
      setIsCalculatingDuration(false);
    }

    if (!duration) {
      return;
    }

    setSelectedDuration(Number(duration).toFixed(0));
  };

  const { RenderStrategyContainer, applyPresets } = useStrategyContainer({
    baseAssetQty,
    calculateDuration,
    handleStrategyParamChange,
    isCalculatingDuration,
    isPovLoading,
    povTarget,
    selectedDuration,
    selectedStrategy,
    selectedStrategyParams,
    setPovTarget,
    setSelectedDuration,
    setSelectedStrategyParams,
    sliderProps,
    strategies,
    strategyParams,
    targetTime,
    setTargetTime,
    FormAtoms,
  });

  const setDefaultParams = () => {
    applyPresets(selectedStrategy);
  };

  useEffect(() => {
    if (baseAssetQty) {
      calculateDuration();
    }
  }, [baseAssetQty]);

  const AdvancedSettingsRender = (
    <Grid container spacing={4}>
      <Grid xs={12}>
        <TrajectoryDropdown
          disabled={selectedStrategy !== 'Custom'}
          selectedStrategy={selectedStrategy}
          setTrajectory={setTrajectory}
          trajectories={trajectories}
          trajectory={trajectory}
        />
      </Grid>
      <Grid xs={12}>
        <PovTargetField
          baseAssetQty={baseAssetQty}
          calculateDuration={calculateDuration}
          isPovLoading={isPovLoading}
          povTarget={povTarget}
          setPovTarget={setPovTarget}
        />
      </Grid>
      <Grid xs={12}>
        <PovLimitField
          baseAssetQty={baseAssetQty}
          isPovLoading={isPovLoading}
          povLimit={povLimit}
          setPovLimit={setPovLimit}
        />
      </Grid>
      <Grid xs={12}>
        <Stack direction='column' spacing={1}>
          {selectedStrategyName !== 'Market' && (
            <DurationField
              inCollapsible
              FormAtoms={FormAtoms}
              isCalculatingDuration={isCalculatingDuration}
              povTarget={povTarget}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
            />
          )}
        </Stack>
      </Grid>
      <Grid xs={12}>
        <BorderedStack spacing={1} title={<TreadTooltip variant='strategy_parameters' />}>
          <PassivenessSlider passiveness={passiveness} setPassiveness={setPassiveness} />
          <DiscretionSlider discretion={discretion} setDiscretion={setDiscretion} />
          <AlphaTiltSlider alphaTilt={alphaTilt} setAlphaTilt={setAlphaTilt} />
          <MaxOtcPercentageSlider maxOtcPercentage={maxOtcPercentage} setMaxOtcPercentage={setMaxOtcPercentage} />
          <MaxClipSizeField maxClipSize={maxClipSize} setMaxClipSize={setMaxClipSize} style={{ marginTop: '16px' }} />
          <Stack alignItems='flex-end' direction='row' justifyContent='space-between'>
            <StrategyParamSelect
              handleStrategyParamChange={handleStrategyParamChange}
              selectedAccountExchangeNames={selectedAccountExchangeNames}
              selectedStrategyName={selectedStrategyName}
              selectedStrategyParams={selectedStrategyParams}
              showHeading={false}
              strategyParams={strategyParams}
            />
            <Button sx={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setDefaultParams()}>
              <Typography color='primary'>Reset Default</Typography>
            </Button>
          </Stack>
        </BorderedStack>
      </Grid>
      {formPageType !== 'ChainedOrderPage' && (
        <Grid xs={12}>
          <ConditionValidateField
            isOrderConditionValidated={isOrderConditionValidated}
            orderCondition={orderCondition}
            rows={2}
            setIsOrderConditionValidated={setIsOrderConditionValidated}
            setOrderCondition={setOrderCondition}
            showAlert={showAlert}
          />
        </Grid>
      )}
      <Grid xs={12}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          placeholder='Notes'
          size='small'
          type='text'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Grid>
    </Grid>
  );

  return { AdvancedSettingsRender, RenderStrategyContainer, applyPresets };
}

export default AlgoOrderFields;
