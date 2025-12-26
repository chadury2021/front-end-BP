import React, { useCallback, useState, useEffect } from 'react';
import Slider from '@mui/material/Slider';
import { Box, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { smartRound } from '@/util';

const percentageMarks = [
  {
    value: 25,
  },
  {
    value: 50,
  },
  {
    value: 75,
  },
];

function PercentageSlider({
  percentage,
  setPercentage,
  disabled,
  ariaLabel,
  onChangeCommitted,
  totalAsset,
  setQtyState,
  sliderUpdatingRef,
}) {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState(percentage);
  const [isDragging, setIsDragging] = useState(false);

  const whiteSliderStyles = {
    '& .MuiSlider-thumb': {
      color: 'var(--text-primary)',
      transition: 'none',
      width: 14,
      height: 14,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
      '&.Mui-active': {
        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
    },
    '& .MuiSlider-track': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-rail': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-mark': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-markLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-valueLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
  };

  // Only sync with parent when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(percentage);
    }
  }, [percentage, isDragging]);

  // Handle slider dragging - only update local state and quantity
  const handleSliderChange = useCallback(
    (_, newValue) => {
      setIsDragging(true);
      setLocalValue(newValue);

      // Update quantity during drag for real-time feedback
      if (setQtyState && totalAsset != null) {
        const assetValue = Number(totalAsset);
        if (assetValue >= 0 && Number.isFinite(assetValue)) {
          const calculatedQty = smartRound(assetValue * (newValue / 100));

          // Set flag to prevent parent interference
          if (sliderUpdatingRef) {
            // eslint-disable-next-line no-param-reassign
            sliderUpdatingRef.current = true;
          }

          setQtyState(calculatedQty.toString());
        }
      }
    },
    [setQtyState, totalAsset, sliderUpdatingRef]
  );

  // Handle drag end - now update parent
  const handleChangeCommitted = useCallback(
    (event, newValue) => {
      // Update parent percentage FIRST, before clearing drag state
      setPercentage(newValue);

      // Final quantity update
      if (setQtyState && totalAsset != null) {
        const assetValue = Number(totalAsset);
        if (assetValue >= 0 && Number.isFinite(assetValue)) {
          const calculatedQty = smartRound(assetValue * (newValue / 100));
          setQtyState(calculatedQty.toString());
        }
      }

      // Clear dragging state AFTER all updates
      setIsDragging(false);

      // Clear flag after everything is done
      if (sliderUpdatingRef) {
        setTimeout(() => {
          // eslint-disable-next-line no-param-reassign
          sliderUpdatingRef.current = false;
        }, 50);
      }

      if (onChangeCommitted) {
        onChangeCommitted(event, newValue);
      }
    },
    [setPercentage, setQtyState, totalAsset, onChangeCommitted, sliderUpdatingRef]
  );

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: '96%' }}>
        <Slider
          aria-label={ariaLabel}
          disabled={disabled}
          marks={percentageMarks}
          max={100}
          min={0}
          step={1}
          sx={{
            ...whiteSliderStyles,
            '& .MuiSlider-thumb': {
              ...whiteSliderStyles['& .MuiSlider-thumb'],
              transition: 'none',
              width: 14,
              height: 14,
            },
            '& .MuiSlider-track': {
              ...whiteSliderStyles['& .MuiSlider-track'],
              transition: 'none',
            },
            '& .MuiSlider-rail': {
              ...whiteSliderStyles['& .MuiSlider-rail'],
              transition: 'none',
            },
            '& .MuiSlider-mark': {
              ...whiteSliderStyles['& .MuiSlider-mark'],
              transition: 'none',
            },
            '& .MuiSlider-markLabel': {
              ...whiteSliderStyles['& .MuiSlider-markLabel'],
              transition: 'none',
            },
            '& .MuiSlider-valueLabel': {
              ...whiteSliderStyles['& .MuiSlider-valueLabel'],
              transition: 'none',
            },
            '&.Mui-disabled': {
              '& .MuiSlider-thumb': {
                opacity: 0.5,
                color: 'text.disabled',
              },
              '& .MuiSlider-track': {
                opacity: 0.5,
                color: 'text.disabled',
              },
              '& .MuiSlider-rail': {
                opacity: 0.5,
                color: 'text.disabled',
              },
              '& .MuiSlider-mark': {
                opacity: 0.5,
                color: 'text.disabled',
              },
              '& .MuiSlider-markLabel': {
                opacity: 0.5,
                color: 'text.disabled',
              },
            },
          }}
          value={localValue}
          valueLabelDisplay='auto'
          valueLabelFormat={(value) => `${value}%`}
          onChange={handleSliderChange}
          onChangeCommitted={handleChangeCommitted}
        />
      </Box>
    </Box>
  );
}

