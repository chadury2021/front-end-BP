import Grid from '@mui/material/Unstable_Grid2';
import DurationField from '../../../pages/dashboard/orderEntry/AlgoOrderFieldsComponents/DurationField';

export function TWAPStrategyView({
  duration,
  isCalculatingDuration,
  setSelectedDuration,
  sliderProps,
  povTarget,
  FormAtoms,
}) {
  const { passiveness, setPassiveness, discretion, setDiscretion, alphaTilt, setAlphaTilt } = sliderProps;

  return (
    <Grid container spacing={2}>
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
