import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import styled from '@emotion/styled';

export function PositionSideButtons({ posSide, setPosSide, isCompact }) {
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
        color: theme.palette.text.offBlack,
      },
      '&.Mui-selected:hover': {
        backgroundColor: theme.palette.charts.greenTransparent,
      },
      color: theme.palette.text.disabled,
      py: 0,
    };
  });

  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      style={{ height: isCompact ? '50%' : '100%' }}
      value={posSide}
      onChange={(e, newPosSide) => setPosSide(newPosSide)}
    >
      <StyledBuyToggleButton aria-label='long' value='long'>
        <Typography color={posSide === 'long' ? 'text.offBlack' : 'text.offWhite'} variant='body1'>
          Long
        </Typography>
      </StyledBuyToggleButton>
      <StyledSellToggleButton aria-label='short' value='short'>
        <Typography color='text.offWhite' variant='body1'>
          Short
        </Typography>
      </StyledSellToggleButton>
    </ToggleButtonGroup>
  );
}
