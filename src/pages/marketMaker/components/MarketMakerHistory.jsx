import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { ExchangeIcon } from '@/shared/components/Icons';
import { msAndKs, insertEllipsis } from '@/util';
import AnimatedNumber, { formatMsAndKsValue } from '@/shared/components/AnimatedNumber';
import { useInitialLoadData } from '@/shared/context/InitialLoadDataProvider';
import ProgressBar from '@/shared/fields/ProgressBar/ProgressBar';
import { useThemeContext } from '@/theme/ThemeContext';
import { useTheme } from '@emotion/react';
import { alpha } from '@mui/material/styles';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import ShareIcon from '@mui/icons-material/Share';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo';
import { hydrateMultiOrderResubmit } from '@/shared/orderTable/multiOrderResubmitUtils';
import { submitMultiOrder, cancelMultiOrder, changeMarketMakerSpread } from '@/apiServices';
import { useToast } from '@/shared/context/ToastProvider';
import { useSound } from '@/hooks/useSound';
import ICONS from '@/../images/exchange_icons';
import getBaseTokenIcon from '@/../images/tokens';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import MarketMakerShareableModal from './MarketMakerShareableModal';

const TWO_DECIMAL_PLACES = 2;

// Helper component to format numbers with grey decimal digits
function FormattedNumberWithGreyDecimals({ value, isActive, theme }) {
  // For static numbers, split and style the decimal part
  const formatted = msAndKs(value, TWO_DECIMAL_PLACES);
  // Match pattern: digits.decimalDigits(suffix like K, M, B, etc.)
  // Updated regex to properly match: integer part, decimal point + decimals, and suffix
  const match = formatted.match(/^(\d+)(\.\d{1,2})?([KMBTQ]?)$/);

  if (isActive) {
    // For animated numbers, we need to split the formatted value properly
    // Use the static formatted string to get the correct split, then animate the integer part
    if (match) {
      const [, integerPart, decimalPart = '', suffix] = match;
      const formattedValue = formatMsAndKsValue(value);

      return (
        <>
          {formattedValue.prefix || ''}
          <AnimatedNumber
            decimals={0}
            formatter={() => ({ numericValue: parseFloat(integerPart) })}
            value={parseFloat(integerPart)}
          />
          {decimalPart && <span style={{ color: theme.palette.text.secondary }}>{decimalPart}</span>}
          {suffix}
        </>
      );
    }
    // Fallback to regular animated number
    return <AnimatedNumber formatter={formatMsAndKsValue} value={value} />;
  }

  // For static numbers, split and style the decimal part
  if (match) {
    const [, integerPart, decimalPart = '', suffix] = match;
    return (
      <>
        {integerPart}
        {decimalPart && <span style={{ color: theme.palette.text.secondary }}>{decimalPart}</span>}
        {suffix}
      </>
    );
  }
  return formatted;
}

const DIRECTIONAL_BIAS_ALPHA_FACTOR = 0.2; // +/-1 bias -> +/-0.2 alpha tilt

const clampBias = (value) => {
  if (!Number.isFinite(value)) return null;
  return Math.max(-1, Math.min(1, value));
};

const deriveDirectionalBias = (childOrders = []) => {
  if (!Array.isArray(childOrders) || childOrders.length === 0) return null;

  const parseAlpha = (order) => {
    const alphaValue = Number(order?.alpha_tilt);
    return Number.isFinite(alphaValue) ? alphaValue : null;
  };

  const buyAlpha = parseAlpha(childOrders.find((child) => child.side === 'buy'));
  const sellAlpha = parseAlpha(childOrders.find((child) => child.side === 'sell'));

  if (buyAlpha !== null && sellAlpha !== null) {
    const biasAlpha = buyAlpha - sellAlpha;
    return clampBias(biasAlpha / DIRECTIONAL_BIAS_ALPHA_FACTOR);
  }

  if (buyAlpha !== null) {
    return clampBias(buyAlpha / DIRECTIONAL_BIAS_ALPHA_FACTOR);
  }

  if (sellAlpha !== null) {
    return clampBias(-sellAlpha / DIRECTIONAL_BIAS_ALPHA_FACTOR);
  }

  return null;
};

// Component for 3 horizontal lines (used for grid mode)
function ThreeHorizontalLines({ color, fontSize = '0.875rem' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2px',
        color,
        height: fontSize,
      }}
    >
      <Box
        sx={{
          width: fontSize,
          height: '1.5px',
          backgroundColor: 'currentColor',
          borderRadius: '1px',
        }}
      />
      <Box
        sx={{
          width: fontSize,
          height: '1.5px',
          backgroundColor: 'currentColor',
          borderRadius: '1px',
        }}
      />
      <Box
        sx={{
          width: fontSize,
          height: '1.5px',
          backgroundColor: 'currentColor',
          borderRadius: '1px',
        }}
      />
    </Box>
  );
}

// Component for 2 horizontal lines (used for spread mode)
function TwoHorizontalLines({ color, fontSize = '0.875rem' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2px',
        color,
        height: fontSize,
      }}
    >
      <Box
        sx={{
          width: fontSize,
          height: '1.5px',
          backgroundColor: 'currentColor',
          borderRadius: '1px',
        }}
      />
      <Box
        sx={{
          width: fontSize,
          height: '1.5px',
          backgroundColor: 'currentColor',
          borderRadius: '1px',
        }}
      />
    </Box>
  );
}

// Component for 1 horizontal line (used for normal mode)
function OneHorizontalLine({ color, fontSize = '0.875rem' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color,
        height: fontSize,
      }}
    >
      <Box
        sx={{
          width: fontSize,
          height: '1.5px',
          backgroundColor: 'currentColor',
          borderRadius: '1px',
        }}
      />
    </Box>
  );
}

