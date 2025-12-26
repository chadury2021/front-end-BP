import { Stack, TextField, InputAdornment, ToggleButtonGroup, ToggleButton, Alert } from '@mui/material';

const PRESETS = [0.5, 1, 5];

function SlippageInput({ slippage, handleSlippageChange }) {
  const handlePredefinedChange = (e, value) => {
    handleSlippageChange(value);
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      handleSlippageChange(value);
    }
  };

  const numericSlippage = parseFloat(slippage);
  const showWarning = numericSlippage > 1;

  return (
    <Stack spacing={1}>
      <Stack direction='row' spacing={1}>
        <TextField
          fullWidth
          InputProps={{
            endAdornment: <InputAdornment position='end'>%</InputAdornment>,
            inputProps: {
              inputMode: 'decimal',
            },
          }}
          label='Slippage'
          value={slippage}
          onChange={handleInputChange}
        />
        <ToggleButtonGroup exclusive size='small' value={slippage} onChange={handlePredefinedChange}>
          {PRESETS.map((value) => (
            <ToggleButton
              key={value}
              sx={{ width: '50px' }}
              value={value}
              variant={slippage === value ? 'contained' : 'outlined'}
            >
              {value}%
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      {showWarning && (
        <Alert severity='warning' sx={{ fontSize: '0.75rem' }}>
          High slippage may result in unexpected execution price.
        </Alert>
      )}
    </Stack>
  );
}

export default SlippageInput;
