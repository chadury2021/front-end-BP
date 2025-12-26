import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ShareIcon from '@mui/icons-material/Share';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useThemeStyles } from '@/theme/useThemeStyles';
import { cssVar, CSS_VARIABLES } from '@/theme/cssVariables';

// Styled components using theme variables
const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
  borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.LARGE),
  boxShadow: cssVar(CSS_VARIABLES.SHADOW.MEDIUM),
  border: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
}));

const StatCard = styled(Card)(({ theme }) => ({
  backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
  borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
  boxShadow: cssVar(CSS_VARIABLES.SHADOW.LIGHT),
  border: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
  padding: cssVar(CSS_VARIABLES.SPACING.LG),
  height: '100%',
}));

const ChartCard = styled(Card)(({ theme }) => ({
  backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
  borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
  boxShadow: cssVar(CSS_VARIABLES.SHADOW.LIGHT),
  border: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
  padding: cssVar(CSS_VARIABLES.SPACING.LG),
  height: '100%',
  minHeight: '300px',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
  borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
  boxShadow: cssVar(CSS_VARIABLES.SHADOW.LIGHT),
  border: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
  padding: cssVar(CSS_VARIABLES.SPACING.LG),
  textAlign: 'center',
}));

const CopyTextField = styled(OutlinedInput)(({ theme }) => ({
  backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.INPUT),
  '& .MuiOutlinedInput-notchedOutline': {
    border: `1px solid ${cssVar(CSS_VARIABLES.UI.INPUT_BORDER)}`,
  },
  '&.Mui-disabled': {
    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    '& input': {
      color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
      '-webkit-text-fill-color': cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    },
    '& .MuiInputBase-input': {
      color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
      '-webkit-text-fill-color': cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    },
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
  '& .MuiTab-root': {
    color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
    fontWeight: 500,
    textTransform: 'none',
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
  },
  '& .Mui-selected': {
    color: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
  },
  '& .MuiTabs-indicator': {
    backgroundColor: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
  },
}));

const StepCard = styled(Card)(({ theme }) => ({
  backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
  borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
  boxShadow: cssVar(CSS_VARIABLES.SHADOW.LIGHT),
  border: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
  padding: cssVar(CSS_VARIABLES.SPACING.LG),
  textAlign: 'center',
  height: '100%',
}));

// Copy field component
function CopyField({ textToCopy }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard!');
    });
  };

  return (
    <CopyTextField
      disabled
      fullWidth
      endAdornment={
        <InputAdornment position="end">
          <Tooltip placement="top" title="Click to copy">
            <IconButton edge="end" onClick={handleCopy}>
              <ContentCopyIcon sx={{ color: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN) }} />
            </IconButton>
          </Tooltip>
        </InputAdornment>
      }
      value={textToCopy}
    />
  );
}

