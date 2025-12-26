import FormControl from '@mui/material/FormControl/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import React from 'react';
import { TreadTooltip } from '@/shared/components/LabelTooltip';

export default function TrajectoryDropdown({
  trajectory,
  setTrajectory,
  trajectories,
  scheduleFilter = true,
  disabled = false,
}) {
  let trajectoryList = Object.keys(trajectories);
  if (scheduleFilter) {
    trajectoryList = trajectoryList.filter((id) => trajectories[id].schedule);
  }

  return (
    <FormControl fullWidth>
      <InputLabel id='select-trajectory-dropdown-label'>
        <TreadTooltip placement='left' variant='trajectory' />
      </InputLabel>
      <Select
        disabled={disabled}
        id='select-trajectory-dropdown'
        label='Trajectory'
        labelId='select-trajectory-dropdown-label'
        value={trajectory}
        onChange={(e) => setTrajectory(e.target.value)}
      >
        {trajectoryList.map((id) => (
          <MenuItem key={id} sx={{ paddingLeft: '2em' }} value={id}>
            {trajectories[id].name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
