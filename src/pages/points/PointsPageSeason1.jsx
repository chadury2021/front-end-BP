import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Container,
  Stack,
  Tabs,
  Tab,
  Typography,
  useTheme,
  Paper,
  Button,
  Skeleton,
  GlobalStyles,
  useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ArticleIcon from '@mui/icons-material/Article';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VolumeBoostIcons from '@images/volume_boost_icons';
import { smartRound, numberWithCommas } from '@/util';
import DataComponent from '@/shared/DataComponent';
import ExchangeIcons from '@images/exchange_icons';
import PointsTableSeason1 from '@/pages/points/PointsTableSeason1';
import PointsLoadingMask from '@/pages/points/PointsLoadingMask';
import PointsStatCard from '@/pages/points/PointsStatCard';
import PointsBuffCard from '@/pages/points/PointsBuffCard';
import WeeklyVolumeProgress from '@/pages/points/WeeklyVolumeProgress';
import CountUp from '@/shared/components/CountUp';
import LOGOS from '@images/logos';
import moment from 'moment';
import { alpha } from '@mui/material/styles';
import { isolatedHolographicStyles } from '@/theme/holographicEffects';
import BackgroundAnimationWrapper, {
  useBackgroundAnimation,
  BackgroundToggle,
} from '@/shared/components/BackgroundAnimationWrapper';
import FaultyTerminal from '@/shared/components/FaultyTerminal';
import { useFeatureFlag } from '@/shared/context/FeatureFlagProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import PointsLeaderboardTab from './leaderboard/PointsLeaderboardTab';
import VotingTab from './voting/VotingTab';
import useGetPoints from './hooks/useGetPoints';

// Custom icon wrapper components for volume boost icons
// These wrap the SVG images as components that accept sx props
function VolumeBoostIcon1({ sx, ...props }) {
  return (
    <Box
      alt='Level 1'
      component='img'
      src={VolumeBoostIcons.level1}
      {...props}
      sx={{
        width: 24,
        height: 24,
        ...sx,
      }}
    />
  );
}

function VolumeBoostIcon2({ sx, ...props }) {
  return (
    <Box
      alt='Level 2'
      component='img'
      src={VolumeBoostIcons.level2}
      {...props}
      sx={{
        width: 24,
        height: 24,
        ...sx,
      }}
    />
  );
}

function VolumeBoostIcon3({ sx, ...props }) {
  return (
    <Box
      alt='Level 3'
      component='img'
      src={VolumeBoostIcons.level3}
      {...props}
      sx={{
        width: 24,
        height: 24,
        ...sx,
      }}
    />
  );
}

// Volume boost levels configuration
const VOLUME_BOOST_LEVELS = [
  {
    level: 1,
    threshold: 1000000, // $1M
    multiplier: '1.10X',
    percentage: 10,
    multiplierValue: 1.1,
    description: '10% boost in volume',
    icon: VolumeBoostIcon1,
  },
  {
    level: 2,
    threshold: 5000000, // $5M
    multiplier: '1.20X',
    percentage: 20,
    multiplierValue: 1.2,
    description: '20% boost in volume',
    icon: VolumeBoostIcon2,
  },
  {
    level: 3,
    threshold: 10000000, // $10M
    multiplier: '1.30X',
    percentage: 30,
    multiplierValue: 1.3,
    description: '30% boost in volume',
    icon: VolumeBoostIcon3,
  },
];

// Legacy VOLUME_LEVELS for progress bar (keeping for compatibility)
// Note: These values must match VOLUME_BOOST_LEVELS for consistency
const VOLUME_LEVELS = [
  { threshold: 1000000, label: '1.10X', percentage: 10 },
  { threshold: 5000000, label: '1.20X', percentage: 20 },
  { threshold: 10000000, label: '1.30X', percentage: 30 },
];

const VOLUME_LEVEL_COLOR_MAP = {
  1: '#cd7f32', // Bronze
  2: '#c0c0c0', // Silver
  3: '#d4af37', // Gold
};

const BOOST_CARD_MIN_HEIGHT = {
  exchange: 100,
  volume: 65,
};

const EXCHANGE_COLOR_CONFIG = {
  bybit: { variant: 'neutral' },
  hyperliquid: { variant: 'neutral' },
  okxdex: { variant: 'holographic' },
};