// Main Affiliate Dashboard component
export default function AffiliateDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const { colors } = useThemeStyles();

  // Placeholder data
  const referralCode = 'TRADER123';
  const referralUrl = `${window.location.origin}/referral/${referralCode}`;
  
  const stats = {
    totalReferrals: 24,
    activeUsers: 18,
    totalEarnings: 1250.75,
    currentCycleEarnings: 89.50,
    cycleStart: '2025-01-01',
    cycleEnd: '2025-01-31',
    commissionRate: '50%',
    tierBreakdown: '40% / 8% / 2%',
  };

  const metrics = {
    conversionRate: '75%',
    avgCommission: '$52.11',
    referredVolume: '$45,230',
    estimatedCommissions: '$89.50',
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          sx={{ 
            color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
            fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H1_SIZE),
            fontWeight: 500,
            mb: 2
          }} 
          variant="h1"
        >
          Affiliate Dashboard
        </Typography>
        <Typography 
          sx={{ 
            color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
            fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
          }} 
          variant="body1"
        >
          Earn trading fee commissions by inviting your friends to trade.
        </Typography>
      </Box>

      {/* Your Referral Link Card with How It Works */}
      <StyledCard sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Stack alignItems="center" direction="row" spacing={2}>
              <LinkOutlinedIcon sx={{ color: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN) }} />
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H3_SIZE),
                  fontWeight: 500
                }} 
                variant="h5"
              >
                Your Referral Link
              </Typography>
            </Stack>
          }
        />
        <CardContent>
          <Grid container spacing={4}>
            {/* Referral Link Section */}
            <Grid item md={6} xs={12}>
              <Stack spacing={3}>
                <Typography 
                  sx={{ 
                    color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
                  }} 
                  variant="body1"
                >
                  Choose a custom referral code to share with your network.
                </Typography>
                <CopyField textToCopy={referralUrl} />
                <Button
                  startIcon={<ShareIcon />}
                  sx={{
                    backgroundColor: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
                    color: cssVar(CSS_VARIABLES.COMMON.WHITE),
                    borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: cssVar(CSS_VARIABLES.BRAND.PRIMARY_DARK),
                    },
                  }}
                  variant="contained"
                >
                  Share Link
                </Button>
              </Stack>
            </Grid>

            {/* How It Works Section */}
            <Grid item md={6} xs={12}>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H4_SIZE),
                  fontWeight: 500,
                  mb: 3
                }} 
                variant="h6"
              >
                How It Works
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <StepCard>
                    <Stack alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShareIcon sx={{ color: cssVar(CSS_VARIABLES.COMMON.WHITE) }} />
                      </Box>
                      <Typography 
                        sx={{ 
                          color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                          fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
                          fontWeight: 500
                        }} 
                        variant="h6"
                      >
                        1. Share Your Link
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                          fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                        }} 
                        variant="body2"
                      >
                        Share your referral link with friends and followers
                      </Typography>
                    </Stack>
                  </StepCard>
                </Grid>
                <Grid item xs={12}>
                  <StepCard>
                    <Stack alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PersonAddIcon sx={{ color: cssVar(CSS_VARIABLES.COMMON.WHITE) }} />
                      </Box>
                      <Typography 
                        sx={{ 
                          color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                          fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
                          fontWeight: 500
                        }} 
                        variant="h6"
                      >
                        2. Users Sign Up
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                          fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                        }} 
                        variant="body2"
                      >
                        Friends sign up using your referral link
                      </Typography>
                    </Stack>
                  </StepCard>
                </Grid>
                <Grid item xs={12}>
                  <StepCard>
                    <Stack alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AttachMoneyIcon sx={{ color: cssVar(CSS_VARIABLES.COMMON.WHITE) }} />
                      </Box>
                      <Typography 
                        sx={{ 
                          color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                          fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
                          fontWeight: 500
                        }} 
                        variant="h6"
                      >
                        3. Earn Commissions
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                          fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                        }} 
                        variant="body2"
                      >
                        Earn commissions on their trading fees
                      </Typography>
                    </Stack>
                  </StepCard>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>

      {/* Tabbed Navigation */}
      <StyledTabs sx={{ mb: 3 }} value={activeTab} onChange={handleTabChange}>
        <Tab label="Overview" />
        <Tab label="Referrals" />
        <Tab label="Payouts" />
        <Tab label="Settings" />
      </StyledTabs>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item md={3} sm={6} xs={12}>
          <StatCard>
            <Stack spacing={2}>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H2_SIZE),
                  fontWeight: 500
                }} 
                variant="h4"
              >
                {stats.totalReferrals}
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
                }} 
                variant="body1"
              >
                Total Referrals
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SUBTITLE),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                }} 
                variant="body2"
              >
                {stats.activeUsers} active users
              </Typography>
            </Stack>
          </StatCard>
        </Grid>

        <Grid item md={3} sm={6} xs={12}>
          <StatCard>
            <Stack spacing={2}>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H2_SIZE),
                  fontWeight: 500
                }} 
                variant="h4"
              >
                ${stats.totalEarnings.toFixed(2)}
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
                }} 
                variant="body1"
              >
                Total Earnings
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SUBTITLE),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                }} 
                variant="body2"
              >
                Lifetime USD earnings
              </Typography>
            </Stack>
          </StatCard>
        </Grid>

        <Grid item md={3} sm={6} xs={12}>
          <StatCard>
            <Stack spacing={2}>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H2_SIZE),
                  fontWeight: 500
                }} 
                variant="h4"
              >
                ${stats.currentCycleEarnings.toFixed(2)}
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
                }} 
                variant="body1"
              >
                Estimated Commissions
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SUBTITLE),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                }} 
                variant="body2"
              >
                {stats.cycleStart} to {stats.cycleEnd}
              </Typography>
            </Stack>
          </StatCard>
        </Grid>

        <Grid item md={3} sm={6} xs={12}>
          <StatCard>
            <Stack spacing={2}>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H2_SIZE),
                  fontWeight: 500
                }} 
                variant="h4"
              >
                Up to {stats.commissionRate} rev share
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
                }} 
                variant="body1"
              >
                Commission Rate
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SUBTITLE),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                }} 
                variant="body2"
              >
                on Hyperliquid
              </Typography>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.SUBTITLE),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE)
                }} 
                variant="body2"
              >
                {stats.tierBreakdown}
              </Typography>
            </Stack>
          </StatCard>
        </Grid>
      </Grid>

      {/* Data Visualization Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item md={6} xs={12}>
          <ChartCard>
            <Stack spacing={3}>
              <Stack alignItems="center" direction="row" justifyContent="space-between">
                <Typography 
                  sx={{ 
                    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H4_SIZE),
                    fontWeight: 500
                  }} 
                  variant="h6"
                >
                  Referral Growth Rate
                </Typography>
                <Button
                  size="small"
                  sx={{
                    borderColor: cssVar(CSS_VARIABLES.UI.BORDER),
                    color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                    textTransform: 'none',
                    borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.SMALL),
                  }}
                  variant="outlined"
                >
                  Week
                </Button>
              </Stack>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
                }}
              >
                No data yet
              </Box>
            </Stack>
          </ChartCard>
        </Grid>

        <Grid item md={6} xs={12}>
          <ChartCard>
            <Stack spacing={3}>
              <Typography 
                sx={{ 
                  color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H4_SIZE),
                  fontWeight: 500
                }} 
                variant="h6"
              >
                Estimated Commission Earnings
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                  fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
                }}
              >
                No data yet
              </Box>
            </Stack>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3}>
        <Grid item md={3} sm={6} xs={12}>
          <MetricCard>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H3_SIZE),
                fontWeight: 500,
                mb: 1
              }} 
              variant="h5"
            >
              {metrics.conversionRate}
            </Typography>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
              }} 
              variant="body1"
            >
              Conversion Rate
            </Typography>
          </MetricCard>
        </Grid>

        <Grid item md={3} sm={6} xs={12}>
          <MetricCard>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H3_SIZE),
                fontWeight: 500,
                mb: 1
              }} 
              variant="h5"
            >
              {metrics.avgCommission}
            </Typography>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
              }} 
              variant="body1"
            >
              Avg. Commission
            </Typography>
          </MetricCard>
        </Grid>

        <Grid item md={3} sm={6} xs={12}>
          <MetricCard>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H3_SIZE),
                fontWeight: 500,
                mb: 1
              }} 
              variant="h5"
            >
              {metrics.referredVolume}
            </Typography>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
              }} 
              variant="body1"
            >
              Referred Volume
            </Typography>
          </MetricCard>
        </Grid>

        <Grid item md={3} sm={6} xs={12}>
          <MetricCard>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H3_SIZE),
                fontWeight: 500,
                mb: 1
              }} 
              variant="h5"
            >
              {metrics.estimatedCommissions}
            </Typography>
            <Typography 
              sx={{ 
                color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
                fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE)
              }} 
              variant="body1"
            >
              Estimated Commissions
            </Typography>
          </MetricCard>
        </Grid>
      </Grid>
    </Container>
  );
}
