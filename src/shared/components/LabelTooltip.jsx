import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const dottedUnderlineStyle = {
  textDecoration: 'underline dotted',
  textDecorationColor: 'var(--text-disabled)',
  textDecorationThickness: '2px',
  textUnderlineOffset: '3px',
  color: 'inherit',
};

function LabelTooltip({
  label,
  link = undefined,
  labelTextVariant = 'body1',
  color = 'text.secondary',
  underline = true,
  ...tooltipProps
}) {
  return (
    <Tooltip {...tooltipProps}>
      {link ? (
        <a
          href={link}
          rel='noopener noreferrer'
          style={underline ? dottedUnderlineStyle : { color: 'inherit', textDecoration: 'none' }}
          target='_blank'
        >
          <Typography color={color} variant={labelTextVariant}>
            {label}
          </Typography>
        </a>
      ) : (
        <Typography color={color} style={underline ? dottedUnderlineStyle : undefined} variant={labelTextVariant}>
          {label}
        </Typography>
      )}
    </Tooltip>
  );
}

export const TreadTooltipVariant = {
  passiveness: {
    text: 'Passiveness',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/passiveness',
    definition:
      'Measure of how passive the engine placements should be (0-1). A higher passiveness will result in deeper quotes in the limit order book.',
  },
  discretion: {
    text: 'Discretion',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/discretion',
    definition:
      'Measure of how much discretion to give to the engine when tracking the benchmark. A higher discretion may result in more passive limit order fills at the cost of more variance in benchmark tracking.',
  },
  alpha_tilt: {
    text: 'Alpha Tilt',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/alpha-tilt',
    definition:
      'Control the skew in order distribution over time to either front-load or back-load your execution schedule.',
  },
  directional_bias: {
    text: 'Directional Bias',
    link: '',
    definition:
      'Run the bot with a bias towards long or short price action for a higher chance at a profitable PnL. The bot will buy more earlier than sell for long bias and vice versa, while keeping the exposure reasonably balanced.',
  },
  max_otc_percentage: {
    text: 'Max OTC Percentage',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/max-otc-percentage',
    definition:
      'The engine will execute as much as Max OTC Percentage of the order via RFQs, if RFQ-capable accounts are selected for the order.',
  },
  exposure_tolerance: {
    text: 'Exposure Tolerance',
    link: 'https://tread-labs.gitbook.io/api-docs/multi-spread-orders/exposure-tolerance',
    definition:
      'Threshold for spread between buy and sell to slowing down or speeding up a leg when exceeded (relative to order notional).',
  },
  passive_only: {
    text: 'Passive Only',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/passive-only',
    definition: 'The engine will only post passive limit orders.',
  },
  active_limit: {
    text: 'Active Limit',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/active-limit',
    definition: 'This causes limit orders to be repegged every second based on passiveness.',
  },
  reduce_only: {
    text: 'Reduce Only',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/reduce-only',
    definition: 'The engine will only reduce a position. Note that Reduce Only is not available on OKX.',
  },
  strict_duration: {
    text: 'Strict Duration',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/strict-duration',
    definition:
      'The engine will stop execution at the end time set at order submission, regardless of whether the full target quantity has been executed.',
  },
  spot_leverage: {
    text: 'Spot Leverage',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/spot-leverage',
    definition: 'Spot margin trading for relevant exchanges (Bybit, Binance PM, Gate).',
  },
  dicy: {
    text: 'Dicy',
    link: 'https://tread-labs.gitbook.io/api-docs/dicy',
    definition: 'Enables DiCy execution logic.',
  },
  strategy_parameters: {
    text: 'Strategy Parameters',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings',
  },
  duration: {
    text: 'Duration',
    link: 'https://tread-labs.gitbook.io/api-docs/submitting-orders',
  },
  dynamic_limit_spread: {
    text: 'Dynamic Limit Spread',
    link: 'https://tread-labs.gitbook.io/api-docs/multi-spread-orders/dynamic-limit-spread',
    definition:
      'The dynamic limit spread is the minimum difference in price (sell leg minus buy leg) at which orders will be placed in their respective limit order books.',
  },
  market_maker_budget: {
    text: 'Budget',
    definition: 'Amount of money to spend on fees to run the Market Maker bot.',
  },
  market_maker_volume: {
    text: 'Volume',
    definition:
      'Target notional trading volume to execute. This represents the total value of trades the bot will attempt to make.',
  },
  ool_pause: {
    text: 'OOL Pause',
    link: 'https://tread-labs.gitbook.io/api-docs/submitting-orders/ool-pause',
    definition:
      'When ticked, during the period of time where the current market price is beyond your limit price, the duration will not be counted towards your set duration.',
  },
  soft_pause: {
    text: 'Soft Pause',
    link: 'https://tread-labs.gitbook.io/api-docs/multi-spread-orders/soft-pause',
    definition:
      "When exceeded exposure tolerance, extend all legs' schedules by flattening the schedule and increasing duration, without pausing any leg.",
  },
  strategy: {
    text: 'Strategy',
    link: 'https://tread-labs.gitbook.io/api-docs/strategies',
    definition: 'Dictates the schedule and configurations that the trading engine uses to fill an order',
  },
  trajectory: {
    text: 'Trajectory',
    link: 'https://tread-labs.gitbook.io/api-docs/trajectories',
    definition: `The planned execution path of an order. Each strategy has a predefined execution method (trajectory). If you require a custom execution method, select ‘Custom'.`,
  },
  max_clip_size: {
    text: 'Max Clip Size',
    link: 'https://tread-labs.gitbook.io/api-docs/advanced-settings/max-clip-size',
    definition: 'The maximum slice size placed at once.',
  },
  enabled_markets_all: {
    text: 'All',
    definition: 'By default, all markets are enabled for this account.',
  },
  market_volume: {
    text: 'Market Volume: ',
    link: 'https://tread-labs.gitbook.io/api-docs/pre-trade-analytics',
  },
  participation_rate: {
    text: 'Participation Rate: ',
    link: 'https://tread-labs.gitbook.io/api-docs/pre-trade-analytics',
  },
  market_volatility: {
    text: 'Market Volatility: ',
    link: 'https://tread-labs.gitbook.io/api-docs/pre-trade-analytics',
  },
  slippage: {
    text: 'Slippage',
    link: 'https://tread-labs.gitbook.io/api-docs/real-time-algo-order-tracking',
    definition: 'Average executed price relative to mid price at the time of order entry.',
  },
  vwap_slippage: {
    text: 'VWAP Slippage',
    link: 'https://tread-labs.gitbook.io/api-docs/real-time-algo-order-tracking',
    definition: 'Average executed price relative to market VWAP throughout the duration of the order.',
  },
  exchange_fee: {
    text: 'Exchange Fee',
    link: 'https://tread-labs.gitbook.io/api-docs/real-time-algo-order-tracking',
    definition: 'Exchange fee shown in quote asset quantity for the entire order.',
  },
  benchmark_participation_rate: {
    text: 'Participation Rate',
    link: 'https://tread-labs.gitbook.io/api-docs/real-time-algo-order-tracking',
    definition: 'Executed quantity as a ratio of reported market volume.',
  },
  notional_exposure: {
    text: 'Notional Exposure',
    link: 'https://tread-labs.gitbook.io/api-docs/real-time-algo-order-tracking',
    definition: 'Total notional exposure of the child orders.',
  },
  funding_fee: {
    text: 'Funding (Total)',
    definition: 'Funding PnL for the current position held.',
  },
  funding_fee_7d: {
    text: 'Funding (7d)',
    definition: 'Due to limited data availability, showing funding PnL over the last 7 days.',
  },
  funding_fee_30d: {
    text: 'Funding (30d)',
    definition: 'Due to limited data availability, showing funding PnL over the last 30 days.',
  },
  gas_fees: {
    text: 'Gas Fees',
    definition: 'Total gas fees paid for DEX transactions in ETH.',
  },
  network_fee: {
    text: 'Network Fee',
    definition: 'Total network fees paid for transaction on the blockchain.',
  },
  dex_exchange_fee: {
    text: 'Exchange Fee',
    definition: 'A fee charged by the platform for executing your trade.',
  },
  price_impact_slippage: {
    text: 'Price Impact & Slippage',
    definition:
      'Price impact shows the effect of your order on the market price. Slippage tolerance sets the maximum acceptable price deviation.',
  },
  max_slippage: {
    text: 'Max Slippage',
    link: 'https://tread-labs.gitbook.io/api-docs/dex-trading/submitting-dex-orders#reviewing-your-order',
    definition: "The highest price change you're willing to tolerate before the trade fails.",
  },
  estimated_slippage: {
    text: 'Estimated Slippage',
    link: 'https://tread-labs.gitbook.io/api-docs/dex-trading/submitting-dex-orders#reviewing-your-order',
    definition: 'A forecast of how much the actual execution price might differ from the quoted price.',
  },
  estimated_gas_fee: {
    text: 'Estimated Gas Fee',
    link: 'https://tread-labs.gitbook.io/api-docs/dex-trading/submitting-dex-orders#reviewing-your-order',
    definition: 'An approximate network fee required to submit and process your transaction on the blockchain.',
  },
  trading_fee: {
    text: 'Trading Fee',
    link: 'https://tread-labs.gitbook.io/api-docs/dex-trading/submitting-dex-orders#reviewing-your-order',
    definition: 'A fee charged by the platform for executing your trade, usually deducted from the output amount.',
  },
  estimated_yield: {
    text: 'Estimated Yield',
    definition:
      'Shows the potential annual yield, calculated by annualizing the average funding rate from the selected historical period (Day, Week, etc.). This is an estimate, not a guarantee. Funding rates are highly variable and change frequently. The calculation does not include any execution costs like trading fees or spreads.',
  },
};

export function TreadTooltip({ variant, labelTextVariant, ...tooltipProps }) {
  const variantConfig = TreadTooltipVariant[variant];
  if (!(variant in TreadTooltipVariant)) {
    throw new Error(`Variant [${variant}] not supported for TreadTooltip`);
  }

  return (
    <LabelTooltip
      label={variantConfig.text}
      labelTextVariant={labelTextVariant}
      link={variantConfig.link}
      title={variantConfig.definition}
      underline={tooltipProps.underline}
      {...tooltipProps}
    />
  );
}

export default LabelTooltip;