import React from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import LabelTooltip from '@/shared/components/LabelTooltip';
import { StyledIBMTypography } from '@/shared/orderTable/util';

export default function MarketMakerConfiguration({ durationMinutes, passiveness, participationRate }) {
  const displayDuration = (duration) => {
    if (!duration) return '-';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const minuteStr = minutes === 1 ? 'minute' : 'minutes';
    if (hours === 0) {
      return `${minutes} ${minuteStr}`;
    }
    return `${hours} hours ${minutes} ${minuteStr}`;
  };

  const displayParticipationRate = (value) => {
    if (!value && value !== 0) return '-';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Paper elevation={1} sx={{ pt: 1, pb: 1, px: 2, backgroundColor: 'transparent', backdropFilter: 'blur(5px)' }}>
      <Stack direction='column' spacing={1}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <TuneIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant='body1'>Configuration</Typography>
        </Stack>

        <Stack direction='column' spacing={1}>
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Duration'
              link='https://docs.tread.fi/market-maker-bot#duration-calculations'
              placement='left'
              title={<Typography>Estimated runtime derived from selected mode.</Typography>}
            />
            <StyledIBMTypography variant='body2'>{displayDuration(durationMinutes)}</StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Participation Rate'
              link='https://docs.tread.fi/market-maker-bot#execution-settings'
              placement='left'
              title={
                <Typography>
                  Target share of market volume the engine aims to execute at any moment for each leg.
                </Typography>
              }
            />
            <StyledIBMTypography variant='body2'>{displayParticipationRate(participationRate)}</StyledIBMTypography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
