import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { calculatePeriodRate } from '@/pages/explore/utils';
import { smartRound } from '@/util';
import LabelTooltip, { TreadTooltip } from '@/shared/components/LabelTooltip';
import { formatNumber } from '@/shared/utils/formatNumber';
import { getQuoteCurrency, normalizeExchangeName } from '@/pages/yield/utils/yieldUtils';
import { Loader } from '@/shared/Loader';
import { getExchangeTickerData, getLeverage } from '@/apiServices';
import { TokenIcon } from '@/shared/components/Icons';

const TIMEFRAME_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
];

function MetricCard({ title, titleNode, value, subtitle, valueColor }) {
  return (
    <Paper elevation={1} sx={{ flex: 1, minHeight: 132, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {titleNode || (
        <Typography color='text.secondary' variant='subtitle2'>
          {title}
        </Typography>
      )}
      <Typography
        color={valueColor || 'text.primary'}
        fontFamily={(theme) => theme.typography?.fontFamilyConfig?.data}
        variant='h3'
      >
        {value}
      </Typography>
      {subtitle ? (
        <Typography color='text.secondary' variant='caption'>
          {subtitle}
        </Typography>
      ) : null}
    </Paper>
  );
}

function YieldSummaryCard({ entries }) {
  return (
    <Paper elevation={1} sx={{ flex: 1, minHeight: 132, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box alignItems='center' display='flex' justifyContent='space-between'>
        <Typography color='text.secondary' variant='caption'>
          Period
        </Typography>
        <TreadTooltip labelTextVariant='subtitle2' variant='estimated_yield' />
      </Box>
      <Stack spacing={1.25}>
        {entries.map(({ label, display, color }) => (
          <Stack direction='row' justifyContent='space-between' key={label}>
            <Typography color='text.secondary' variant='body1'>
              {label}
            </Typography>
            <Typography color={color} fontFamily={(theme) => theme.typography?.fontFamilyConfig?.data} variant='body1'>
              {display}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function YieldHeaderCard({
  exchangeName,
  displayLabel,
  baseSymbol,
  quoteCurrency,
  spreadDisplay,
  spreadColor,
  spotVolumeDisplay,
  perpVolumeDisplay,
  leverageDisplay,
  leverageColor,
}) {
  return (
    <Paper elevation={0} sx={{ p: 2.5 }}>
      <Stack
        alignItems={{ xs: 'flex-start', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        spacing={2}
      >
        <Box alignItems='center' display='flex' gap={1.5}>
          <TokenIcon style={{ width: 24, height: 24 }} tokenName={baseSymbol} />
          <Box>
            <Typography color='text.secondary' variant='subtitle2'>
              {exchangeName}
            </Typography>
            <Typography variant='body1'>{displayLabel || `${baseSymbol}/${quoteCurrency}`}</Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', ml: -15 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={20}>
            <Box sx={{ minWidth: 120 }}>
              <Typography color='text.secondary' variant='caption'>
                Spot Volume (24H)
              </Typography>
              <Typography
                color='info.main'
                fontFamily={(theme) => theme.typography?.fontFamilyConfig?.data}
                sx={{ mt: 0.5 }}
                variant='body1'
              >
                {spotVolumeDisplay}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 120 }}>
              <Typography color='text.secondary' variant='caption'>
                Perp Volume (24H)
              </Typography>
              <Typography
                color='info.main'
                fontFamily={(theme) => theme.typography?.fontFamilyConfig?.data}
                sx={{ mt: 0.5 }}
                variant='body1'
              >
                {perpVolumeDisplay}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 120 }}>
              <Box alignItems='center' display='flex' gap={0.5}>
                <LabelTooltip
                  label='Spread'
                  labelTextVariant='caption'
                  title='The difference between the perpetual price and the spot price.'
                />
              </Box>
              <Typography
                color={spreadColor}
                fontFamily={(theme) => theme.typography?.fontFamilyConfig?.data}
                sx={{ mt: 0.5 }}
                variant='body1'
              >
                {spreadDisplay}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 120 }}>
              <Box alignItems='center' display='flex' gap={0.5}>
                <LabelTooltip
                  label='Leverage'
                  labelTextVariant='caption'
                  title='This is the current set leverage for the perpetual leg of this order. To adjust, please set this on the exchange website before proceeding.'
                />
              </Box>
              <Typography
                color={leverageColor}
                fontFamily={(theme) => theme.typography?.fontFamilyConfig?.data}
                sx={{ mt: 0.5 }}
                variant='body1'
              >
                {leverageDisplay}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function EmptyState({ title, description }) {
  return (
    <Paper elevation={0} sx={{ p: 4, height: '100%' }}>
      <Stack alignItems='center' justifyContent='center' spacing={1} sx={{ height: '100%' }}>
        <Typography variant='h6'>{title}</Typography>
        <Typography color='text.secondary' textAlign='center' variant='body2'>
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function FundingPerpAnalytics({ selectedAccount, selectedOption, fundingRates, isLoading = false }) {
  const { tickerData } = useExchangeTicker();
  const [tickerSnapshot, setTickerSnapshot] = useState({ spot: null, perp: null });
  const [spreadPrices, setSpreadPrices] = useState({ spot: null, perp: null });
  const [leverageData, setLeverageData] = useState({ leverage: null, loading: false, error: null });

  const quoteCurrency = getQuoteCurrency(selectedAccount?.exchangeName);
  const baseSymbol = selectedOption?.baseSymbol || '';
  const spotSymbol = baseSymbol ? `${baseSymbol}-${quoteCurrency}` : '';
  const perpSymbol = baseSymbol ? `${baseSymbol}:PERP-${quoteCurrency}` : '';
  const leveragePairId = selectedOption?.perpPair?.id || perpSymbol;

  useEffect(() => {
    if (!spotSymbol && !perpSymbol) {
      setTickerSnapshot({ spot: null, perp: null });
      setSpreadPrices({ spot: null, perp: null });
      return;
    }

    const current = tickerData || {};
    setTickerSnapshot({
      spot: spotSymbol ? current[spotSymbol] || null : null,
      perp: perpSymbol ? current[perpSymbol] || null : null,
    });
    setSpreadPrices({
      spot: spotSymbol && current[spotSymbol]?.lastPrice != null ? Number(current[spotSymbol].lastPrice) : null,
      perp: perpSymbol && current[perpSymbol]?.lastPrice != null ? Number(current[perpSymbol].lastPrice) : null,
    });
  }, [tickerData, spotSymbol, perpSymbol]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedAccount?.exchangeName) {
      return undefined;
    }

    const refreshTickers = async () => {
      try {
        const result = await getExchangeTickerData({ exchangeName: selectedAccount.exchangeName });
        if (!isMounted) return;

        const map = Array.isArray(result)
          ? result.reduce((acc, ticker) => {
              acc[ticker.pair] = ticker;
              return acc;
            }, {})
          : {};

        setSpreadPrices({
          spot: spotSymbol && map[spotSymbol]?.lastPrice != null ? Number(map[spotSymbol].lastPrice) : null,
          perp: perpSymbol && map[perpSymbol]?.lastPrice != null ? Number(map[perpSymbol].lastPrice) : null,
        });
      } catch (error) {
        // Silently ignore refresh errors; UI will retain last known values
      }
    };

    refreshTickers();
    const interval = setInterval(refreshTickers, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedAccount?.exchangeName, spotSymbol, perpSymbol]);

  // Fetch leverage data
  useEffect(() => {
    const fetchLeverage = async () => {
      if (!selectedAccount?.id || !leveragePairId) {
        setLeverageData({ leverage: null, loading: false, error: null });
        return;
      }

      setLeverageData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await getLeverage(leveragePairId, [selectedAccount.id]);
        const leverage = Number(result?.leverage);
        setLeverageData({
          leverage: Number.isFinite(leverage) ? leverage : null,
          loading: false,
          error: null,
        });
      } catch (error) {
        setLeverageData({
          leverage: null,
          loading: false,
          error: error.message || 'Failed to fetch leverage',
        });
      }
    };

    fetchLeverage();
  }, [selectedAccount?.id, leveragePairId]);

  const spotTicker = tickerSnapshot.spot;
  const perpTicker = tickerSnapshot.perp;
  const spotPrice = spreadPrices.spot ?? (spotTicker?.lastPrice ? Number(spotTicker.lastPrice) : null);
  const perpPrice = spreadPrices.perp ?? (perpTicker?.lastPrice ? Number(perpTicker.lastPrice) : null);
  const spotVolumeNotional = spotTicker?.volume24hNotional ?? null;
  const perpVolumeNotional = perpTicker?.volume24hNotional ?? null;

  const spreadValue = useMemo(() => {
    if (spotPrice == null || perpPrice == null) return null;
    const diff = Number(perpPrice) - Number(spotPrice);
    return Number.isFinite(diff) ? diff : null;
  }, [spotPrice, perpPrice]);

  const fundingRateEntry = useMemo(() => {
    if (!fundingRates?.length || !baseSymbol || !selectedAccount?.exchangeName) return null;
    const mappedExchange = normalizeExchangeName(selectedAccount.exchangeName);

    let entry = fundingRates.find(
      (rate) => normalizeExchangeName(rate.exchange) === mappedExchange && rate.pair === baseSymbol
    );

    if (!entry) {
      entry = fundingRates.find((rate) => {
        if (!rate?.exchange_pair) return false;
        const [exchange, base] = String(rate.exchange_pair).split('#');
        return normalizeExchangeName(exchange) === mappedExchange && base === baseSymbol;
      });
    }

    return entry || null;
  }, [fundingRates, baseSymbol, selectedAccount?.exchangeName]);

  const fundingRateSnapshot = useMemo(() => {
    if (!fundingRateEntry) return null;
    const rate = Number(fundingRateEntry.rate) || 0;
    const interval = Number(fundingRateEntry.funding_rate_interval ?? fundingRateEntry.interval ?? 4) || 4;
    return { rate, interval };
  }, [fundingRateEntry]);

  const yieldEntries = useMemo(() => {
    return TIMEFRAME_OPTIONS.map(({ label, value }) => {
      if (!fundingRateSnapshot) {
        return { label, display: 'N/A', color: 'text.secondary' };
      }
      const periodRate = calculatePeriodRate(fundingRateSnapshot.rate, fundingRateSnapshot.interval, value);
      if (!Number.isFinite(periodRate)) {
        return { label, display: 'N/A', color: 'text.secondary' };
      }
      const rounded = smartRound(periodRate, 3);
      let color = 'text.primary';
      if (periodRate > 0) color = 'success.light';
      if (periodRate < 0) color = 'error.main';
      return { label, display: `${rounded}%`, color };
    });
  }, [fundingRateSnapshot]);

  const spreadDisplay = useMemo(() => {
    if (spreadValue == null) return 'N/A';
    const prefix = spreadValue > 0 ? '+' : '';
    return `${prefix}${Number(spreadValue).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${quoteCurrency}`;
  }, [spreadValue, quoteCurrency]);

  const spreadColor = useMemo(() => {
    if (spreadValue == null) return 'text.secondary';
    if (spreadValue > 0) return 'success.light';
    if (spreadValue < 0) return 'error.main';
    return 'text.primary';
  }, [spreadValue]);

  const spotVolumeDisplay = spotVolumeNotional == null ? 'N/A' : `${formatNumber(spotVolumeNotional)} ${quoteCurrency}`;
  const perpVolumeDisplay = perpVolumeNotional == null ? 'N/A' : `${formatNumber(perpVolumeNotional)} ${quoteCurrency}`;

  const leverageDisplay = useMemo(() => {
    if (leverageData.loading) return 'Loading...';
    if (leverageData.error) return 'Error';
    if (leverageData.leverage == null) return 'N/A';
    return `${smartRound(leverageData.leverage, 2)}x`;
  }, [leverageData]);

  const leverageColor = useMemo(() => {
    if (leverageData.loading) return 'text.secondary';
    if (leverageData.error) return 'error.main';
    if (leverageData.leverage == null) return 'text.secondary';
    return 'text.primary';
  }, [leverageData]);

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ p: 4, height: '100%' }}>
        <Stack alignItems='center' justifyContent='center' sx={{ height: '100%' }}>
          <Loader />
        </Stack>
      </Paper>
    );
  }

  if (!selectedAccount) {
    return (
      <EmptyState
        description='Connect or select an account to explore funding analytics.'
        title='No account selected'
      />
    );
  }

  if (!selectedOption) {
    return (
      <EmptyState
        description='Select a perpetual contract in the order form to load its funding analytics.'
        title='Select a symbol to get started'
      />
    );
  }

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <YieldHeaderCard
        baseSymbol={baseSymbol}
        displayLabel={selectedOption.displayLabel}
        exchangeName={selectedAccount.exchangeName}
        leverageColor={leverageColor}
        leverageDisplay={leverageDisplay}
        perpVolumeDisplay={perpVolumeDisplay}
        quoteCurrency={quoteCurrency}
        spotVolumeDisplay={spotVolumeDisplay}
        spreadColor={spreadColor}
        spreadDisplay={spreadDisplay}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <YieldSummaryCard entries={yieldEntries} />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
        }}
      >
        <Typography variant='subtitle1'>Historical Funding Rate</Typography>
        <Typography color='text.secondary' sx={{ mt: 1 }} textAlign='center' variant='body2'>
          Historical funding rate charts for this perp are coming soon.
        </Typography>
      </Paper>
    </Stack>
  );
}
