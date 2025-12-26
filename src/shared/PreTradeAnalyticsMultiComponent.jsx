import { theme } from '@/theme/theme';
import { Box, Stack, Paper, Skeleton } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import Typography from '@mui/material/Typography';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { StyledIBMTypography } from './orderTable/util';

function PreTradeAnalyticsCard({ children }) {
  return (
    <Paper
      elevation={1}
      sx={{
        boxSizing: 'border-box',
        p: 2,
        height: '100%',
      }}
    >
      {children}
    </Paper>
  );
}

function MarketVolumeNA() {
  return (
    <Stack flexDirection='column' justifyContent='space-between' minHeight='40px' spacing={0.5}>
      <Box sx={{ padding: '8px' }}>
        <Box>
          <TreadTooltip
            labelTextVariant='subtitle1'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the aggregated market activity across this leg over the past 24 hours relative to expected
                  seasonal volume.
                </Typography>
                <Typography>Market volume data not available.</Typography>
              </div>
            }
            variant='market_volume'
          />
        </Box>
        <Box alignItems='center' display='flex' justifyContent='space-between'>
          <Typography
            sx={{
              fontWeight: 600,
              textDecorationColor: 'rgba(255,255,255,0.5)',
            }}
            variant='subtitle2'
          >
            N/A
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

function MarketVolumeData({ color, tag, message, marketVolume }) {
  return (
    <Stack flexDirection='column' justifyContent='space-between' minHeight='40px' spacing={0.5}>
      <Box sx={{ padding: '8px' }}>
        <Box>
          <TreadTooltip
            labelTextVariant='subtitle1'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the aggregated market activity across this leg over the past 24 hours relative to expected
                  seasonal volume.
                </Typography>
                <Typography>{message}</Typography>
              </div>
            }
            variant='market_volume'
          />
        </Box>
        <Box alignItems='center' display='flex' justifyContent='space-between'>
          {marketVolume !== null ? (
            <Typography
              color={color}
              style={{
                fontWeight: 600,
              }}
              variant='subtitle2'
            >
              {tag} {Number(marketVolume).toFixed(2)}x
            </Typography>
          ) : (
            <Typography
              sx={{
                fontWeight: 600,
                textDecorationColor: 'rgba(255,255,255,0.5)',
              }}
              variant='subtitle2'
            >
              N/A
            </Typography>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

function ParticipationRate({ buyAnalytics, sellAnalytics }) {
  const generateGuideline = () => {
    const buyPov = buyAnalytics?.pov || null;
    const sellPov = sellAnalytics?.pov || null;

    if (buyPov === null && sellPov === null) {
      return 'Fill in valid order parameters to see analytics.';
    }

    const displayPov = buyPov !== null ? buyPov : sellPov;

    if (displayPov < 0.5) {
      return 'Minimum impact expected.';
    }
    if (displayPov < 1) {
      return 'Moderate impact expected, consider increasing duration or adding more venues.';
    }

    return 'High impact expected, increasing duration and adding more venues is recommended.';
  };

  return (
    <Stack flexDirection='column' justifyContent='space-between' minHeight='40px' spacing={0.5}>
      <Box sx={{ padding: '8px' }}>
        <Box>
          <TreadTooltip
            labelTextVariant='subtitle1'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the proportion of the predicted market volume your order is expected to take up during its
                  duration across your pairs aggregated for this leg.
                </Typography>
                <Typography>{generateGuideline()}</Typography>
              </div>
            }
            variant='participation_rate'
          />
        </Box>
        <Box alignItems='center' display='flex' justifyContent='space-between'>
          <Typography
            sx={{
              fontWeight: 600,
              textDecorationColor: 'rgba(255,255,255,0.5)',
              color: (() => {
                const participationRate = buyAnalytics.pov || sellAnalytics.pov;
                if (!participationRate) {
                  return theme.palette.text.primary;
                }
                if (participationRate < 0.5) {
                  return theme.palette.success.main;
                }
                if (participationRate < 1) {
                  return theme.palette.warning.main;
                }
                return theme.palette.error.main;
              })(),
            }}
            variant='subtitle2'
          >
            {buyAnalytics.pov || sellAnalytics.pov ? `${(buyAnalytics.pov || sellAnalytics.pov).toFixed(4)}%` : 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

function MarketVolatility({ buyAnalytics, sellAnalytics }) {
  return (
    <Stack flexDirection='column' justifyContent='space-between' minHeight='40px' spacing={0.5}>
      <Box sx={{ padding: '8px' }}>
        <Box>
          <TreadTooltip
            labelTextVariant='subtitle1'
            placement='top'
            title={
              <div>
                <Typography>
                  Shows the expected price movement during the order, calculated as a notional-weighted average of
                  realized volatility across all orders in this leg.
                </Typography>
              </div>
            }
            variant='market_volatility'
          />
        </Box>
        <Box alignItems='center' display='flex' justifyContent='space-between'>
          <Typography
            sx={{
              textDecorationColor: 'rgba(255,255,255,0.5)',
            }}
            variant='subtitle2'
          >
            &plusmn;
            {buyAnalytics.volatility || sellAnalytics.volatility
              ? `${(buyAnalytics.volatility || sellAnalytics.volatility).toFixed(4)}%`
              : 'N/A%'}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

function MarketVolume({ buyAnalytics, sellAnalytics }) {
  const buyMarketVolume = buyAnalytics?.market_volume || null;
  const sellMarketVolume = sellAnalytics?.market_volume || null;

  const marketVolume = buyMarketVolume !== null ? buyMarketVolume : sellMarketVolume;

  let message = '';
  let color = '';
  let tag = '';

  if (marketVolume < 0.5) {
    message = 'Market volume is much lower than expected, trades may experience higher impact.';
    color = theme.palette.error.main;
    tag = 'Low';
  } else if (marketVolume < 0.75) {
    message = 'Market volume is lower than expected.';
    color = theme.palette.warning.main;
    tag = 'Below Average';
  } else if (marketVolume < 1) {
    message = 'Market volume is as expected.';
    color = theme.palette.text.primary;
    tag = 'Normal';
  } else if (marketVolume < 1.5) {
    message = 'Market volume is elevated, favorable market conditions.';
    color = theme.palette.success.main;
    tag = 'Above Average';
  } else {
    message =
      'Market volume is very elevated, favorable market conditions to trade quickly, ' +
      'but be mindful of volatility.';
    color = theme.palette.success.main;
    tag = 'High';
  }
  if (marketVolume === null) {
    return (
      <PreTradeAnalyticsCard>
        <MarketVolumeNA />
      </PreTradeAnalyticsCard>
    );
  }
  return (
    <PreTradeAnalyticsCard>
      <MarketVolumeData color={color} marketVolume={marketVolume} message={message} tag={tag} />
    </PreTradeAnalyticsCard>
  );
}

function RenderUnavailablePOVAnalytics({ dataUnavailableMessage }) {
  return (
    <Stack flexDirection='column' justifyContent='space-between' minHeight='40px' spacing={0.5}>
      <Box sx={{ padding: '8px' }}>
        <Box>
          <TreadTooltip
            labelTextVariant='subtitle1'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the proportion of the predicted market volume your order is expected to take up during its
                  duration across your pairs aggregated for this leg.
                </Typography>
                <Typography>{dataUnavailableMessage()}</Typography>
              </div>
            }
            variant='participation_rate'
          />
        </Box>
        <Box alignItems='center' display='flex' justifyContent='space-between'>
          <Typography
            sx={{
              fontWeight: 600,
              textDecorationColor: 'rgba(255,255,255,0.5)',
            }}
            variant='subtitle2'
          >
            N/A
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

function RenderUnavailableVolatilityAnalytics() {
  return (
    <Stack flexDirection='column' justifyContent='space-between' minHeight='40px' spacing={0.5}>
      <Box sx={{ padding: '8px' }}>
        <Box>
          <TreadTooltip
            labelTextVariant='subtitle1'
            placement='top'
            title={
              <div>
                <Typography>
                  Shows the expected price movement during the order, calculated as a notional-weighted average of
                  realized volatility across all orders in this leg.
                </Typography>
              </div>
            }
            variant='market_volatility'
          />
        </Box>
        <Box alignItems='center' display='flex' justifyContent='space-between'>
          <Typography
            sx={{
              fontWeight: 600,
              textDecorationColor: 'rgba(255,255,255,0.5)',
            }}
            variant='subtitle2'
          >
            N/A
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

function RenderUnavailableVolumeAnalytics({ dataUnavailableMessage }) {
  return (
    <Stack flexDirection='column' justifyContent='space-between' minHeight='40px' spacing={0.5}>
      <Box sx={{ padding: '8px' }}>
        <Box>
          <TreadTooltip
            labelTextVariant='subtitle1'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the aggregated market activity across this leg over the past 24 hours relative to expected
                  seasonal volume.
                </Typography>
                <Typography>{dataUnavailableMessage()}</Typography>
              </div>
            }
            variant='market_volume'
          />
        </Box>
        <Box alignItems='center' display='flex' justifyContent='space-between'>
          <Typography
            sx={{
              fontWeight: 600,
              textDecorationColor: 'rgba(255,255,255,0.5)',
            }}
            variant='subtitle2'
          >
            N/A
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

function getImpactMessage(participationRate) {
  if (participationRate < 0.5) {
    return 'Minimum impact expected.';
  }
  if (participationRate < 1) {
    return 'Moderate impact expected, consider increasing duration or adding more venues.';
  }
  return 'High impact expected, increasing duration and adding more venues is recommended.';
}

function getMarketVolumeMessage(marketVolume) {
  if (marketVolume < 0.5) {
    return 'Market volume is much lower than expected, trades may experience higher impact.';
  }
  if (marketVolume < 0.75) {
    return 'Market volume is lower than expected.';
  }
  if (marketVolume < 1) {
    return 'Market volume is as expected.';
  }
  if (marketVolume < 1.5) {
    return 'Market volume is elevated, favorable market conditions.';
  }
  return 'Market volume is very elevated, favorable market conditions to trade quickly, but be mindful of volatility.';
}

function PreTradeAnalyticsMultiComponent({
  buyData,
  sellData,
  loading,
  dataError,
  side,
  buyOrderItems,
  sellOrderItems,
}) {
  const buyAnalytics = buyData || {};
  const sellAnalytics = sellData || {};
  const isBuyDataAvailable = buyData && Object.keys(buyData).length > 0;
  const isSellDataAvailable = sellData && Object.keys(sellData).length > 0;
  const isDataAvailable = isBuyDataAvailable || isSellDataAvailable;

  const renderOrderSummary = () => {
    const title = side === 'buy' ? 'Long Summary' : 'Short Summary';
    const orderItems = side === 'buy' ? buyOrderItems : sellOrderItems;
    const orderCount = orderItems?.length || 0;

    // Calculate total notional by summing up all order rows
    const totalNotional =
      orderItems?.reduce((sum, item) => {
        if (item.qty && item.pair?.price) {
          const qty = Number(item.qty);
          if (!item.isBaseAsset) {
            return sum + qty;
          }

          const price = Number(item.pair.price);
          if (!Number.isNaN(qty) && !Number.isNaN(price)) {
            return sum + qty * price;
          }
        }
        return sum;
      }, 0) || 0;

    // Format the notional value with 2 decimal places
    const formattedNotional = totalNotional.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <Stack flexDirection='column' spacing={1}>
        <Typography
          sx={{
            color: side === 'buy' ? theme.palette.success.main : theme.palette.error.main,
          }}
          variant='subtitle1'
        >
          {title}
        </Typography>
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='body2'>Total Orders</Typography>
          <StyledIBMTypography variant='body2'>{orderCount}</StyledIBMTypography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <Typography variant='body2'>Total Notional</Typography>
          <StyledIBMTypography variant='body2'>${formattedNotional}</StyledIBMTypography>
        </Box>
      </Stack>
    );
  };

  const renderPreTradeAnalytics = () => {
    if (loading) {
      return (
        <Stack flexDirection='column' spacing={1}>
          <Typography variant='subtitle1'>Pre-Trade Analytics</Typography>
          <Box display='flex' justifyContent='space-between'>
            <TreadTooltip
              labelTextVariant='body2'
              placement='top'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows the proportion of the predicted market volume your order is expected to take up during its
                    duration across your pairs aggregated for this leg.
                  </Typography>
                </div>
              }
              variant='participation_rate'
            />
            <Box alignItems='center' display='flex' width={80}>
              <Skeleton height={16} variant='rectangular' width='100%' />
            </Box>
          </Box>
          <Box display='flex' justifyContent='space-between'>
            <TreadTooltip
              labelTextVariant='body2'
              placement='top'
              title={
                <div>
                  <Typography>
                    Shows the expected price movement during the order, calculated as a notional-weighted average of
                    realized volatility across all orders in this leg.
                  </Typography>
                </div>
              }
              variant='market_volatility'
            />
            <Box alignItems='center' display='flex' width={80}>
              <Skeleton height={16} variant='rectangular' width='100%' />
            </Box>
          </Box>
          <Box display='flex' justifyContent='space-between'>
            <TreadTooltip
              labelTextVariant='body2'
              placement='top'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows the aggregated market activity across this leg over the past 24 hours relative to expected
                    seasonal volume.
                  </Typography>
                </div>
              }
              variant='market_volume'
            />
            <Box alignItems='center' display='flex' width={80}>
              <Skeleton height={16} variant='rectangular' width='100%' />
            </Box>
          </Box>
        </Stack>
      );
    }

    const dataUnavailableMessage = () => {
      if (dataError) {
        return 'Market data unavailable for selected exchange and pair.';
      }
      return 'Input a valid order to view pre-trade analytics.';
    };

    if (!isDataAvailable) {
      return (
        <Stack flexDirection='column' spacing={1}>
          <Typography variant='subtitle1'>Pre-Trade Analytics</Typography>
          <Box display='flex' justifyContent='space-between'>
            <TreadTooltip
              labelTextVariant='body2'
              placement='top'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows the proportion of the predicted market volume your order is expected to take up during its
                    duration across your pairs aggregated for this leg.
                  </Typography>
                  <Typography>{dataUnavailableMessage()}</Typography>
                </div>
              }
              variant='participation_rate'
            />
            <Box alignItems='center' display='flex' width={80}>
              <Skeleton height={16} variant='rectangular' width='100%' />
            </Box>
          </Box>
          <Box display='flex' justifyContent='space-between'>
            <TreadTooltip
              labelTextVariant='body2'
              placement='top'
              title={
                <div>
                  <Typography>
                    Shows the expected price movement during the order, calculated as a notional-weighted average of
                    realized volatility across all orders in this leg.
                  </Typography>
                </div>
              }
              variant='market_volatility'
            />
            <Box alignItems='center' display='flex' width={80}>
              <Skeleton height={16} variant='rectangular' width='100%' />
            </Box>
          </Box>
          <Box display='flex' justifyContent='space-between'>
            <TreadTooltip
              labelTextVariant='body2'
              placement='top'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows the aggregated market activity across this leg over the past 24 hours relative to expected
                    seasonal volume.
                  </Typography>
                  <Typography>{dataUnavailableMessage()}</Typography>
                </div>
              }
              variant='market_volume'
            />
            <Box alignItems='center' display='flex' width={80}>
              <Skeleton height={16} variant='rectangular' width='100%' />
            </Box>
          </Box>
        </Stack>
      );
    }

    const participationRate = buyAnalytics.pov || sellAnalytics.pov;
    const volatility = buyAnalytics.volatility || sellAnalytics.volatility;
    const marketVolume = buyAnalytics.market_volume || sellAnalytics.market_volume;

    let povColor = theme.palette.text.primary;
    if (participationRate < 0.5) {
      povColor = theme.palette.success.main;
    } else if (participationRate < 1) {
      povColor = theme.palette.warning.main;
    } else {
      povColor = theme.palette.error.main;
    }

    let marketVolumeColor = theme.palette.text.primary;
    let marketVolumeTag = '';
    if (marketVolume < 0.5) {
      marketVolumeColor = theme.palette.error.main;
      marketVolumeTag = 'Low';
    } else if (marketVolume < 0.75) {
      marketVolumeColor = theme.palette.warning.main;
      marketVolumeTag = 'Below Average';
    } else if (marketVolume < 1) {
      marketVolumeColor = theme.palette.text.primary;
      marketVolumeTag = 'Normal';
    } else if (marketVolume < 1.5) {
      marketVolumeColor = theme.palette.success.main;
      marketVolumeTag = 'Above Average';
    } else {
      marketVolumeColor = theme.palette.success.main;
      marketVolumeTag = 'High';
    }

    return (
      <Stack flexDirection='column' spacing={1}>
        <Typography variant='subtitle1'>Pre-Trade Analytics</Typography>
        <Box display='flex' justifyContent='space-between'>
          <TreadTooltip
            labelTextVariant='body2'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the proportion of the predicted market volume your order is expected to take up during its
                  duration across your pairs aggregated for this leg.
                </Typography>
                <Typography>{getImpactMessage(participationRate)}</Typography>
              </div>
            }
            variant='participation_rate'
          />
          <StyledIBMTypography color={povColor} variant='body2'>
            {participationRate ? `${participationRate.toFixed(4)}%` : 'N/A'}
          </StyledIBMTypography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <TreadTooltip
            labelTextVariant='body2'
            placement='top'
            title={
              <div>
                <Typography>
                  Shows the expected price movement during the order, calculated as a notional-weighted average of
                  realized volatility across all orders in this leg.
                </Typography>
              </div>
            }
            variant='market_volatility'
          />
          <StyledIBMTypography variant='body2'>
            &plusmn;{volatility ? `${volatility.toFixed(4)}%` : 'N/A'}
          </StyledIBMTypography>
        </Box>
        <Box display='flex' justifyContent='space-between'>
          <TreadTooltip
            labelTextVariant='body2'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the aggregated market activity across this leg over the past 24 hours relative to expected
                  seasonal volume.
                </Typography>
                <Typography>{getMarketVolumeMessage(marketVolume)}</Typography>
              </div>
            }
            variant='market_volume'
          />
          <StyledIBMTypography color={marketVolumeColor} variant='body2'>
            {marketVolume ? `${marketVolumeTag} ${marketVolume.toFixed(2)}x` : 'N/A'}
          </StyledIBMTypography>
        </Box>
      </Stack>
    );
  };

  return (
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <PreTradeAnalyticsCard>{renderOrderSummary()}</PreTradeAnalyticsCard>
      </Grid>
      <Grid item xs={6}>
        <PreTradeAnalyticsCard>{renderPreTradeAnalytics()}</PreTradeAnalyticsCard>
      </Grid>
    </Grid>
  );
}

export default PreTradeAnalyticsMultiComponent;
