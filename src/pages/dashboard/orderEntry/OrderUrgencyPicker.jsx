import React from 'react';
import { ToggleButton, FormControl, FormLabel, Box } from '@mui/material';
import LoadingToggleButtonGroup from '@/shared/components/LoadingToggleButtonGroup';
import { useTheme } from '@mui/material/styles';

function OrderUrgencyPicker({ disabled, loading, urgencies = [], urgency, setUrgency }) {
  const handleUrgencyChange = (e, newUrgency) => {
    setUrgency(newUrgency);
  };

  const theme = useTheme();

  return (
    <FormControl sx={{ width: '100%' }}>
      <FormLabel>Urgency</FormLabel>
      <Box sx={{ mt: 1 }}>
        <LoadingToggleButtonGroup
          exclusive
          fullWidth
          color='primary'
          disabled={disabled}
          loading={loading}
          value={urgency}
          onChange={handleUrgencyChange}
        >
          {urgencies.map((option) => (
            <ToggleButton
              key={option.key}
              sx={{
                px: 0,
                color: theme.palette.orderUrgency[option.key],
                fontWeight: 400,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.orderUrgency.background,
                  color: theme.palette.orderUrgency[option.key],
                },
              }}
              value={option.key}
            >
              {option.name}
            </ToggleButton>
          ))}
        </LoadingToggleButtonGroup>
      </Box>
    </FormControl>
  );
}

export default OrderUrgencyPicker;
