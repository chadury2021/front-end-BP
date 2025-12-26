import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Paper,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme } from '@mui/material/styles';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { Loader } from '@/shared/Loader';
import { StyledTableCell, formatDateTime } from '@/shared/orderTable/util';
import DataComponent from '@/shared/DataComponent';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import WalletSelector from '@/shared/components/WalletSelector';
import { useWalletAuth } from '@/pages/login/walletAuth';
import useGetReferrals from './hooks/useGetReferrals';
import useReferralEarnings from './hooks/useReferralEarnings';
import LOGOS from '../../../images/logos';

function generateReferralUrl(code) {
  return `${window.location.origin}/referral/${code}`;
}

const CopyTextField = styled(OutlinedInput)(({ theme }) => ({
  backgroundColor: theme.palette.background.card,
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '&.Mui-disabled': {
    color: theme.palette.text.primary,
    '& input': {
      color: theme.palette.text.primary,
      '-webkit-text-fill-color': theme.palette.text.primary,
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      '-webkit-text-fill-color': theme.palette.text.primary,
    },
  },
}));

function CopyField({ textToCopy }) {
  const { showAlert } = useContext(ErrorContext);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showAlert({ message: 'Copied to clipboard!' });
    });
  };

  return (
    <CopyTextField
      disabled
      endAdornment={
        <InputAdornment position='end'>
          <Tooltip placement='top' title='Click to copy'>
            <IconButton edge='end' onClick={handleCopy}>
              <ContentCopyIcon color='primary' />
            </IconButton>
          </Tooltip>
        </InputAdornment>
      }
      value={textToCopy}
    />
  );
}

