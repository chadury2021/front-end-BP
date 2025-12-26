import { Paper, Stack, Typography } from '@mui/material';
import { memo } from 'react';
import { Analytics, WarningAmber } from '@mui/icons-material';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { StyledIBMTypography } from '@/shared/orderTable/util';

const AggregatePreTradeAnalytics = memo(
  ({ buyData, sellData, buyOrderItems, sellOrderItems, theme, hasBalanceShortfall = false }) => {
  const buyAnalytics = buyData || {};
  const sellAnalytics = sellData || {};
  const isBuyDataAvailable = buyData && Object.keys(buyData).length > 0;
  const isSellDataAvailable = sellData && Object.keys(sellData).length > 0;
  const isDataAvailable = isBuyDataAvailable || isSellDataAvailable;

  const calculateTotalNotional = (orderItems) => {
    return (
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
      }, 0) || 0
    );
  };

  const totalBuyNotional = calculateTotalNotional(buyOrderItems);
  const totalSellNotional = calculateTotalNotional(sellOrderItems);
  const netNotional = totalBuyNotional - totalSellNotional;

  const getAggregatePov = () => {
    if (!isDataAvailable) return null;
    const buyPov = buyAnalytics.pov || 0;
    const sellPov = sellAnalytics.pov || 0;

    if (totalBuyNotional === 0 && totalSellNotional === 0) return 0;
    if (totalBuyNotional === 0) return sellPov;
    if (totalSellNotional === 0) return buyPov;

    const totalNotional = totalBuyNotional + totalSellNotional;
    return (buyPov * totalBuyNotional + sellPov * totalSellNotional) / totalNotional;
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

  const getNetNotionalColor = (value) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  const showDirectionalRiskWarning = hasBalanceShortfall && Math.abs(netNotional) > 1;

  return (
    <Paper elevation={1} sx={{ py: 1, px: 2 }}>
      <Stack direction='column' spacing={1}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Analytics sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant='body1'>Pre-Trade Analytics</Typography>
        </Stack>

        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <Typography variant='body1'>Net Notional</Typography>
          <Typography color={getNetNotionalColor(netNotional)} variant='body1'>
            $
            {netNotional.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Stack>

        {showDirectionalRiskWarning && (
          <Stack alignItems='center' direction='row' spacing={0.5}>
            <WarningAmber color='warning' fontSize='small' />
            <Typography color='warning.main' variant='caption'>
              The resulting order will be imbalanced and exposed to directional risk.
            </Typography>
          </Stack>
        )}

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
  }
);

AggregatePreTradeAnalytics.displayName = 'AggregatePreTradeAnalytics';

export default AggregatePreTradeAnalytics;
