import React, { useMemo } from 'react';
import { Alert, Box, Divider, Stack, Typography } from '@mui/material';
import AccountDropdown from '@/shared/fields/AccountDropdown';
import { Loader } from '@/shared/Loader';

export default function YieldAccountSelector({
  accounts,
  selectedAccountName,
  onSelect,
  loading,
  error,
}) {
  const accountsMap = useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.name] = account;
      return acc;
    }, {});
  }, [accounts]);

  const selectedAccount = selectedAccountName ? accountsMap[selectedAccountName] : null;

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  if (!accounts.length) {
    return (
      <Typography color='text.secondary'>
        Connect a Bybit, Binance, OKX, Hyperliquid, or Gate account to view yield analytics.
      </Typography>
    );
  }

  const handleSelectChange = (event) => {
    const nextValue = event?.target?.value ?? '';
    onSelect(nextValue);
  };

  return (
    <Stack spacing={2}>
      <AccountDropdown
        simpleChip
        accounts={accountsMap}
        handleSelectedAccountsChange={handleSelectChange}
        handleSelectedAccountsDelete={() => onSelect('')}
        multiple={false}
        selectedAccounts={selectedAccountName}
      />

      {selectedAccount && (
        <>
          <Divider light />
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' spacing={2}>
            <Box>
              <Typography color='text.secondary' variant='subtitle2'>Selected Account</Typography>
              <Typography variant='h6'>{selectedAccount.accountName}</Typography>
              <Typography color='text.secondary' variant='body2'>
                {selectedAccount.exchangeName}
              </Typography>
            </Box>
            <Box textAlign={{ xs: 'left', sm: 'right' }}>
              <Typography color='text.secondary' variant='subtitle2'>Total Equity</Typography>
              <Typography variant='h5'>
                {selectedAccount.totalEquity.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Box>
          </Stack>
        </>
      )}
    </Stack>
  );
}
