import React from 'react';
import { Stack, Typography } from '@mui/material';
import { ExchangeIcon } from '@/shared/components/Icons';

function OrderAccounts({ accounts, selectedAccounts }) {
  return (
    <Stack direction='row' spacing={2}>
      {selectedAccounts.map((accName, index) => {
        const account = accounts[accName];
        const isLast = index === selectedAccounts.length - 1;
        return (
          <Stack alignItems='center' direction='row' key={accName} spacing={2}>
            <ExchangeIcon exchangeName={account?.exchangeName} style={{ width: '20px', height: '20px' }} />
            <Typography>{isLast ? `${accName}` : `${accName},`}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

export default OrderAccounts;
