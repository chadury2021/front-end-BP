import React from 'react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { smartRound } from '@/util';

function AutoOrderExplanationHeader({ orderParams }) {
  const theme = useTheme();
  const { side, qty, pair, urgency, duration, strategy, pov, volatility } = orderParams;

  const sideQtyPairText = (
    <span
      style={{
        color: side === 'buy' ? theme.palette.success.main : theme.palette.error.main,
        fontWeight: '700',
      }}
    >
      {side} {smartRound(qty)} {pair}
    </span>
  );

  const urgencyText = (
    <span
      style={{
        color: theme.palette.orderUrgency[urgency?.key],
        fontWeight: '700',
        textDecoration: 'underline',
      }}
    >
      {urgency?.name.toLowerCase()}
    </span>
  );

  if (['Market', 'IOC'].includes(strategy)) {
    return (
      <Typography>
        To {sideQtyPairText} with a {urgencyText} urgency, the best strategy is to execute the order as a market order.
      </Typography>
    );
  }

  const durationText = (
    <span style={{ color: theme.palette.blue[400], fontWeight: '700' }}>{smartRound(duration / 60, 2)} minute(s)</span>
  );

  const strategyText = <span style={{ color: theme.palette.blue[400], fontWeight: '700' }}>{strategy} strategy</span>;

  let povColor;
  if (pov < 0.5) {
    povColor = theme.palette.success.main;
  } else if (pov < 1) {
    povColor = theme.palette.warning.main;
  } else {
    povColor = theme.palette.error.main;
  }
  const povText = <span style={{ color: povColor, fontWeight: '700' }}>{smartRound(pov)}%</span>;

  const volatilityText = <span style={{ fontWeight: '700' }}>±{smartRound(volatility)}%</span>;

  return (
    <Typography>
      To {sideQtyPairText} with a {urgencyText} urgency, the best strategy is to execute your trade over {durationText}{' '}
      with our {strategyText}. Over this duration, you will be {povText} of the market volume. With the current market
      volatility, you can expect {volatilityText} of price movement without considering slippage.
    </Typography>
  );
}

function AutoOrderExplanationMarketOut() {
  return (
    <Typography>
      Sending the order out as a market order is the best available strategy because the quantity is not expected to
      cause oversized slippage and market orders will ensure consistent results.
    </Typography>
  );
}

function AutoOrderExplanationUltraLowDetail({ orderParams }) {
  const theme = useTheme();
  const { duration } = orderParams;
  const durationText = (
    <span style={{ color: theme.palette.blue[400], fontWeight: '700' }}>{smartRound(duration / 60, 2)} minute(s)</span>
  );

  const povText = <span style={{ color: theme.palette.error.main, fontWeight: '700' }}>1% of the market volume</span>;
  return (
    <Typography>
      The trading engine will only aim to act as a maker, such that the order can be roughly {povText}. The order should
      take roughly {durationText}, but there is no guaranteed execution duration and the engine will continue to work
      the order until complete. The limit orders will be placed at multiple levels throughout the book.
    </Typography>
  );
}

function AutoOrderExplanationLowDetail({ orderParams }) {
  const theme = useTheme();
  const { duration } = orderParams;
  const durationText = (
    <span style={{ color: theme.palette.blue[400], fontWeight: '700' }}>{smartRound(duration / 60, 2)} minute(s)</span>
  );

  const povText = <span style={{ color: theme.palette.error.main, fontWeight: '700' }}>1% of the market volume</span>;
  return (
    <Typography>
      This is our Impact Minimization strategy with a duration of {durationText} calculated so the order can be roughly{' '}
      {povText}. By utilizing a VWAP schedule, the trading engine optimizes to minimize variances in trading speed for
      minimal market impact. Limit orders may be placed a few levels deeper in the book to allow for micro price
      improvements.
    </Typography>
  );
}

function AutoOrderExplanationMediumDetail({ orderParams }) {
  const theme = useTheme();
  const { duration } = orderParams;
  const durationText = (
    <span style={{ color: theme.palette.blue[400], fontWeight: '700' }}>{smartRound(duration / 60, 2)} minute(s)</span>
  );

  const povText = <span style={{ color: theme.palette.error.main, fontWeight: '700' }}>2.5% of the market volume</span>;
  return (
    <Typography>
      This is our Impact Minimization strategy with a duration of {durationText} calculated so the order can be roughly{' '}
      {povText}. By utilizing a VWAP schedule, the trading engine optimizes to minimize variances in trading speed for
      minimal market impact.
    </Typography>
  );
}

function AutoOrderExplanationHighDetail() {
  return (
    <Typography>
      The trading engine will rely on a front-loaded VWAP, trading at a faster speed at the beginning of the order and
      sending passive limit orders to take advantage of the price reversion.
    </Typography>
  );
}

function AutoOrderExplanationUltraHighDetail({ orderParams }) {
  const theme = useTheme();
  const { duration } = orderParams;
  const durationText = (
    <span style={{ color: theme.palette.blue[400], fontWeight: '700' }}>{smartRound(duration / 120, 2)} minute(s)</span>
  );
  return (
    <Typography>
      The trading engine will use a combination of maker and taker orders to execute your order as soon as possible,
      aiming to get as much quantity executed in the first {durationText} of the order. The engine will aim to place
      limit orders at the top of the book before relying on market orders.
    </Typography>
  );
}

const AutoOrderExplanationVariant = {
  header: AutoOrderExplanationHeader,
  market_out: AutoOrderExplanationMarketOut,
  ultra_low_detail: AutoOrderExplanationUltraLowDetail,
  low_detail: AutoOrderExplanationLowDetail,
  medium_detail: AutoOrderExplanationMediumDetail,
  high_detail: AutoOrderExplanationHighDetail,
  ultra_high_detail: AutoOrderExplanationUltraHighDetail,
};

function AutoOrderExplanation({ variant, orderParams }) {
  if (!(variant in AutoOrderExplanationVariant)) {
    throw new Error(`Variant [${variant}] not supported for AutoOrderExplanation`);
  }
  const ExplanationVariantComponent = AutoOrderExplanationVariant[variant];
  return <ExplanationVariantComponent orderParams={orderParams} />;
}

export default AutoOrderExplanation;
