import { useTheme } from '@emotion/react';
import { Stack, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import Box from '@mui/material/Box';
import { useAtom } from 'jotai';
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { formatPrice, msAndKs } from '../../../util';
import { renderPriceWithSubscript } from '../../../util/priceFormatting';
import { limitPriceAtom, limitPriceFromOrderBookAtom, selectedSideAtom } from '../orderEntry/hooks/useFormReducer';
import { useFlashOnChange } from '../../../theme/holographicEffects';
import MarketDepthSentiment from './MarketDepthSentiment';
import useViewport from '../../../shared/hooks/useViewport';

function OrderBookChart({ orderBookDataByExchange, contractValue, isInverse }) {
  const theme = useTheme();
  const { isMobile } = useViewport();
  const [limitPrice, setLimitPrice] = useAtom(limitPriceAtom);
  const [, setLimitPriceFromOrderBook] = useAtom(limitPriceFromOrderBookAtom);
  const [, setSelectedSide] = useAtom(selectedSideAtom);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const midBarRef = useRef(null);
  const [rowsPerSide, setRowsPerSide] = useState(10);
  const [rowHeight, setRowHeight] = useState(25);
  const firstAskRowRef = useRef(null);
  const firstBidRowRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Track container width for responsive font sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    // Initial measurement
    updateWidth();

    // Listen for resize events
    window.addEventListener('resize', updateWidth);

    // Use ResizeObserver for more accurate container size changes
    let resizeObserver;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Measure actual row height from DOM when available
  useEffect(() => {
    const measure = () => {
      const el = firstBidRowRef.current || firstAskRowRef.current;
      if (!el) return;
      const h = el.getBoundingClientRect().height;
      if (h && Math.abs(h - rowHeight) > 0.5) {
        setRowHeight(h);
      }
    };
    // Measure after first paint and whenever layout could change
    requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rowHeight, containerWidth, orderBookDataByExchange]);

  const updateRows = useCallback(() => {
    if (!containerRef.current) return;

    // On mobile, if collapsed, show only 3 rows
    if (isMobile && !isExpanded) {
      setRowsPerSide(3);
      return;
    }

    const containerHeight = containerRef.current.clientHeight || 0;
    const midHeight = midBarRef.current ? midBarRef.current.clientHeight || 0 : 0;
    const usable = Math.max(0, containerHeight - midHeight - 30); // Reduced padding from 45 to 30
    const effectiveRowHeight = rowHeight || 25;
    const perSide = Math.max(10, Math.floor(usable / (effectiveRowHeight * 2))); // Minimum 10 rows
    setRowsPerSide(perSide);
  }, [rowHeight, isMobile, isExpanded]);

  // Calculate how many rows can fit without scrollbars based on available height
  useEffect(() => {
    // Initial measurement
    updateRows();

    // Observe size changes of the content area and mid bar
    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateRows);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (midBarRef.current) resizeObserver.observe(midBarRef.current);
    }

    window.addEventListener('resize', updateRows);

    return () => {
      window.removeEventListener('resize', updateRows);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updateRows]);

  // Update when inputs change that might affect height
  useEffect(() => {
    updateRows();
  }, [updateRows, containerWidth, orderBookDataByExchange?.bids?.length, orderBookDataByExchange?.asks?.length]);

  // Calculate font scale based on container width
  const getFontScale = useCallback(() => {
    if (containerWidth === 0) return 1; // Default to normal size if width not detected

    // Base width is 300px (where we want 100% font size - original size)
    const baseWidth = 300;
    const minScale = 0.8; // Minimum 80% of original size for very small containers (more readable)
    const maxScale = 1; // Maximum 100% of original size (original size)

    if (containerWidth >= baseWidth) return maxScale;

    // Scale down more gently for smaller containers
    const scale = Math.max(minScale, 0.8 + (0.2 * containerWidth) / baseWidth);

    return scale;
  }, [containerWidth]);

  const handleOnClick = useCallback(
    (e, price, type) => {
      setLimitPrice(price);
      setLimitPriceFromOrderBook(true);
      // Set the appropriate side based on the row type
      // type === 'ask' (red rows) means we want to SELL
      // type === 'bid' (green rows) means we want to BUY
      setSelectedSide(type === 'ask' ? 'sell' : 'buy');
    },
    [setLimitPrice, setLimitPriceFromOrderBook, setSelectedSide]
  );

  // Memoize the order book data to prevent unnecessary recalculations
  const orderBookData = useMemo(() => {
    if (!orderBookDataByExchange || !orderBookDataByExchange.bids || !orderBookDataByExchange.asks) {
      return { bids: [], asks: [], mid: 0, spread_bps: 0, pair: '' };
    }

    const data = { ...orderBookDataByExchange };
    data.bids = orderBookDataByExchange.bids;
    data.asks = orderBookDataByExchange.asks;
    return data;
  }, [orderBookDataByExchange]);

  // Memoize max size calculation
  const maxSize = useMemo(() => {
    return Math.max(...orderBookData.bids.map((bid) => bid.y), ...orderBookData.asks.map((ask) => ask.y));
  }, [orderBookData.bids, orderBookData.asks]);

  const spread = Number(orderBookData.spread_bps);
  const { className: spreadFlashClass } = useFlashOnChange(spread);

  const renderOrderRow = useCallback(
    (type, data) => {
      const { price, y } = data;
      const barWidth = (y / maxSize) * 100;
      const quoteValue = isInverse ? y * contractValue : y * price * contractValue;
      const barColor = type === 'bid' ? theme.palette.orderBook.bid : theme.palette.orderBook.ask;
      const textColor = type === 'bid' ? theme.palette.charts.green : theme.palette.charts.red;
      // Calculate bps away from mid
      const mid = Number(orderBookData.mid);
      const bps = mid ? (Math.abs(price - mid) / mid) * 10000 : 0;
      const fontScale = getFontScale();

      return (
        <Box
          key={price}
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: '25px',
            display: 'flex',
            alignItems: 'center',
            mb: 0,
            cursor: 'pointer',
            borderRadius: '4px',
            overflow: 'hidden',
            transition: 'background 0.2s',
            '&:hover': {
              backgroundColor: `${theme.palette.grey[800]}0A`, // 4% opacity
            },
          }}
          onClick={(e) => handleOnClick(e, price, type)}
        >
          {/* Animated background bar */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${barWidth}%`,
              backgroundColor: barColor,
              opacity: 0.4,
              zIndex: 0,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '4px',
            }}
          />
          {/* Row content as grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: containerWidth < 250 ? '80px 1fr 50px' : '110px 1fr 90px',
              width: '100%',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
              gap: containerWidth < 250 ? '4px' : '8px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                color={textColor}
                fontFamily={theme.typography.fontFamilyConfig.numbers} // Use IBM Plex Mono for numbers
                sx={{
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: `${0.75 * fontScale}rem`,
                }}
                variant='body1'
              >
                {renderPriceWithSubscript(formatPrice(price))}
              </Typography>
              <Typography
                sx={{
                  ml: 0.5,
                  opacity: 0.6,
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  fontFamily: theme.typography.fontFamilyConfig.numbers, // Use IBM Plex Mono for numbers
                  fontSize: `${0.64 * fontScale}rem`,
                }}
                variant='caption'
              >
                ({bps.toFixed(1)}bps)
              </Typography>
            </Box>
            <Typography
              fontFamily={theme.typography.fontFamilyConfig.numbers} // Use IBM Plex Mono for numbers
              sx={{
                textAlign: 'right',
                fontWeight: 500,
                fontSize: `${0.75 * fontScale}rem`,
                pr: containerWidth < 250 ? 0.5 : 2,
              }}
              variant='body1'
            >
              {msAndKs(y, 1)}
            </Typography>
            <Typography
              fontFamily={theme.typography.fontFamilyConfig.numbers} // Use IBM Plex Mono for numbers
              sx={{
                textAlign: 'right',
                fontWeight: 500,
                fontSize: `${0.75 * fontScale}rem`,
              }}
              variant='body1'
            >
              ${msAndKs(quoteValue, 1)}
            </Typography>
          </Box>
        </Box>
      );
    },
    [theme.palette, isInverse, contractValue, handleOnClick, maxSize, orderBookData.mid, getFontScale, containerWidth]
  );

  if (!orderBookDataByExchange || !orderBookDataByExchange.pair) {
    return null;
  }

  return (
    <Stack direction='column' height='100%' ref={containerRef} spacing={0}>
      <Box>
        <Stack direction='column' spacing={0}>
          <Stack
            sx={{
              '& > *': {
                animation: 'slideInFromTop 0.3s ease-out',
                animationFillMode: 'both',
              },
              '@keyframes slideInFromTop': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(-10px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            {[...orderBookData.asks]
              .slice(-rowsPerSide)
              .reverse()
              .map((ask, index) => (
                <Box
                  key={ask.price}
                  sx={{
                    animationDelay: `${index * 20}ms`,
                  }}
                >
                  {renderOrderRow('ask', ask)}
                </Box>
              ))}
          </Stack>

          <Stack
            alignItems='center'
            direction='row'
            justifyContent='space-between'
            ref={midBarRef}
            spacing={2}
            sx={{
              backgroundColor: theme.palette.background.paper,
              minHeight: '32px',
              boxShadow: `0 1px 4px 0 ${theme.palette.common.pureBlack}14`, // 8% opacity
              position: 'relative',
              transition: 'background-color 0.3s ease-in-out',
              flexShrink: 0, // Prevent shrinking
            }}
          >
            <Typography
              fontFamily={theme.typography.fontFamilyConfig.numbers} // Use IBM Plex Mono for numbers
              sx={{
                position: 'absolute',
                color: theme.palette.text.primary,
                transition: 'color 0.2s ease-in-out',
                fontSize: `${0.75 * getFontScale()}rem`,
              }}
              variant='body1'
            >
              {formatPrice(orderBookData.mid || 0)}
            </Typography>

            <Typography
              className={spreadFlashClass}
              fontFamily={theme.typography.fontFamilyConfig.numbers} // Use IBM Plex Mono for numbers
              sx={{
                position: 'absolute',
                right: 0,
                textAlign: 'right',
                width: 'auto',
                background: `${theme.palette.grey[800]}0A`, // 4% opacity
                px: 1.5,
                transition: 'color 0.2s ease-in-out',
                fontSize: `${0.75 * getFontScale()}rem`,
              }}
              variant='body1'
            >
              Spread <span style={{ fontWeight: 700 }}>{Number(orderBookData.spread_bps).toFixed(2)}</span>bps
            </Typography>
          </Stack>

          <Stack
            sx={{
              '& > *': {
                animation: 'slideInFromBottom 0.3s ease-out',
                animationFillMode: 'both',
              },
              '@keyframes slideInFromBottom': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(10px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            {orderBookData.bids.slice(0, rowsPerSide).map((bid, index) => (
              <Box
                key={bid.price}
                sx={{
                  animationDelay: `${index * 20}ms`,
                }}
              >
                {renderOrderRow('bid', bid)}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* Mobile Expand/Collapse Button */}
      {isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 0.5,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`,
            },
          }}
        >
          <IconButton
            size='small'
            sx={{
              color: theme.palette.text.secondary,
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      )}

      {/* Sticky Market Depth Sentiment Indicator */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.card,
          zIndex: 10,
          height: '45px',
          flexShrink: 0, // Prevent shrinking
        }}
      >
        <MarketDepthSentiment containerWidth={containerWidth} orderBookData={orderBookData} />
      </Box>
    </Stack>
  );
}

export default React.memo(OrderBookChart);
