import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, CardContent, LinearProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function PollCard({ isSelected, option, rank, totalVotes, onVote }) {
  const theme = useTheme();
  const votePercentage = useMemo(
    () => (totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0),
    [option.votes, totalVotes]
  );

  const getRankIcon = () => {
    if (rank === 1) return '👑'; // Gold crown
    if (rank === 2) return '🥈'; // Silver medal
    if (rank === 3) return '🥉'; // Bronze medal
    return null;
  };

  const getRankColor = () => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.palette.text.secondary;
  };
  const othersText = useMemo(() => {
    const rawOthers = option.others;
    if (!rawOthers) return '';
    if (typeof rawOthers === 'object' && rawOthers.text) {
      return String(rawOthers.text);
    }
    if (typeof rawOthers === 'string') {
      return rawOthers;
    }

    return '';
  }, [option.others]);

  return (
    <Card
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
        borderRadius: 2,
        width: '100%',
        cursor: 'default',
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '100%',
          }}
        >
          {/* Header: rank + logo + title/description + progress + vote button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
              {/* Rank badge */}
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minWidth: 40,
                  flexShrink: 0,
                }}
              >
                {getRankIcon() && (
                  <Typography
                    sx={{
                      color: getRankColor(),
                      fontSize: '1.5rem',
                      lineHeight: 1,
                      mb: 0.25,
                    }}
                  >
                    {getRankIcon()}
                  </Typography>
                )}
                <Typography
                  sx={{
                    color: getRankColor(),
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  #{rank}
                </Typography>
              </Box>

              {option.logo && (
                <Box
                  sx={{
                    alignItems: 'center',
                    backgroundColor: theme.palette.ui.backgroundLight,
                    borderRadius: '50%',
                    display: 'flex',
                    flexShrink: 0,
                    height: 40,
                    justifyContent: 'center',
                    width: 40,
                  }}
                >
                  <img
                    alt={`${option.title} logo`}
                    src={option.logo}
                    style={{
                      height: 'inherit',
                      objectFit: 'contain',
                      width: 'inherit',
                      borderRadius: '50%',
                    }}
                  />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                  variant='h6'
                >
                  {option.title}
                </Typography>
                {option.description && (
                  <Typography
                    sx={{
                      color: theme.palette.text.secondary,
                      maxWidth: '50%',
                      mt: 0.5,
                    }}
                    variant='body2'
                  >
                    {option.description}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Right: vote % progress + button */}
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                gap: 1,
                minWidth: 140,
              }}
            >
              <Box
                sx={{
                  minWidth: 120,
                }}
              >
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography sx={{ color: theme.palette.text.secondary }} variant='caption'>
                    Share of votes
                  </Typography>
                  <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }} variant='caption'>
                    {votePercentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: theme.palette.ui.backgroundLight,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                    },
                  }}
                  value={votePercentage}
                  variant='determinate'
                />
              </Box>

              <Button
                disabled={isSelected}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 2,
                  color: theme.palette.common.black,
                  px: 2.5,
                  py: 0.75,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: 'none',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: theme.palette.ui.backgroundLight,
                    boxShadow: 'none',
                    color: theme.palette.text.disabled,
                  },
                }}
                variant='contained'
                onClick={() => {
                  if (!isSelected) {
                    onVote(option.id);
                  }
                }}
              >
                {(() => {
                  if (isSelected) return 'Voted';
                  return 'Vote';
                })()}
              </Button>
            </Box>
          </Box>

          {/* Details: Integration fee, Fee Rebates, Others */}
          <Box
            sx={{
              backgroundColor: theme.palette.ui.backgroundLight,
              borderRadius: 2,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr 2fr' },
              mt: 2,
              p: 2,
            }}
          >
            <Box>
              <Typography sx={{ color: theme.palette.text.secondary, mb: 0.5 }} variant='body2'>
                Integration fee
              </Typography>
              <Typography sx={{ color: theme.palette.text.primary }} variant='body1'>
                {option.integration_bonus || '—'}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: theme.palette.text.secondary, mb: 0.5 }} variant='body2'>
                Fee Rebates
              </Typography>
              <Typography sx={{ color: theme.palette.text.primary }} variant='body1'>
                {option.fee_rebates || '—'}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: theme.palette.text.secondary, mb: 0.5 }} variant='body2'>
                Others
              </Typography>
              <Typography sx={{ color: theme.palette.text.primary }} variant='body1'>
                {othersText || '—'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

PollCard.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  option: PropTypes.shape({
    description: PropTypes.string,
    id: PropTypes.string.isRequired,
    integration_bonus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    logo: PropTypes.string,
    others: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    title: PropTypes.string.isRequired,
    votes: PropTypes.number.isRequired,
    fee_rebates: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  rank: PropTypes.number.isRequired,
  onVote: PropTypes.func.isRequired,
  totalVotes: PropTypes.number.isRequired,
};

export default PollCard;
