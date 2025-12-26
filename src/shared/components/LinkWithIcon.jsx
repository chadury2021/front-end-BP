import { Link, Stack, Typography } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';

export default function LinkWithIcon({ href, label }) {
  return (
    <Link href={href} rel='noopener noreferrer' target='_blank'>
      <Stack alignItems='center' direction='row' spacing={1}>
        <Typography color='primary' variant='body1'>
          {label}
        </Typography>
        <OpenInNew fontSize='14px' sx={{ color: 'text.primary' }} />
      </Stack>
    </Link>
  );
}
