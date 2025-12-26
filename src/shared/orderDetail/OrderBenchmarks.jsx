import { Box, Stack, Paper, InputLabel, useTheme } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import React from 'react';
import { smartRound, msAndKs, titleCase } from '@/util';
import { HeaderTypography } from '@/shared/components/MuiComponents';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import EmptyBar from '@/shared/components/EmptyBar';
import DataComponent from '@/shared/DataComponent';
import AnimatedNumber from '@/shared/components/AnimatedNumber';
import { renderPriceWithSubscript } from '@/util/priceFormatting';
import { CHAIN_CONFIGS, getTokenInfo } from '@/shared/dexUtils';
import { fillRoleColor } from './charts/util';

function BenchmarkCard({ children }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        px: '12px',
        py: '8px',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: theme.palette.background.card,
      }}
    >
      {children}
    </Paper>
  );
}

const moveNegativeToFront = (value) => {
  if (value < 0) {
    return `-$${Math.abs(value)}`;
  }
  return `$${value}`;
};

// Helper function to get native token symbol based on chain ID
const getNativeTokenSymbol = (chainId) => {
  const chainConfig = CHAIN_CONFIGS[chainId];
  return chainConfig?.symbol || 'ETH'; // Default to ETH if chain not found
};

export function ArrivalCost({ arrival_cost, arrival_bps_notional, arrival_price, showArrivalPrice }) {
  return (
    <Stack direction='column' spacing={1}>
      <InputLabel
        sx={{
          color: 'text',
        }}
      >
        <TreadTooltip labelTextVariant='small2' placement='left' variant='slippage' />
      </InputLabel>

      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={!arrival_cost}
      >
        <Stack alignItems='baseline' direction='row' spacing={0}>
          {(() => {
            const numValue = Number(arrival_cost) || 0;
            const isPositive = numValue > 0;
            const color = isPositive ? 'error.main' : 'success.main';
            return (
              <>
                {numValue < 0 && (
                  <Typography color={color} component='span' variant='subtitle1'>
                    -
                  </Typography>
                )}
                <Typography color={color} variant='subtitle1'>
                  <AnimatedNumber decimals={2} value={Math.abs(numValue)} />
                </Typography>
              </>
            );
          })()}
          <Typography color={(Number(arrival_cost) || 0) > 0 ? 'error.main' : 'success.main'} variant='small1'>
            {'bps\u00A0'}
          </Typography>
          {arrival_bps_notional && (
            <Typography variant='small1'>
              {` ≈ `}
              {`${moveNegativeToFront(smartRound(arrival_bps_notional, 2))}`}
            </Typography>
          )}
        </Stack>
      </DataComponent>

      {showArrivalPrice && (
        <Stack alignItems='center' direction='row' spacing={2}>
          <HeaderTypography>Benchmark:</HeaderTypography>
          <DataComponent emptyComponent={<EmptyBar variant='small' />} isEmpty={!arrival_price}>
            <HeaderTypography>${smartRound(arrival_price, 2)}</HeaderTypography>
          </DataComponent>
        </Stack>
      )}
    </Stack>
  );
}

function VWAPCost({ vwap_cost, vwap, showVmap }) {
  return (
    <Stack direction='column' spacing={1}>
      <InputLabel
        sx={{
          color: 'text',
        }}
      >
        <TreadTooltip labelTextVariant='small2' placement='left' variant='vwap_slippage' />
      </InputLabel>

      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={!vwap_cost}
      >
        <Stack alignItems='baseline' direction='row' spacing={0}>
          {(() => {
            const numValue = Number(vwap_cost) || 0;
            const isPositive = numValue > 0;
            const color = isPositive ? 'error.main' : 'success.main';
            return (
              <>
                {numValue < 0 && (
                  <Typography color={color} component='span' variant='subtitle1'>
                    -
                  </Typography>
                )}
                <Typography color={color} variant='subtitle1'>
                  <AnimatedNumber decimals={2} value={Math.abs(numValue)} />
                </Typography>
              </>
            );
          })()}
          <Typography color={(Number(vwap_cost) || 0) > 0 ? 'error.main' : 'success.main'} variant='small1'>
            bps
          </Typography>
        </Stack>
      </DataComponent>

      {showVmap && (
        <Stack alignItems='center' direction='row' spacing={2}>
          <HeaderTypography>Benchmark:</HeaderTypography>
          <DataComponent emptyComponent={<EmptyBar variant='small' />} isEmpty={!vwap}>
            <HeaderTypography>${smartRound(vwap, 2)}</HeaderTypography>
          </DataComponent>
        </Stack>
      )}
    </Stack>
  );
}

