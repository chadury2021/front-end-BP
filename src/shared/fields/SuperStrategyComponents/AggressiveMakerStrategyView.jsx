import Grid from '@mui/material/Unstable_Grid2';
import React from 'react';
import DurationField from '../../../pages/dashboard/orderEntry/AlgoOrderFieldsComponents/DurationField';
import { PovTargetField } from '../ParticipationRate';

export function AggressiveMakerStrategyView({
  baseAssetQty,
  calculateDuration,
  duration,
  isCalculatingDuration,
  isPovLoading,
  povTarget,
  setPovTarget,
  setSelectedDuration,
  FormAtoms,
}) {
  return (
    <Grid container spacing={2}>
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
        <DurationField
          FormAtoms={FormAtoms}
          isCalculatingDuration={isCalculatingDuration}
          povTarget={povTarget}
          selectedDuration={duration}
          setSelectedDuration={setSelectedDuration}
        />
      </Grid>
    </Grid>
  );
}
