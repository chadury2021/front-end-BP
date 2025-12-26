import React from 'react';
import { Box, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { alpha } from '@mui/material/styles';
import { numberWithCommas, smartRound } from '@/util';

function WeeklyVolumeProgress({
  current,
  target,
  progress,
  boostPercentage,
  disableWrapper = false,
  showLabel = true,
  showEndpoints = true,
  showTargetLabel = false,
  showNextBoost = false,
  cardSx,
  wrapperGap = 1.25,
  wrapperPadding = 2.5,
  contentGap = 1,
}) {
  const theme = useTheme();

  const content = (
    <Stack direction='column' gap={contentGap}>
      <Stack direction='column' spacing={0.5}>
        {/* Boost percentage above progress bar (right aligned) */}
        <Stack direction='row' justifyContent='flex-end'>
          {(() => {
            if (showNextBoost && boostPercentage > 0) {
              return (
                <Stack alignItems='center' direction='row' spacing={0.5}>
                  <KeyboardArrowUpIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />
                  <Typography sx={{ color: theme.palette.warning.main, fontSize: '0.75rem' }} variant='caption'>
                    Next Boost: {boostPercentage}% boost in notional volume generated
                  </Typography>
                </Stack>
              );
            }
            if (boostPercentage > 0) {
              return (
                <Typography sx={{ color: theme.palette.warning.main, fontSize: '0.75rem' }} variant='caption'>
                  {boostPercentage}% boost in notional volume generated
                </Typography>
              );
            }
            return (
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }} variant='caption'>
                No active boost
              </Typography>
            );
          })()}
        </Stack>
        {/* Progress bar */}
        <LinearProgress
          sx={{
            width: '100%',
            height: 12,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.common.white, 0.06),
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.warning.main,
              borderRadius: 2,
            },
          }}
          value={progress}
          variant='determinate'
        />
        {/* Current and target values below progress bar */}
        <Stack alignItems='flex-end' direction='row' justifyContent='space-between'>
          <Typography sx={{ color: theme.palette.common.white }} variant='body2'>
            ${numberWithCommas(smartRound(current, 0))}
          </Typography>
          {showTargetLabel && (
            <Typography sx={{ color: theme.palette.common.white }} variant='body2'>
              ${numberWithCommas(smartRound(target, 0))}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );

  if (disableWrapper) {
    return content;
  }

  const wrapperSx = {
    p: wrapperPadding,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 152, 48, 0.1)',
    border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
    width: '100%',
    ...(cardSx || { minHeight: 110 }),
  };

  return (
    <Stack direction='column' gap={wrapperGap} sx={wrapperSx}>
      {content}
    </Stack>
  );
}

export default WeeklyVolumeProgress;
