import { AccountsProvider, AccountsContext } from '@/shared/context/AccountsProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import ExchangeIcons from '@images/exchange_icons';
import { Chip, Stack, Typography, Paper, Divider, Container, Skeleton, Avatar } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useContext, useState, useMemo, useEffect } from 'react';
import DataComponent from '@/shared/DataComponent';
import { useTraderSum } from '@/pages/vaults/data/useTraderSum';
import DateRangePicker, { DateRange } from '@/pages/points/DateRangePicker';
import {
  ExchangeBreakdownComponent,
  TraderDashboardComponent,
  MarketDataEmptyComponent,
  MarketDataErrorComponent,
} from '../vaults/VaultComponents';
import ExplorerProofsTable from './ExplorerProofsTable';

function ExchangeAccountChip({ id, name, selected, exchange, handleClick }) {
  const avatarIcon =
    id === 'ALL' ? (
      <Avatar>A</Avatar>
    ) : (
      <img
        alt={exchange}
        src={ExchangeIcons[exchange.toLowerCase()]}
        style={{
          borderRadius: '50%',
        }}
      />
    );

  return (
    <Chip
      avatar={avatarIcon}
      label={name}
      sx={{
        justifyContent: 'flex-start',
        ...(selected && {
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': {
            borderColor: 'primary.light',
            color: 'primary.light',
          },
        }),
      }}
      variant='outlined'
      onClick={() => handleClick(id)}
    />
  );
}

function ExchangeAccountList({ traderIdExchanges, selectedAccount, onAccountSelect }) {
  if (!traderIdExchanges) {
    return null;
  }

  const handleAccountSelect = (id) => {
    onAccountSelect(id);
  };

  return (
    <Stack direction='column' spacing={2}>
      <Typography color='text.secondary' variant='subtitle1'>
        Accounts
      </Typography>
      <ExchangeAccountChip handleClick={handleAccountSelect} id='ALL' name='All' selected={selectedAccount === 'ALL'} />
      {Object.keys(traderIdExchanges).map((traderId) => {
        const { exchange, name } = traderIdExchanges[traderId];
        return (
          <ExchangeAccountChip
            exchange={exchange}
            handleClick={handleAccountSelect}
            id={traderId}
            key={traderId}
            name={name}
            selected={selectedAccount === traderId}
          />
        );
      })}
    </Stack>
  );
}

function ExplorerPageContent() {
  const isPreviewOnly = true;
  const [dateRange, setDateRange] = useState(DateRange.MONTH);
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const { loading: accountLoading, traderIds, traderIdExchanges } = useContext(AccountsContext);

  const {
    loading: isLoading,
    error,
    // Destructure consensus data
    namedConsensusEvents,
    groupedConsensusEvents, // Get grouped consensus events for potential future use or metadata access
  } = useTraderSum(traderIds, dateRange);

  const showIds = useMemo(() => {
    return selectedAccount === 'ALL' ? traderIds : [selectedAccount];
  }, [selectedAccount, traderIds]);

  useEffect(() => {
    let filtered = namedConsensusEvents?.volume?.events || [];
    filtered = filtered.filter((event) => {
      const [_, parsedTraderId] = event.traderId.split('0x');
      return showIds.includes(parsedTraderId);
    });

    setFilteredEvents(filtered);
  }, [namedConsensusEvents, showIds]);

  return (
    <Container fixed maxWidth='xl' sx={{ py: 8 }}>
      <Grid container spacing={6}>
        <Grid xs={12}>
          <Stack alignItems='flex-end' direction='row' justifyContent='space-between'>
            <Stack direction='column' spacing={1}>
              <Typography variant='h1'>Trader Dashboard</Typography>
              <Typography color='text.secondary' variant='body2'>
                Explore verifiable proofs of your trading on-chain
              </Typography>
            </Stack>

            <DateRangePicker dateRange={dateRange} onSelectDateRange={setDateRange} />
          </Stack>
        </Grid>
        <Grid xs={1.5}>
          <ExchangeAccountList
            selectedAccount={selectedAccount}
            traderIdExchanges={traderIdExchanges}
            onAccountSelect={setSelectedAccount}
          />
        </Grid>
        <Grid xs={10.5}>
          <Stack direction='column' spacing={6}>
            <Paper elevation={0} sx={{ height: '340px' }}>
              <DataComponent
                emptyComponent={<MarketDataEmptyComponent />}
                errorComponent={<MarketDataErrorComponent error={error} />}
                hasError={error}
                isEmpty={namedConsensusEvents.length === 0}
                isLoading={isLoading || accountLoading}
                loadingComponent={<Skeleton sx={{ height: '100%', width: '100%' }} variant='rounded' />}
              >
                <TraderDashboardComponent
                  consensusEvents={filteredEvents}
                  dateRange={dateRange}
                  traderIdExchanges={traderIdExchanges}
                  traderIds={traderIds}
                />
              </DataComponent>
            </Paper>

            <ExplorerProofsTable isPreviewOnly={isPreviewOnly} selectedAccounts={showIds} />
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

export default function ExplorerPage() {
  return (
    <AccountsProvider>
      <ExplorerPageContent />
    </AccountsProvider>
  );
}
