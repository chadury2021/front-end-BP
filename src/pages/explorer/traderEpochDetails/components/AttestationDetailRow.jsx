import { Box, Stack, Typography } from '@mui/material';

export default function AttestationDetailRow({ labelValue, content }) {
  return (
    <Stack alignItems='center' direction='row' height='21px' spacing={0}>
      <Box width='280px'>
        <Typography color='text.secondary' variant='body1'>
          {labelValue}
        </Typography>
      </Box>
      <Box>{content}</Box>
    </Stack>
  );
}
