import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useTitle } from '@/shared/context/TitleProvider';
import { Box, Stack, Tooltip, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState, useRef } from 'react';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { getTokenPairLookup, getUserFavouritePairs, getFundingRates } from '@/apiServices';
import { ChainIcon } from '@/shared/components/Icons';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import ICONS from '../../../images/exchange_icons';
import getBaseTokenIcon from '../../../images/tokens';
import { formatPrice, formatQty, smartRound } from '../../util';
import { renderPriceWithSubscript } from '../../util/priceFormatting';
import { useMarketDataContext } from './orderEntry/MarketDataContext';
import PairSelector from './orderEntry/PairSelector';
import { usePriceDataContext } from './orderEntry/PriceDataContext';
import getDexTokenIcon from '../../../images/dex_tokens';
import { useFlashOnChange } from '../../theme/holographicEffects';

export function PairInfoBar({ exchangeName, selectedPairName, showAlert }) {
  const theme = useTheme();
  const {
    balances,
    favouritePairs,
    initialLoadValue,
    selectedAccounts,
    selectedPair,
    setSelectedPair,
    setTokenPairLookUp,
    setFavouritePairs,
  } = useOrderForm();
  const { livePairPrice, livePriceChange } = usePriceDataContext();
  const { tickerData } = useExchangeTicker();
  const { marketSummaryMetrics, noData, reloading } = useMarketDataContext();
  const { accounts, tokenPairs, tokens } = initialLoadValue;
  const [fundingRate, setFundingRate] = useState(null);
  const priceRef = useRef(null);

  const { user } = useUserMetadata();

  const { setTitle } = useTitle();

  const isToken = selectedPair?.chain_id !== undefined;

  useEffect(() => {
    if (livePairPrice && selectedPair) {
      setTitle(`${formatPrice(Number(livePairPrice))} - ${selectedPair?.label}`);
    }
  }, [livePairPrice, selectedPair]);

  const loadFavouritePairs = async () => {
    let pairs;

    try {
      const result = await getUserFavouritePairs();
      pairs = result.pairs;
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Unable to load favourite pairs: ${e.message}`,
      });
      return;
    }

    setFavouritePairs(
      pairs.reduce((acc, pair) => {
        return { ...acc, [pair]: true };
      }, {})
    );
  };

  const loadTokenPairLookup = async () => {
    let data;

    try {
      const result = await getTokenPairLookup();
      data = result.pairs;
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Unable to load token pair lookup: ${e.message}`,
      });
      return;
    }

    setTokenPairLookUp(data);
  };

  useEffect(() => {
    if (user && user.is_authenticated) {
      loadFavouritePairs();
      loadTokenPairLookup();
    }
  }, [user]);

  useEffect(() => {
    const fetchFundingRate = async () => {
      try {
        const result = await getFundingRates();
        // Extract base token name if pair has :PERP suffix
        const basePairName = selectedPairName.includes(':PERP') ? selectedPairName.split(':PERP')[0] : selectedPairName;

        const pairFundingRate = result.find((rate) => rate.pair === basePairName && rate.exchange === exchangeName);
        if (pairFundingRate) {
          setFundingRate(pairFundingRate.rate);
        } else {
          setFundingRate(null);
        }
      } catch (e) {
        // Silently handle funding rate fetch error
        setFundingRate(null);
      }
    };

    if (selectedPairName && exchangeName) {
      fetchFundingRate();
    }
  }, [selectedPairName, exchangeName]);

  const shortenNumber = (value) => {
    if (value >= 10 ** 6) {
      return value / 10 ** 6;
    }
    if (value >= 10 ** 3) {
      return value / 10 ** 3;
    }
    return value;
  };

  const getUnit = (value) => {
    if (value >= 10 ** 6) {
      return 'M';
    }
    if (value >= 10 ** 3) {
      return 'K';
    }

    return '';
  };

  const marketSummaryLabelStyle = {
    textDecoration: 'underline dotted',
    textDecorationThickness: '2px',
    textUnderlineOffset: '2px',
  };

  const buildMarketSummaryLines = () => {
    const ticker = tickerData && tickerData[selectedPairName];
    const priceDiff = ticker ? smartRound(ticker.pricePctChange24h, 2) : null;
    const volume = marketSummaryMetrics.past24Volume
      ? shortenNumber(marketSummaryMetrics.past24Volume).toFixed(2)
      : null;
    const evr = marketSummaryMetrics.evr ? marketSummaryMetrics.evr.toFixed(2) : null;
    const priceVolatility = marketSummaryMetrics.priceVolatility
      ? shortenNumber(marketSummaryMetrics.priceVolatility).toFixed(2)
      : null;
    const pv = marketSummaryMetrics.predictedVolume
      ? shortenNumber(marketSummaryMetrics.predictedVolume).toFixed(2)
      : null;
    const fundingRateValue = fundingRate ? ((fundingRate / 100) * 100).toFixed(4) : null;

    const lines = [
      {
        value: { number: priceDiff, unit: '%' },
        label: '24H Price',
        style: marketSummaryLabelStyle,
        tooltip: 'Change in price over last 24H',
      },
      {
        value: {
          number: volume,
          unit: getUnit(marketSummaryMetrics.past24Volume),
        },
        label: '24H Volume',
        style: marketSummaryLabelStyle,
        tooltip: 'Total reported volume in the last 24H',
      },
      {
        value: { number: priceVolatility, unit: '%' },
        label: '1H Volatility',
        style: marketSummaryLabelStyle,
        tooltip: 'Expected price volatility for the next hour',
      },
      {
        value: {
          number: pv,
          unit: getUnit(marketSummaryMetrics.predictedVolume),
        },
        label: '1H P.V.',
        style: marketSummaryLabelStyle,
        tooltip: 'Total predicted volume for the next hour',
      },
    ];

    // Only add funding rate if it exists for this pair
    if (fundingRate !== null) {
      lines.push({
        value: { number: fundingRateValue, unit: '%' },
        label: 'Funding Rate',
        style: marketSummaryLabelStyle,
        tooltip: 'Current funding rate per period',
      });
    }

    // Filter out lines with null values
    return lines.filter((line) => line.value.number !== null);
  };

  const evrColor = (value) => {
    if (value < 0.5) {
      return 'error.main';
    }
    if (value < 0.75) {
      return 'warning.main';
    }
    if (value <= 1) {
      return 'info.main';
    }
    return 'success.light';
  };

  const marketSummaryValueColor = (line) => {
    if (line.value.number === null) {
      return 'grey.main';
    }

    if (line.label.includes('E.V.R')) {
      return evrColor(line.value.number);
    }

    if (line.label.includes('Volume') || line.label.includes('Volatility') || line.label.includes('P.V.')) {
      return 'info.main';
    }

    if (line.label.includes('Funding Rate')) {
      return line.value.number >= 0 ? 'success.light' : 'error.main';
    }

    if (line.value.number >= 0) {
      return 'success.light';
    }

    return 'error.main';
  };

  const renderMarketSummaryValue = (line) => {
    let value = line.value.number;

    if (line.label.includes('Volatility')) {
      value = `\u00B1${line.value.number}`;
    } else if (line.label.includes('Price')) {
      value = `${value > 0 ? '+' : ''}${value}`;
    }

    return `${formatQty(value)}${line.value.unit}`;
  };

  // Custom price formatting for DEX tokens to avoid scientific notation
  const formatDexPrice = (price) => {
    if (!price) return '';

    const priceNum = Number(price);

    // For very small numbers, use more precision to avoid scientific notation
    let formatted;
    if (priceNum < 0.0001) {
      formatted = priceNum.toFixed(10);
    } else if (priceNum < 0.01) {
      formatted = priceNum.toFixed(6);
    } else if (priceNum < 1) {
      formatted = priceNum.toFixed(4);
    } else if (priceNum < 100) {
      formatted = priceNum.toFixed(2);
    } else {
      formatted = priceNum.toFixed(1);
    }

    // Remove trailing zeros after decimal point
    const cleanFormatted = formatted.replace(/\.?0+$/, '');

    // Add comma formatting for numbers >= 1000
    if (priceNum >= 1000) {
      return Number(cleanFormatted).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 10,
      });
    }

    return cleanFormatted;
  };

  const livePriceColor = () => {
    const currentPrice = livePairPrice;
    if (currentPrice === '') {
      return 'grey.main';
    }

    // Use DEX price change for DEX tokens, otherwise use market summary metrics
    const priceChange = isToken ? livePriceChange : marketSummaryMetrics.priceDiff;

    if (priceChange === undefined) {
      return 'text.primary';
    }

    return priceChange >= 0 ? 'success.light' : 'error.main';
  };

  const priceNumber = Number(livePairPrice);
  const { className: priceFlashClass } = useFlashOnChange(priceNumber);

  let pairDisplayIcon = null;
  if (selectedPair) {
    if (isToken) {
      pairDisplayIcon = getDexTokenIcon(selectedPair.address, selectedPair.chain_id);
      if (!pairDisplayIcon) {
        pairDisplayIcon = selectedPair.logo_url;
      }
    } else {
      pairDisplayIcon = getBaseTokenIcon(selectedPair.base);
    }
  }

  // Chain configuration for DEX display
  const CHAIN_CONFIGS = {
    1: { name: 'Ethereum', id: 1 },
    56: { name: 'BSC', id: 56 },
    8453: { name: 'Base', id: 8453 },
    501: { name: 'Solana', id: 501 },
  };

  // Format contract address for display
  const formatContractAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Copy contract address to clipboard
  const copyContractAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      showAlert({
        severity: 'success',
        message: 'Contract address copied to clipboard',
      });
    } catch (err) {
      showAlert({
        severity: 'error',
        message: 'Failed to copy contract address',
      });
    }
  };

  return (
    <Box
      display='flex'
      flexDirection='row'
      gap={2}
      height='100%'
      sx={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      width='100%'
    >
      <Box alignItems='center' display='flex' gap={2}>
        {pairDisplayIcon && (
          <Box alignItems='center' display='flex' paddingX='8px' position='relative'>
            <img
              alt='Token Icon'
              src={pairDisplayIcon}
              style={{ height: '30px', width: '30px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <Box alignItems='center' bottom={0} display='flex' position='absolute' right={0}>
              {isToken ? (
                <ChainIcon chainId={selectedPair.chain_id} style={{ height: '15px', width: '15px' }} />
              ) : (
                <img
                  alt={exchangeName}
                  src={ICONS[exchangeName.toLowerCase()]}
                  style={{ height: '15px', width: '15px', borderRadius: '50%' }}
                />
              )}
            </Box>
          </Box>
        )}
        <div style={{ cursor: 'pointer' }}>
          <PairSelector
            accounts={accounts}
            balances={balances}
            favourites={favouritePairs}
            pairs={tokenPairs}
            selectedAccounts={selectedAccounts}
            selectedPairName={selectedPairName}
            setFavourites={setFavouritePairs}
            setSelectedPair={setSelectedPair}
            showAlert={showAlert}
            tokens={tokens}
          />
        </div>
      </Box>
      <Stack alignItems='center' direction='row' flexGrow={1} gap={4} justifyContent='start'>
        {/* DEX Token Information Display */}
        {isToken && selectedPair && (
          <>
            {/* Large Price Display for DEX */}
            <Box alignSelf='center' paddingX='10px'>
              <Typography
                className={priceFlashClass}
                color={livePriceColor()}
                fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                ref={priceRef}
                textAlign='left'
                variant='h3'
              >
                {livePairPrice ? renderPriceWithSubscript(formatDexPrice(livePairPrice)) : ''}
              </Typography>
            </Box>

            {/* DEX Token Details */}
            <Stack alignItems='center' direction='row' gap={3}>
              {/* 24H Change */}
              <Tooltip
                title={`24-hour price change: ${livePriceChange !== undefined ? `${livePriceChange >= 0 ? '+' : ''}${livePriceChange}%` : 'N/A'}`}
              >
                <Box display='flex' flexDirection='column' flexGrow='0'>
                  <Typography
                    color='grey.main'
                    style={marketSummaryLabelStyle}
                    textAlign='left'
                    textOverflow='ellipsis'
                    variant='body2'
                    whiteSpace='nowrap'
                  >
                    24H Change
                  </Typography>
                  <Typography
                    color={livePriceChange >= 0 ? 'success.light' : 'error.main'}
                    fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                    sx={{
                      paddingRight: '15px',
                    }}
                    textAlign='left'
                    variant='body1'
                  >
                    {livePriceChange !== undefined ? `${livePriceChange >= 0 ? '+' : ''}${livePriceChange}%` : 'N/A'}
                  </Typography>
                </Box>
              </Tooltip>

              {/* Full Name */}
              <Tooltip title={`Full token name: ${selectedPair.name || selectedPair.base}`}>
                <Box display='flex' flexDirection='column' flexGrow='0'>
                  <Typography
                    color='grey.main'
                    style={marketSummaryLabelStyle}
                    textAlign='left'
                    textOverflow='ellipsis'
                    variant='body2'
                    whiteSpace='nowrap'
                  >
                    Token Name
                  </Typography>
                  <Typography
                    color='text.primary'
                    fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                    sx={{
                      paddingRight: '15px',
                    }}
                    textAlign='left'
                    variant='body1'
                  >
                    {selectedPair.name || selectedPair.base}
                  </Typography>
                </Box>
              </Tooltip>

              {/* Contract Address */}
              <Tooltip title={`Contract address: ${selectedPair.address}`}>
                <Box display='flex' flexDirection='column' flexGrow='0'>
                  <Typography
                    color='grey.main'
                    style={marketSummaryLabelStyle}
                    textAlign='left'
                    textOverflow='ellipsis'
                    variant='body2'
                    whiteSpace='nowrap'
                  >
                    Contract
                  </Typography>
                  <Box alignItems='center' display='flex' gap={0.5}>
                    <Typography
                      color='info.main'
                      fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                      sx={{
                        paddingRight: '2px',
                      }}
                      textAlign='left'
                      variant='body1'
                    >
                      {formatContractAddress(selectedPair.address)}
                    </Typography>
                    <IconButton
                      size='small'
                      sx={{
                        color: 'grey.main',
                        padding: '1px',
                        '&:hover': {
                          backgroundColor: 'rgba(158, 158, 158, 0.1)',
                        },
                      }}
                      onClick={() => copyContractAddress(selectedPair.address)}
                    >
                      <ContentCopyIcon sx={{ fontSize: '14px' }} />
                    </IconButton>
                  </Box>
                </Box>
              </Tooltip>

              {/* Chain */}
              <Tooltip title={`Blockchain: ${CHAIN_CONFIGS[selectedPair.chain_id]?.name || 'Unknown'}`}>
                <Box display='flex' flexDirection='column' flexGrow='0'>
                  <Typography
                    color='grey.main'
                    style={marketSummaryLabelStyle}
                    textAlign='left'
                    textOverflow='ellipsis'
                    variant='body2'
                    whiteSpace='nowrap'
                  >
                    Chain
                  </Typography>
                  <Box alignItems='center' display='flex' gap={1}>
                    <ChainIcon chainId={selectedPair.chain_id} style={{ height: '16px', width: '16px' }} />
                    <Typography
                      color='text.primary'
                      fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                      sx={{
                        paddingRight: '15px',
                      }}
                      textAlign='left'
                      variant='body1'
                    >
                      {CHAIN_CONFIGS[selectedPair.chain_id]?.name || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Stack>
          </>
        )}

        {/* Price display for non-DEX pairs */}
        {!isToken && (
          <Box alignSelf='center' paddingX='10px'>
            <Typography
              className={priceFlashClass}
              color={livePriceColor()}
              fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
              ref={priceRef}
              textAlign='left'
              variant='h3'
            >
              {livePairPrice ? renderPriceWithSubscript(formatDexPrice(livePairPrice)) : ''}
            </Typography>
          </Box>
        )}

        {!noData &&
          !reloading &&
          Object.keys(marketSummaryMetrics).length > 0 &&
          buildMarketSummaryLines().map((line) => (
            <Tooltip key={line.label} title={line.tooltip}>
              <Box display='flex' flexDirection='column' flexGrow='0'>
                <Typography
                  color='grey.main'
                  style={line.style || {}}
                  textAlign='left'
                  textOverflow='ellipsis'
                  variant='body2'
                  whiteSpace='nowrap'
                >
                  {line.label}
                </Typography>
                <Typography
                  color={() => marketSummaryValueColor(line)}
                  fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                  sx={{
                    paddingRight: '15px',
                  }}
                  textAlign='left'
                  variant='body1'
                >
                  {renderMarketSummaryValue(line)}
                </Typography>
              </Box>
            </Tooltip>
          ))}
      </Stack>
    </Box>
  );
}
