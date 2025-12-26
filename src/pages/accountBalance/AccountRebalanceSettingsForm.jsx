import React, { useEffect, useState } from 'react';
import { Box, Stack, Grid } from '@mui/material';
import {
  AlphaTiltSlider,
  DiscretionSlider,
  ExposureToleranceSlider,
  PassivenessSlider,
} from '../../shared/fields/Sliders';
import { StrategyParamSelect } from '../../shared/fields/StrategyParamSelect';
import TrajectoryDropdown from '../../shared/fields/TrajectoryDropdown';
import * as FormAtoms from '../dashboard/orderEntry/hooks/useFormReducer';

export default function AccountRebalanceSettingsForm({
  strategies,
  strategyParams,
  selectedStrategy,
  setSelectedStrategy,
  selectedStrategyParams,
  setSelectedStrategyParams,
  passiveness,
  setPassiveness,
  discretion,
  setDiscretion,
  exposureTolerance,
  setExposureTolerance,
  handleSubmit,
  alphaTilt,
  setAlphaTilt,
}) {
  const filteredStrategies = Object.fromEntries(
    Object.entries(strategies).filter(([key, value]) => value.name === 'TWAP' || value.name === 'IS')
  );

  const handleStrategyParamChange = (event) => {
    setSelectedStrategyParams({
      ...selectedStrategyParams,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <form height='100%' onSubmit={handleSubmit}>
      <Stack direction='row' height='100%' spacing={5}>
        <Box style={{ width: '34%' }}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <TrajectoryDropdown
                setTrajectory={setSelectedStrategy}
                trajectories={filteredStrategies}
                trajectory={selectedStrategy}
              />
            </Grid>
          </Grid>
        </Box>
        <Box style={{ width: '33%', height: '100%' }}>
          <Stack marginTop='8px' spacing={0}>
            <ExposureToleranceSlider
              exposureTolerance={exposureTolerance}
              setExposureTolerance={setExposureTolerance}
              sx={{ marginBottom: '10px' }}
            />
            <PassivenessSlider
              passiveness={passiveness}
              setPassiveness={setPassiveness}
              sx={{ marginBottom: '10px' }}
            />
            <DiscretionSlider discretion={discretion} setDiscretion={setDiscretion} sx={{ marginBottom: '10px' }} />
            <AlphaTiltSlider alphaTilt={alphaTilt} setAlphaTilt={setAlphaTilt} sx={{ marginBottom: '10px' }} />
          </Stack>
        </Box>
        <Box sx={{ width: '33%', height: '100%' }}>
          <StrategyParamSelect
            handleStrategyParamChange={handleStrategyParamChange}
            selectedStrategyParams={selectedStrategyParams}
            strategyParams={strategyParams}
          />
        </Box>
      </Stack>
    </form>
  );
}
