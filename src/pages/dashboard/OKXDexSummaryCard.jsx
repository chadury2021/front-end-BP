import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  useTheme,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LanguageIcon from '@mui/icons-material/Language';
import XIcon from '@mui/icons-material/X';
import TelegramIcon from '@mui/icons-material/Telegram';
import numbro from 'numbro';
import { DexTokenIcon } from '@/shared/components/Icons';
import { useDexTokenInfo } from './orderEntry/hooks/useDexTokenInfo';

function formatNumber(n, digits = 2) {
  if (n === undefined || n === null) return '-';
  const num = parseFloat(n);

  // Helper function to format with conditional decimals
  const formatWithConditionalDecimals = (value, suffix) => {
    const isWhole = Math.abs(value - Math.round(value)) < 0.01;
    return `${isWhole ? Math.round(value) : value.toFixed(digits)}${suffix}`;
  };

  if (Math.abs(num) >= 1e12) return formatWithConditionalDecimals(num / 1e12, 'T');
  if (Math.abs(num) >= 1e9) return formatWithConditionalDecimals(num / 1e9, 'B');
  if (Math.abs(num) >= 1e6) return formatWithConditionalDecimals(num / 1e6, 'M');
  if (Math.abs(num) >= 1e3) return formatWithConditionalDecimals(num / 1e3, 'K');

  // For numbers less than 1000, show whole numbers without decimals
  const isWhole = Math.abs(num - Math.round(num)) < 0.01;
  return isWhole ? Math.round(num).toString() : num.toFixed(digits);
}

function BenchmarkCard({ label, value }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        backgroundColor: theme.palette.background.card,
      }}
    >
      <Stack alignItems='flex-start' direction='column' spacing={1}>
        <Typography color='text.secondary' variant='small2'>
          {label}
        </Typography>
        <Typography variant='body2Strong'>{value}</Typography>
      </Stack>
    </Paper>
  );
}

