import { Loader } from '@/shared/Loader';
import { CopyableValue } from '@/shared/components/CopyableValue';
import { OrderInfoTypography } from '@/shared/orderDetail/OrderInfo';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Link,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Stack } from '@mui/system';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MarketDataComponent, PerformancePaper, VaultDataComponent } from './VaultComponents';
import { useVaultDetailsData } from './data/useVaultDetailsData';
import { useVaultData } from './data/useVaultOverviewData';
import { useVaultRisk } from './data/useVaultRisk';

function OverviewComponent({ data, traderId }) {
  return (
    <Paper elevation={0} sx={{ p: 4, flexGrow: 1 }}>
      <Stack direction='column' spacing={4} sx={{ padding: 2 }}>
        <Typography variant='h4'>Overview</Typography>
        <OrderInfoTypography
          header='Owner'
          headerColor='text.dark'
          headerVariant='body1'
          value={data.owner_id}
          valueVariant='body1'
        />
        <OrderInfoTypography
          header='Trader ID'
          headerColor='text.dark'
          headerVariant='body1'
          value={traderId || 'Unknown'}
          valueVariant='body1'
        />
        <OrderInfoTypography
          header='Description'
          headerColor='text.dark'
          headerVariant='body1'
          value={data.description}
          valueVariant='body1'
        />
        <Typography variant='h4'>Performance</Typography>
        <Stack direction='row' spacing={2}>
          <Paper sx={{ padding: 2, width: '33%' }}>
            <OrderInfoTypography
              header='Deposit APY 1M'
              headerColor='text.dark'
              headerVariant='body2'
              value={data.tvl}
              valueVariant='body2'
            />
          </Paper>

          <Paper sx={{ padding: 2, width: '33%' }}>
            <OrderInfoTypography
              header='Deposit APY 3M'
              headerColor='text.dark'
              headerVariant='body2'
              value={data.pnl}
              valueVariant='body2'
            />
          </Paper>

          <Paper sx={{ padding: 2, width: '33%' }}>
            <OrderInfoTypography
              header='Deposit APY 6M'
              headerColor='text.dark'
              headerVariant='body2'
              value={data.deposit_apy}
              valueVariant='body2'
            />
          </Paper>
        </Stack>
        <Typography variant='h4'>Key Stats</Typography>
        <Grid container spacing={4}>
          <Grid item xs={4}>
            <OrderInfoTypography header='Created Date (UTC)' headerVariant='body3' value={data.created} />
          </Grid>
          <Grid item xs={4}>
            <OrderInfoTypography header='Borrow APY' value={data.borrow_apy} />
          </Grid>
          <Grid item xs={4}>
            <OrderInfoTypography header='Total Borrowed' headerVariant='body3' value={data.total_borrowed} />
          </Grid>
          <Grid item xs={4}>
            <OrderInfoTypography header='Deposit Address' headerVariant='body3' value={data.deposit_address} />
          </Grid>
          <Grid item xs={4}>
            <OrderInfoTypography header='Max Drawdown' headerVariant='body3' value={data.max_drawdown} />
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}

function DespositWithdrawCard({ data }) {
  const [inputCardTabValue, setInputCardTabValue] = useState('deposit');
  const [depositValue, setDepositValue] = useState('');
  const [withdrawValue, setWithdrawValue] = useState('');

  const isDeposit = inputCardTabValue === 'deposit';

  return (
    <Card sx={{ flexShrink: 0, height: '450px' }}>
      <Tabs value={inputCardTabValue} variant='fullWidth' onChange={(e, newVal) => setInputCardTabValue(newVal)}>
        <Tab label='Deposit' value='deposit' />
        <Tab label='Withdraw' value='withdraw' />
      </Tabs>
      <CardContent>
        <Typography>{isDeposit ? 'Deposit' : 'Withdraw'}</Typography>
        <TextField
          fullWidth
          placeholder='Amount'
          size='small'
          value={isDeposit ? depositValue : withdrawValue}
          onChange={(e) => (isDeposit ? setDepositValue(e.target.value) : setWithdrawValue(e.target.value))}
        />
        <Button disabled fullWidth size='small' sx={{ my: 6 }} variant='contained'>
          Connect Wallet
        </Button>
        <Stack direction='column' spacing={2}>
          <Stack direction='row' justifyContent='space-between' spacing={2}>
            <Typography variant='body3'>APY</Typography>
            <Typography variant='body3'>{data.deposit_apy}</Typography>
          </Stack>
          <Stack direction='row' justifyContent='space-between' spacing={2}>
            <Typography variant='body3'>Lockup Period</Typography>
            <Typography variant='body3'>{data.lockup_period}</Typography>
          </Stack>

          <Stack direction='row' justifyContent='space-between' spacing={2}>
            <Typography variant='body3'>Max Loan Amount</Typography>
            <Typography variant='body3'>{data.max_loan_amount}</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Component to display trader ID with loading and error states
 * @param {string} traderId - The trader ID to display
 * @param {boolean} loading - Whether the trader ID is loading
 * @param {object} error - Error object if loading failed
 * @returns {JSX.Element} Rendered component
 */
function TraderIdComponent({ traderId, loading, error }) {
  if (loading) {
    return <Loader />;
  }
  if (error) {
    return <>Error loading trader ID</>;
  }
  return (
    <>
      Trader ID: <CopyableValue value={traderId} />
    </>
  );
}

export default function VaultDetailsPage() {
  const navigate = useNavigate();
  const { vaultAddress } = useParams();
  const vaultData = useVaultDetailsData();
  const { vaultData: overviewData, loading } = useVaultData(vaultAddress);
  const { traderId, loading: riskLoading, error: riskError } = useVaultRisk(vaultData.address);

  const [vaultTab, setVaultTab] = useState('overview');
  const [paramCounts, setParamCounts] = useState({});

  console.log('[VaultDetailsPage] vaultAddress', vaultAddress);
  console.log('[VaultDetailsPage] vaultData', vaultData);

  const hardcoded_data = vaultData;

  return (
    <Box
      spacing={2}
      sx={{
        height: 'auto',
        width: '90%',
        margin: '0 auto',
      }}
    >
      <Stack dirction='column' spacing={1}>
        <Box sx={{ py: 2 }}>
          <Breadcrumbs aria-label='breadcrumb'>
            <Link
              color='inherit'
              component='button'
              href='/vault'
              underline='hover'
              onClick={(e) => {
                e.preventDefault();
                navigate('/vault');
              }}
            >
              All Vaults
            </Link>

            <Typography color='text.primary'>{vaultAddress}</Typography>
          </Breadcrumbs>
        </Box>
        <Typography variant='h1'>{loading ? vaultAddress : overviewData?.name || vaultAddress}</Typography>
        <Typography color='text.dark' variant='body2'>
          Vault Address: <CopyableValue value={hardcoded_data.address} />
        </Typography>
        <Typography color='text.dark' variant='body2'>
          <TraderIdComponent error={riskError} loading={riskLoading} traderId={traderId} />
        </Typography>
      </Stack>
      <Grid container spacing={2} sx={{ height: '100vh', pt: 8 }}>
        <Grid
          item
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100% - 200px)',
            overflowY: 'auto',
          }}
          xs={9}
        >
          <Stack direction='column' spacing={4} sx={{ flex: 1 }}>
            <Stack direction='row' spacing={4}>
              <Paper sx={{ padding: 2, width: '33%' }}>
                <Typography color='text.dark' variant='body2'>
                  Vault TVL
                </Typography>
                <Typography>{hardcoded_data.tvl}</Typography>
              </Paper>
              <Paper sx={{ padding: 2, width: '33%' }}>
                <Typography color='text.dark' variant='body2'>
                  Vault PnL
                </Typography>
                <Typography>{hardcoded_data.pnl}</Typography>
              </Paper>
              <Paper sx={{ padding: 2, width: '33%' }}>
                <Typography color='text.dark' variant='body2'>
                  Deposit APY(1M)
                </Typography>
                <Typography>{hardcoded_data.deposit_apy}</Typography>
              </Paper>
            </Stack>
            <Tabs value={vaultTab} onChange={(e, newVal) => setVaultTab(newVal)}>
              <Tab label='Overview' value='overview' />
              <Tab label='Your Performance' value='performance' />
            </Tabs>
            {vaultTab === 'overview' ? (
              <Stack direction='column' spacing={4}>
                <VaultDataComponent />
                <MarketDataComponent traderIds={[traderId]} />
                <OverviewComponent data={hardcoded_data} traderId={traderId} />
              </Stack>
            ) : (
              <PerformancePaper />
            )}
          </Stack>
        </Grid>
        <Grid item xs={3}>
          <DespositWithdrawCard data={hardcoded_data} />
        </Grid>
      </Grid>
    </Box>
  );
}
