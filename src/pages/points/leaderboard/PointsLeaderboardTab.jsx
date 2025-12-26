import React from 'react';
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import LOGOS from '@images/logos';
import useGetLeaderboardData from '@/pages/points/hooks/useGetLeaderboardData';
import PointsLoadingMask from '@/pages/points/PointsLoadingMask';
import DataComponent from '@/shared/DataComponent';
import PointsLeaderboardHeader from './PointsLeaderboardHeader';
import PointsLeaderboardTable from './PointsLeaderboardTable';

function NoLeaderboardData() {
  return (
    <Stack
      alignItems='center'
      direction='column'
      justifyContent='center'
      spacing={2}
      sx={{ height: '100%', minHeight: '400px' }}
    >
      <img alt='Tread Logo' src={LOGOS.treadRoundedSvg} style={{ height: '64px' }} />
      <Typography variant='h6'>No leaderboard data available</Typography>
      <Typography sx={{ color: 'text.secondary' }} variant='body2'>
        Make your first trade to appear on the leaderboard!
      </Typography>
      <Button href='/' size='large' variant='contained'>
        Go to trade
      </Button>
    </Stack>
  );
}

function PointsLeaderboardTab() {
  const [timeframe] = React.useState('30d'); // Can be made configurable later
  const rowsPerPage = 10; // Show only top 10

  const { leaderboardData, leaderboardDataLoading } = useGetLeaderboardData(
    0, // page 0
    '', // no search
    timeframe,
    rowsPerPage
  );

  // Extract data from API response
  const { my_rank, my_trader_id, my_volume, my_boosted_volume, leaderboard_rows = [] } = leaderboardData;

  // Limit to top 10 rows
  const top10Rows = leaderboard_rows.slice(0, 10);

  return (
    <Stack direction='column' spacing={4}>
      <PointsLoadingMask open={leaderboardDataLoading} />

      {/* Your Ranking Header */}
      <PointsLeaderboardHeader
        myBoostedVolume={my_boosted_volume}
        myRank={my_rank}
        myTraderId={my_trader_id}
        myVolume={my_volume}
      />

      {/* Leaderboard Table Section */}
      <Stack direction='column' spacing={2}>
        <Box sx={{ minHeight: '400px' }}>
          <DataComponent
            emptyComponent={<NoLeaderboardData />}
            isEmpty={!leaderboardDataLoading && top10Rows.length === 0}
            isLoading={leaderboardDataLoading}
            loadingComponent={<Skeleton sx={{ height: '100%', width: '100%' }} variant='rounded' />}
          >
            <PointsLeaderboardTable leaderboardRows={top10Rows} userRank={my_rank} />
          </DataComponent>
        </Box>
      </Stack>
    </Stack>
  );
}

export default PointsLeaderboardTab;