const createHolographicGradient = (primaryAlpha = 0.32, secondaryAlpha = 0.22) =>
  `linear-gradient(135deg, rgba(139, 92, 246, ${primaryAlpha}) 0%, rgba(59, 130, 246, ${secondaryAlpha}) 33%, rgba(34, 197, 94, ${primaryAlpha}) 66%, rgba(244, 114, 182, ${secondaryAlpha}) 100%)`;

function NoPointsActivity() {
  const theme = useTheme();
  return (
    <Stack
      alignItems='center'
      direction='column'
      justifyContent='center'
      spacing={2}
      sx={{ height: '100%', minHeight: 'inherit' }}
    >
      <Box alt='Tread Logo' component='img' src={LOGOS.treadRoundedSvg} sx={{ height: theme.spacing(16) }} />
      <Typography variant='h6'>You don&apos;t have any points rewards right now</Typography>
      <Button href='/' size='large' variant='contained'>
        Go to trade
      </Button>
    </Stack>
  );
}

function CountdownCell({ value, label }) {
  return (
    <Stack alignItems='center' direction='column' spacing={0}>
      <Typography variant='h5Strong'>{String(value).padStart(2, '0')}</Typography>
      <Typography variant='small2'>{label}</Typography>
    </Stack>
  );
}

function CountdownTimer({ duration }) {
  return (
    <Stack direction='row' spacing={1} sx={{ border: '1px solid', p: 2 }}>
      <CountdownCell label='Days' value={duration.days()} />
      <Typography variant='h5Strong'>:</Typography>
      <CountdownCell label='Hours' value={duration.hours()} />
      <Typography variant='h5Strong'>:</Typography>
      <CountdownCell label='Mins' value={duration.minutes()} />
      <Typography variant='h5Strong'>:</Typography>
      <CountdownCell label='Secs' value={duration.seconds()} />
    </Stack>
  );
}

