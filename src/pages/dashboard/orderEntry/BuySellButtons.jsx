import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import styled from '@emotion/styled';

const StyledSellToggleButton = styled(ToggleButton)(({ theme }) => {
  return {
    '&.Mui-selected': {
      backgroundColor: theme.palette.charts.red,
      color: theme.palette.text.primary,
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.charts.redTransparent,
    },
    color: theme.palette.text.disabled,
    py: 0,
  };
});

const StyledBuyToggleButton = styled(ToggleButton)(({ theme }) => {
  return {
    '&.Mui-selected': {
      backgroundColor: theme.palette.charts.green,
      color: '#000000', // Always black text for buy button
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.charts.greenTransparent,
      color: '#000000', // Always black text on hover
    },
    color: theme.palette.text.disabled,
    py: 0,
  };
});

export function BuySellButtons({ handleSelectedSide, isBuySide, selectedPair, selectedSide, isCompact, disabled }) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      disabled={disabled}
      style={{ height: isCompact ? '50%' : '100%' }}
      value={selectedSide}
      onChange={(e, newpair) => handleSelectedSide(e, newpair, selectedSide, selectedPair)}
    >
      <StyledBuyToggleButton aria-label='buy' value='buy'>
        <Typography color={isBuySide ? '#000000' : 'text.offWhite'} variant='body1'>
          Buy
        </Typography>
      </StyledBuyToggleButton>
      <StyledSellToggleButton aria-label='sell' value='sell'>
        <Typography color='text.offWhite' variant='body1'>
          Sell
        </Typography>
      </StyledSellToggleButton>
    </ToggleButtonGroup>
  );
}
