import { Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

function OrderInfoTypography({
  header,
  value,
  headerColor = 'text',
  valueColor = '',
  headerVariant = 'small2',
  valueVariant = 'body3',
  highlight = false,
}) {
  const theme = useTheme();

  return (
    <OrderInfo header={header} headerColor={headerColor} headerVariant={headerVariant}>
      <Typography
        color={highlight ? 'primary.main' : valueColor}
        sx={highlight ? { color: theme.palette.primary.main } : {}}
        variant={valueVariant}
      >
        {value}
      </Typography>
    </OrderInfo>
  );
}

function OrderInfo({ children, header, headerColor = 'text', headerVariant = 'small2', sx }) {
  return (
    <Stack direction='column' spacing={1}>
      <Typography color={headerColor} sx={sx} variant={headerVariant}>
        {header}
      </Typography>
      {children}
    </Stack>
  );
}

export { OrderInfo, OrderInfoTypography };
