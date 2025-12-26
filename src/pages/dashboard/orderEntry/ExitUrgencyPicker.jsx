import React from 'react';
import PropTypes from 'prop-types';
import { ToggleButton, FormControl, FormLabel, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DEFAULT_EXIT_URGENCIES } from '@/util/urgencyUtils';

function ExitUrgencyPicker({ disabled, urgencies = DEFAULT_EXIT_URGENCIES, urgency, setUrgency }) {
  const handleUrgencyChange = (e, newUrgency) => {
    if (newUrgency !== null) {
      setUrgency(newUrgency);
    }
  };

  const theme = useTheme();

  return (
    <FormControl sx={{ width: '100%' }}>
      <FormLabel>Urgency</FormLabel>
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            display: 'flex',
            '& .MuiToggleButton-root': {
              flex: 1,
              px: 1,
              py: 0.5,
              fontSize: '0.75rem',
              textTransform: 'none',
              backgroundColor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
              '&:not(:first-of-type)': {
                borderLeft: 'none',
              },
              '&:first-of-type': {
                borderTopLeftRadius: theme.shape.borderRadius,
                borderBottomLeftRadius: theme.shape.borderRadius,
              },
              '&:last-of-type': {
                borderTopRightRadius: theme.shape.borderRadius,
                borderBottomRightRadius: theme.shape.borderRadius,
              },
              '&.Mui-selected': {
                backgroundColor: theme.palette.orderUrgency.background,
                color: theme.palette.orderUrgency[urgency] || theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: theme.palette.orderUrgency.background,
                },
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        >
          {urgencies.map((option) => (
            <ToggleButton
              disabled={disabled}
              key={option.key}
              selected={urgency === option.key}
              sx={{
                color: theme.palette.orderUrgency[option.key] || theme.palette.text.secondary,
                fontWeight: 400,
              }}
              value={option.key}
              onClick={(e) => handleUrgencyChange(e, option.key)}
            >
              {option.name}
            </ToggleButton>
          ))}
        </Box>
      </Box>
    </FormControl>
  );
}

ExitUrgencyPicker.propTypes = {
  disabled: PropTypes.bool,
  urgencies: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  urgency: PropTypes.string.isRequired,
  setUrgency: PropTypes.func.isRequired,
};

ExitUrgencyPicker.defaultProps = {
  disabled: false,
  urgencies: undefined,
};

export default ExitUrgencyPicker;
