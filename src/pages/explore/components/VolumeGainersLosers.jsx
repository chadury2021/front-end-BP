import React from 'react';
import { Box, Grid, Paper, Typography, Skeleton } from '@mui/material';
import DataComponent from '@/shared/DataComponent';

function VolumeGainersLosers({
  loading,
  volumeTab,
  setVolumeTab,
  perpPairs,
  spotPairs,
  sortedByGain,
  sortedByLoss,
  renderPairsTable,
}) {
  return (
    <Grid container spacing={2} sx={{ height: '100%', minHeight: 0 }}>
      {/* Top Volume Section */}
      <Grid item md={4} sx={{ height: '100%', minHeight: 0 }} xs={12}>
        <DataComponent isLoading={loading} loadingComponent={<Skeleton height='100%' variant='rectangular' />}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minHeight: 0,
              // Hide internal scrollbars while preserving scroll
              '& *': { scrollbarWidth: 'none', msOverflowStyle: 'none' },
              '& *::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
              <Typography gutterBottom variant='subtitle1'>
                Top Volume
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography
                  sx={{
                    color: volumeTab === 'perp' ? 'primary.main' : 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.light' },
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: volumeTab === 'perp' ? 'action.selected' : 'transparent',
                  }}
                  variant='body3'
                  onClick={() => setVolumeTab('perp')}
                >
                  Perp
                </Typography>
                <Typography
                  sx={{
                    color: volumeTab === 'spot' ? 'primary.main' : 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.light' },
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: volumeTab === 'spot' ? 'action.selected' : 'transparent',
                  }}
                  variant='body3'
                  onClick={() => setVolumeTab('spot')}
                >
                  Spot
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', pb: 6, pr: 1 }}
            >
              {volumeTab === 'perp' ? renderPairsTable(perpPairs, '') : renderPairsTable(spotPairs, '')}
            </Box>
          </Paper>
        </DataComponent>
      </Grid>

      {/* Top Gainers and Losers Section */}
      <Grid item md={8} sx={{ height: '100%', minHeight: 0 }} xs={12}>
        <DataComponent isLoading={loading} loadingComponent={<Skeleton height='100%' variant='rectangular' />}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minHeight: 0,
              // Hide internal scrollbars while preserving scroll
              '& *': { scrollbarWidth: 'none', msOverflowStyle: 'none' },
              '& *::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pb: 6, pr: 1 }}>
              <Grid container spacing={2} sx={{ minHeight: 0 }}>
                <Grid item sx={{ display: 'flex', flexDirection: 'column' }} xs={6}>
                  {renderPairsTable(sortedByGain, 'Top Gainers')}
                </Grid>
                <Grid item sx={{ display: 'flex', flexDirection: 'column' }} xs={6}>
                  {renderPairsTable(sortedByLoss, 'Top Losers')}
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </DataComponent>
      </Grid>
    </Grid>
  );
}

export default VolumeGainersLosers;
