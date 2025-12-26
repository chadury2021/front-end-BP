import FormControl from '@mui/material/FormControl/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const durations = [
  { seconds: 300, display: '5 minutes' },
  { seconds: 900, display: '15 minutes' },
  { seconds: 1800, display: '30 minutes' },
  { seconds: 3600, display: '1 hour' },
  { seconds: 10800, display: '3 hours' },
  { seconds: 21600, display: '6 hours' },
];

export default function DurationDropdown({ value, setValue, size = 'small' }) {
  return (
    <FormControl fullWidth>
      <InputLabel id='select-duration-dropdown-label'>Duration</InputLabel>
      <Select
        id='select-duration-dropdown'
        label='Duration'
        labelId='select-duration-dropdown-label'
        size={size}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {durations.map((duration) => (
          <MenuItem key={duration.seconds} value={duration.seconds}>
            {duration.display}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
