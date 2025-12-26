import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, TextField, InputAdornment } from '@mui/material';
import { ExchangeIcon } from '@/shared/components/Icons';
import { Search as SearchIcon } from '@mui/icons-material';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

function ExchangeAccountsPanel({ exchangeAccounts, formData, onToggleAccount }) {
  const [query, setQuery] = React.useState('');

  const normalized = query.trim().toLowerCase();
  const filteredAccounts = normalized
    ? exchangeAccounts.filter((account) => {
        const name = String(account.name || '').toLowerCase();
        const exchange = String(account.exchange || '').toLowerCase();
        const username = String(account.username || '').toLowerCase();
        return name.includes(normalized) || exchange.includes(normalized) || username.includes(normalized);
      })
    : exchangeAccounts;

  // Virtualized row renderer
  const getItemSize = React.useCallback(() => 108, []);

  const Row = React.useCallback(({ index, style, data }) => {
    const { accounts, selectedAccountIds, handleToggle } = data;
    const account = accounts[index];
    const isSelected = selectedAccountIds.includes(account.id);
    return (
      <Box style={style} sx={{ px: 1, boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
        <Card
          sx={{
            cursor: 'pointer',
            border: isSelected ? 2 : 1,
            borderColor: isSelected ? 'primary.main' : 'divider',
            bgcolor: 'background.paper',
            borderRadius: 3,
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => handleToggle(account.id)}
        >
          <CardContent
            sx={{
              py: 2,
              px: 4,
              display: 'flex',
              alignItems: 'center',
              minHeight: 72,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: 4,
                textAlign: 'left',
                maxWidth: '100%',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <ExchangeIcon exchangeName={account.exchange} style={{ height: '40px', width: '40px' }} />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  flex: 1,
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <Typography
                  noWrap
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', minWidth: 0 }}
                  title={`${account.name} • ${account.exchange}`}
                  variant='subtitle1'
                >
                  {account.name}
                </Typography>
                <Typography
                  color='text.secondary'
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                  variant='body1Strong'
                >
                  {account.exchange}
                </Typography>
                <Typography
                  noWrap
                  color='text.secondary'
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                  title={account.username}
                  variant='caption'
                >
                  {account.username}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h6'>Exchange Accounts</Typography>
        <Chip color='primary' label={`${formData.selectedAccounts.length} selected`} variant='outlined' />
      </Box>
      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          placeholder='Search by account name, exchange, or user...'
          size='medium'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Box>
      <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
        Choose which exchange accounts this group will have access to.
      </Typography>
      {filteredAccounts.length === 0 ? (
        <Typography color='text.secondary' sx={{ mt: 2 }} variant='body2'>
          No exchange accounts found.
        </Typography>
      ) : (
        <Box sx={{ height: 540 }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={filteredAccounts.length}
                itemData={{
                  accounts: filteredAccounts,
                  selectedAccountIds: formData.selectedAccounts,
                  handleToggle: onToggleAccount,
                }}
                itemSize={getItemSize}
                style={{ scrollbarGutter: 'stable', overflowX: 'hidden' }}
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </Box>
      )}
    </Box>
  );
}

export default ExchangeAccountsPanel;