function InvitePage() {
  const { code } = useParams();
  const { openSignupModal } = useAuthModal();
  const { signInWithWallet } = useWalletAuth();
  const [openWalletSelector, setOpenWalletSelector] = useState(false);
  const [isWalletSigningUp, setIsWalletSigningUp] = useState(false);

  // Store referral code in localStorage when the user visits the page
  React.useEffect(() => {
    if (code) {
      localStorage.setItem('referralCode', code);
    }
  }, [code]);

  const handleWalletSignup = async (wallet) => {
    setIsWalletSigningUp(true);
    setOpenWalletSelector(false);

    let isAuthed = false;
    try {
      isAuthed = await signInWithWallet(wallet);
    } catch (error) {
      setIsWalletSigningUp(false);
      return;
    }

    if (isAuthed) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setIsWalletSigningUp(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '95vh',
        }}
      >
        <Card sx={{ width: 500, height: 200, p: 8 }}>
          <Stack alignItems='center' direction='column' justifyContent='space-between' spacing={4}>
            <img alt='Tread Logo' src={LOGOS.treadRoundedSvg} style={{ height: 64 }} />
            <Typography align='center' sx={{ maxWidth: 600 }} variant='detailsPrimary'>
              You will never see trading the same way again.
            </Typography>
            <Typography align='center' variant='body1'>
              Realize your full potential with tread.fi.
            </Typography>
            <Stack direction='row' spacing={2} sx={{ width: 360 }}>
              <Button
                size='large'
                sx={{ flex: 1 }}
                variant='contained'
                onClick={(event) => {
                  event.preventDefault();
                  openSignupModal({ referralCode: code });
                }}
              >
                Sign up (Email)
              </Button>
              <Button
                color='primary'
                disabled={isWalletSigningUp}
                size='large'
                sx={{ flex: 1 }}
                variant='outlined'
                onClick={() => setOpenWalletSelector(true)}
              >
                {isWalletSigningUp ? <CircularProgress size={20} /> : 'Sign up (Wallet)'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Box>
      <Dialog fullWidth maxWidth='sm' open={openWalletSelector} onClose={() => setOpenWalletSelector(false)}>
        <DialogContent>
          <WalletSelector onConnect={handleWalletSignup} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReferralOverview({ isLoading, referralCode, userReferrals, userEarnings }) {
  const theme = useTheme();
  const { showAlert } = useContext(ErrorContext);
  const [referralsPage, setReferralsPage] = useState(1);
  const referralsPerPage = 10;
  const { pendingEarnings, availableEarnings, lifetimeEarnings } = useReferralEarnings(userReferrals, userEarnings);

  // Pagination logic for referrals
  const totalReferralsPages = Math.ceil(userReferrals.length / referralsPerPage);
  const startIndex = (referralsPage - 1) * referralsPerPage;
  const endIndex = startIndex + referralsPerPage;
  const paginatedReferrals = userReferrals.slice(startIndex, endIndex);

  const handleReferralsPageChange = (event, page) => {
    setReferralsPage(page);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const kpiCards = [
    {
      title: 'Pending Earnings',
      primaryValue: formatCurrency(pendingEarnings),
      secondaryLabel: '0.8 bps of executed notional',
      tertiaryLabel: null,
    },
    {
      title: 'Available Earnings',
      primaryValue: formatCurrency(availableEarnings),
      secondaryLabel: 'Ready to withdraw, minimum $1,000',
      tertiaryLabel: null,
    },
    {
      title: 'Lifetime Earnings',
      primaryValue: formatCurrency(lifetimeEarnings),
      secondaryLabel: 'Total earnings all time',
      tertiaryLabel: null,
    },
  ];

  return (
    <Container maxWidth='lg' sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography variant='h1'>Affiliate Dashboard</Typography>
          <Typography color='text.secondary' variant='body1'>
            Earn trading fee commissions by inviting your friends to trade.
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            boxSizing: 'border-box',
            height: '200px',
            width: '100%',
            border: `1px solid ${theme.palette.grey[600]}`,
            background: theme.palette.background.paper,
          }}
        >
          <Grid container sx={{ height: '100%' }}>
            <Grid sx={{ height: '100%', borderRight: '1px solid rgba(255, 255, 255, 0.12);' }} xs={6}>
              <Stack direction='column' spacing={4} sx={{ p: 4 }}>
                <Stack direction='column' spacing={2}>
                  <Stack alignItems='center' direction='row' spacing={1}>
                    <Typography variant='body1'>Referral ID</Typography>
                    <Tooltip placement='top' title='Click to copy'>
                      <IconButton
                        edge='end'
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode).then(() => {
                            showAlert({ message: 'Copied to clipboard!' });
                          });
                        }}
                      >
                        <ContentCopyIcon color='primary' fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Typography variant='h5Strong'>{referralCode}</Typography>
                </Stack>
                <Divider />
                <Stack direction='column' spacing={2}>
                  <Stack alignItems='center' direction='row' spacing={1}>
                    <Typography variant='body1'>Your Referral Link</Typography>
                    <Tooltip placement='top' title='Click to copy'>
                      <IconButton
                        edge='end'
                        onClick={() => {
                          navigator.clipboard.writeText(generateReferralUrl(referralCode)).then(() => {
                            showAlert({ message: 'Copied to clipboard!' });
                          });
                        }}
                      >
                        <ContentCopyIcon color='primary' fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Typography sx={{ wordBreak: 'break-all' }} variant='body2'>
                    {generateReferralUrl(referralCode)}
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid sx={{ height: '100%' }} xs={6}>
              <Stack direction='column' spacing={2} sx={{ p: 4 }}>
                <Typography variant='body1'>Share Your Link</Typography>
                <Typography color='text.secondary' variant='body2'>
                  Invite traders with your custom referral link and track engagement instantly.
                </Typography>
                <Typography color='text.secondary' variant='body2'>
                  Earn trading fee commissions from your referred users with tiered rewards.
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {kpiCards.map((kpi) => (
            <Grid key={kpi.title} lg={4} md={6} xs={12}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography color='text.secondary' variant='overline'>
                      {kpi.title}
                    </Typography>
                    <Typography variant='h4'>{kpi.primaryValue}</Typography>
                    <Typography color='text.secondary' variant='body2'>
                      {kpi.secondaryLabel}
                    </Typography>
                    {kpi.tertiaryLabel && (
                      <Typography color='text.secondary' variant='body2'>
                        {kpi.tertiaryLabel}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <CardHeader title='Referrals' />
          <Divider />
          <CardContent sx={{ px: 0 }}>
            <DataComponent
              emptyComponent={<NoReferrals />}
              isEmpty={userReferrals.length === 0}
              isLoading={isLoading}
              loadingComponent={<Loader />}
            >
              <Stack sx={{ minHeight: 400 }}>
                <Box sx={{ px: 3, pb: 2 }}>
                  <Typography color='text.secondary' variant='body2'>
                    Complete list of all your referrals ({userReferrals.length} total)
                  </Typography>
                </Box>

                <DataTable userReferrals={paginatedReferrals} />

                {totalReferralsPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination
                      color='primary'
                      count={totalReferralsPages}
                      page={referralsPage}
                      onChange={handleReferralsPageChange}
                    />
                  </Box>
                )}
              </Stack>
            </DataComponent>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

function DataTable({ userReferrals }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatEarnings = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Table stickyHeader size='small'>
      <TableHead>
        <TableRow>
          <StyledTableCell sx={{ width: '33%' }}>ID</StyledTableCell>
          <StyledTableCell align='right' sx={{ width: '33%' }}>
            Volume
          </StyledTableCell>
          <StyledTableCell align='right' sx={{ width: '33%' }}>
            Earned
          </StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {userReferrals.map((row) => (
          <TableRow
            hover
            key={`${row.username}-${row.registration_date}`}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            <StyledTableCell scope='row' sx={{ width: '33%' }}>
              <Stack direction='column'>
                <Typography sx={{ fontWeight: 500 }} variant='body1'>
                  {row.username}
                </Typography>
                <Typography variant='body1'>{row.email}</Typography>
              </Stack>
            </StyledTableCell>
            <StyledTableCell align='right' sx={{ width: '33%' }}>
              {formatCurrency(row.total_notional || 0)}
            </StyledTableCell>
            <StyledTableCell align='right' sx={{ width: '33%' }}>
              {formatEarnings(row.earnings || 0)}
            </StyledTableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function NoReferrals() {
  return (
    <Stack align='center' direction='column' justifyContent='center' spacing={2} sx={{ height: '100%' }}>
      <img alt='Tread Logo' src={LOGOS.treadRoundedSvg} style={{ height: 64 }} />
      <Typography variant='h6'>You have no referrals</Typography>
    </Stack>
  );
}

function ReferralPage() {
  const { user, referralCode, isMetadataLoading } = useUserMetadata();
  const { isLoading, userReferrals, userEarnings } = useGetReferrals(user.is_authenticated);

  if (isMetadataLoading) {
    return <Loader />;
  }

  if (!user.is_authenticated) {
    return <InvitePage />;
  }

  return (
    <ReferralOverview
      isLoading={isLoading}
      referralCode={referralCode}
      userEarnings={userEarnings}
      userReferrals={userReferrals}
    />
  );
}

export default ReferralPage;
