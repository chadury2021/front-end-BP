import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import SouthEastIcon from '@mui/icons-material/SouthEast';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { isEmpty, numberWithCommas, smartRound } from '@/util';
import { Card, CardContent } from '@mui/material';
import { CASH_ASSETS } from '@/constants';
import { useState, useEffect, useMemo } from 'react';
import { getAccountBalanceHistory } from '@/apiServices';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import DataComponent from '@/shared/DataComponent';
import { ThinLoader } from '@/shared/Loader';
import LabelTooltip from '@/shared/components/LabelTooltip';
import DownloadIcon from '@mui/icons-material/Download';
import { balanceToRow } from '../util';
import AssetAreaChart from './AssetAreaChart';
import { MarketTypeTable } from './MarketTypeTable';
import CloseBalanceButton from '../CloseBalanceButton';
import LiquidationRiskPanel from './LiquidationRiskPanel';
import { isMarginedAsset } from './tableUtils';
import LegendToggle from './LegendToggle';

const isStablecoin = (symbol) => CASH_ASSETS.includes(symbol);

function SubTitleTypography(props) {
  return <Typography color='text.subtitle' fontWeight={300} variant='body1' {...props} />;
}

function CurrencyTitleTypography(props) {
  return <Typography fontWeight={300} variant='subtitle1' {...props} />;
}

function pnlDisplayValue(value) {
  let color = 'text.primary';
  if (value > 0) {
    color = 'success.main';
  }
  if (value < 0) {
    color = 'error.main';
  }

  return (
    <Stack alignItems='baseline' direction='row' spacing={4}>
      <Typography color={color} fontWeight={400} variant='h4'>
        {value > 0 ? '+' : ''}
        {numberWithCommas(smartRound(value, 2))}
      </Typography>
      <CurrencyTitleTypography>USDT</CurrencyTitleTypography>
    </Stack>
  );
}

