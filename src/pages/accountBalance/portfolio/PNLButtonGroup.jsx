import React, { useState } from 'react';
import { Button, ButtonGroup, Box } from '@mui/material';

export const timeGroupMapping = {
  '1D': 1,
  '7D': 7,
  // '1M': 30,
};

// TODO: create common time picker component that ties in points date picker
function PNLButtonGroup({ timeActiveButton, setTimeActiveButton }) {
  const handleButtonClick = (value) => {
    setTimeActiveButton(value);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
      <ButtonGroup variant='outlined'>
        {Object.keys(timeGroupMapping).map((range) => (
          <Button
            key={range}
            sx={{
              backgroundColor: timeActiveButton === range ? 'primary.main' : 'inherit',
              color: timeActiveButton === range ? 'primary.contrastText' : 'primary.main',
              '&:hover': {
                backgroundColor: timeActiveButton === range ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
            onClick={() => handleButtonClick(range)}
          >
            {range}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}

export default PNLButtonGroup;
