import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { memo } from 'react';
import { Analytics } from '@mui/icons-material';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { StyledIBMTypography } from '@/shared/orderTable/util';

const YieldPreTradeAnalytics = memo(({ buyData, sellData, buyOrderItems, sellOrderItems, theme }) => {
  const buyAnalytics = buyData || {};
  const sellAnalytics = sellData || {};
  const isBuyDataAvailable = buyData && Object.keys(buyData).length > 0;
  const isSellDataAvailable = sellData && Object.keys(sellData).length > 0;
  const isDataAvailable = isBuyDataAvailable || isSellDataAvailable;

  const getAggregatePov = () => {
    if (!isDataAvailable) return null;
    const buyPov = buyAnalytics.pov || 0;
    const sellPov = sellAnalytics.pov || 0;

    // For yield strategies, we typically want to show the higher POV as the limiting factor
    return Math.max(buyPov, sellPov);
  };

  const aggregatePov = getAggregatePov();

  const generatePredictedPov = () => {
    if (aggregatePov === null || aggregatePov === undefined) {
      return <Typography style={{ display: 'inline' }}>-</Typography>;
    }
    let color;

    if (aggregatePov < 0.5) {
      color = theme.palette.success.main;
    } else if (aggregatePov < 1) {
      color = theme.palette.warning.main;
    } else {
      color = theme.palette.error.main;
    }

    return (
      <StyledIBMTypography color={color} style={{ display: 'inline' }}>
        {aggregatePov !== null ? Number(aggregatePov).toFixed(4) : '-'}%
      </StyledIBMTypography>
    );
  };

  const generateGuideline = () => {
    if (aggregatePov === null || aggregatePov === undefined) {
      return 'Fill in valid order parameters to see analytics.';
    }

    if (aggregatePov < 0.5) {
      return 'Minimum impact expected.';
    }
    if (aggregatePov < 1) {
      return 'Moderate impact expected, consider increasing duration or adding more venues.';
    }

    return 'High impact expected, increasing duration and adding more venues is recommended.';
  };

  return (
    <Paper elevation={1} sx={{ py: 1, px: 2 }}>
      <Stack direction='column' spacing={1}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Analytics sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant='body1'>Pre-Trade Analytics</Typography>
        </Stack>

        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <TreadTooltip
            labelTextVariant='body1'
            placement='top'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the proportion of the predicted market volume your order is expected to take up during its
                  duration.
                </Typography>
                <Typography>{generateGuideline()}</Typography>
              </div>
            }
            variant='participation_rate'
          />
          {generatePredictedPov()}
        </Stack>
      </Stack>
    </Paper>
  );
});

YieldPreTradeAnalytics.displayName = 'YieldPreTradeAnalytics';

export default YieldPreTradeAnalytics;
