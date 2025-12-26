import { Star } from '@mui/icons-material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TabScrollButton from '@mui/material/TabScrollButton';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { useContext, useEffect, useRef, useState, memo } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { useDexTokenManager } from '@/shared/context/DexTokenManagerProvider';
import { isDexToken as isDexTokenUtils } from '@/shared/dexUtils';
import getBaseTokenIcon from '../../../../images/tokens';
import getDexTokenIcon from '../../../../images/dex_tokens';
import { ErrorContext } from '../../../shared/context/ErrorProvider';
import { isolatedHolographicStyles } from '../../../theme/holographicEffects';

const MyTabScrollButton = styled(TabScrollButton)({
  '&.Mui-disabled': {
    width: 0,
  },
  overflow: 'hidden',
  transition: 'width 0.5s',
  width: 28,
});

// Styled component for isolated holographic pair buttons
const IsolatedHolographicPairButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 3),
  minHeight: '0px',
  height: '30px',
  gap: theme.spacing(2),
  cursor: 'pointer',
  ...isolatedHolographicStyles(theme),
}));

// Memoized pair button component to prevent unnecessary re-renders
const PairButton = memo(({ pair, pairDisplayIcon, priceChangeColor, pricePctChange, onClick, isDexToken }) => (
  <IsolatedHolographicPairButton onClick={onClick}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pointerEvents: 'none' }}>
      {pairDisplayIcon && (
        <img
          alt='Token Icon'
          src={pairDisplayIcon}
          style={{ height: '16px', width: '16px', borderRadius: isDexToken ? '50%' : undefined }}
        />
      )}
      <Typography
        sx={{
          fontSize: '12px',
          fontWeight: 500,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {pair}
      </Typography>
      {pricePctChange && (
        <Typography color={priceChangeColor} sx={{ fontSize: '11px', lineHeight: 1 }} variant='caption'>
          {pricePctChange !== undefined && pricePctChange !== null ? `${Number(pricePctChange).toFixed(2)}%` : '-'}
        </Typography>
      )}
    </Box>
  </IsolatedHolographicPairButton>
));

PairButton.displayName = 'PairButton';

