import FormControl from '@mui/material/FormControl/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ListSubheader from '@mui/material/ListSubheader';
import Chip from '@mui/material/Chip';
import React, { useState, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { StyledListSubheader, StyledMenuItem } from '@/shared/components/MuiComponents';
import useViewport from '@/shared/hooks/useViewport';

// Helper function to get strategy descriptions
const getStrategyDescription = (strategyName) => {
  const descriptions = {
    'Impact Minimization':
      'Sends smaller limit/market orders over time to reduce market impact using a VWAP trajectory. Targets best execution over a fixed duration',
    'Time Constant (TWAP)':
      'Sends smaller limit/market orders at a consistent rate. Targets constant execution over a fixed duration.',
    'Target Participation Rate':
      'Adjusts execution dynamically to maintain a fixed percentage of market volume until the order is complete.',
    'Market Maker': 'Places passive-only limit orders to maintain market presence while never crossing the spread. ',
    'Aggressive Taker':
      'Prioritizes speed with front-loaded execution, ensuring quick fills. Ideal for urgent trades requiring immediate liquidity.',
    'Aggressive Maker':
      'Uses passive-only limit orders with a high participation target, balancing execution speed and cost efficiency.',
    'Target Time':
      'Concentrates execution around a specific future event, making it ideal for event-driven trading strategies.',
    Custom: 'Custom strategy allowing manual trajectory selection in advanced settings.',
  };

  return descriptions[strategyName] || '';
};

// Helper function to get strategy chips
const getStrategyChips = (strategyName) => {
  const chips = {
    'Impact Minimization': [
      { id: 'mid-freq', label: 'Mid Freq', color: 'success' },
      { id: 'mixed', label: 'Mixed', color: 'warning' },
    ],
    'Time Constant (TWAP)': [
      { id: 'mid-freq', label: 'Mid Freq', color: 'success' },
      { id: 'mixed', label: 'Mixed', color: 'warning' },
    ],
    'Target Participation Rate': [
      { id: 'mid-freq', label: 'Mid Freq', color: 'success' },
      { id: 'mixed', label: 'Mixed', color: 'warning' },
    ],
    'Market Maker': [
      { id: 'mid-freq', label: 'Mid Freq', color: 'success' },
      { id: 'passive', label: 'Passive', color: 'success' },
    ],
    'Aggressive Taker': [
      { id: 'high-freq', label: 'High Freq', color: 'warning' },
      { id: 'aggressive', label: 'Aggressive', color: 'error' },
    ],
    'Aggressive Maker': [
      { id: 'high-freq', label: 'High Freq', color: 'warning' },
      { id: 'passive', label: 'Passive', color: 'success' },
    ],
    'Target Time': [
      { id: 'mid-freq', label: 'Mid Freq', color: 'success' },
      { id: 'aggressive', label: 'Aggressive', color: 'error' },
    ],
    Custom: [],
    Market: [{ id: 'instant', label: 'Instant', color: 'error' }],
    Limit: [{ id: 'passive', label: 'Passive', color: 'success' }],
    Iceberg: [
      { id: 'high-freq', label: 'High Freq', color: 'warning' },
      { id: 'passive', label: 'Passive', color: 'success' },
    ],
    IOC: [{ id: 'instant', label: 'Instant', color: 'error' }],
  };

  return chips[strategyName] || [];
};

// Helper function to get display name for selected value
const getDisplayName = (value, strategies, trajectories) => {
  if (value in strategies) {
    return strategies[value].name;
  }
  if (value in trajectories) {
    return trajectories[value].name;
  }
  if (value === 'Custom') {
    return 'Custom';
  }
  return value;
};

export default function StrategyDropdown({
  value,
  setValue,
  strategies,
  setTrajectory,
  trajectories,
  includeSimple = false,
  applyPresets,
}) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const { isMobile } = useViewport();

  // Helper function to get theme color for chips
  const getChipColor = (colorName) => {
    return theme.palette.strategy[colorName] || theme.palette[colorName]?.main || theme.palette.text.primary;
  };

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const isStrategy = selectedValue in strategies;
    setValue(selectedValue);
    if (isStrategy) {
      const trajectory_id = strategies[selectedValue].strategy_id; // uuid of trajectory
      setTrajectory(trajectory_id); // set trajectory to strategy id
      applyPresets(selectedValue);
      return;
    }
    if (selectedValue in trajectories) {
      setTrajectory(selectedValue); // set trajectory to strategy id (same as strategy name)
      return;
    }
    setTrajectory(Object.keys(trajectories)[0]);
  };

  return (
    <FormControl fullWidth>
      <InputLabel
        id='select-strategy-dropdown-label'
        sx={{
          marginLeft: '-6px',
        }}
      >
        <TreadTooltip placement='left' variant='strategy' />
      </InputLabel>
      {includeSimple ? (
        <Select
          id='select-strategy-dropdown'
          label='Strategy'
          labelId='select-strategy-dropdown-label'
          MenuProps={{
            anchorEl: selectRef.current,
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            PaperProps: {
              sx: {
                width: selectRef.current ? selectRef.current.offsetWidth : 'auto',
                maxWidth: selectRef.current ? selectRef.current.offsetWidth : 'auto',
                backgroundColor: `${theme.palette.ui.backgroundDark}CC`, // 80% opacity - much darker
                backdropFilter: 'blur(15px)',
                border: 'none',
                borderRadius: 0,
                boxShadow: 'none',
                '& .MuiMenuItem-root': {
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  minHeight: 'auto',
                  padding: '8px 16px',
                  overflowWrap: 'break-word',
                  backgroundColor: 'transparent',
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: `${theme.palette.action.hover}80`, // 50% opacity
                  },
                },
                '& .MuiMenuItem-root.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}40`, // 25% opacity
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}60`, // 37% opacity
                  },
                },
                '& .MuiListSubheader-root': {
                  overflowWrap: 'break-word',
                  backgroundColor: 'transparent',
                  color: theme.palette.text.primary,
                },
              },
            },
          }}
          ref={selectRef}
          renderValue={(selectedValue) => getDisplayName(selectedValue, strategies, trajectories)}
          value={value}
          onChange={(e) => handleChange(e)}
          onClose={() => setIsOpen(false)}
          onOpen={() => setIsOpen(true)}
        >
          {/* Only render Strategies subheader if there are super strategies */}
          {Object.keys(strategies).some((id) => strategies[id].is_super_strategy) && (
            <StyledListSubheader>
              <Typography variant='body2'>Strategies</Typography>
            </StyledListSubheader>
          )}
          {Object.keys(strategies)
            .filter((id) => strategies[id].is_super_strategy)
            .map((id) => (
              <StyledMenuItem key={id} value={id}>
                {isOpen ? (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }} variant='body1'>
                        {strategies[id].name}
                      </Typography>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {getStrategyChips(strategies[id].name).map((chip, index) => (
                          <Chip
                            key={chip.id}
                            label={chip.label}
                            size='small'
                            sx={{
                              height: '18px',
                              fontSize: '0.6rem',
                              backgroundColor: 'transparent',
                              borderColor: getChipColor(chip.color),
                              color: getChipColor(chip.color),
                              '& .MuiChip-label': {
                                color: getChipColor(chip.color),
                              },
                            }}
                            variant='outlined'
                          />
                        ))}
                      </div>
                    </div>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        lineHeight: 1.3,
                        overflowWrap: 'break-word',
                      }}
                      variant='caption'
                    >
                      {getStrategyDescription(strategies[id].name)}
                    </Typography>
                  </div>
                ) : (
                  strategies[id].name
                )}
              </StyledMenuItem>
            ))}
          {/* Include Custom as a frontend specific strategy, allows user to select trajectory in advanced settings */}
          <StyledMenuItem value='Custom'>
            {isOpen ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }} variant='body1'>
                    Custom
                  </Typography>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {getStrategyChips('Custom').map((chip, index) => (
                      <Chip
                        color={chip.color}
                        key={chip.id}
                        label={chip.label}
                        size='small'
                        sx={{
                          height: '18px',
                          fontSize: '0.6rem',
                          backgroundColor: 'transparent',
                          borderColor: theme.palette.strategy[chip.color] || theme.palette[chip.color]?.main,
                          color: theme.palette.strategy[chip.color] || theme.palette[chip.color]?.main,
                        }}
                        variant='outlined'
                      />
                    ))}
                  </div>
                </div>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    lineHeight: 1.3,
                    overflowWrap: 'break-word',
                  }}
                  variant='caption'
                >
                  {getStrategyDescription('Custom')}
                </Typography>
              </div>
            ) : (
              'Custom'
            )}
          </StyledMenuItem>
          {/* Only render Simple subheader if there are simple trajectories */}
          {Object.keys(trajectories).some((id) => !trajectories[id].schedule) && (
            <StyledListSubheader>
              <Typography variant='body2'>Simple</Typography>
            </StyledListSubheader>
          )}
          {Object.keys(trajectories)
            .filter((id) => !trajectories[id].schedule)
            .map((id) => (
              <StyledMenuItem key={id} value={id}>
                {isOpen ? (
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                  >
                    <Typography sx={{ fontWeight: 500 }} variant='body1'>
                      {trajectories[id].name}
                    </Typography>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {getStrategyChips(trajectories[id].name).map((chip, index) => (
                        <Chip
                          color={chip.color}
                          key={chip.id}
                          label={chip.label}
                          size='small'
                          sx={{
                            height: '18px',
                            fontSize: '0.6rem',
                            backgroundColor: 'transparent',
                            borderColor: getChipColor(chip.color),
                            color: getChipColor(chip.color),
                          }}
                          variant='outlined'
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  trajectories[id].name
                )}
              </StyledMenuItem>
            ))}
        </Select>
      ) : (
        <Select
          id='select-strategy-dropdown'
          label='Strategy'
          labelId='select-strategy-dropdown-label'
          MenuProps={{
            anchorEl: selectRef.current,
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            PaperProps: {
              sx: {
                width: selectRef.current ? selectRef.current.offsetWidth * 1.5 : 'auto',
                maxWidth: selectRef.current ? selectRef.current.offsetWidth * 1.5 : 'auto',
                backgroundColor: `${theme.palette.ui.backgroundDark}CC`, // 80% opacity - much darker
                backdropFilter: 'blur(15px)',
                border: 'none',
                borderRadius: 0,
                boxShadow: 'none',
                transform: !isMobile ? 'translateX(-50px)' : 'none', // Negative X transformation on desktop only
                '& .MuiMenuItem-root': {
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  minHeight: 'auto',
                  padding: '8px 16px',
                  overflowWrap: 'break-word',
                  backgroundColor: 'transparent',
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: `${theme.palette.action.hover}80`, // 50% opacity
                  },
                },
                '& .MuiMenuItem-root.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}40`, // 25% opacity
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}60`, // 37% opacity
                  },
                },
                '& .MuiListSubheader-root': {
                  overflowWrap: 'break-word',
                  backgroundColor: 'transparent',
                  color: theme.palette.text.primary,
                },
              },
            },
          }}
          ref={selectRef}
          renderValue={(selectedValue) => getDisplayName(selectedValue, strategies, trajectories)}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onClose={() => setIsOpen(false)}
          onOpen={() => setIsOpen(true)}
        >
          {Object.keys(strategies)
            .filter((id) => !strategies[id].schedule)
            .map((id) => (
              <MenuItem key={id} sx={{ paddingLeft: '2em' }} value={id}>
                {isOpen ? (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }} variant='body1'>
                        {strategies[id].name}
                      </Typography>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {getStrategyChips(strategies[id].name).map((chip, index) => (
                          <Chip
                            key={chip.id}
                            label={chip.label}
                            size='small'
                            sx={{
                              height: '18px',
                              fontSize: '0.6rem',
                              backgroundColor: 'transparent',
                              borderColor: getChipColor(chip.color),
                              color: getChipColor(chip.color),
                              '& .MuiChip-label': {
                                color: getChipColor(chip.color),
                              },
                            }}
                            variant='outlined'
                          />
                        ))}
                      </div>
                    </div>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        lineHeight: 1.3,
                        overflowWrap: 'break-word',
                      }}
                      variant='caption'
                    >
                      {getStrategyDescription(strategies[id].name)}
                    </Typography>
                  </div>
                ) : (
                  strategies[id].name
                )}
              </MenuItem>
            ))}
        </Select>
      )}
    </FormControl>
  );
}
