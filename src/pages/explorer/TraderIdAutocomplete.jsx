import { Autocomplete, TextField } from '@mui/material';
import { insertEllipsis } from './insertEllipsis';

export function TraderIdAutocomplete({ accounts, value, onChange, onInputChange }) {
  return (
    <Autocomplete
      freeSolo
      fullWidth
      options={accounts.filter((acc) => acc.hashed_api_key).map((acc) => acc.hashed_api_key)}
      renderInput={(params) => <TextField {...params} fullWidth placeholder='Filter by Trader ID' size='small' />}
      renderOption={(props, option) => {
        const account = accounts.find((acc) => acc.hashed_api_key === option);
        const { key, ...rest } = props; // Extract key from props
        return (
          <li key={key} {...rest}>
            {account?.name || 'Unknown'} ({insertEllipsis(option)})
          </li>
        );
      }}
      value={value}
      onChange={onChange}
      onInputChange={onInputChange}
    />
  );
}