// Component to render mode icons
function ModeIcons({ guaranteePnl, directionalBias, chaseDecay, enginePassiveness, theme }) {
  const icons = [];
  const parameters = [];

  // Icon 1: Grid mode OR Execution mode (Aggressive/Normal/Passive)
  if (guaranteePnl) {
    // Grid mode
    icons.push({
      icon: <ThreeHorizontalLines color={theme.palette.warning.main} fontSize='0.875rem' />,
      tooltip: 'Grid Mode',
    });
    parameters.push('Grid Mode');
  } else if (
    enginePassiveness !== null &&
    enginePassiveness !== undefined &&
    Number.isFinite(Number(enginePassiveness))
  ) {
    // Execution mode (only if not grid)
    const passiveness = Number(enginePassiveness);
    if (Math.abs(passiveness - 0.04) < 0.01) {
      // Normal mode - show 1 white line
      icons.push({
        icon: <OneHorizontalLine color={theme.palette.common.white} fontSize='0.875rem' />,
        tooltip: 'Normal Mode',
      });
      parameters.push(`Normal Mode (passiveness: ${passiveness})`);
    } else if (Math.abs(passiveness - 0.02) < 0.01) {
      // Aggressive mode - yellow bolt
      icons.push({
        icon: <FlashOnIcon sx={{ fontSize: '0.875rem', color: theme.palette.warning.main }} />,
        tooltip: 'Aggressive Mode',
      });
      parameters.push(`Aggressive Mode (passiveness: ${passiveness})`);
    } else if (Math.abs(passiveness - 0.1) < 0.01) {
      // Passive mode - green turtle
      icons.push({
        icon: <SlowMotionVideoIcon sx={{ fontSize: '0.875rem', color: theme.palette.success.main }} />,
        tooltip: 'Passive Mode',
      });
      parameters.push(`Passive Mode (passiveness: ${passiveness})`);
    } else {
      parameters.push(`Passiveness: ${passiveness}`);
    }
  }

  // Icon 2: Bias (Long/Neutral/Short) - can be with grid or without
  if (directionalBias !== null && directionalBias !== undefined && Number.isFinite(Number(directionalBias))) {
    const bias = Number(directionalBias);
    if (bias > 0.1) {
      icons.push({
        icon: <ArrowUpwardIcon sx={{ fontSize: '0.875rem', color: theme.palette.success.main }} />,
        tooltip: 'Long Bias',
      });
      parameters.push(`Long Bias: ${bias.toFixed(2)}`);
    } else if (bias < -0.1) {
      icons.push({
        icon: <ArrowDownwardIcon sx={{ fontSize: '0.875rem', color: theme.palette.error.main }} />,
        tooltip: 'Short Bias',
      });
      parameters.push(`Short Bias: ${bias.toFixed(2)}`);
    } else {
      // Neutral bias (close to 0)
      icons.push({
        icon: <HorizontalRuleIcon sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }} />,
        tooltip: 'Neutral Bias',
      });
      parameters.push(`Neutral Bias: ${bias.toFixed(2)}`);
    }
  }

  // Additional parameters for tooltip (not shown as icons)
  if (chaseDecay !== null && chaseDecay !== undefined && Number.isFinite(Number(chaseDecay))) {
    parameters.push(`Reaction Time: ${chaseDecay}s`);
  }

  if (icons.length === 0) {
    return null;
  }

  const tooltipContent = parameters.length > 0 ? parameters.join('\n') : 'Mode parameters';

  return (
    <Tooltip
      title={
        <Box component='div' sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {tooltipContent}
        </Box>
      }
    >
      <Stack alignItems='center' direction='row' spacing={0.5}>
        {icons.map((item) => (
          <Box key={item.tooltip} sx={{ display: 'flex', alignItems: 'center' }}>
            {item.icon}
          </Box>
        ))}
      </Stack>
    </Tooltip>
  );
}

// Render exchange icon with token icon badge (shared by desktop and mobile views)
function ExchangeVenueIcon({ pair, accountName, exchange, getAccount }) {
  if (!pair || !accountName) return null;

  const [base] = pair.split('-');
  if (!base) return null;

  const [baseToken] = base.split(':');
  const tokenIconSrc = getBaseTokenIcon(baseToken);
  // Use exchange from prop if available, otherwise fallback to account
  const exchangeName = exchange || getAccount(accountName)?.exchangeName;
  const exchangeIconUrl = exchangeName ? ICONS[exchangeName.toLowerCase()] : null;

  if (!tokenIconSrc && !exchangeIconUrl) return null;

  return (
    <Tooltip arrow title={accountName || exchangeName}>
      <Box display='inline-block' position='relative' sx={{ pr: 0 }}>
        {tokenIconSrc ? (
          <>
            <img
              alt={`${baseToken} token`}
              height='24.75px'
              src={tokenIconSrc}
              style={{ borderRadius: '50%' }}
              width='24.75px'
            />
            {exchangeIconUrl && (
              <Box bottom={0} position='absolute' right={0} sx={{ transform: 'translate(25%, 25%)' }}>
                <img
                  alt={`${exchangeName} exchange`}
                  height='12.375px'
                  src={exchangeIconUrl}
                  style={{ borderRadius: '50%' }}
                  width='12.375px'
                />
              </Box>
            )}
          </>
        ) : (
          <img
            alt={`${exchangeName} exchange`}
            height='24.75px'
            src={exchangeIconUrl}
            style={{ borderRadius: '50%' }}
            width='24.75px'
          />
        )}
      </Box>
    </Tooltip>
  );
}

