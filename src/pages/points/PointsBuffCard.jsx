import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function PointsBuffCard({
  title,
  description,
  multiplier,
  exchangeIconSrc,
  exchangeAlt,
  BuffIcon,
  iconColor,
  multiplierColor,
  cardOpacity = 1,
  minHeight,
  maxHeight,
  cardSx,
  plain = false,
  children,
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        alignSelf: 'flex-start',
        p: plain ? 0 : 2,
        borderRadius: plain ? 0 : 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        opacity: cardOpacity,
        transition: 'opacity 0.2s ease-in-out',
        width: '100%',
        minHeight,
        maxHeight,
        ...(plain ? {} : cardSx),
      }}
    >
      <Stack alignItems='center' direction='row' justifyContent='space-between' spacing={2}>
        <Stack alignItems='center' direction='row' flex={1} spacing={2} sx={{ minWidth: 0 }}>
          {exchangeIconSrc ? (
            <Box
              alt={exchangeAlt}
              component='img'
              src={exchangeIconSrc}
              sx={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : null}
          {BuffIcon ? (
            <BuffIcon
              sx={{
                flexShrink: 0,
                color: iconColor,
              }}
            />
          ) : null}
          <Stack direction='row' flex={1} spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Typography noWrap variant='subtitle1'>
              {title}
            </Typography>
          </Stack>
        </Stack>
        {multiplier ? (
          <Typography
            sx={{
              color: multiplierColor,
              flexShrink: 0,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
            variant='body1'
          >
            {multiplier}
          </Typography>
        ) : null}
      </Stack>
      {description ? (
        <Typography sx={{ color: theme.palette.text.secondary }} variant='body2'>
          {description}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}

export default PointsBuffCard;