export function ExchangeFee({ fee_cost, fee_asset, fee_notional, fillRoleBreakdown, showFillBreakdown }) {
  const theme = useTheme();
  const renderFee = () => {
    if (!fee_asset || fee_asset.includes('USD')) {
      return `$${smartRound(fee_notional)}`;
    }

    return `${smartRound(fee_notional)} ${fee_asset}`;
  };

  const formatRole = (role) => {
    if (['MAKE', 'TAKE'].includes(role)) {
      return titleCase(`${role}r\u00A0`);
    }

    return titleCase(role);
  };

  const renderFillRoleBreakdown = () => {
    if (!fillRoleBreakdown || Object.keys(fillRoleBreakdown).length === 0) {
      return <EmptyBar variant='small' />;
    }

    return (
      <Stack direction='row'>
        {Object.entries(fillRoleBreakdown).map(([role, value], i) => {
          return (
            <Stack direction='row' key={role} spacing={1}>
              {i !== 0 && <Typography variant='small2'>/</Typography>}
              <Typography variant='small2'>{Number(value).toFixed(0)}%</Typography>
              <Typography color={fillRoleColor({ theme, role })} variant='small2'>
                {formatRole(role)}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    );
  };

  const renderFeeCost = () => {
    if (!fee_cost && fee_cost !== 0) {
      return '';
    }

    return <AnimatedNumber decimals={1} suffix='bps' value={fee_cost} />;
  };

  return (
    <Stack direction='column' spacing={1}>
      <InputLabel
        sx={{
          color: 'text',
        }}
      >
        <TreadTooltip labelTextVariant='small2' placement='left' variant='exchange_fee' />
      </InputLabel>

      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={fee_cost === undefined && fee_notional === undefined}
      >
        <Stack alignItems='baseline' direction='row' spacing={1}>
          <Typography variant='subtitle1'>{renderFee()}</Typography>
          <Typography variant='small1'>{renderFeeCost()}</Typography>
        </Stack>
      </DataComponent>
      {showFillBreakdown && renderFillRoleBreakdown()}
    </Stack>
  );
}

function ParticipationRate({ pov, interval_volume, showVolume, base }) {
  return (
    <Stack direction='column' spacing={1}>
      <InputLabel
        sx={{
          color: 'text',
        }}
      >
        <TreadTooltip labelTextVariant='small2' placement='left' variant='benchmark_participation_rate' />
      </InputLabel>

      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={!pov}
      >
        <Typography variant='subtitle1'>
          <AnimatedNumber decimals={3} suffix='%' value={pov} />
        </Typography>
      </DataComponent>

      {showVolume && (
        <Stack alignItems='center' direction='row' spacing={2}>
          <HeaderTypography>Volume:</HeaderTypography>
          <DataComponent emptyComponent={<EmptyBar variant='small' />} isEmpty={!interval_volume}>
            <HeaderTypography>{`${msAndKs(Number(interval_volume))} ${base}`}</HeaderTypography>
          </DataComponent>
        </Stack>
      )}
    </Stack>
  );
}

function NotionalExposure({ notional_exposure }) {
  return (
    <Stack direction='column' spacing={1}>
      <InputLabel
        sx={{
          color: 'text',
        }}
      >
        <TreadTooltip labelTextVariant='small2' placement='left' variant='notional_exposure' />
      </InputLabel>
      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={!notional_exposure}
      >
        <Stack alignItems='baseline' direction='row' spacing={0}>
          <Typography variant='subtitle1'>{moveNegativeToFront(msAndKs(notional_exposure))}</Typography>
        </Stack>
      </DataComponent>
    </Stack>
  );
}

// DEX-specific benchmark cards
function GasFees({ gas_fee, tx_fee, chainId }) {
  const nativeTokenSymbol = getNativeTokenSymbol(chainId);

  const networkFee = chainId === '501' ? tx_fee : gas_fee;

  return (
    <Stack direction='column' spacing={1}>
      <InputLabel
        sx={{
          color: 'text',
        }}
      >
        <TreadTooltip labelTextVariant='small2' placement='left' variant='network_fee' />
      </InputLabel>
      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={!networkFee}
      >
        <Stack direction='column' spacing={0}>
          <Stack alignItems='baseline' direction='row' spacing={0}>
            <Typography variant='subtitle1'>
              {networkFee ? renderPriceWithSubscript(Number(networkFee).toPrecision(4)) : '0'} {nativeTokenSymbol}
            </Typography>
          </Stack>
        </Stack>
      </DataComponent>
    </Stack>
  );
}

function DexExchangeFee({ fee_cost, fee_asset }) {
  return (
    <Stack direction='column' spacing={1}>
      <InputLabel sx={{ color: 'text' }}>
        <TreadTooltip labelTextVariant='small2' placement='left' variant='dex_exchange_fee' />
      </InputLabel>
      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={!fee_cost}
      >
        <Typography variant='subtitle1'>
          {renderPriceWithSubscript(Number(fee_cost).toPrecision(4))} {fee_asset}
        </Typography>
      </DataComponent>
    </Stack>
  );
}

function PriceImpactSlippage({ price_impact, slippage_tolerance, executed_qty, executed_price }) {
  // Calculate price impact dollar value
  const calculatePriceImpactUSD = () => {
    if (!price_impact || !executed_qty || !executed_price) return null;

    // Price impact is a percentage, so we need to convert it to decimal
    const priceImpactDecimal = Math.abs(price_impact) / 100;
    const impactUSD = executed_qty * executed_price * priceImpactDecimal;

    return impactUSD;
  };

  const priceImpactUSD = calculatePriceImpactUSD();

  // Format USD value with subscript if needed
  const formatUSDWithSubscript = (value) => {
    if (!value || value === 0) return '$0';

    const valueNum = Number(value);
    const formattedValue = valueNum.toFixed(2);

    // Only apply subscript formatting if value is less than 1
    if (valueNum >= 1) {
      return `$${formattedValue}`;
    }

    // Match: 0.(zeros)(rest), at least 2 zeros after decimal, then a nonzero digit
    const match = formattedValue.match(/^(\d*)\.(0{2,})([1-9]\d*)$/);
    if (match) {
      const [, intPart, zeros, rest] = match;
      return (
        <>
          ${intPart}.0<sub style={{ fontSize: '0.7em', verticalAlign: 'sub', opacity: 0.7 }}>{zeros.length}</sub>
          {rest}
        </>
      );
    }
    return `$${formattedValue}`;
  };

  return (
    <Stack direction='column' spacing={1}>
      <InputLabel
        sx={{
          color: 'text',
        }}
      >
        <TreadTooltip labelTextVariant='small2' placement='left' variant='price_impact_slippage' />
      </InputLabel>
      <DataComponent
        emptyComponent={
          <Stack direction='column' justifyContent='center' sx={{ height: '24px' }}>
            <EmptyBar />
          </Stack>
        }
        isEmpty={!price_impact && !slippage_tolerance}
      >
        <Stack direction='column' spacing={0.5}>
          {price_impact && (
            <Stack alignItems='baseline' direction='row' spacing={0}>
              <Typography color='error.main' variant='subtitle1'>
                {Math.abs(price_impact).toFixed(2)}%
              </Typography>
            </Stack>
          )}
          {priceImpactUSD && (
            <Typography color='text.secondary' variant='caption'>
              {formatUSDWithSubscript(priceImpactUSD)}
            </Typography>
          )}
          {slippage_tolerance && (
            <Stack alignItems='baseline' direction='row' spacing={0}>
              <Typography variant='subtitle1'>
                <AnimatedNumber suffix='%' value={slippage_tolerance} />
              </Typography>
              <Typography color='text.secondary' sx={{ ml: 1 }} variant='caption'>
                Slippage
              </Typography>
            </Stack>
          )}
        </Stack>
      </DataComponent>
    </Stack>
  );
}

function OrderBenchmarks({
  benchmarkData,
  fillRoleBreakdown,
  isSimple = false,
  isMulti = false,
  isMobile = false,
  isDexOrder = false,
  orderSummary,
}) {
  const {
    arrival_price,
    arrival_cost,
    arrival_bps_notional,
    vwap,
    vwap_cost,
    fee_notional,
    fee_asset,
    fee_cost,
    interval_volume,
    pov,
    notional_exposure = undefined,
    // DEX-specific fields
    gas_fee,
    gas_price,
    gas_used,
    tx_fee,
    price_impact_percentage,
    slippage_tolerance,
  } = benchmarkData;

  // Extract base asset from pair (e.g., "NEWT-USDT" -> "NEWT")
  const base_asset = orderSummary?.pair ? orderSummary.pair.split('-')[0] : undefined;

  let cardSize;
  if (isSimple) {
    cardSize = 6;
  } else if (isMulti) {
    cardSize = isMobile ? 6 : 12 / 5;
  } else {
    cardSize = isMobile ? 6 : 3;
  }

  const { chainId } = getTokenInfo(orderSummary?.sell_token);

  return (
    <Box>
      <Grid container direction='row' spacing={1} sx={{ height: '100%' }}>
        {isDexOrder ? (
          // DEX-specific benchmark cards
          <>
            <Grid xs={4}>
              <BenchmarkCard>
                <GasFees chainId={chainId} gas_fee={gas_fee} tx_fee={tx_fee} />
              </BenchmarkCard>
            </Grid>
            <Grid xs={4}>
              <BenchmarkCard>
                <DexExchangeFee fee_asset={fee_asset} fee_cost={fee_cost} />
              </BenchmarkCard>
            </Grid>
            <Grid xs={4}>
              <BenchmarkCard>
                <PriceImpactSlippage
                  executed_price={benchmarkData.executed_price || benchmarkData.notional}
                  executed_qty={benchmarkData.executed_token}
                  price_impact={price_impact_percentage}
                  slippage_tolerance={slippage_tolerance}
                />
              </BenchmarkCard>
            </Grid>
          </>
        ) : (
          // Regular benchmark cards for non-DEX orders
          <>
            {isMulti && (
              <Grid xs={cardSize}>
                <BenchmarkCard>
                  <NotionalExposure notional_exposure={notional_exposure} />
                </BenchmarkCard>
              </Grid>
            )}
            <Grid xs={cardSize}>
              <BenchmarkCard>
                <ArrivalCost
                  arrival_bps_notional={arrival_bps_notional}
                  arrival_cost={arrival_cost}
                  arrival_price={arrival_price}
                  showArrivalPrice={!isMulti}
                />
              </BenchmarkCard>
            </Grid>
            {!isSimple && (
              <Grid xs={cardSize}>
                <BenchmarkCard>
                  <VWAPCost showVmap={!isMulti} vwap={vwap} vwap_cost={vwap_cost} />
                </BenchmarkCard>
              </Grid>
            )}
            <Grid xs={cardSize}>
              <BenchmarkCard>
                <ExchangeFee
                  fee_asset={fee_asset}
                  fee_cost={fee_cost}
                  fee_notional={fee_notional}
                  fillRoleBreakdown={fillRoleBreakdown}
                  showFillBreakdown={!isMulti}
                />
              </BenchmarkCard>
            </Grid>
            {!isSimple && (
              <Grid xs={cardSize}>
                <BenchmarkCard>
                  <ParticipationRate
                    base={base_asset}
                    interval_volume={interval_volume}
                    pov={pov}
                    showVolume={!isMulti}
                  />
                </BenchmarkCard>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
}

export { OrderBenchmarks };
