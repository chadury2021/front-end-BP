import { Box, FormControl, InputLabel, NativeSelect, Typography } from '@mui/material';
import { Loader } from '@/shared/Loader';

/**
 * Component for selecting a trade blob from a list of trades
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.trades - Array of trade blobs to select from
 * @param {boolean} props.loading - Whether trades are currently loading
 * @param {number} props.selectedIndex - Currently selected trade index
 * @param {Function} props.onChange - Function to call when selection changes
 * @returns {React.ReactElement} Trade blob selector component
 */
export default function TradeBlobSelector({ trades, loading, selectedIndex, onChange }) {
  if (loading) {
    return <Loader />;
  }

  if (!trades || trades.length === 0) {
    return (
      <Typography sx={{ ml: 2, fontStyle: 'italic' }} variant='body2'>
        No trade data available
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <FormControl size='small' sx={{ minWidth: 200 }}>
        <InputLabel htmlFor='blob-selection' variant='standard'>
          Storage Entry
        </InputLabel>
        <NativeSelect
          id='blob-selection'
          inputProps={{
            id: 'blob-entry-native-select',
            name: 'blob-entry',
          }}
          sx={{ height: '36px' }}
          value={selectedIndex}
          onChange={onChange}
        >
          {trades.map((trade, index) => (
            <option key={trade.id} value={index}>
              ID: {trade.id.substring(0, 8)}...
            </option>
          ))}
        </NativeSelect>
      </FormControl>
    </Box>
  );
}