export default function MarketMakerHistory({ history, showActiveOnly, setShowActiveOnly }) {
  const {
    marketMakerOrders,
    loading,
    currentPageNumber,
    currentPageSize,
    count,
    setCurrentPageNumber,
    setCurrentPageSize,
    refresh,
  } = history;
  const { getAccount } = useInitialLoadData();
  const { currentTheme } = useThemeContext();
  const [resubmitLoading, setResubmitLoading] = useState({});
  const [cancelLoading, setCancelLoading] = useState({});
  const [spreadAnchor, setSpreadAnchor] = useState(null);
  const [spreadLoading, setSpreadLoading] = useState({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedMMBotData, setSelectedMMBotData] = useState(null);
  const { showToastMessage } = useToast();
  const { playOrderSuccess } = useSound();
  const { referralCode, isDev } = useUserMetadata();
  const theme = useTheme();

  const getSpreadOptions = (refPrice) => {
    if (refPrice === 'grid') return [-10, -1, 0, 5, 10];
    if (refPrice === 'other_exchange') return [0, 1, 5];
    return [0, 1, 2, 5, 10];
  };

  // Determine reference price type and extract reference exchange: 'grid', 'mid', or 'other_exchange'
  const getReferencePriceType = (guaranteePnl, childOrders, executionExchange) => {
    // Grid mode: guarantee_pnl is enabled
    if (guaranteePnl) {
      return { type: 'grid', referenceExchange: null };
    }

    // Check if limit_price uses a different exchange
    if (childOrders && childOrders.length > 0 && executionExchange) {
      const buyOrder = childOrders.find((child) => child.side === 'buy');
      const sellOrder = childOrders.find((child) => child.side === 'sell');
      const limitPrice = buyOrder?.limit_price || sellOrder?.limit_price;

      if (limitPrice) {
        // Grid format: contains ":exec_price" (e.g., "{order_id}:exec_price * multiplier")
        if (limitPrice.includes(':exec_price')) {
          return { type: 'grid', referenceExchange: null };
        }

        // Check if limit_price references a different exchange
        // Format: "PAIR@EXCHANGE * multiplier" or "PAIR@EXCHANGE - spread"
        const exchangeMatch = limitPrice.match(/@([A-Za-z0-9_]+)/);
        if (exchangeMatch) {
          const limitPriceExchange = exchangeMatch[1];
          const limitPriceExchangeLower = limitPriceExchange.toLowerCase();
          const execExchange = String(executionExchange).toLowerCase();
          // If the exchange in limit_price differs from execution exchange, it's other_exchange
          if (limitPriceExchangeLower !== execExchange) {
            return { type: 'other_exchange', referenceExchange: limitPriceExchange };
          }
        }
      }
    }

    // Default to mid price
    return { type: 'mid', referenceExchange: null };
  };

  const buildExchangeOptions = (row) => {
    const exchanges = new Set();
    if (row?.exchange) exchanges.add(row.exchange);
    (row?.accounts || []).forEach((accountName) => {
      const account = getAccount(accountName);
      if (account?.exchangeName) {
        exchanges.add(account.exchangeName);
      }
    });
    ['Binance', 'OKX', 'Bybit', 'Bitget', 'Hyperliquid'].forEach((ex) => exchanges.add(ex));
    return Array.from(exchanges);
  };

  const rows = useMemo(() => {
    if (!Array.isArray(marketMakerOrders)) return [];
    return marketMakerOrders.map((o) => {
      const feeNotional = parseFloat(o.fee_notional || 0);
      const childOrders = Array.isArray(o.child_orders) ? o.child_orders : [];
      const hasChildLimitPrice = childOrders.some((child) => child?.limit_price);

      // Extract exchange from child_orders[0].exchanges
      let exchange = null;
      if (childOrders.length > 0) {
        const firstChildOrder = childOrders[0];
        if (Array.isArray(firstChildOrder?.exchanges) && firstChildOrder.exchanges.length > 0) {
          [exchange] = firstChildOrder.exchanges;
        }
      }

      // Calculate MM PnL in bps and dollar amount
      let mmPnLBps = null;
      let mmPnLDollar = null;
      let spreadBps = null;

      // Calculate spread from limit prices on child orders
      if (childOrders.length > 0) {
        const buyOrder = childOrders.find((child) => child.side === 'buy');
        const sellOrder = childOrders.find((child) => child.side === 'sell');

        // Calculate spread from limit prices if available
        if (buyOrder?.limit_price && sellOrder?.limit_price) {
          try {
            // Parse multiplier format: "PAIR@EXCHANGE * 0.9999" or "PAIR@EXCHANGE * 1.0001"
            const buyMatch = buyOrder.limit_price.match(/\*\s*([\d.]+)$/);
            const sellMatch = sellOrder.limit_price.match(/\*\s*([\d.]+)$/);

            if (buyMatch && sellMatch) {
              const buyMultiplier = parseFloat(buyMatch[1]);
              const sellMultiplier = parseFloat(sellMatch[1]);
              // Spread in bps = (sellMultiplier - buyMultiplier) * 10000
              spreadBps = (sellMultiplier - buyMultiplier) * 10000;
            } else {
              // Try dynamic limit price format: "PAIR@EXCHANGE - 0.5" or "PAIR@EXCHANGE + 0.5"
              const buyDynamicMatch = buyOrder.limit_price.match(/-\s*([\d.]+)$/);
              const sellDynamicMatch = sellOrder.limit_price.match(/\+\s*([\d.]+)$/);

              if (buyDynamicMatch && sellDynamicMatch) {
                const buySpread = parseFloat(buyDynamicMatch[1]);
                const sellSpread = parseFloat(sellDynamicMatch[1]);
                // For dynamic format, we need a reference price to convert to bps
                // Use executed price if available, otherwise use limit_price_spread
                let referencePrice = null;
                if (buyOrder.average_executed_price) {
                  referencePrice = parseFloat(buyOrder.average_executed_price);
                } else if (sellOrder.average_executed_price) {
                  referencePrice = parseFloat(sellOrder.average_executed_price);
                }

                if (referencePrice) {
                  const totalSpreadDollars = buySpread + sellSpread;
                  spreadBps = (totalSpreadDollars / referencePrice) * 10000;
                } else if (o.limit_price_spread) {
                  // Fallback to limit_price_spread if available
                  const limitSpread = parseFloat(o.limit_price_spread);
                  let midPrice = 1;
                  if (buyOrder.average_executed_price) {
                    midPrice = parseFloat(buyOrder.average_executed_price);
                  } else if (sellOrder.average_executed_price) {
                    midPrice = parseFloat(sellOrder.average_executed_price);
                  }
                  if (midPrice > 0) {
                    spreadBps = (limitSpread / midPrice) * 10000;
                  }
                }
              }
            }
          } catch (e) {
            // If parsing fails, spreadBps remains null
          }
        }

        // Calculate MM PnL from executed prices
        if (buyOrder && sellOrder && buyOrder.average_executed_price && sellOrder.average_executed_price) {
          const buyPrice = parseFloat(buyOrder.average_executed_price);
          const sellPrice = parseFloat(sellOrder.average_executed_price);
          const priceSpread = sellPrice - buyPrice;
          mmPnLBps = ((priceSpread / buyPrice) * 10000) / 2;

          // Calculate dollar PnL: executed_notional * (mmPnLBps / 10000)
          const executedNotional = parseFloat(o.executed_notional || 0);
          mmPnLDollar = executedNotional * (mmPnLBps / 10000);
        }
      }

      const directionalBiasValue = deriveDirectionalBias(childOrders);
      const enginePassiveness = o.engine_passiveness ? parseFloat(o.engine_passiveness) : null;
      // Check for chase_decay in child orders or multi-order
      let chaseDecay = null;
      if (childOrders.length > 0) {
        chaseDecay = childOrders.find((child) => child.chase_decay != null)?.chase_decay ?? null;
      }
      // Also check multi-order level if not found in child orders
      if (chaseDecay == null && o.chase_decay != null) {
        chaseDecay = o.chase_decay;
      }

      // Determine reference price type using the same logic as getSpreadOptions
      const { type: referencePriceType, referenceExchange } = getReferencePriceType(
        o.guarantee_pnl,
        childOrders,
        exchange
      );

      return {
        id: o.id,
        status: o.status,
        is_active: o.is_active,
        pct_filled: o.pct_filled,
        notional_exposure: o.notional_exposure,
        pair: (o.pairs || '').split(',')[0] || '-',
        accounts: o.account_names || [],
        executed_notional: o.executed_notional,
        fee_notional: o.fee_notional,
        mmPnLBps,
        mmPnLDollar,
        spreadBps,
        netFees: feeNotional,
        exchange,
        directional_bias: directionalBiasValue,
        is_inactive: o.is_inactive,
        created_at: o.created_at,
        guarantee_pnl: o.guarantee_pnl || false,
        limit_price_spread: o.limit_price_spread,
        has_limit_price: hasChildLimitPrice,
        engine_passiveness: enginePassiveness,
        chase_decay: chaseDecay,
        reference_price_type: referencePriceType,
        reference_exchange: referenceExchange,
      };
    });
  }, [marketMakerOrders]);

  const formatNumber = (value, options = {}) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
    try {
      return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        ...options,
      }).format(Number(value));
    } catch (_) {
      return String(value);
    }
  };

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETE') return 'success';
    if (s === 'CANCELED' || s === 'CANCELLED') return 'error';
    if (s === 'ACTIVE' || s === 'RUNNING' || s === 'PAUSED' || s === 'FINISHER') return 'info';
    if (s === 'PENDING') return 'warning';
    return 'default';
  };

  const formatStatus = (status) => {
    const statusMap = {
      COMPLETE: 'Complete',
      CANCELED: 'Canceled',
      CANCELLED: 'Canceled',
      ACTIVE: 'Active',
      RUNNING: 'Running',
      PAUSED: 'Active', // Override PAUSED to display as Active
      PENDING: 'Pending',
      FINISHER: 'Active', // Override FINISHER to display as Active
    };
    return statusMap[status] || status;
  };

  const getDirectionalBiasLabel = (bias) => {
    const b = Number(bias);
    if (!Number.isFinite(b)) return '-';
    if (b > 0) return 'Long';
    if (b < 0) return 'Short';
    return 'Neutral';
  };

  const isOrderLessThan2MinutesOld = (createdAt) => {
    if (!createdAt) return false;
    try {
      const createdTime = new Date(createdAt);
      const now = new Date();
      const diffInMs = now - createdTime;
      const diffInMinutes = diffInMs / (1000 * 60);
      return diffInMinutes < 2;
    } catch (_) {
      return false;
    }
  };

  const isWalletAddress = (value) => {
    const s = String(value || '');
    // Check for Ethereum address (0x + 40 hex chars)
    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(s);
    // Check for Solana address (32-44 base58 chars)
    const isSolAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
    return isEthAddress || isSolAddress;
  };

  const handleOrderClick = useCallback((orderId) => {
    const url = `/multi_order/${orderId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleResubmit = useCallback(
    async (orderId, event) => {
      event.stopPropagation();
      setResubmitLoading((prev) => ({ ...prev, [orderId]: true }));

      try {
        const { submitPayload } = await hydrateMultiOrderResubmit(orderId);

        // Ensure market_maker flag is set to true for resubmitted MM orders
        const mmPayload = {
          ...submitPayload,
          market_maker: true,
        };

        await submitMultiOrder(mmPayload);

        playOrderSuccess();
        showToastMessage({
          type: 'success',
          message: 'MM Bot order resubmitted successfully.',
        });

        // Refresh the data
        await refresh();
      } catch (error) {
        showToastMessage({
          type: 'error',
          message: error.message || 'Failed to resubmit MM Bot order.',
        });
      } finally {
        setResubmitLoading((prev) => ({ ...prev, [orderId]: false }));
      }
    },
    [playOrderSuccess, refresh, showToastMessage]
  );

  const handleCancel = useCallback(
    async (orderId, event) => {
      event.stopPropagation();
      setCancelLoading((prev) => ({ ...prev, [orderId]: true }));

      try {
        await cancelMultiOrder(orderId);

        showToastMessage({
          type: 'success',
          message: 'MM Bot order canceled successfully.',
        });

        // Refresh the data
        await refresh();
      } catch (error) {
        showToastMessage({
          type: 'error',
          message: error.message || 'Failed to cancel MM Bot order.',
        });
      } finally {
        setCancelLoading((prev) => ({ ...prev, [orderId]: false }));
      }
    },
    [refresh, showToastMessage]
  );

  const handleShareClick = useCallback(
    async (row, event) => {
      event.stopPropagation();

      try {
        // Extract data from row
        const volume = row.executed_notional || 0;
        const netFees = row.netFees || row.fee_notional || 0;
        const mmPnL = row.mmPnLDollar || 0;
        const pair = row.pair || 'N/A';

        // Get exchange name from row data (extracted from child_orders[0].exchanges)
        const exchangeName = row.exchange || 'N/A';

        // Get duration from the original order - API returns duration in seconds, convert to minutes for formatDuration
        let duration = 0;
        const originalOrder = marketMakerOrders.find((o) => o.id === row.id);
        if (originalOrder?.duration) {
          // Convert from seconds to minutes (formatDuration expects minutes)
          duration = originalOrder.duration / 60;
        }

        // Build mmBotData object
        const mmBotData = {
          volume,
          netFees,
          mmPnL,
          exchange: exchangeName,
          pair,
          duration,
          referralCode: referralCode || '',
        };

        // Set state and open modal
        setSelectedMMBotData(mmBotData);
        setShareModalOpen(true);
      } catch (error) {
        showToastMessage({
          type: 'error',
          message: error.message || 'Failed to prepare share data.',
        });
      }
    },
    [marketMakerOrders, referralCode, showToastMessage]
  );

  const handleSpreadMenuOpen = (row, event) => {
    event.stopPropagation();
    // Use the pre-computed reference_price_type from the row object
    const referencePrice = row.reference_price_type || 'mid';
    const exchanges = buildExchangeOptions(row);
    const initialExchange = row.exchange || exchanges[0];
    let initialSpread = 0;
    if (typeof row.spreadBps === 'number' && !Number.isNaN(row.spreadBps)) {
      initialSpread = Math.round(row.spreadBps);
    }
    setSpreadAnchor({
      id: row.id,
      anchorEl: event.currentTarget,
      referencePrice,
      spreadBps: initialSpread,
      referenceExchange: initialExchange,
      exchanges,
    });
  };

  const handleSpreadMenuClose = () => setSpreadAnchor(null);

  useEffect(() => {
    // Close spread menu if list refreshes/re-renders (prevents orphaned menu at top-left)
    setSpreadAnchor(null);
  }, [marketMakerOrders]);

  const handleApplySpread = async (rowId, referencePrice, spreadBps, referenceExchange) => {
    handleSpreadMenuClose(); // Close menu immediately
    setSpreadLoading((prev) => ({ ...prev, [rowId]: true }));
    try {
      await changeMarketMakerSpread(rowId, spreadBps, {
        reference_price: referencePrice,
        reference_exchange: referencePrice === 'other_exchange' ? referenceExchange : undefined,
      });
      showToastMessage({
        type: 'success',
        message: 'Reference price and spread updated.',
      });
      await refresh();
    } catch (error) {
      showToastMessage({
        type: 'error',
        message: error.message || 'Failed to update spread.',
      });
    } finally {
      setSpreadLoading((prev) => ({ ...prev, [rowId]: false }));
    }
  };

  const renderHeader = () => (
    <Grid container sx={{ pl: 2, pr: 2, py: 1.5 }}>
      <Grid sx={{ pl: 3 }} xs={0.6}>
        <Typography
          color='text.secondary'
          sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          variant='caption'
        >
          Mode
        </Typography>
      </Grid>
      <Grid xs={2.5}>
        <Typography
          color='text.secondary'
          sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          variant='caption'
        >
          Pair
        </Typography>
      </Grid>
      <Grid xs={1.4}>
        <Typography
          color='text.secondary'
          sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          variant='caption'
        >
          Account
        </Typography>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title='Total executed notional (buy + sell)'>
            <Typography
              color='text.secondary'
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'help',
              }}
              variant='caption'
            >
              Volume
            </Typography>
          </Tooltip>
        </Box>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title='Total fees paid to exchange'>
            <Typography
              color='text.secondary'
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'help',
              }}
              variant='caption'
            >
              Fees
            </Typography>
          </Tooltip>
        </Box>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title='Executed Notional × PnL%'>
            <Typography
              color='text.secondary'
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'help',
              }}
              variant='caption'
            >
              rPnL
            </Typography>
          </Tooltip>
        </Box>
      </Grid>
      <Grid xs={1.0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', pl: 4 }}>
          <Tooltip title='Spread between buy and sell prices'>
            <Typography
              color='text.secondary'
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'help',
              }}
              variant='caption'
            >
              Spread
            </Typography>
          </Tooltip>
        </Box>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Filled
          </Typography>
        </Box>
      </Grid>
      <Grid xs={0.9}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Status
          </Typography>
        </Box>
      </Grid>
      <Grid xs={1.2}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Actions
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );

  const getDirectionalBiasColor = (bias) => {
    const b = Number(bias);
    if (!Number.isFinite(b)) return theme.palette.text.secondary;
    if (b > 0) return theme.palette.orderUrgency?.ULTRA_LOW ?? theme.palette.success.main;
    if (b < 0) return theme.palette.orderUrgency?.HIGH ?? theme.palette.error.main;
    return theme.palette.text.primary;
  };

  const renderRow = (row) => {
    const isTerminalStatus =
      row.status === 'COMPLETE' || row.status === 'CANCELED' || row.status === 'CANCELLED' || row.status === 'FINISHER';
    const canResubmit = isTerminalStatus && row.pct_filled > 0;
    const canCancel = !isTerminalStatus || row.status === 'FINISHER';

    return (
      <Grid
        container
        key={row.id}
        sx={{
          pl: 2,
          pr: 2,
          py: 0.5,
          cursor: 'pointer',
          alignItems: 'center',
          minHeight: '40px',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          transition: 'background-color 0.2s ease',
        }}
        onClick={() => handleOrderClick(row.id)}
      >
        <Grid sx={{ pl: 3 }} xs={0.6}>
          <ModeIcons
            chaseDecay={row.chase_decay}
            directionalBias={row.directional_bias}
            enginePassiveness={row.engine_passiveness}
            guaranteePnl={row.guarantee_pnl}
            theme={theme}
          />
        </Grid>
        <Grid xs={2.5}>
          <Stack alignItems='center' direction='row' spacing={1}>
            {Array.isArray(row.accounts) && row.accounts.length > 0 && (
              <ExchangeVenueIcon
                accountName={row.accounts[0]}
                exchange={row.exchange}
                getAccount={getAccount}
                pair={row.pair}
              />
            )}
            <Typography
              sx={{
                color: (() => {
                  const hasSpread =
                    (row.limit_price_spread !== undefined && row.limit_price_spread !== null) || row.has_limit_price;
                  if (row.guarantee_pnl) return theme.palette.warning.main;
                  if (hasSpread) return theme.palette.info.main;
                  if (Number.isFinite(Number(row.directional_bias))) {
                    return getDirectionalBiasColor(row.directional_bias);
                  }
                  return undefined;
                })(),
              }}
              variant='body1'
            >
              {row.pair}
            </Typography>
          </Stack>
        </Grid>
        <Grid xs={1.4}>
          <Stack alignItems='center' direction='row' spacing={1}>
            {Array.isArray(row.accounts) && row.accounts.length > 0 ? (
              row.accounts.map((accountName) => {
                // Use exchange from row data if available, otherwise fallback to account
                const exchangeName = row.exchange || getAccount(accountName)?.exchangeName;
                let displayAccount = accountName;
                if (isWalletAddress(accountName)) {
                  displayAccount = insertEllipsis(accountName, 4, 4);
                } else if (accountName.length > 15) {
                  displayAccount = `${accountName.substring(0, 15)}...`;
                }
                return (
                  <Stack alignItems='center' direction='row' key={accountName} spacing={1}>
                    <ExchangeIcon exchangeName={exchangeName} style={{ height: '20px', width: '20px' }} />
                    <Typography variant='body1'>{displayAccount}</Typography>
                  </Stack>
                );
              })
            ) : (
              <Typography variant='body1'>N/A</Typography>
            )}
          </Stack>
        </Grid>
        <Grid xs={1.1}>
          <Typography sx={{ textAlign: 'right' }} variant='body1'>
            <span style={{ color: theme.palette.text.secondary }}>$</span>
            <FormattedNumberWithGreyDecimals
              isActive={row.is_active}
              theme={theme}
              value={row.executed_notional || 0}
            />
          </Typography>
        </Grid>
        <Grid xs={1.1}>
          <Typography
            sx={{
              textAlign: 'right',
              color: (() => {
                if (row.netFees === null || row.netFees === undefined) return 'text.secondary';
                return row.netFees >= 0 ? 'text.primary' : 'success.main';
              })(),
            }}
            variant='body1'
          >
            {row.netFees !== null && row.netFees !== undefined ? (
              <>
                {row.netFees < 0 ? '-' : ''}
                <span style={{ color: row.netFees >= 0 ? theme.palette.text.primary : theme.palette.success.main }}>
                  $
                </span>
                <FormattedNumberWithGreyDecimals isActive={row.is_active} theme={theme} value={Math.abs(row.netFees)} />
              </>
            ) : (
              '-'
            )}
          </Typography>
        </Grid>
        <Grid xs={1.1}>
          <Typography
            sx={{
              textAlign: 'right',
              color: (() => {
                if (row.mmPnLDollar === null) return 'text.secondary';
                return row.mmPnLDollar >= 0 ? 'success.main' : 'error.main';
              })(),
            }}
            variant='body1'
          >
            {row.mmPnLDollar !== null ? (
              <>
                {row.mmPnLDollar < 0 ? '-' : ''}
                <span style={{ color: row.mmPnLDollar >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                  $
                </span>
                {(() => {
                  const value = Math.abs(row.mmPnLDollar);
                  if (value === 0) return '0.00';
                  return row.is_active ? (
                    <AnimatedNumber decimals={TWO_DECIMAL_PLACES} formatter={formatMsAndKsValue} value={value} />
                  ) : (
                    msAndKs(value, TWO_DECIMAL_PLACES)
                  );
                })()}
              </>
            ) : (
              '-'
            )}
          </Typography>
        </Grid>
        <Grid xs={1.0}>
          {(() => {
            let label = 'Mid';
            if (row.reference_price_type === 'grid') {
              label = 'Grid';
            } else if (row.reference_price_type === 'other_exchange') {
              label = 'Ref';
            }

            const spreadDisplay = (() => {
              if (row.spreadBps !== null && row.spreadBps !== undefined) {
                const spreadValue = Number(row.spreadBps);
                if (spreadValue === 0) {
                  return `${label} 0`;
                }
                const sign = spreadValue >= 0 ? '+' : '';
                return (
                  <>
                    {label} {sign}
                    {formatNumber(row.spreadBps, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                  </>
                );
              }
              return `${label} 0`;
            })();

            const typography = (
              <Typography
                sx={{
                  textAlign: 'center',
                  pl: 4,
                  color: row.reference_price_type === 'grid' ? theme.palette.warning.main : 'text.primary',
                  ...(row.reference_price_type === 'other_exchange' && row.reference_exchange && { cursor: 'pointer' }),
                }}
                variant='body1'
              >
                {spreadDisplay}
              </Typography>
            );

            return row.reference_price_type === 'other_exchange' && row.reference_exchange ? (
              <Tooltip title={`Reference Exchange: ${row.reference_exchange}`}>{typography}</Tooltip>
            ) : (
              typography
            );
          })()}
        </Grid>
        <Grid xs={1.1}>
          <Box sx={{ display: 'flex', justifyContent: 'center', px: 4, py: 1.5 }}>
            <ProgressBar
              containerStyleOverride={{ width: '80%' }}
              isDark={currentTheme === 'dark'}
              isPov={false}
              orderStatus={row.status}
              progress={Math.round(Number(row.pct_filled || 0))}
            />
          </Box>
        </Grid>
        <Grid xs={0.9}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography
              sx={{
                color: (() => {
                  const isStalled = row.is_inactive && !isOrderLessThan2MinutesOld(row.created_at);
                  const statusColor = getStatusColor(row.status);
                  // If stalled and status is active, use orange
                  if (
                    isStalled &&
                    (statusColor === 'info' ||
                      row.status === 'ACTIVE' ||
                      row.status === 'RUNNING' ||
                      row.status === 'PAUSED' ||
                      row.status === 'FINISHER')
                  ) {
                    return 'warning.main';
                  }
                  switch (statusColor) {
                    case 'success':
                      return 'success.main';
                    case 'error':
                      return 'error.main';
                    case 'warning':
                      return 'warning.main';
                    case 'info':
                      return 'info.main';
                    default:
                      return 'text.primary';
                  }
                })(),
              }}
              variant='body1'
            >
              {formatStatus(row.status)}
            </Typography>
          </Box>
        </Grid>
        <Grid
          sx={{
            alignItems: 'center',
            border: 'none',
            display: 'flex',
            justifyContent: 'flex-end',
            minHeight: 0,
            outline: 'none',
            overflow: 'hidden',
            pr: 0,
          }}
          xs={1.2}
        >
          <Stack direction='row' spacing={0.5}>
            <Tooltip title={canCancel ? 'Cancel MM Bot Order' : 'Cannot cancel this order'}>
              <IconButton
                disabled={!canCancel || cancelLoading[row.id]}
                size='small'
                sx={{
                  color: canCancel ? theme.palette.error.main : theme.palette.action.disabled,
                  p: 0.35,
                  '&:hover': canCancel ? { backgroundColor: alpha(theme.palette.error.main, 0.12) } : {},
                }}
                onClick={(event) => handleCancel(row.id, event)}
              >
                {cancelLoading[row.id] ? <CircularProgress size={16} /> : <CancelIcon fontSize='small' />}
              </IconButton>
            </Tooltip>
            <Tooltip title={canResubmit ? 'Resubmit MM Bot Order' : 'Cannot resubmit this order'}>
              <IconButton
                disabled={!canResubmit || resubmitLoading[row.id]}
                size='small'
                sx={{
                  color: canResubmit ? theme.palette.primary.main : theme.palette.action.disabled,
                  p: 0.35,
                  '&:hover': canResubmit ? { backgroundColor: alpha(theme.palette.primary.main, 0.12) } : {},
                }}
                onClick={(event) => handleResubmit(row.id, event)}
              >
                {resubmitLoading[row.id] ? <CircularProgress size={16} /> : <ReplayIcon fontSize='small' />}
              </IconButton>
            </Tooltip>
            <Tooltip title={!isTerminalStatus ? 'Grid / Spread' : 'Order has terminated'}>
              <IconButton
                disabled={isTerminalStatus}
                size='small'
                sx={{
                  color: !isTerminalStatus ? theme.palette.text.primary : theme.palette.action.disabled,
                  p: 0.35,
                  '&:hover': !isTerminalStatus
                    ? {
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      }
                    : {},
                }}
                onClick={(event) => handleSpreadMenuOpen(row, event)}
              >
                <TuneIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                row.status === 'COMPLETE' || row.status?.toUpperCase() === 'COMPLETE'
                  ? 'Share Market Maker Bot'
                  : 'Share only available for completed orders'
              }
            >
              <IconButton
                disabled={row.status !== 'COMPLETE' && row.status?.toUpperCase() !== 'COMPLETE'}
                size='small'
                sx={{
                  color:
                    row.status === 'COMPLETE' || row.status?.toUpperCase() === 'COMPLETE'
                      ? theme.palette.text.primary
                      : theme.palette.action.disabled,
                  p: 0.35,
                  '&:hover':
                    row.status === 'COMPLETE' || row.status?.toUpperCase() === 'COMPLETE'
                      ? {
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        }
                      : {},
                }}
                onClick={(event) => handleShareClick(row, event)}
              >
                <ShareIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        </Grid>
      </Grid>
    );
  };

  const renderSkeletonRow = (key) => (
    <Grid
      container
      key={key}
      sx={{
        px: 2,
        py: 1,
        alignItems: 'center',
        minHeight: '48px', // Match the actual row height
      }}
    >
      <Grid xs={0.6}>
        <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
      </Grid>
      <Grid xs={2.5}>
        <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
      </Grid>
      <Grid xs={1.4}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Skeleton animation='wave' height={20} variant='circular' width={20} />
          <Skeleton animation='wave' height={24} variant='rounded' width='70%' />
        </Stack>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='80%' />
        </Box>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='70%' />
        </Box>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='70%' />
        </Box>
      </Grid>
      <Grid xs={1.0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
        </Box>
      </Grid>
      <Grid xs={1.1}>
        <Box sx={{ display: 'flex', justifyContent: 'center', px: 4 }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='80%' />
        </Box>
      </Grid>
      <Grid xs={0.9}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='70%' />
        </Box>
      </Grid>
      <Grid xs={1.2}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='70%' />
        </Box>
      </Grid>
    </Grid>
  );

  return (
    <Stack
      direction='column'
      spacing={2}
      sx={{
        pb: 10,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h6'>History</Typography>
        <FormControlLabel
          control={
            <Checkbox checked={showActiveOnly} size='small' onChange={(e) => setShowActiveOnly(e.target.checked)} />
          }
          label='Active Bots Only'
          sx={{ color: 'text.secondary' }}
        />
      </Box>
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          pb: 4,
          backgroundColor: 'rgba(10, 12, 24, 0.50)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box sx={{ width: '100%' }}>
          {/* Mobile: horizontally scrollable table for readability */}
          <Box
            sx={{
              display: 'block',
              [theme.breakpoints.up('md')]: {
                display: 'none',
              },
            }}
          >
            <TableContainer
              sx={{
                overflowX: 'auto',
                overflowY: 'visible',
              }}
            >
              <Table size='small' sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }} />
                    <TableCell>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Mode
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Pairs
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Account
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Volume
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Net Fees
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        rPnL
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Typography
                        color='text.secondary'
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          pl: 4,
                        }}
                        variant='caption'
                      >
                        Spread
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Filled
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Status
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        color='text.secondary'
                        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        variant='caption'
                      >
                        Actions
                      </Typography>
                    </TableCell>
                    <TableCell align='center' sx={{ width: 30, minWidth: 30, maxWidth: 30, pl: '3px' }} />
                    <TableCell align='center' sx={{ width: 30, minWidth: 30, maxWidth: 30, pl: '3px' }} />
                    <TableCell align='center' sx={{ width: 30, minWidth: 30, maxWidth: 30, pl: '3px', pr: 0 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      hover
                      key={`mm-mobile-${r.id}`}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleOrderClick(r.id)}
                    >
                      <TableCell sx={{ width: 40, pl: 0.5, pr: 0.5 }} />
                      <TableCell>
                        <ModeIcons
                          chaseDecay={r.chase_decay}
                          directionalBias={r.directional_bias}
                          enginePassiveness={r.engine_passiveness}
                          guaranteePnl={r.guarantee_pnl}
                          theme={theme}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          {Array.isArray(r.accounts) && r.accounts.length > 0 && (
                            <ExchangeVenueIcon
                              accountName={r.accounts[0]}
                              exchange={r.exchange}
                              getAccount={getAccount}
                              pair={r.pair}
                            />
                          )}
                          <Typography
                            sx={{
                              color: (() => {
                                const hasSpread =
                                  (r.limit_price_spread !== undefined && r.limit_price_spread !== null) ||
                                  r.has_limit_price;
                                if (r.guarantee_pnl) return theme.palette.warning.main;
                                if (hasSpread) return theme.palette.info.main;
                                if (Number.isFinite(Number(r.directional_bias))) {
                                  return getDirectionalBiasColor(r.directional_bias);
                                }
                                return undefined;
                              })(),
                            }}
                            variant='body2'
                          >
                            {r.pair}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack
                          alignItems='center'
                          direction='row'
                          spacing={1}
                          sx={{ maxWidth: 140, overflow: 'hidden' }}
                        >
                          {Array.isArray(r.accounts) && r.accounts.length > 0 ? (
                            r.accounts.slice(0, 1).map((accountName) => {
                              // Use exchange from row data if available, otherwise fallback to account
                              const exchangeName = r.exchange || getAccount(accountName)?.exchangeName;
                              let displayAccount = accountName;
                              if (isWalletAddress(accountName)) {
                                displayAccount = insertEllipsis(accountName, 4, 4);
                              } else if (accountName.length > 14) {
                                displayAccount = `${accountName.substring(0, 14)}…`;
                              }
                              return (
                                <Stack alignItems='center' direction='row' key={`${r.id}-${accountName}`} spacing={0.5}>
                                  <ExchangeIcon exchangeName={exchangeName} style={{ height: 18, width: 18 }} />
                                  <Typography noWrap variant='body2'>
                                    {displayAccount}
                                  </Typography>
                                </Stack>
                              );
                            })
                          ) : (
                            <Typography variant='body2'>N/A</Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2'>
                          <span style={{ color: theme.palette.text.secondary }}>$</span>
                          {(() => {
                            const value = r.executed_notional || 0;
                            return r.is_active ? (
                              <AnimatedNumber
                                decimals={TWO_DECIMAL_PLACES}
                                formatter={formatMsAndKsValue}
                                value={value}
                              />
                            ) : (
                              msAndKs(value, TWO_DECIMAL_PLACES)
                            );
                          })()}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          sx={{
                            color: (() => {
                              if (r.netFees === null || r.netFees === undefined) return theme.palette.text.secondary;
                              return r.netFees >= 0 ? theme.palette.text.primary : theme.palette.success.main;
                            })(),
                          }}
                          variant='body2'
                        >
                          {r.netFees !== null && r.netFees !== undefined ? (
                            <>
                              {r.netFees < 0 ? '-' : ''}
                              <span
                                style={{
                                  color: r.netFees >= 0 ? theme.palette.text.primary : theme.palette.success.main,
                                }}
                              >
                                $
                              </span>
                              {(() => {
                                const value = Math.abs(r.netFees);
                                return r.is_active ? (
                                  <AnimatedNumber
                                    decimals={TWO_DECIMAL_PLACES}
                                    formatter={formatMsAndKsValue}
                                    value={value}
                                  />
                                ) : (
                                  msAndKs(value, TWO_DECIMAL_PLACES)
                                );
                              })()}
                            </>
                          ) : (
                            '-'
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {r.mmPnLDollar === null ? (
                          '-'
                        ) : (
                          <Typography color={r.mmPnLDollar >= 0 ? 'success.main' : 'error.main'} variant='body2'>
                            {r.mmPnLDollar < 0 ? '-' : ''}
                            <span
                              style={{
                                color: r.mmPnLDollar >= 0 ? theme.palette.success.main : theme.palette.error.main,
                              }}
                            >
                              $
                            </span>
                            {(() => {
                              const value = Math.abs(r.mmPnLDollar);
                              if (value === 0) return '0.00';
                              return r.is_active ? (
                                <AnimatedNumber
                                  decimals={TWO_DECIMAL_PLACES}
                                  formatter={formatMsAndKsValue}
                                  value={value}
                                />
                              ) : (
                                msAndKs(value, TWO_DECIMAL_PLACES)
                              );
                            })()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align='center'>
                        {(() => {
                          let label = 'Mid';
                          if (r.reference_price_type === 'grid') {
                            label = 'Grid';
                          } else if (r.reference_price_type === 'other_exchange') {
                            label = 'Ref';
                          }

                          const spreadDisplay = (() => {
                            if (r.spreadBps !== null && r.spreadBps !== undefined) {
                              const spreadValue = Number(r.spreadBps);
                              if (spreadValue === 0) {
                                return `${label} 0`;
                              }
                              const sign = spreadValue >= 0 ? '+' : '';
                              return (
                                <>
                                  {label} {sign}
                                  {formatNumber(r.spreadBps, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                </>
                              );
                            }
                            return `${label} 0`;
                          })();

                          const typography = (
                            <Typography
                              sx={{
                                pl: 4,
                                color: r.reference_price_type === 'grid' ? theme.palette.warning.main : 'text.primary',
                                ...(r.reference_price_type === 'other_exchange' &&
                                  r.reference_exchange && { cursor: 'pointer' }),
                              }}
                              variant='body2'
                            >
                              {spreadDisplay}
                            </Typography>
                          );

                          return r.reference_price_type === 'other_exchange' && r.reference_exchange ? (
                            <Tooltip title={`Reference Exchange: ${r.reference_exchange}`}>{typography}</Tooltip>
                          ) : (
                            typography
                          );
                        })()}
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ px: 1 }}>
                          <ProgressBar
                            containerStyleOverride={{ width: 70 }}
                            isDark={currentTheme === 'dark'}
                            isPov={false}
                            orderStatus={r.status}
                            progress={Math.round(Number(r.pct_filled || 0))}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack alignItems='center' direction='row' justifyContent='flex-start' spacing={1}>
                          <Typography
                            color={(() => {
                              const isStalled = r.is_inactive && !isOrderLessThan2MinutesOld(r.created_at);
                              const c = getStatusColor(r.status);
                              // If stalled and status is active, use orange
                              if (
                                isStalled &&
                                (c === 'info' ||
                                  r.status === 'ACTIVE' ||
                                  r.status === 'RUNNING' ||
                                  r.status === 'PAUSED' ||
                                  r.status === 'FINISHER')
                              ) {
                                return 'warning.main';
                              }
                              switch (c) {
                                case 'success':
                                  return 'success.main';
                                case 'error':
                                  return 'error.main';
                                case 'warning':
                                  return 'warning.main';
                                case 'info':
                                  return 'info.main';
                                default:
                                  return 'text.primary';
                              }
                            })()}
                            variant='body2'
                          >
                            {formatStatus(r.status)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align='right' sx={{ minWidth: 150, pl: '0px', pr: 0 }}>
                        <Stack direction='row' justifyContent='flex-end' spacing={0.5}>
                          {(() => {
                            const isTerminalStatus =
                              r.status === 'COMPLETE' || r.status === 'CANCELED' || r.status === 'CANCELLED';
                            const canCancel = !isTerminalStatus || r.status === 'FINISHER';
                            return (
                              <Tooltip title={canCancel ? 'Cancel MM Bot Order' : 'Cannot cancel this order'}>
                                <IconButton
                                  disabled={!canCancel || cancelLoading[r.id]}
                                  size='small'
                                  sx={{
                                    color: canCancel ? theme.palette.error.main : theme.palette.action.disabled,
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleCancel(r.id, event);
                                  }}
                                >
                                  {cancelLoading[r.id] ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <CancelIcon fontSize='small' />
                                  )}
                                </IconButton>
                              </Tooltip>
                            );
                          })()}
                          {(() => {
                            const isTerminalStatus =
                              r.status === 'COMPLETE' || r.status === 'CANCELED' || r.status === 'CANCELLED';
                            const canResubmit = isTerminalStatus && r.pct_filled > 0;
                            return (
                              <Tooltip title={canResubmit ? 'Resubmit MM Bot Order' : 'Cannot resubmit this order'}>
                                <IconButton
                                  disabled={!canResubmit || resubmitLoading[r.id]}
                                  size='small'
                                  sx={{
                                    color: canResubmit ? theme.palette.primary.main : theme.palette.action.disabled,
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleResubmit(r.id, event);
                                  }}
                                >
                                  {resubmitLoading[r.id] ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <ReplayIcon fontSize='small' />
                                  )}
                                </IconButton>
                              </Tooltip>
                            );
                          })()}
                          {(() => {
                            const isTerminalStatus =
                              r.status === 'COMPLETE' || r.status === 'CANCELED' || r.status === 'CANCELLED';
                            return (
                              <Tooltip title={!isTerminalStatus ? 'Grid / Spread' : 'Order has terminated'}>
                                <IconButton
                                  disabled={isTerminalStatus}
                                  size='small'
                                  sx={{
                                    color: !isTerminalStatus
                                      ? theme.palette.text.primary
                                      : theme.palette.action.disabled,
                                    '&:hover': !isTerminalStatus
                                      ? {
                                          color: theme.palette.primary.main,
                                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                        }
                                      : {},
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSpreadMenuOpen(r, event);
                                  }}
                                >
                                  <TuneIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            );
                          })()}
                          <Tooltip
                            title={
                              r.status === 'COMPLETE' || r.status?.toUpperCase() === 'COMPLETE'
                                ? 'Share Market Maker Bot'
                                : 'Share only available for completed orders'
                            }
                          >
                            <IconButton
                              disabled={r.status !== 'COMPLETE' && r.status?.toUpperCase() !== 'COMPLETE'}
                              size='small'
                              sx={{
                                color:
                                  r.status === 'COMPLETE' || r.status?.toUpperCase() === 'COMPLETE'
                                    ? theme.palette.text.primary
                                    : theme.palette.action.disabled,
                                '&:hover':
                                  r.status === 'COMPLETE' || r.status?.toUpperCase() === 'COMPLETE'
                                    ? {
                                        color: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                      }
                                    : {},
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleShareClick(r, event);
                              }}
                            >
                              <ShareIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {/* Header + rows for md+ */}
          <Box
            sx={{
              display: 'none',
              [theme.breakpoints.up('md')]: {
                display: 'block',
              },
            }}
          >
            {renderHeader()}
            <Divider />
            <Box>
              {(() => {
                if (loading) {
                  return (
                    <>
                      {Array.from({ length: currentPageSize }).map((_, index) => {
                        const uniqueKey = `skeleton-${Math.random().toString(36).substring(2, 11)}-${index}`;
                        return (
                          <React.Fragment key={uniqueKey}>
                            {renderSkeletonRow(`skeleton-row-${uniqueKey}`)}
                            {index < currentPageSize - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                }
                if (rows.length === 0) {
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Typography color='text.secondary' variant='body2'>
                        No market maker orders found.
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <>
                    {rows.map((r, index) => (
                      <React.Fragment key={r.id}>
                        {renderRow(r)}
                        {index < rows.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </>
                );
              })()}
            </Box>
            <Divider />
          </Box>
          <Box
            alignItems='center'
            display='flex'
            justifyContent='flex-end'
            sx={{
              p: 2,
              pb: {
                xs: 6,
                md: 2,
              },
            }}
          >
            <TablePagination
              component='div'
              count={typeof count === 'number' ? count : 0}
              page={Math.max(0, (Number(currentPageNumber) || 1) - 1)}
              rowsPerPage={Number(currentPageSize) || 10}
              rowsPerPageOptions={[10, 25, 30]}
              sx={{
                '& .MuiTablePagination-select': {
                  fontSize: '0.75rem',
                },
              }}
              onPageChange={(_, newPage) => {
                setCurrentPageNumber(newPage + 1);
              }}
              onRowsPerPageChange={(event) => {
                const newSize = Math.min(parseInt(event.target.value, 10) || 10, 30);
                setCurrentPageSize(newSize);
                setCurrentPageNumber(1);
              }}
            />
          </Box>
        </Box>
      </Paper>

      <Menu
        anchorEl={spreadAnchor?.anchorEl || null}
        open={Boolean(spreadAnchor?.anchorEl)}
        PaperProps={{
          sx: {
            backgroundColor: 'background.container40',
            backdropFilter: 'blur(15px)',
            borderRadius: 0,
            border: 'none',
          },
        }}
        onClose={handleSpreadMenuClose}
      >
        {spreadAnchor && (
          <Box sx={{ p: 2, width: 280 }}>
            <Stack direction='column' spacing={1.5}>
              <Box>
                <Typography color='text.secondary' sx={{ fontSize: '0.7rem' }} variant='caption'>
                  Reference Price
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size='small'
                  value={spreadAnchor.referencePrice}
                  onChange={(_, val) => {
                    if (!val) return;
                    const nextSpread = getSpreadOptions(val)[0];
                    setSpreadAnchor((prev) => ({
                      ...prev,
                      referencePrice: val,
                      spreadBps: nextSpread,
                    }));
                  }}
                >
                  <ToggleButton value='mid'>
                    <Typography sx={{ fontSize: '0.75rem' }} variant='body2'>
                      Mid Price
                    </Typography>
                  </ToggleButton>
                  <ToggleButton value='grid'>
                    <Typography color='warning.main' sx={{ fontSize: '0.75rem' }} variant='body2'>
                      Grid
                    </Typography>
                  </ToggleButton>
                  {isDev && (
                    <ToggleButton value='other_exchange'>
                      <Typography sx={{ fontSize: '0.75rem' }} variant='body2'>
                        Other Exch
                      </Typography>
                    </ToggleButton>
                  )}
                </ToggleButtonGroup>
              </Box>

              {spreadAnchor.referencePrice === 'other_exchange' && (
                <TextField
                  fullWidth
                  select
                  label='Exchange'
                  size='small'
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                    '& .MuiSelect-select': { fontSize: '0.75rem', py: 1 },
                  }}
                  value={spreadAnchor.referenceExchange}
                  onChange={(e) => setSpreadAnchor((prev) => ({ ...prev, referenceExchange: e.target.value }))}
                >
                  {(spreadAnchor.exchanges || []).map((ex) => (
                    <MenuItem key={ex} sx={{ fontSize: '0.75rem' }} value={ex}>
                      {ex}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <Box>
                <Typography color='text.secondary' sx={{ fontSize: '0.7rem' }} variant='caption'>
                  Spread
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size='small'
                  value={spreadAnchor.spreadBps}
                  onChange={(_, val) => val != null && setSpreadAnchor((prev) => ({ ...prev, spreadBps: val }))}
                >
                  {getSpreadOptions(spreadAnchor.referencePrice).map((option) => {
                    const label = option > 0 ? `+${option}` : `${option}`;
                    const color = (() => {
                      if (option > 0) return 'success.main';
                      if (option < 0) return 'warning.main';
                      return 'text.primary';
                    })();
                    return (
                      <ToggleButton key={option} value={option}>
                        <Typography
                          color={color}
                          sx={{ fontSize: '0.75rem' }}
                          variant='body2'
                        >{`${label} bps`}</Typography>
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
              </Box>
              <Divider />
              <Button
                fullWidth
                disabled={spreadLoading[spreadAnchor.id]}
                size='small'
                sx={{ fontSize: '0.75rem', py: 0.75 }}
                variant='contained'
                onClick={() =>
                  handleApplySpread(
                    spreadAnchor.id,
                    spreadAnchor.referencePrice,
                    spreadAnchor.spreadBps,
                    spreadAnchor.referenceExchange
                  )
                }
              >
                {spreadLoading[spreadAnchor.id] ? <CircularProgress size={16} /> : 'Apply'}
              </Button>
            </Stack>
          </Box>
        )}
      </Menu>

      {/* Share Modal */}
      <MarketMakerShareableModal
        mmBotData={selectedMMBotData}
        open={shareModalOpen}
        showAlert={(alert) => {
          showToastMessage({
            type: alert.severity || 'info',
            message: alert.message,
          });
        }}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedMMBotData(null);
        }}
      />
    </Stack>
  );
}
