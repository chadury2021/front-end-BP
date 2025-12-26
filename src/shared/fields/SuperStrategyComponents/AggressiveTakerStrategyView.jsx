import Grid from '@mui/material/Unstable_Grid2';
import DurationField from '../../../pages/dashboard/orderEntry/AlgoOrderFieldsComponents/DurationField';

export function AggressiveTakerStrategyView({
  baseAssetQty,
  calculateDuration,
  duration,
  isPovLoading,
  povTarget,
  setPovTarget,
  setSelectedDuration,
  sliderProps,
  FormAtoms,
}) {
  const { passiveness, setPassiveness, discretion, setDiscretion, alphaTilt, setAlphaTilt } = sliderProps;

  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <DurationField
          FormAtoms={FormAtoms}
          isCalculatingDuration={false}
          povTarget={povTarget}
          selectedDuration={duration}
          setSelectedDuration={setSelectedDuration}
        />
      </Grid>
    </Grid>
  );
}