// Helper function to aggregate data from multiple pairs
function aggregatePairsData(pairs, address) {
  const filteredPairs = (pairs || []).filter(
    (pair) => pair.baseToken?.address?.toLowerCase() === address.toLowerCase()
  );
  if (!filteredPairs || filteredPairs.length === 0) return null;

  const aggregated = {
    liquidity: { usd: 0 },
    fdv: 0,
    marketCap: 0,
    volume: { h24: 0, h6: 0, h1: 0, m5: 0 },
    txns: {
      m5: { buys: 0, sells: 0 },
      h1: { buys: 0, sells: 0 },
      h6: { buys: 0, sells: 0 },
      h24: { buys: 0, sells: 0 },
    },
    pairCreatedAt: null,
    websites: [],
    socials: [],
    exchanges: new Set(),
    dexVolumes: {},
    priceChange: {},
  };

  const priceChanges = {
    m5: [],
    h1: [],
    h6: [],
    h24: [],
  };

  filteredPairs.forEach((pair) => {
    // Aggregate liquidity
    if (pair.liquidity?.usd) {
      aggregated.liquidity.usd += pair.liquidity.usd;
    }

    // Aggregate FDV (take the highest value)
    if (pair.fdv && pair.fdv > aggregated.fdv) {
      aggregated.fdv = pair.fdv;
    }

    // Aggregate market cap (take the highest value)
    if (pair.marketCap && pair.marketCap > aggregated.marketCap) {
      aggregated.marketCap = pair.marketCap;
    }

    // Aggregate volume
    Object.entries(pair.volume || {}).forEach(([key, value]) => {
      aggregated.volume[key] += value;
    });

    // Aggregate transactions for all timeframes
    Object.entries(pair.txns || {}).forEach(([key, value]) => {
      Object.entries(value).forEach(([key2, value2]) => {
        aggregated.txns[key][key2] += value2;
      });
    });

    // Aggregate price changes
    Object.entries(pair.priceChange || {}).forEach(([key, value]) => {
      const vol = pair.volume?.[key];
      if (vol && value) {
        priceChanges[key].push(value * vol);
      }
    });

    // Get pair creation timestamp (take the earliest one)
    if (pair.pairCreatedAt) {
      const timestamp = new Date(pair.pairCreatedAt).getTime();
      if (!aggregated.pairCreatedAt || timestamp < new Date(aggregated.pairCreatedAt).getTime()) {
        aggregated.pairCreatedAt = pair.pairCreatedAt;
      }
    }

    // Extract websites and socials (take the first non-empty arrays)
    if (pair.info?.websites && (pair.info.websites || []).length > 0 && aggregated.websites.length === 0) {
      aggregated.websites = pair.info.websites;
    }
    if (pair.info?.socials && (pair.info.socials || []).length > 0 && aggregated.socials.length === 0) {
      aggregated.socials = pair.info.socials;
    }

    // Collect all unique exchanges
    if (pair.swapDexes && Array.isArray(pair.swapDexes)) {
      pair.swapDexes.forEach((dex) => {
        if (dex.name) {
          aggregated.exchanges.add(dex.name);
        }
      });
    } else if (pair.dexId) {
      aggregated.exchanges.add(pair.dexId);
    }

    // New: aggregate by dexId (or fallback to contract address)
    const dexKey = pair.dexId || pair.pairAddress || pair.address;
    if (dexKey) {
      const vol = pair.volume?.h24 || 0;
      aggregated.dexVolumes[dexKey] = (aggregated.dexVolumes[dexKey] || 0) + vol;
    }
  });

  // Convert Set to array for easier handling
  aggregated.exchanges = Array.from(aggregated.exchanges);
  // Convert dexVolumes to array for easier handling
  aggregated.dexVolumes = Object.entries(aggregated.dexVolumes).map(([dexId, volume]) => ({ dexId, volume }));

  Object.entries(priceChanges).forEach(([key, value]) => {
    if (value.length > 0) {
      const totalWeightedValue = value.reduce((sum, item) => sum + item, 0);
      aggregated.priceChange[key] = totalWeightedValue / aggregated.volume[key] || 0;
    }
  });
  return aggregated;
}

