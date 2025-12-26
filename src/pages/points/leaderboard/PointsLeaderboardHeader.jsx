import React from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import PointsStatCard from '@/pages/points/PointsStatCard';
import { numberWithCommas, smartRound } from '@/util';

function PointsLeaderboardHeader({ myRank, myTraderId, myVolume, myBoostedVolume, onShare, onEditTraderId }) {
  const theme = useTheme();

  const handleShare = () => {
    if (onShare) {
      onShare({ myRank, myTraderId, myVolume, myBoostedVolume });
    }
  };

  const handleEditTraderId = () => {
    if (onEditTraderId) {
      onEditTraderId();
    }
  };

  return (
    <Box>
      <Box
        aria-label='Leaderboard Summary'
        role='region'
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: 'none',
          borderRadius: 2,
          p: { xs: 2, md: 3 },
        }}
      >
        <Grid container spacing={2}>
          {/* Your Ranking */}
          <Grid item md={3} xs={12}>
            <PointsStatCard plain label='Your Ranking' value={myRank || '-'} />
            {onShare && (
              <IconButton
                size='small'
                sx={{
                  position: 'absolute',
                  right: theme.spacing(1),
                  top: theme.spacing(1),
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
                onClick={handleShare}
              >
                <ShareIcon fontSize='small' />
              </IconButton>
            )}
          </Grid>
          {/* Trader ID */}
          <Grid item md={3} xs={12}>
            <PointsStatCard plain label='Trader' value={myTraderId || '-'} />
            {onEditTraderId && (
              <IconButton
                size='small'
                sx={{
                  position: 'absolute',
                  right: theme.spacing(1),
                  top: theme.spacing(1),
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
                onClick={handleEditTraderId}
              >
                <EditIcon fontSize='small' />
              </IconButton>
            )}
          </Grid>
          {/* Season 1 Volume */}
          <Grid item md={3} xs={12}>
            <PointsStatCard
              plain
              label='Season 1 Volume'
              value={
                myVolume !== null && myVolume !== undefined ? `$${numberWithCommas(smartRound(myVolume, 2))}` : '-'
              }
            />
          </Grid>
          {/* Boosted Volume */}
          <Grid item md={3} xs={12}>
            <PointsStatCard
              plain
              label='Boosted Volume'
              value={
                myBoostedVolume !== null && myBoostedVolume !== undefined
                  ? `$${numberWithCommas(smartRound(myBoostedVolume, 2))}`
                  : '-'
              }
              valueColor={
                myBoostedVolume !== null && myBoostedVolume !== undefined ? theme.palette.warning.main : undefined
              }
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default PointsLeaderboardHeader;