function PointsPageSeason1() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { isFeatureEnabled } = useFeatureFlag();
  const { isDev } = useUserMetadata();
  const isVotingEnabled = isFeatureEnabled('exchange_voting') || isDev;
  const [activeTab, setActiveTab] = useState(0); // 0 = Points, 1 = Leaderboard, 2 = Vote (if enabled)
  const [currentTime, setCurrentTime] = useState(moment.utc()); // For countdown updates
  const [hasVisitedLeaderboard, setHasVisitedLeaderboard] = useState(false);
  const [showAnimation, setShowAnimation] = useBackgroundAnimation();
  const { pointsData, loading: pointsDataLoading } = useGetPoints();

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = moment.utc();
      setCurrentTime(now);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []); // Empty deps - interval doesn't need to be recreated

  useEffect(() => {
    if (activeTab === 1) {
      setHasVisitedLeaderboard(true);
    }
  }, [activeTab]);

  const { total_points, points, volume: weeklyVolume, week_end_date } = pointsData;

  const formattedWeeklyVolume = useMemo(() => numberWithCommas(Math.round(Number(weeklyVolume) || 0)), [weeklyVolume]);
  const showWeeklyVolumeAnimation = activeTab === 0 && !hasVisitedLeaderboard && !pointsDataLoading;

  // Calculate week date range
  const weekDateRange = useMemo(() => {
    if (!week_end_date) return '';
    const weekEnd = moment.unix(week_end_date);
    const weekStart = weekEnd.clone().subtract(7, 'days');
    const startFormatted = weekStart.format('YYYY/MM/DD');
    const endFormatted = weekEnd.format('YYYY/MM/DD');
    return `${startFormatted} - ${endFormatted}`;
  }, [week_end_date]);

  // Calculate countdown until week end date
  const countdownToNextAward = useMemo(() => {
    const now = currentTime;

    const nextRewardDate = moment.unix(week_end_date);

    const diff = nextRewardDate.diff(now);
    const duration = moment.duration(diff);

    return { duration };
  }, [currentTime, week_end_date]);

  // Calculate current level and progress
  const getCurrentLevel = () => {
    for (let i = VOLUME_LEVELS.length - 1; i >= 0; i -= 1) {
      if (weeklyVolume >= VOLUME_LEVELS[i].threshold) {
        return { level: i + 1, isMax: i === VOLUME_LEVELS.length - 1 };
      }
    }
    return { level: 0, isMax: false };
  };

  const { level: currentLevel, isMax } = getCurrentLevel();

  const volumeBoostCards = useMemo(
    () =>
      VOLUME_BOOST_LEVELS.map((boost) => {
        const isUnlocked = weeklyVolume >= boost.threshold;
        const isActive = isUnlocked && currentLevel === boost.level && currentLevel !== 0;
        const isAchieved = isUnlocked && boost.level < currentLevel;

        return {
          ...boost,
          name: `Level ${boost.level}`,
          description: boost.description,
          icon: boost.icon,
          multiplier: boost.multiplier,
          threshold: boost.threshold,
          level: boost.level,
          percentage: boost.percentage,
          isActive,
          isAchieved,
          isLocked: !isUnlocked,
          type: 'volume',
        };
      }),
    [currentLevel, weeklyVolume]
  );

  // Get next threshold for progress bar
  const getProgressData = () => {
    if (pointsDataLoading) {
      return {
        progress: 0,
        current: 0,
        target: 0,
        nextMultiplier: '',
      };
    }

    if (isMax) {
      return {
        progress: 100,
        current: weeklyVolume,
        target: VOLUME_LEVELS[VOLUME_LEVELS.length - 1].threshold,
        nextMultiplier: VOLUME_LEVELS[VOLUME_LEVELS.length - 1].label,
      };
    }

    const nextLevelIndex = currentLevel;
    const nextThreshold = VOLUME_LEVELS[nextLevelIndex].threshold;
    const prevThreshold = nextLevelIndex > 0 ? VOLUME_LEVELS[nextLevelIndex - 1].threshold : 0;
    const progress = ((weeklyVolume - prevThreshold) / (nextThreshold - prevThreshold)) * 100;

    return {
      progress: Math.min(progress, 100),
      current: weeklyVolume,
      target: nextThreshold,
      nextMultiplier: VOLUME_LEVELS[nextLevelIndex].label,
    };
  };

  const progressData = getProgressData();

  // Calculate active and inactive volume boosts based on weeklyVolume
  // Only the highest active boost is shown (higher levels replace lower ones)
  // Exchange boosts (static for now)
  const exchangeBoosts = [
    {
      name: 'Bybit Boost',
      multiplier: '2x',
      exchange: 'bybit',
    },
    {
      name: 'Hyperliquid Boost',
      multiplier: '2x',
      exchange: 'hyperliquid',
    },
    {
      name: 'Pacifica Boost',
      multiplier: '2x',
      exchange: 'pacifica',
    },
    {
      name: 'OKXDEX Boost',
      multiplier: '5x',
      exchange: 'okxdex',
    },
  ];

  // Get current active boost percentage for progress bar display
  const currentBoostPercentage = useMemo(() => {
    const activeBoost = volumeBoostCards.find((boost) => boost.isActive);
    return activeBoost ? activeBoost.percentage : 0;
  }, [volumeBoostCards]);

  const renderHistorySection = () => (
    <Stack direction='column' spacing={2}>
      <Typography variant='h6'>Points History</Typography>
      <Paper elevation={0} sx={{ minHeight: '400px' }}>
        <DataComponent
          emptyComponent={<NoPointsActivity />}
          isEmpty={points?.length === 0}
          isLoading={pointsDataLoading}
          loadingComponent={<Skeleton sx={{ height: '100%', width: '100%' }} variant='rounded' />}
        >
          <PointsTableSeason1 pointsActivity={points} />
        </DataComponent>
      </Paper>
    </Stack>
  );

  const getBuffVisualTokens = useCallback(
    (buff) => {
      let baseColor = theme.palette.warning.main;
      let gradientFn = null;

      if (buff.type === 'volume') {
        // Use the same color for all volume boost levels
        baseColor = VOLUME_LEVEL_COLOR_MAP[3] || baseColor; // Use Level 3 color (Gold) for all
        // Apply holographic effect for active volume boost cards
        if (buff.isActive) {
          baseColor = theme.palette.primary.main;
          gradientFn = createHolographicGradient;
        }
      } else if (buff.type === 'exchange') {
        const exchangeConfig = EXCHANGE_COLOR_CONFIG[buff.exchange] || {};
        const isHolographicExchange = exchangeConfig.variant === 'holographic';
        if (isHolographicExchange) {
          baseColor = theme.palette.primary.main;
          gradientFn = createHolographicGradient;
        } else {
          baseColor = theme.palette.text.secondary;
        }
      }

      const isExchange = buff.type === 'exchange';
      const isHolographicExchange =
        isExchange && (EXCHANGE_COLOR_CONFIG[buff.exchange]?.variant === 'holographic' || gradientFn);
      const isActiveVolumeBoost = buff.type === 'volume' && buff.isActive;

      if (isHolographicExchange || isActiveVolumeBoost) {
        const {
          '&::before': baseBefore = {},
          '&::after': baseAfter = {},
          '&:hover': baseHover = {},
          ...holoRoot
        } = isolatedHolographicStyles(theme);
        const { '&::before': hoverBefore = {}, '&::after': hoverAfter = {}, ...hoverRoot } = baseHover;
        const baseRadiusValue = (() => {
          const shapeRadius = theme.shape?.borderRadius ?? 8;
          if (typeof shapeRadius === 'number') {
            return shapeRadius * 1.05;
          }
          const parsed = Number.parseFloat(shapeRadius);
          return Number.isNaN(parsed) ? shapeRadius : `${parsed * 1.5}px`;
        })();
        // Set border radius to 2px for volume boost cards, otherwise use baseRadiusValue
        const borderRadiusValue = isActiveVolumeBoost ? 2 : baseRadiusValue;
        // Remove border for exchange cards, keep border for active volume boost cards using theme primary color
        const holoBorder = isHolographicExchange ? 'none' : `1px solid ${theme.palette.primary.main}`;
        const holoActive = {
          ...holoRoot,
          backgroundColor: isHolographicExchange
            ? theme.palette.background.paper
            : alpha(theme.palette.background.paper, 0.18),
          border: holoBorder,
          borderRadius: borderRadiusValue,
          '&::before': {
            ...baseBefore,
            borderRadius: borderRadiusValue,
          },
          '&::after': {
            ...baseAfter,
            opacity: 0.14,
            borderRadius: borderRadiusValue,
            // Add slow, continuous holographic animation for active volume boost cards
            ...(isActiveVolumeBoost
              ? {
                  animation: 'holographic-move 8s ease-in-out infinite',
                }
              : {}),
          },
          '&:hover': {
            ...hoverRoot,
          },
          '&:hover::before': hoverBefore,
          '&:hover::after': hoverAfter,
        };
        const { '&::after': holoActiveAfter = {}, ...holoActiveRoot } = holoActive;

        return {
          baseColor: theme.palette.primary.main,
          card: {
            active: holoActive,
            achieved: {
              ...holoActiveRoot,
              backgroundColor: isHolographicExchange
                ? theme.palette.background.paper
                : alpha(theme.palette.background.paper, 0.14),
              border: isHolographicExchange ? 'none' : `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
              '&::after': {
                ...holoActiveAfter,
                opacity: 0.1,
              },
            },
            inactive: {
              ...holoActiveRoot,
              backgroundColor: isHolographicExchange
                ? theme.palette.background.paper
                : alpha(theme.palette.background.paper, 0.1),
              border: isHolographicExchange ? 'none' : `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
              '&::after': {
                ...holoActiveAfter,
                opacity: 0.06,
              },
            },
          },
          icon: {
            active: theme.palette.primary.light,
            achieved: alpha(theme.palette.primary.light, 0.8),
            inactive: alpha(theme.palette.primary.light, 0.6),
          },
          multiplier: {
            active: theme.palette.primary.light,
            achieved: alpha(theme.palette.primary.light, 0.85),
            inactive: alpha(theme.palette.primary.light, 0.65),
          },
        };
      }

      const getActiveBackground = () => {
        if (gradientFn) {
          return {
            backgroundColor: 'transparent',
            backgroundImage: gradientFn(0.38, 0.26),
          };
        }
        // Use same background color for both volume and exchange boost cards
        return {
          backgroundColor: theme.palette.background.paper,
        };
      };

      const getAchievedBackground = () => {
        if (gradientFn) {
          return {
            backgroundColor: 'transparent',
            backgroundImage: gradientFn(0.28, 0.2),
          };
        }
        // Use same background color for both volume and exchange boost cards
        return {
          backgroundColor: theme.palette.background.paper,
        };
      };

      const getInactiveBackground = () => {
        if (gradientFn) {
          return {
            backgroundColor: 'transparent',
            backgroundImage: gradientFn(0.2, 0.14),
          };
        }
        // Use same background color for both volume and exchange boost cards
        return {
          backgroundColor: theme.palette.background.paper,
        };
      };

      const activeBackground = getActiveBackground();
      const achievedBackground = getAchievedBackground();
      const inactiveBackground = getInactiveBackground();

      const activeBorderAlpha = isExchange ? 0.28 : 0.46;
      const achievedBorderAlpha = isExchange ? 0.22 : 0.32;
      const inactiveBorderAlpha = isExchange ? 0.16 : 0.2;

      const iconActiveColor = isExchange ? theme.palette.text.primary : baseColor;
      const iconAchievedColor = isExchange ? alpha(theme.palette.text.primary, 0.72) : alpha(baseColor, 0.75);
      const iconInactiveColor = isExchange ? alpha(theme.palette.text.primary, 0.56) : alpha(baseColor, 0.55);

      const multiplierActiveColor = isExchange ? theme.palette.text.primary : baseColor;
      const multiplierAchievedColor = isExchange ? alpha(theme.palette.text.primary, 0.85) : alpha(baseColor, 0.82);
      const multiplierInactiveColor = isExchange ? alpha(theme.palette.text.primary, 0.65) : alpha(baseColor, 0.65);

      // For volume boost cards: active has border using theme primary color, inactive/achieved have no border; for exchange cards, remove border
      const getBorder = (borderAlpha) => {
        if (buff.type === 'volume') {
          if (buff.isActive) {
            return `1px solid ${theme.palette.primary.main}`;
          }
          return 'none';
        }
        // Remove border for exchange boost cards
        return 'none';
      };

      // Set border radius to 2px for all volume boost cards
      const volumeBorderRadius = buff.type === 'volume' ? 2 : 2;

      return {
        baseColor,
        card: {
          active: {
            ...activeBackground,
            border: getBorder(activeBorderAlpha),
            borderRadius: volumeBorderRadius,
          },
          achieved: {
            ...achievedBackground,
            border: getBorder(achievedBorderAlpha),
            borderRadius: volumeBorderRadius,
          },
          inactive: {
            ...inactiveBackground,
            border: getBorder(inactiveBorderAlpha),
            borderRadius: volumeBorderRadius,
          },
        },
        icon: {
          active: iconActiveColor,
          achieved: iconAchievedColor,
          inactive: iconInactiveColor,
        },
        multiplier: {
          active: multiplierActiveColor,
          achieved: multiplierAchievedColor,
          inactive: multiplierInactiveColor,
        },
      };
    },
    [theme]
  );

  const renderPointsTab = () => {
    return (
      <Stack direction='column' spacing={4}>
        {/* Points and Volume Section */}
        <Box>
          <Box
            aria-label='Account KPIs'
            role='region'
            sx={{
              backgroundColor: theme.palette.background.paper,
              border: 'none',
              borderRadius: 2,
              p: { xs: 2, md: 3 },
            }}
          >
            <Grid container spacing={3}>
              <Grid md={9} xs={12}>
                <PointsStatCard plain label='Total Points' value={numberWithCommas(smartRound(total_points, 2))} />
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Weekly Volume Boost (size=9) + Exchange Boosts (size=3) */}
        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
          {/* Left: Weekly Volume Boost */}
          <Grid md={9} sx={{ display: 'flex' }} xs={12}>
            <Stack direction='column' spacing={2} sx={{ width: '100%' }}>
              <Stack alignItems='center' direction='row' justifyContent='space-between'>
                <Typography sx={{ color: theme.palette.text.secondary }} variant='body1'>
                  Weekly Volume
                </Typography>
                {weekDateRange && (
                  <Stack alignItems='center' direction='row' spacing={1}>
                    <CalendarTodayIcon sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
                    <Typography sx={{ color: theme.palette.text.secondary }} variant='body3'>
                      {weekDateRange}
                    </Typography>
                  </Stack>
                )}
              </Stack>
              <Typography component='div' sx={{ display: 'flex', alignItems: 'baseline' }} variant='h4'>
                $
                {showWeeklyVolumeAnimation ? (
                  <CountUp className='' decimals={0} duration={0.2} from={0} separator=',' to={weeklyVolume} />
                ) : (
                  <Box component='span'>{formattedWeeklyVolume}</Box>
                )}
              </Typography>
              <WeeklyVolumeProgress
                disableWrapper
                showTargetLabel
                boostPercentage={currentBoostPercentage}
                current={progressData.current}
                progress={progressData.progress}
                showEndpoints={false}
                showNextBoost={!isMax}
                target={progressData.target}
              />
              {/* Level cards */}
              <Grid
                container
                spacing={3}
                sx={{
                  alignItems: 'stretch',
                  '& > .MuiGrid2-root': { display: 'flex' },
                }}
              >
                {volumeBoostCards.map((buff) => {
                  const { icon: BuffIcon, isActive, isAchieved, multiplier, description, name, type } = buff;
                  const visualTokens = getBuffVisualTokens(buff);
                  let cardStyles = visualTokens.card.inactive;
                  if (isActive) {
                    cardStyles = visualTokens.card.active;
                  } else if (isAchieved) {
                    cardStyles = visualTokens.card.achieved;
                  }
                  let keyStatus = 'inactive';
                  if (isActive) keyStatus = 'active';
                  else if (isAchieved) keyStatus = 'achieved';
                  let iconColor = visualTokens.icon.inactive;
                  if (isActive) {
                    iconColor = visualTokens.icon.active;
                  } else if (isAchieved) {
                    iconColor = visualTokens.icon.achieved;
                  }
                  let multiplierColor = visualTokens.multiplier.inactive;
                  if (isActive) {
                    multiplierColor = visualTokens.multiplier.active;
                  } else if (isAchieved) {
                    multiplierColor = visualTokens.multiplier.achieved;
                  }
                  let cardOpacity = 0.7;
                  if (isActive) {
                    cardOpacity = 1;
                  } else if (isAchieved) {
                    cardOpacity = 0.85;
                  }
                  // Use Level 3 card height as baseline for all cards
                  const cardMinHeight = BOOST_CARD_MIN_HEIGHT.volume;
                  return (
                    <Grid key={`${name}-${multiplier}-${keyStatus}`} md={4} sx={{ display: 'flex' }} xs={12}>
                      <PointsBuffCard
                        BuffIcon={BuffIcon}
                        cardOpacity={cardOpacity}
                        cardSx={cardStyles}
                        description={description}
                        iconColor={iconColor}
                        minHeight={cardMinHeight}
                        multiplier={multiplier}
                        multiplierColor={multiplierColor}
                        title={name}
                      />
                    </Grid>
                  );
                })}
              </Grid>
              <Button
                color='primary'
                href='https://docs.tread.fi/season-1-trade-earn-vote/points-program'
                rel='noopener noreferrer'
                startIcon={<MenuBookIcon fontSize='small' />}
                sx={{
                  alignSelf: 'flex-start',
                  mt: 1,
                  px: 0,
                  textTransform: 'none',
                }}
                target='_blank'
                variant='text'
              >
                Read more about point program
              </Button>
            </Stack>
          </Grid>

          {/* Right: Exchange Boosts */}
          <Grid md={3} sx={{ display: 'flex' }} xs={12}>
            <Stack direction='column' spacing={2} sx={{ width: '100%', flex: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  p: 2,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack direction='column' spacing={2}>
                  <Typography sx={{ color: theme.palette.text.secondary }} variant='body1'>
                    Exchange Boosts
                  </Typography>
                  {exchangeBoosts.map((buff) => {
                    const { exchange, name, multiplier } = buff;
                    const ExchangeIcon = ExchangeIcons[exchange];
                    const visualTokens = getBuffVisualTokens({ ...buff, type: 'exchange' });
                    // Remove all background-related styles and pseudo-elements from cardStyles for exchange boost cards
                    const {
                      backgroundColor,
                      backgroundImage,
                      background,
                      '&::before': beforeStyles,
                      '&::after': afterStyles,
                      '&:hover': hoverStyles,
                      '&:hover::before': hoverBeforeStyles,
                      '&:hover::after': hoverAfterStyles,
                      ...cardStylesWithoutBg
                    } = visualTokens.card.active;
                    return (
                      <Box key={`${exchange}-${multiplier}`}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            textAlign: 'left',
                            gap: 1,
                          }}
                        >
                          <Stack
                            alignItems='center'
                            direction='row'
                            justifyContent='space-between'
                            spacing={2}
                            sx={{ width: '100%' }}
                          >
                            <Stack alignItems='center' direction='row' spacing={2}>
                              {ExchangeIcon && (
                                <Box
                                  alt={exchange}
                                  component='img'
                                  src={ExchangeIcon}
                                  sx={{
                                    flexShrink: 0,
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                  }}
                                />
                              )}
                              <Typography variant='subtitle1'>{name}</Typography>
                            </Stack>
                            {multiplier && (
                              <Typography
                                sx={{
                                  color: visualTokens.multiplier.active,
                                  flexShrink: 0,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                                variant='body1'
                              >
                                {multiplier}
                              </Typography>
                            )}
                          </Stack>
                          <Typography sx={{ color: theme.palette.text.secondary }} variant='body2'>
                            Exchange boost
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
        {renderHistorySection()}
      </Stack>
    );
  };

  const renderLeaderboardTab = () => <PointsLeaderboardTab />;

  const renderVoteTab = () => {
    return <VotingTab userPoints={total_points} />;
  };

  const renderFaultyTerminalBackground = useCallback(
    () => (
      <FaultyTerminal
        pageLoadAnimation
        brightness={0.18}
        chromaticAberration={0}
        className='points-faulty-terminal'
        curvature={0}
        digitSize={1.2}
        dither={0}
        flickerAmount={1}
        glitchAmount={1}
        gridMul={[2, 1]}
        mouseReact={false}
        mouseStrength={0.5}
        noiseAmp={1}
        pause={false}
        resolutionScale={0.75}
        scale={1.4}
        scanlineIntensity={0.65}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundColor: alpha(theme.palette.common.black, 0.92),
          backdropFilter: 'blur(6px)',
        }}
        targetFPS={30}
        timeScale={0.18}
        tint='#ff8a00'
      />
    ),
    [theme]
  );

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes holographic-move': {
            '0%': {
              backgroundPosition: '0% 50%',
            },
            '50%': {
              backgroundPosition: '100% 50%',
            },
            '100%': {
              backgroundPosition: '0% 50%',
            },
          },
        }}
      />
      <BackgroundAnimationWrapper
        isFeatureEnabled
        renderBackground={renderFaultyTerminalBackground}
        showAnimation={showAnimation}
      />
      <Container
        maxWidth='lg'
        sx={{
          my: 4,
          px: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: 'background.container',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <PointsLoadingMask open={pointsDataLoading} />
          <Stack direction='column' spacing={3} sx={{ p: { xs: 3, md: 4 } }}>
            {/* Tab Navigation */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 0,
              }}
            >
              <Tabs
                aria-label='Points Season 1 tabs'
                sx={{
                  minHeight: 'auto',
                  '& .MuiTab-root': {
                    color: theme.palette.text.secondary,
                    minHeight: 'auto',
                    padding: '12px 16px',
                  },
                  '& .Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
              >
                <Tab label='Points' />
                <Tab label='Leaderboard' />
                {isVotingEnabled && <Tab label='Vote' />}
              </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && renderPointsTab()}
            {activeTab === 1 && renderLeaderboardTab()}
            {isVotingEnabled && activeTab === 2 && renderVoteTab()}
          </Stack>
        </Paper>
      </Container>
      {/* Desktop: fixed positioning at bottom-right corner */}
      {isDesktop && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 2000,
            pointerEvents: 'auto',
          }}
        >
          <BackgroundToggle showAnimation={showAnimation} onToggle={setShowAnimation} />
        </Box>
      )}
    </>
  );
}

export default PointsPageSeason1;
