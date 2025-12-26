import React, { useState, useMemo, useContext } from 'react';
import { Box, Typography, Grid, useTheme, CircularProgress } from '@mui/material';

import EXCHANGE_ICONS from '@images/exchange_icons';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { ApiError, delegatePointsToExchange } from '@/apiServices';
import PollCard from './PollCard';
import ExchangeIntegrationAdminForm from './ExchangeIntegrationAdminForm';
import useExchangeIntegrationVotes from '../hooks/useExchangeIntegrationVotes';

function VotingTab({ userPoints }) {
  const theme = useTheme();
  const { showAlert } = useContext(ErrorContext);
  const { user } = useUserMetadata();
  const { votesData, rawData, loading, error, refresh, usersVote } = useExchangeIntegrationVotes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin
  const isAdmin = !!(user && (user.is_staff || user.is_superuser));

  // Use real data from API, fallback to empty array if loading or error
  const polls = useMemo(() => {
    if (loading || error) return [];
    return votesData.map((poll) => ({
      ...poll,
      // Use logo_url from API if available, otherwise try to match from exchange icons
      logo: poll.logo || EXCHANGE_ICONS[poll.title?.toLowerCase()] || EXCHANGE_ICONS.default,
    }));
  }, [votesData, loading, error]);

  const totalVotes = polls.reduce((acc, curr) => acc + curr.votes, 0);

  // Rank integrations by vote count (descending)
  const sortedPolls = useMemo(() => [...polls].sort((a, b) => b.votes - a.votes), [polls]);

  const handleVoteClick = async (pollId) => {
    const option = sortedPolls.find((p) => p.id === pollId);
    if (!option || !option.exchangeIntegrationId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await delegatePointsToExchange(option.exchangeIntegrationId, userPoints);

      refresh();

      showAlert({
        severity: 'success',
        message: `Successfully delegated ${userPoints.toLocaleString()} points to ${option.title}`,
      });
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to submit vote. Please try again.';
      showAlert({
        severity: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading && polls.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          mt: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error && polls.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
        <Typography color='error' variant='h6'>
          Failed to load exchange integrations
        </Typography>
        <Typography color='text.secondary' sx={{ mt: 2 }} variant='body2'>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {isAdmin && (
        <ExchangeIntegrationAdminForm exchangeIntegrations={rawData} showAlert={showAlert} onRefresh={refresh} />
      )}

      {/* Cards row */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {polls.length === 0 ? (
          <Grid item xs={12}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography color='text.secondary' variant='body1'>
                No exchange integrations available for voting yet.
              </Typography>
            </Box>
          </Grid>
        ) : (
          sortedPolls.map((poll, index) => (
            <Grid item key={poll.id} md={12} sm={12} xs={12}>
              <PollCard
                isSelected={String(usersVote) === String(poll.id)}
                option={poll}
                rank={index + 1}
                totalVotes={totalVotes}
                onVote={handleVoteClick}
              />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}

export default VotingTab;