function PassivenessSlider({ passiveness, setPassiveness, sx }) {
  const theme = useTheme();

  const whiteSliderStyles = {
    '& .MuiSlider-thumb': {
      color: 'var(--text-primary)',
      transition: 'none',
      width: 14,
      height: 14,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
      '&.Mui-active': {
        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
    },
    '& .MuiSlider-track': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-rail': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-mark': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-markLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-valueLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
  };

  return (
    <Stack alignItems='center' direction='row' justifyContent='center' spacing={1} sx={sx}>
      <Box width='10rem'>
        <TreadTooltip placement='left' variant='passiveness' />
      </Box>
      <Slider
        marks
        aria-label='Passiveness'
        max={0.2}
        min={0.0}
        size='medium'
        step={0.02}
        sx={whiteSliderStyles}
        value={passiveness}
        valueLabelDisplay='auto'
        onChange={(_, newValue) => setPassiveness(newValue)}
      />
    </Stack>
  );
}

function DiscretionSlider({ discretion, setDiscretion, sx }) {
  const theme = useTheme();

  const whiteSliderStyles = {
    '& .MuiSlider-thumb': {
      color: 'var(--text-primary)',
      transition: 'none',
      width: 14,
      height: 14,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
      '&.Mui-active': {
        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
    },
    '& .MuiSlider-track': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-rail': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-mark': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-markLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-valueLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
  };

  return (
    <Stack alignItems='center' direction='row' justifyContent='center' spacing={1} sx={sx}>
      <Box width='10rem'>
        <TreadTooltip placement='left' variant='discretion' />
      </Box>
      <Slider
        marks
        aria-label='Discretion'
        max={0.5}
        min={0.02}
        size='medium'
        step={0.01}
        sx={whiteSliderStyles}
        value={discretion}
        valueLabelDisplay='auto'
        onChange={(_, newValue) => setDiscretion(newValue)}
      />
    </Stack>
  );
}

function ExposureToleranceSlider({ exposureTolerance, setExposureTolerance, sx }) {
  const theme = useTheme();

  const whiteSliderStyles = {
    '& .MuiSlider-thumb': {
      color: 'var(--text-primary)',
      transition: 'none',
      width: 14,
      height: 14,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
      '&.Mui-active': {
        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
    },
    '& .MuiSlider-track': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-rail': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-mark': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-markLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-valueLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
  };

  return (
    <Stack alignItems='center' direction='row' justifyContent='center' spacing={1} sx={sx}>
      <Box width='10rem'>
        <TreadTooltip placement='left' variant='exposure_tolerance' />
      </Box>
      <Slider
        marks
        aria-label='Exposure Tolerance'
        max={1.0}
        min={0.01}
        size='medium'
        step={0.01}
        sx={whiteSliderStyles}
        value={exposureTolerance}
        valueLabelDisplay='auto'
        onChange={(_, newValue) => setExposureTolerance(newValue)}
      />
    </Stack>
  );
}

function AlphaTiltSlider({ alphaTilt, setAlphaTilt, sx }) {
  const theme = useTheme();

  const whiteSliderStyles = {
    '& .MuiSlider-thumb': {
      color: 'var(--text-primary)',
      transition: 'none',
      width: 14,
      height: 14,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
      '&.Mui-active': {
        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
    },
    '& .MuiSlider-track': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-rail': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-mark': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-markLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-valueLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
  };

  return (
    <Stack alignItems='center' direction='row' justifyContent='center' spacing={1} sx={sx}>
      <Box width='10rem'>
        <TreadTooltip placement='left' variant='alpha_tilt' />
      </Box>
      <Slider
        marks
        aria-label='Alpha Tilt'
        max={1}
        min={-1}
        size='medium'
        step={0.1}
        sx={whiteSliderStyles}
        value={alphaTilt}
        valueLabelDisplay='auto'
        onChange={(_, newValue) => setAlphaTilt(newValue)}
      />
    </Stack>
  );
}

function DirectionalBiasSlider({ directionalBias, setDirectionalBias, sx }) {
  const theme = useTheme();

  // Calculate color based on bias value (-1 to 1)
  const getBiasColor = (value) => {
    if (value === 0) return theme.palette.common.pureWhite; // White for neutral

    // Normalize value to 0-1 range for interpolation
    const normalizedValue = Math.abs(value);

    if (value > 0) {
      // Positive bias (long) - interpolate from white to green
      const greenIntensity = normalizedValue;
      return `rgba(${255 - 255 * greenIntensity}, 255, ${255 - 255 * greenIntensity}, 1)`;
    }
    // Negative bias (short) - interpolate from white to red
    const redIntensity = normalizedValue;
    return `rgba(255, ${255 - 255 * redIntensity}, ${255 - 255 * redIntensity}, 1)`;
  };

  const directionalBiasSliderStyles = {
    '& .MuiSlider-thumb': {
      color: getBiasColor(directionalBias),
      transition: 'color 0.3s ease',
      width: 14,
      height: 14,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${alpha(getBiasColor(directionalBias), 0.16)}`,
      },
      '&.Mui-active': {
        boxShadow: `0px 0px 0px 14px ${alpha(getBiasColor(directionalBias), 0.16)}`,
      },
    },
    '& .MuiSlider-track': {
      background: 'transparent',
      transition: 'none',
      height: 4,
    },
    '& .MuiSlider-rail': {
      background: `linear-gradient(to right, ${theme.palette.charts.red}, ${theme.palette.common.pureWhite}, ${theme.palette.charts.green})`,
      transition: 'none',
      height: 4,
    },
    '& .MuiSlider-mark': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-markLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-valueLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
  };

  return (
    <Stack alignItems='center' direction='row' justifyContent='center' spacing={1} sx={sx}>
      <Box width='10rem'>
        <TreadTooltip placement='left' variant='directional_bias' />
      </Box>
      <Slider
        marks
        aria-label='Directional Bias'
        max={1}
        min={-1}
        size='medium'
        step={0.1}
        sx={directionalBiasSliderStyles}
        value={directionalBias}
        valueLabelDisplay='auto'
        onChange={(_, newValue) => setDirectionalBias(newValue)}
      />
    </Stack>
  );
}

function MaxOtcPercentageSlider({ maxOtcPercentage, setMaxOtcPercentage, sx }) {
  const theme = useTheme();

  const whiteSliderStyles = {
    '& .MuiSlider-thumb': {
      color: 'var(--text-primary)',
      transition: 'none',
      width: 14,
      height: 14,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
      '&.Mui-active': {
        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
      },
    },
    '& .MuiSlider-track': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-rail': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-mark': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-markLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
    '& .MuiSlider-valueLabel': {
      color: 'var(--text-primary)',
      transition: 'none',
    },
  };

  return (
    <Stack alignItems='center' direction='row' justifyContent='center' spacing={1} sx={sx}>
      <Box width='10rem'>
        <TreadTooltip placement='left' variant='max_otc_percentage' />
      </Box>
      <Slider
        marks
        aria-label='Max OTC Percentage'
        max={100}
        min={0}
        size='medium'
        step={10}
        sx={whiteSliderStyles}
        value={maxOtcPercentage}
        valueLabelDisplay='auto'
        onChange={(_, newValue) => setMaxOtcPercentage(newValue)}
      />
    </Stack>
  );
}

export {
  PassivenessSlider,
  DiscretionSlider,
  ExposureToleranceSlider,
  AlphaTiltSlider,
  DirectionalBiasSlider,
  PercentageSlider,
  MaxOtcPercentageSlider,
};
