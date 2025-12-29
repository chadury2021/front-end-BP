import React, { useState } from 'react';
import { Button, Stack, Typography, Box, Container, Paper, Divider, Skeleton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import Link from '@mui/material/Link';
import DateRangePicker, { DateRange } from '@/pages/points/DateRangePicker';
import useGetPointsData from '@/pages/points/hooks/useGetPointsData';
import { smartRound, numberWithCommas } from '@/util';
import DataComponent from '@/shared/DataComponent';
import PointsLoadingMask from '@/pages/points/PointsLoadingMask';
import BackgroundAnimationWrapper, {
  useBackgroundAnimation,
  BackgroundToggle,
} from '@/shared/components/BackgroundAnimationWrapper';
import PointsTable from './PointsTable';
import PointsChart from './PointsChart';
import LOGOS from '../../../images/logos';

function NoPointsActivity() {
  return (
    <Stack
      alignItems='center'
      direction='column'
      justifyContent='center'
      spacing={2}
      sx={{ height: '100%', minHeight: 'inherit' }}
    >
      <img alt='Tread Logo' src={LOGOS.treadRoundedSvg} style={{ height: '64px' }} />
      <Typography variant='h6'>You don’t have any points rewards right now</Typography>
      <Button href='/' size='large' variant='contained'>
        Go to trade
      </Button>
    </Stack>
  );
}

function PointsSection({ title, subtitle, children }) {
  return (
    <Stack direction='column' spacing={4}>
      <Stack direction='column' spacing={1}>
        <Typography variant='h1'>{title}</Typography>
        <Typography variant='subtitle1'>{subtitle}</Typography>
      </Stack>
      {children}
    </Stack>
  );
}

function PointsPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [dateRange, setDateRange] = useState(DateRange.MONTH);
  const [activityPage, setActivityPage] = useState(0);
  const [showAnimation, setShowAnimation] = useBackgroundAnimation();
  const { pointsData, pointsDataLoading } = useGetPointsData(dateRange, activityPage);

  const {
    total_points = 0,
    total_volume = 0,
    points_chart_data = [],
    points_activity = [],
    points_activity_count = 0,
    achievements = {},
  } = pointsData;

  return (
    <>
      <BackgroundAnimationWrapper isFeatureEnabled showAnimation={showAnimation} />
      <Container fixed maxWidth='lg' sx={{ py: 8 }}>
        <Box sx={{ position: 'relative' }}>
          <PointsLoadingMask open={pointsDataLoading} />
          <Stack direction='column' spacing={6}>
            <Stack direction='column' spacing={4}>
              <Stack alignItems='flex-start' direction='row' justifyContent='space-between'>
                <Stack direction='column' spacing={1}>
                  <Typography variant='h1'>Points</Typography>
                  <Typography variant='subtitle1'>
                    Accumulate points by trading on Bitfrost Prime.
                    <Link
                      href='https://foul-wavelength-9af.notion.site/Tread-fi-Points-Program-13f60eedf44c80f98812fdb7a3fbb5c0'
                      underline='none'
                    >
                      {' '}
                      Learn more
                    </Link>
                  </Typography>
                </Stack>
                {/* Hide background toggle on mobile to declutter small screens */}
                {isDesktop && <BackgroundToggle showAnimation={showAnimation} onToggle={setShowAnimation} />}
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
                <DataComponent
                  emptyComponent={<NoPointsActivity />}
                  isEmpty={points_activity_count === 0}
                  isLoading={pointsDataLoading}
                  loadingComponent=<Skeleton sx={{ height: '100%', width: '100%' }} variant='rounded' />
                >
                  <Grid container sx={{ height: '100%' }}>
                    <Grid sx={{ height: '100%', borderRight: '1px solid rgba(255, 255, 255, 0.12);' }} xs={3}>
                      <Stack direction='column' spacing={4} sx={{ p: 4 }}>
                        <Stack direction='column' spacing={2}>
                          <Typography variant='body1'>Total Points</Typography>
                          <Typography variant='h5Strong'>{numberWithCommas(smartRound(total_points, 2))}</Typography>
                        </Stack>
                        <Divider />
                        <Stack direction='column' spacing={2}>
                          <Typography variant='body1'>Badges</Typography>
                          <Typography color='text.secondary' variant='body2'>
                            Season 1 is loading...
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                    <Grid sx={{ height: '100%', borderRight: '1px solid rgba(255, 255, 255, 0.12);' }} xs={3}>
                      <Stack direction='column' spacing={2} sx={{ p: 4 }}>
                        <Typography variant='body1'>Total Volume</Typography>
                        <Typography variant='h5Strong'>${numberWithCommas(smartRound(total_volume, 2))}</Typography>
                      </Stack>
                    </Grid>
                    <Grid sx={{ height: '100%' }} xs={6}>
                      <Stack
                        direction='column'
                        spacing={1}
                        sx={{ p: 4, pb: 0, boxSizing: 'border-box', height: '100%' }}
                      >
                        <Stack direction='row' justifyContent='space-between'>
                          <Typography>Points Chart</Typography>
                          <DateRangePicker dateRange={dateRange} onSelectDateRange={setDateRange} />
                        </Stack>
                        <Box style={{ height: '100%' }}>
                          <PointsChart dateRange={dateRange} pointsData={points_chart_data} />
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </DataComponent>
              </Paper>
            </Stack>
            <PointsSection subtitle='Stay tuned for new ways to earn points.' title='Season 1'>
              <Paper
                elevation={0}
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  minHeight: '200px',
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography variant='h5'>Season 1 loading..</Typography>
              </Paper>
            </PointsSection>
            <PointsSection subtitle='Track your points earned from trading activities.' title='Points History'>
              <Paper elevation={0} sx={{ minHeight: '400px' }}>
                <DataComponent
                  emptyComponent={<NoPointsActivity />}
                  isEmpty={points_activity_count === 0}
                  isLoading={pointsDataLoading}
                  loadingComponent=<Skeleton sx={{ height: '100%', width: '100%' }} variant='rounded' />
                >
                  <PointsTable
                    achievements={achievements}
                    activityPage={activityPage}
                    pointsActivity={points_activity}
                    pointsActivityCount={points_activity_count}
                    onPageChange={setActivityPage}
                  />
                </DataComponent>
              </Paper>
            </PointsSection>
          </Stack>
        </Box>
      </Container>
    </>
  );
}

export default PointsPage;