function TimeRangeSelector({ selectedRange, setSelectedRange, timeRanges, priceChange }) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      value={selectedRange}
      onChange={(e, newRange) => {
        if (newRange) setSelectedRange(newRange);
      }}
    >
      {timeRanges.map((range) => {
        let pctLabel = 'N/A';
        let color = 'text.secondary';
        const pctChangeNum = priceChange[range.key];
        if (pctChangeNum) {
          pctLabel = `${numbro(pctChangeNum).format({
            mantissa: 2,
            forceSign: true,
          })}%`;

          if (pctChangeNum > 0) {
            color = 'success.main';
          } else if (pctChangeNum < 0) {
            color = 'error.main';
          }
        }
        return (
          <ToggleButton
            key={range.key}
            sx={{
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: 0,
              textTransform: 'none',
              p: 1,
            }}
            value={range.key}
          >
            <Stack direction='column' spacing={1}>
              <Typography variant='body3'>{range.label}</Typography>
              <Typography color={color} variant='body3'>
                {pctLabel}
              </Typography>
            </Stack>
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}

function MultiRatioBar({ segments, theme }) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <Stack direction='row' spacing={0.5} sx={{ width: '100%', height: '10px' }}>
      {total > 0 ? (
        segments.map((seg, idx) => (
          <Box
            key={seg.label}
            sx={{
              borderTopLeftRadius: idx === 0 ? '2px' : '0',
              borderBottomLeftRadius: idx === 0 ? '2px' : '0',
              borderTopRightRadius: idx === segments.length - 1 ? '2px' : '0',
              borderBottomRightRadius: idx === segments.length - 1 ? '2px' : '0',
              flex: seg.value / total,
              backgroundColor: seg.color,
            }}
          />
        ))
      ) : (
        <Box sx={{ flex: 1, backgroundColor: theme.palette.text.subtitle, borderRadius: '2px' }} />
      )}
    </Stack>
  );
}

function MetricsPanel({ tradingHistoryInfo, theme }) {
  const { txs, txsBuy, txsSell, volume, volumeBuy, volumeSell, uniqueTraders, uniqueTradersBuy, uniqueTradersSell } =
    tradingHistoryInfo;

  return (
    <Grid container spacing={4} sx={{ p: 2 }}>
      <Grid item xs={4}>
        <Stack spacing={1}>
          <Typography variant='small2'>Transactions</Typography>
          <Typography variant='body3'>{formatNumber(txs)}</Typography>
        </Stack>
      </Grid>
      <Grid item xs={8}>
        <Stack spacing={2}>
          <Stack direction='row' justifyContent='space-between'>
            <Paper elevation={1} sx={{ px: 1, py: 0.5 }}>
              <Stack direction='row' spacing={0.5}>
                <Typography variant='small2'>Buy</Typography>
                <Typography color='side.buy' variant='small2'>
                  {formatNumber(txsBuy)}
                </Typography>
              </Stack>
            </Paper>
            <Paper elevation={1} sx={{ px: 1, py: 0.5 }}>
              <Stack direction='row' spacing={0.5}>
                <Typography variant='small2'>Sell</Typography>
                <Typography color='side.sell' variant='small2'>
                  {formatNumber(txsSell)}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
          <MultiRatioBar
            segments={[
              { value: Number(txsBuy), color: 'side.buy', label: 'Buy' },
              { value: Number(txsSell), color: 'side.sell', label: 'Sell' },
            ]}
            theme={theme}
          />
        </Stack>
      </Grid>
      <Grid item xs={4}>
        <Stack spacing={1}>
          <Typography variant='small2'>Volume</Typography>
          <Typography variant='body3'>${formatNumber(volume)}</Typography>
        </Stack>
      </Grid>
      <Grid item xs={8}>
        <Stack spacing={2}>
          <Stack direction='row' justifyContent='space-between'>
            <Paper elevation={1} sx={{ px: 1, py: 0.5 }}>
              <Stack direction='row' spacing={0.5}>
                <Typography variant='small2'>Buy</Typography>
                <Typography color='side.buy' variant='small2'>
                  ${formatNumber(volumeBuy)}
                </Typography>
              </Stack>
            </Paper>
            <Paper elevation={1} sx={{ px: 1, py: 0.5 }}>
              <Stack direction='row' spacing={0.5}>
                <Typography variant='small2'>Sell</Typography>
                <Typography color='side.sell' variant='small2'>
                  ${formatNumber(volumeSell)}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
          <MultiRatioBar
            segments={[
              { value: Number(volumeBuy), color: 'side.buy', label: 'Buy' },
              { value: Number(volumeSell), color: 'side.sell', label: 'Sell' },
            ]}
            theme={theme}
          />
        </Stack>
      </Grid>
      <Grid item xs={4}>
        <Stack spacing={1}>
          <Typography variant='small2'>Traders</Typography>
          <Typography variant='body3'>{formatNumber(uniqueTraders)}</Typography>
        </Stack>
      </Grid>
      <Grid item xs={8}>
        <Stack spacing={2}>
          <Stack direction='row' justifyContent='space-between'>
            <Paper elevation={1} sx={{ px: 1, py: 0.5 }}>
              <Stack direction='row' spacing={0.5}>
                <Typography variant='small2'>Buy</Typography>
                <Typography color='side.buy' variant='small2'>
                  {formatNumber(uniqueTradersBuy)}
                </Typography>
              </Stack>
            </Paper>
            <Paper elevation={1} sx={{ px: 1, py: 0.5 }}>
              <Stack direction='row' spacing={0.5}>
                <Typography variant='small2'>Sell</Typography>
                <Typography color='side.sell' variant='small2'>
                  {formatNumber(uniqueTradersSell)}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
          <MultiRatioBar
            segments={[
              { value: Number(uniqueTradersBuy), color: 'side.buy', label: 'Buy' },
              { value: Number(uniqueTradersSell), color: 'side.sell', label: 'Sell' },
            ]}
            theme={theme}
          />
        </Stack>
      </Grid>
    </Grid>
  );
}

function ExchangeVolumeBreakdown({ dexVolumes, theme }) {
  const colors = [
    'primary.main',
    'secondary.main',
    'success.main',
    'warning.main',
    'error.main',
    'info.main',
    theme.palette.primary.main, // primary
    theme.palette.semantic.warning, // orange
    theme.palette.grey[600], // brown
    theme.palette.grey[500], // blue grey
    theme.palette.primary.light, // primary light
    theme.palette.charts.blue, // indigo
  ];

  const total = dexVolumes.reduce((sum, item) => sum + item.volume, 0);

  return (
    <Stack direction='column' spacing={2}>
      <Typography variant='subtitle1'>Exchange Volume Breakdown</Typography>
      <MultiRatioBar
        segments={dexVolumes.map((item, index) => ({
          value: item.volume,
          color: colors[index % colors.length],
          label: item.dexId,
        }))}
      />
      <Grid container>
        {dexVolumes.map((item, index) => {
          const volumePercentage =
            total > 0 ? ((item.volume / total) * 100).toFixed(1) : (100 / dexVolumes.length).toFixed(1);
          return (
            <Grid item key={item.dexId} xs={6}>
              <Stack alignItems='center' direction='row' spacing={1}>
                <Box
                  sx={{
                    minWidth: '8px',
                    minHeight: '8px',
                    borderRadius: '50%',
                    backgroundColor: colors[index % colors.length],
                  }}
                />
                <Typography noWrap variant='small2'>
                  {item.dexId} ({volumePercentage}%)
                </Typography>
              </Stack>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

function SocialsPanel({ socials, creationTime }) {
  const formatTokenAge = (time) => {
    if (!time) return 'N/A';

    // Convert string timestamp to number if needed
    const timestamp = typeof time === 'string' ? parseInt(time, 10) : time;
    const now = new Date();
    const created = new Date(timestamp);
    const diffInMs = now - created;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    }
    if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    }
    if (diffInMinutes > 0) {
      return `${diffInMinutes}m ago`;
    }
    return 'Just now';
  };

  const formatCreationTime = (time) => {
    if (!time) return 'N/A';

    // Convert string timestamp to number if needed
    const timestamp = typeof time === 'string' ? parseInt(time, 10) : time;
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Stack alignItems='flex-end' direction='column' spacing={1}>
      <Stack direction='row' spacing={1}>
        {socials?.website && (
          <LanguageIcon
            sx={{ width: '16px', height: '16px', color: 'text.subtitle', cursor: 'pointer' }}
            onClick={() => window.open(socials.website, '_blank')}
          />
        )}
        {socials?.twitter && (
          <XIcon
            sx={{ width: '16px', height: '16px', color: 'text.subtitle', cursor: 'pointer' }}
            onClick={() => window.open(socials.twitter, '_blank')}
          />
        )}
        {socials?.telegram && (
          <TelegramIcon
            sx={{ width: '16px', height: '16px', color: 'text.subtitle', cursor: 'pointer' }}
            onClick={() => window.open(socials.telegram, '_blank')}
          />
        )}
      </Stack>
      {creationTime && (
        <Stack alignItems='flex-end' direction='column' spacing={0.5}>
          <Typography color='text.secondary' variant='small2'>
            Created: {formatCreationTime(creationTime)} ({formatTokenAge(creationTime)})
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

const timeRanges = [
  { key: 'm5', label: '5m' },
  { key: 'h1', label: '1h' },
  { key: 'h4', label: '4h' },
  { key: 'h24', label: '24h' },
];

export default function OKXDexSummaryCard({ pair }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [selectedRange, setSelectedRange] = useState('h24');

  const { socials, marketInfo, tradingHistoryInfo, loading } = useDexTokenInfo(pair.id, selectedRange);

  if (loading) {
    return (
      <Box alignItems='center' display='flex' height='100%' justifyContent='center' sx={{ minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const contractAddress = pair?.address || '-';

  // Format contract address to show first and last few characters
  const formatContractAddress = (address) => {
    if (!address || address === '-') return '-';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy to clipboard handler
  const handleCopy = () => {
    if (contractAddress && contractAddress !== '-') {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <Grid container rowSpacing={4} sx={{ m: 0 }}>
      <Grid item sx={{ px: 4, py: 3, borderBottom: `1px solid ${theme.palette.divider}` }} xs={12}>
        <Stack alignItems='flex-start' direction='row' justifyContent='space-between'>
          <Stack direction='column' spacing={0.5}>
            <Stack alignItems='center' direction='row' spacing={2}>
              <DexTokenIcon chainId={pair.chain_id} logoUrl={pair.logo_url} tokenAddress={pair.address} />
              <Typography variant='subtitle1'>{pair.name}</Typography>
            </Stack>
            <Stack alignItems='center' direction='row' spacing={2}>
              <Typography color='text.secondary' variant='small2'>
                {formatContractAddress(contractAddress)}
              </Typography>
              <Box component='span' sx={{ cursor: 'pointer' }} onClick={handleCopy}>
                {copied ? (
                  <CheckIcon color='success' sx={{ fontSize: '14px' }} />
                ) : (
                  <ContentCopyIcon sx={{ fontSize: '14px', color: 'text.secondary' }} />
                )}
              </Box>
            </Stack>
          </Stack>
          <Box sx={{ mt: '4px' }}>
            <SocialsPanel creationTime={marketInfo?.tokenCreateTime} socials={socials} />
          </Box>
        </Stack>
      </Grid>
      <Grid item sx={{ px: 2 }} xs={12}>
        <div>
          <Grid container spacing={1}>
            <Grid item sx={{ display: 'flex', flexDirection: 'column' }} xs={6}>
              <Paper
                elevation={1}
                sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                <Stack alignItems='flex-start' direction='column' spacing={1}>
                  <Typography color='text.secondary' variant='small2'>
                    Liquidity
                  </Typography>
                  <Typography variant='body2Strong'>{`$${formatNumber(marketInfo?.liquidity)}`}</Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item sx={{ display: 'flex', flexDirection: 'column' }} xs={6}>
              <Paper
                elevation={1}
                sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                <Stack alignItems='flex-start' direction='column' spacing={1}>
                  <Typography color='text.secondary' variant='small2'>
                    Circulating Supply
                  </Typography>
                  <Typography variant='body2Strong'>{`${formatNumber(marketInfo?.circulatingSupply)}`}</Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <BenchmarkCard label='Market Cap' value={`$${formatNumber(marketInfo?.marketCap)}`} />
            </Grid>
            <Grid item xs={6}>
              <BenchmarkCard label='FDV' value={`$${formatNumber(marketInfo?.fdv)}`} />
            </Grid>
          </Grid>
        </div>
      </Grid>

      <Grid item sx={{ p: 0 }} xs={12}>
        <Stack direction='column' spacing={0}>
          <TimeRangeSelector
            priceChange={{
              m5: marketInfo?.priceChange5M,
              h1: marketInfo?.priceChange1H,
              h4: marketInfo?.priceChange4H,
              h24: marketInfo?.priceChange,
            }}
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
            timeRanges={timeRanges}
          />
          <MetricsPanel theme={theme} tradingHistoryInfo={tradingHistoryInfo} />
        </Stack>
      </Grid>
    </Grid>
  );
}