function pnlDisplayPercentage(value, isOneDay = false) {
  if (value === undefined || value === null) {
    return null;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;

  // Colour & arrow selection
  let color = 'text.primary';
  if (isPositive) {
    color = 'success.main';
  } else if (isNegative) {
    color = 'error.main';
  }
  const ArrowIcon = isNegative ? SouthEastIcon : ArrowOutwardIcon;

  return (
    <Stack alignItems='baseline' direction='row' spacing={2}>
      <ArrowIcon
        fontSize='small'
        sx={{
          alignSelf: 'center',
          color,
        }}
      />
      <Typography color={color} variant='body1'>
        {`${Number(value).toFixed(2)}%`}
      </Typography>
      <Typography variant='body1'>{isOneDay ? '1d' : '7d'}</Typography>
    </Stack>
  );
}

const calculatePnl = (assets) => {
  return assets.reduce((acc, asset) => {
    // Skip stablecoins
    if (isStablecoin(asset.symbol)) {
      return acc;
    }
    if (asset.unrealized_profit) {
      return acc + Number(asset.unrealized_profit);
    }
    return acc;
  }, 0);
};

const calculateTotalValue = (assets) => {
  return assets.reduce((acc, asset) => {
    // Skip stablecoins
    if (isStablecoin(asset.symbol)) {
      return acc;
    }
    return acc + (Number(asset.notional) || 0);
  }, 0);
};

const calculateROI = (pnl, value) => {
  if (!value || value === 0) return 0;
  return (Number(pnl) / Math.abs(Number(value))) * 100;
};

const ONE_YEAR_TIME_FRAME = 'one_year';
const THIRTY_DAYS_TIME_FRAME = 'thirty_days';
const SEVEN_DAYS_TIME_FRAME = 'seven_days';
const ONE_DAY_TIME_FRAME = 'one_day';

function AccountOverviewComponent({ accountBalances, selectedAccount, assets, pastSnapshots }) {
  const theme = useTheme();
  const [balanceHistory, setBalanceHistory] = useState({
    one_day: [],
    seven_days: [],
    thirty_days: [],
    one_year: [],
  });
  const [balanceHistoryLoading, setBalanceHistoryLoading] = useState(false);
  const [balanceHistoryTimeFrame, setBalanceHistoryTimeFrame] = useState(SEVEN_DAYS_TIME_FRAME);
  // Chart series visibility toggles for Total Equity & GMV
  const [showEquitySeries, setShowEquitySeries] = useState(true);
  const [showGmvSeries, setShowGmvSeries] = useState(true);
  const selectedAccountId = selectedAccount.accountId;
  const selectedAccountObj = accountBalances.find((obj) => obj.account_id === selectedAccountId);
  const selectedBalance = selectedAccountId ? accountBalances.find((a) => a.account_id === selectedAccountId) : {};
  const row = balanceToRow(selectedAccountObj, pastSnapshots);
  const totalPnl = calculatePnl(selectedAccountObj.assets);
  const totalValue = calculateTotalValue(selectedAccountObj.assets);
  const roiPercentage = calculateROI(totalPnl, totalValue);
  const { transfers } = selectedAccountObj;

  const exchange = selectedAccountObj.exchange_name;
  const { weekAgoDiffPercentage, dayAgoDiffPercentage } = row;
  const isDex = selectedAccount.exchangeName === 'OKXDEX';
  const hasPerpPositions = selectedAccountObj.assets?.some((a) => a.asset_type === 'position');

  const loadBalanceHistory = async () => {
    setBalanceHistoryLoading(true);
    try {
      const res = await getAccountBalanceHistory(selectedAccountId);
      setBalanceHistory(res);
    } catch (error) {
      // nothing to do
    } finally {
      setBalanceHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadBalanceHistory();
  }, [selectedAccountId]);

  const handleDownloadEquityCsv = () => {
    const url = `${window.location.origin}/internal/account/account_balance_history_csv?account_id=${encodeURIComponent(selectedAccountId)}`;
    window.open(url, '_blank');
  };

  const calculateDirectionalBias = (assetsList) => {
    const directionalBias = assetsList.reduce(
      (acc, asset) => {
        let notional = Number(asset.notional) || 0;

        // Use margin-adjusted notional for spot margin assets (not perps)
        if (!isStablecoin(asset.symbol)) {
          const isSpotMargin = isMarginedAsset(asset);
          // Only apply margin adjustment for spot assets, not perpetual futures
          if (isSpotMargin && asset.margin_balance && asset.market_type === 'spot') {
            const originalNotional = Number(asset.notional) || 0;
            const originalQuantity = Number(asset.amount) || 0;
            if (originalQuantity !== 0) {
              const markPrice = originalNotional / originalQuantity;
              notional = markPrice * Number(asset.margin_balance);
            }
          }

          if (notional > 0) {
            acc.long += notional;
          } else if (notional < 0) {
            acc.short += Math.abs(notional);
          }
          return acc;
        }

        // For cash (stablecoins), treat negative cash as short exposure
        const balance = Number(asset.amount) || 0;
        const borrowed = Number(asset.borrowed || 0);
        const netCash = balance - borrowed;
        if (netCash < 0) {
          acc.short += Math.abs(netCash);
        }
        return acc;
      },
      { long: 0, short: 0 }
    );

    // Sum net cash to use as normalization base (use absolute value to handle negative cash)
    const cashBalance = assetsList.reduce((acc, asset) => {
      if (isStablecoin(asset.symbol)) {
        const balance = Number(asset.amount) || 0;
        const borrowed = Number(asset.borrowed || 0);
        return acc + (balance - borrowed);
      }
      return acc;
    }, 0);

    const denom = Math.abs(cashBalance);
    const normalizedLong = denom > 0 ? (directionalBias.long / denom) * 100 : 0;
    const normalizedShort = denom > 0 ? (directionalBias.short / denom) * 100 : 0;

    const isNeutral = normalizedLong - normalizedShort === 0;
    let longShortRatio = 50;

    const isLongBias = normalizedLong > normalizedShort;
    if (!isNeutral) {
      longShortRatio = isLongBias
        ? (normalizedLong / (normalizedLong + normalizedShort)) * 100
        : (normalizedShort / (normalizedLong + normalizedShort)) * 100;
    }

    return {
      normalizedLong,
      normalizedShort,
      longShortRatio,
      isLongBias,
      isNeutral,
    };
  };

  const getBiasText = (isNeutral, isLongBias) => {
    if (isNeutral) return 'Delta Neutral';
    if (isLongBias) return 'Long Bias';
    if (!isLongBias) return 'Short Bias';
    return 'Delta Neutral';
  };

  const getBiasColor = (isNeutral, isLongBias) => {
    if (isNeutral) return 'text.primary';
    if (isLongBias) return 'success.main';
    if (!isLongBias) return 'error.main';
    return 'text.primary';
  };

  const getTotalVolumeColor = (totalVolume) => {
    if (totalVolume > 0) return 'success.main';
    if (totalVolume < 0) return 'error.main';
    return 'text.primary';
  };

  const { longShortRatio, isNeutral, isLongBias } = calculateDirectionalBias(selectedAccountObj.assets);

  const totalVolume = selectedAccountObj.assets.reduce((acc, asset) => {
    if (isStablecoin(asset.symbol)) {
      const balance = Number(asset.amount) || 0;
      const borrowed = Number(asset.borrowed || 0);
      const netCash = balance - borrowed;
      // Include negative cash as short exposure (subtract magnitude)
      if (netCash < 0) {
        return acc - Math.abs(netCash);
      }
      return acc;
    }

    // Use margin-adjusted notional for spot margin assets (not perps)
    let notional = Number(asset.notional) || 0;
    const isSpotMargin = isMarginedAsset(asset);
    // Only apply margin adjustment for spot assets, not perpetual futures
    if (isSpotMargin && asset.margin_balance && asset.market_type === 'spot') {
      const originalNotional = Number(asset.notional) || 0;
      const originalQuantity = Number(asset.amount) || 0;
      if (originalQuantity !== 0) {
        const markPrice = originalNotional / originalQuantity;
        notional = markPrice * Number(asset.margin_balance);
      }
    }

    return acc + notional;
  }, 0);

  // Subtract Unrealized PnL from the displayed directional bias value
  const directionalBiasValue = totalVolume - totalPnl;

  const getPnlPercentageColor = (value) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  const balanceHistoryData = balanceHistory?.[balanceHistoryTimeFrame] || [];

  // Filter transfers based on selected time frame
  const filteredTransfers = useMemo(() => {
    if (!transfers || transfers.length === 0) return [];

    const now = new Date();
    let cutoffDate;

    switch (balanceHistoryTimeFrame) {
      case ONE_DAY_TIME_FRAME:
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        break;
      case SEVEN_DAYS_TIME_FRAME:
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case THIRTY_DAYS_TIME_FRAME:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        break;
      case ONE_YEAR_TIME_FRAME:
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
        break;
      default:
        return transfers;
    }

    return transfers.filter((transfer) => {
      // Ensure transfer has a valid timestamp
      if (!transfer || !transfer.timestamp) return false;

      try {
        const transferDate = new Date(transfer.timestamp);
        // Check if the date is valid
        if (Number.isNaN(transferDate.getTime())) return false;

        return transferDate >= cutoffDate;
      } catch (error) {
        return false;
      }
    });
  }, [transfers, balanceHistoryTimeFrame]);

  const renderThirdRow = () => {
    if (isDex) {
      return null;
    }

    return (
      <Stack direction='row' spacing={2} sx={{ width: '100%' }}>
        <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
          <CardContent>
            <Stack direction='column' spacing={2}>
              <SubTitleTypography>Notional Exposure</SubTitleTypography>
              <Box sx={{ height: '225px' }}>
                <DataComponent
                  emptyComponent={<Typography>No data</Typography>}
                  hasError={false}
                  isEmpty={!balanceHistoryData || balanceHistoryData.length === 0}
                  isLoading={balanceHistoryLoading}
                  loadingComponent={<ThinLoader />}
                >
                  <AssetAreaChart balanceData={balanceHistoryData} />
                </DataComponent>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
          <CardContent>
            <Stack direction='column' spacing={2}>
              <SubTitleTypography>Unrealized PnL</SubTitleTypography>
              <Box sx={{ height: '225px' }}>
                <DataComponent
                  emptyComponent={<Typography>No data</Typography>}
                  hasError={false}
                  isEmpty={!balanceHistoryData || balanceHistoryData.length === 0}
                  isLoading={balanceHistoryLoading}
                  loadingComponent={<ThinLoader />}
                >
                  <AssetAreaChart balanceData={balanceHistoryData} dataField='total_unrealized_pnl' />
                </DataComponent>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        {hasPerpPositions && (
          <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
            <CardContent>
              <Stack direction='column' spacing={2}>
                <LabelTooltip
                  label='Liquidation Risk'
                  link='https://www.binance.com/en/support/faq/detail/4868b2f1aa6c4d08af973328462bb0bd'
                  title='Based on Binance MMR (Maintenance Margin Ratio). MMR = Maintenance Margin / Wallet Balance × 100%. Lower MMR = safer position, higher MMR = closer to liquidation.'
                />
                <Box sx={{ height: '225px' }}>
                  <LiquidationRiskPanel accountBalance={selectedAccountObj} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  };

  return (
    <Stack direction='column' spacing={2} sx={{ p: 2 }}>
      <Stack direction='row' spacing={2} sx={{ width: '100%' }}>
        <Card sx={{ bgcolor: 'background.paper', flex: 1, height: '110px' }}>
          <CardContent>
            <Stack direction='column' spacing={1}>
              <SubTitleTypography>
                <LabelTooltip
                  label='Total Equity'
                  link='https://docs.tread.fi/portfolio/portfolio-tab'
                  title='Your current overall portfolio value, representing the sum of your cash, spot asset holdings, and the net profit or loss from all your open perpetual futures positions.'
                />
              </SubTitleTypography>
              <Stack alignItems='baseline' direction='row' spacing={4}>
                <Typography fontWeight={400} variant='h4'>
                  {numberWithCommas(smartRound(selectedAccountObj?.totalValue, 2))}
                </Typography>
                <CurrencyTitleTypography>USD</CurrencyTitleTypography>
                <Box sx={{ flexGrow: 1 }} />
              </Stack>
              <Stack alignItems='baseline' direction='row' spacing={4}>
                {pnlDisplayPercentage(dayAgoDiffPercentage, true)}
                {pnlDisplayPercentage(weekAgoDiffPercentage)}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'background.paper', flex: 1, height: '110px' }}>
          <CardContent>
            <Stack direction='column' spacing={1}>
              <SubTitleTypography>
                <LabelTooltip
                  label='Directional Bias'
                  link='https://tread-labs.gitbook.io/api-docs/portfolio'
                  title="Your portfolio's overall lean towards long or short positions."
                />
              </SubTitleTypography>
              <Stack alignItems='baseline' direction='row' spacing={4}>
                <Typography color={getTotalVolumeColor(directionalBiasValue)} fontWeight={400} variant='h4'>
                  {directionalBiasValue > 0 ? '+' : ''}
                  {numberWithCommas(smartRound(directionalBiasValue, 2))}
                </Typography>
                <CurrencyTitleTypography>USDT</CurrencyTitleTypography>
              </Stack>
              <Stack alignItems='baseline' direction='row' spacing={4}>
                <Typography fontWeight={300} variant='body1'>
                  <Typography
                    color={getBiasColor(isNeutral, isLongBias)}
                    component='span'
                    fontWeight={300}
                    variant='body1'
                  >
                    {getBiasText(isNeutral, isLongBias)}
                  </Typography>{' '}
                  {numberWithCommas(smartRound(longShortRatio, 2))}% Adjusted L/S
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        {!isDex && (
          <Card sx={{ bgcolor: 'background.paper', flex: 1, height: '110px' }}>
            <CardContent>
              <Stack direction='column' spacing={1}>
                <SubTitleTypography>
                  <LabelTooltip
                    label='Unrealized PnL'
                    link='https://tread-labs.gitbook.io/api-docs/portfolio'
                    title='The current profit or loss on your open positions.'
                  />
                </SubTitleTypography>
                {pnlDisplayValue(totalPnl)}
                <Stack alignItems='baseline' direction='row' spacing={2}>
                  <Typography color={getPnlPercentageColor(roiPercentage)} variant='body1'>
                    {totalValue !== 0 ? `${Number(roiPercentage).toFixed(2)}%` : '-'}
                  </Typography>
                  <Typography variant='body1'>ROI</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
      <Stack direction='row' spacing={2} sx={{ width: '100%' }}>
        <Card sx={{ bgcolor: 'background.paper', flex: 1, position: 'relative' }}>
          <CardContent>
            <Box position='relative'>
              <Stack direction='row' spacing={1} sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
                <ToggleButtonGroup
                  exclusive
                  color='primary'
                  size='small'
                  value={balanceHistoryTimeFrame}
                  onChange={(e, newValue) => {
                    if (newValue !== null) {
                      setBalanceHistoryTimeFrame(newValue);
                    }
                  }}
                >
                  <ToggleButton sx={{ px: 4 }} value={ONE_DAY_TIME_FRAME}>
                    1d
                  </ToggleButton>
                  <ToggleButton sx={{ px: 4 }} value={SEVEN_DAYS_TIME_FRAME}>
                    7d
                  </ToggleButton>
                  <ToggleButton sx={{ px: 3 }} value={THIRTY_DAYS_TIME_FRAME}>
                    30d
                  </ToggleButton>
                  <ToggleButton sx={{ px: 4 }} value={ONE_YEAR_TIME_FRAME}>
                    1y
                  </ToggleButton>
                </ToggleButtonGroup>
                <Button
                  startIcon={<DownloadIcon />}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    color: theme.palette.text.primary,
                    borderColor: theme.palette.text.primary,
                    '&:hover': {
                      borderColor: theme.palette.text.primary,
                      backgroundColor: `${theme.palette.grey[600]}1A`, // 10% opacity
                    },
                  }}
                  variant='outlined'
                  onClick={handleDownloadEquityCsv}
                >
                  CSV
                </Button>
              </Stack>
              <Stack direction='column' spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SubTitleTypography>
                    <LegendToggle
                      active={showEquitySeries}
                      activeColor={theme.palette.text.primary}
                      docLink='https://docs.tread.fi/portfolio/portfolio-tab'
                      docTooltip='About Total Equity'
                      inactiveColor='text.disabled'
                      label='Total Equity'
                      title='Your total portfolio value, including cash, spot holdings, and the net profit/loss from your perpetual futures. This matches the Total Equity calculation shown above.'
                      onToggle={() => setShowEquitySeries((v) => !v)}
                    />
                  </SubTitleTypography>
                  <SubTitleTypography sx={{ ml: 2 }}>
                    <LegendToggle
                      active={showGmvSeries}
                      activeColor='primary.main'
                      docLink='https://docs.tread.fi/portfolio/portfolio-tab'
                      docTooltip='About GMV'
                      inactiveColor='text.disabled'
                      label='Gross Market Value (GMV)'
                      title='The sum of the absolute value of all your open positions (including futures, perpetuals, and options), indicating total market exposure.'
                      onToggle={() => setShowGmvSeries((v) => !v)}
                    />
                  </SubTitleTypography>
                </Box>
                <Box sx={{ height: '200px' }}>
                  <DataComponent
                    emptyComponent={<Typography>No data</Typography>}
                    hasError={false}
                    isEmpty={!balanceHistoryData || balanceHistoryData.length === 0}
                    isLoading={balanceHistoryLoading}
                    loadingComponent={<ThinLoader />}
                  >
                    <AssetAreaChart
                      additionalDataField='gmv'
                      balanceData={balanceHistoryData}
                      dataField='total_equity'
                      showAdditional={showGmvSeries}
                      showMain={showEquitySeries}
                      transfers={filteredTransfers}
                    />
                  </DataComponent>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
      {renderThirdRow()}
      <Stack direction='column' paddingX={4} spacing={4} sx={{ flex: 2 }}>
        {isEmpty(assets) ? (
          <Box alignItems='center' display='flex' justifyContent='center' sx={{ pt: 4 }} width='100%'>
            <Typography variant='h5'>No assets found</Typography>
          </Box>
        ) : (
          <>
            <MarketTypeTable assets={assets} exchange={exchange} />
            {exchange !== 'OKXDEX' && (
              <CloseBalanceButton selectedAccount={selectedAccount} selectedBalance={selectedBalance} />
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
}

export default AccountOverviewComponent;
