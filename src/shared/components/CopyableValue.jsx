import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export function CopyableValue({ value, displayValue }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <Stack alignItems='center' direction='row' spacing={1}>
      <Typography>{displayValue || value}</Typography>
      <Tooltip title='Copy to clipboard'>
        <IconButton size='small' onClick={handleCopy}>
          <ContentCopyIcon sx={{ color: 'text.subtitle', fontSize: '14px' }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