function FavoritePairTabs({ FormAtoms, exchangeName }) {
  const [favouritePairs, setFavouritePairs] = useAtom(FormAtoms.favouritePairsAtom);
  const [selectedPair, setSelectedPair] = useAtom(FormAtoms.selectedPairAtom);
  const [initialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);
  const { showAlert } = useContext(ErrorContext);
  const { tokenPairs } = initialLoadValue;
  const { tickerData } = useExchangeTicker();
  const [scrollingEnabled, setScrollingEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [tickerX, setTickerX] = useState(0);
  const animationRef = useRef();
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const tickerTapeRef = useRef(null);
  const { loadTokens, getToken } = useDexTokenManager();

  const enabledFavorites = Object.entries(favouritePairs).filter(([_, enabled]) => enabled);

  useEffect(() => {
    loadTokens(Object.keys(favouritePairs));
  }, [favouritePairs]);

  // Update dimensions when content changes
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.scrollWidth);
      }
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [favouritePairs]);

  const handleTabChange = (event, newValue) => {
    const foundTokenPair = isDexTokenUtils(newValue)
      ? getToken(newValue)
      : tokenPairs.find((tokenPair) => tokenPair.id === newValue);
    if (!foundTokenPair) {
      showAlert({
        severity: 'error',
        message: 'Token pair no longer supplied, favorite pair removed',
      });
      const { [newValue]: _, ...otherFavorites } = favouritePairs;
      setFavouritePairs(otherFavorites);
      return;
    }
    setSelectedPair(foundTokenPair);
  };

  const handlePairClick = (pairId) => {
    handleTabChange(null, pairId);
  };

  const pairExistsFavorite = (pair) => {
    return pair && Object.keys(favouritePairs).includes(pair.id);
  };

  // Calculate how many repetitions are needed for seamless looping (always render all repetitions)
  const calculateRepetitions = () => {
    if (contentWidth === 0 || containerWidth === 0) return 2; // Default fallback
    const repetitionsNeeded = Math.ceil((containerWidth * 2) / contentWidth);
    return Math.max(2, repetitionsNeeded); // Minimum of 2 repetitions
  };
  const repetitions = calculateRepetitions();
  // Calculate max scroll value for manual (hovered) state (all repetitions)
  const maxScrollAll = Math.max(0, contentWidth * repetitions - containerWidth + 1); // +1 for subpixel rounding

  // Animate tickerX with requestAnimationFrame when not hovered
  useEffect(() => {
    let lastTime = performance.now();
    const speed = 60; // px per second (adjust for desired speed)
    function animate(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setTickerX((prev) => {
        let next = prev + speed * dt;
        // Only loop over one set width
        if (next > contentWidth) next = 0;
        return next;
      });
      animationRef.current = requestAnimationFrame(animate);
      return null;
    }
    if (!isHovered && contentWidth > 0) {
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
    return undefined;
  }, [isHovered, contentWidth]);

  // Reset tickerX if contentWidth changes
  useEffect(() => {
    setTickerX(0);
  }, [contentWidth]);

  // Manual wheel scrolling
  const handleWheel = (event) => {
    if (isHovered) {
      event.preventDefault();
      const scrollAmount = (event.deltaX || event.deltaY) > 0 ? 10 : -10;
      setTickerX((prev) => {
        let next = prev + scrollAmount;
        // Clamp to [0, maxScrollAll] when hovered
        if (next < 0) next = 0;
        if (next > maxScrollAll) next = maxScrollAll;
        return next;
      });
    }
  };

  // Manual drag scrolling
  const handleMouseDown = (event) => {
    if (isHovered) {
      setIsDragging(true);
      setDragStartX(event.pageX);
      setScrollLeft(tickerX);
      if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grabbing';
    }
  };
  const handleMouseMove = (event) => {
    if (isDragging) {
      event.preventDefault();
      const x = event.pageX;
      const walk = (x - dragStartX) * 0.8;
      let next = scrollLeft - walk;
      // Clamp to [0, maxScrollAll] when hovered
      if (next < 0) next = 0;
      if (next > maxScrollAll) next = maxScrollAll;
      setTickerX(next);
    }
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
    return undefined;
  }, [isDragging, dragStartX, scrollLeft]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (tickerX < 0) setTickerX(0);
    if (tickerX > maxScrollAll) setTickerX(maxScrollAll);
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
  };
  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
  };

  // Helper to render the favorite tabs (as ticker items)
  const renderFavoriteTabs = () =>
    Object.entries(favouritePairs)
      .filter(([_, enabled]) => enabled)
      .map(([pair, enabled]) => {
        const isDexToken = isDexTokenUtils(pair);
        const tokenPair = isDexToken ? getToken(pair) : tokenPairs.find((tp) => tp.id === pair);

        // Get the appropriate icon and display text
        let pairDisplayIcon = null;
        let displayText = pair;

        if (tokenPair) {
          if (isDexToken) {
            // For DEX tokens, use the symbol and DEX token icon
            pairDisplayIcon = getDexTokenIcon(tokenPair.address, tokenPair.chain_id) || tokenPair.logo_url;
            displayText = tokenPair.symbol || tokenPair.name || pair;
          } else {
            // For regular tokens, use base token icon
            pairDisplayIcon = getBaseTokenIcon(tokenPair.base);
          }
        }

        // Get ticker data with correct key format for DEX tokens
        const ticker = tickerData[pair];
        const pricePctChange = isDexToken ? tokenPair?.price_info?.priceChange24H : ticker?.pricePctChange24h;
        let priceChangeColor;
        if (pricePctChange) {
          priceChangeColor = pricePctChange > 0 ? 'side.buy' : 'side.sell';
        }
        return (
          <PairButton
            isDexToken={isDexToken}
            key={pair}
            pair={displayText}
            pairDisplayIcon={pairDisplayIcon}
            priceChangeColor={priceChangeColor}
            pricePctChange={pricePctChange}
            onClick={() => handlePairClick(pair)}
          />
        );
      });

  return (
    <>
      {/* Hide scrollbar for all browsers */}
      <style>{`
        .scrollable-container {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .scrollable-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      <Stack direction='row' sx={{ width: '100%' }}>
        <Tooltip arrow title='Toggle scrolling'>
          <IconButton
            sx={{ color: scrollingEnabled ? 'primary.main' : 'text.secondary', minWidth: 'auto', padding: '4px' }}
            onClick={() => setScrollingEnabled((prev) => !prev)}
          >
            <Star sx={{ fontSize: '0.8rem' }} />
          </IconButton>
        </Tooltip>
        {Object.keys(favouritePairs).length > 0 ? (
          <Box
            className='scrollable-container'
            ref={scrollContainerRef}
            sx={{
              alignItems: 'center',
              background: 'transparent',
              cursor: isHovered ? 'grab' : 'default',
              display: 'flex',
              flex: 1,
              height: '30px',
              overflow: isHovered ? 'auto' : 'hidden',
              width: '100%',
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          >
            <Box
              ref={tickerTapeRef}
              sx={{
                display: 'flex',
                flexWrap: 'nowrap',
                minWidth: 'max-content',
                // Clamp tickerX to [0, maxScrollAll] when hovered to avoid extra space
                transform: `translateX(-${isHovered ? Math.min(Math.max(tickerX, 0), maxScrollAll) : tickerX}px)`,
                transition: isHovered ? 'transform 0.1s linear' : undefined,
              }}
            >
              {/* Render all repetitions for seamless loop, even when hovered */}
              {Array.from({ length: repetitions }, (_, index) => (
                <Box key={index} ref={index === 0 ? contentRef : null} sx={{ display: 'flex', flexWrap: 'nowrap' }}>
                  {renderFavoriteTabs()}
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box alignItems='center' display='flex' height='30px' justifyContent='center'>
            <Typography color='grey.main' variant='body2'>
              No favorite pairs
            </Typography>
          </Box>
        )}
      </Stack>
    </>
  );
}

export default FavoritePairTabs;
