import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Box,
  List,
  ListItemButton,
  Stack,
  TextField,
  Typography,
  useTheme,
  Paper,
  IconButton,
  Chip,
  InputAdornment,
} from '@mui/material';
import { TokenIcon } from '@/shared/components/Icons';
import { Star, StarBorder, Close, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

export default function YieldPairSelector({ pairOptions, selectedBase, onPairChange, selectedOption }) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('yield-pair-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'high', 'low'
  const containerRef = useRef(null);

  const filteredOptions = useMemo(() => {
    let filtered = pairOptions;

    // Apply search filter
    if (searchTerm.trim()) {
      const normalized = searchTerm.trim().toLowerCase();
      filtered = pairOptions.filter((option) => {
        const { baseSymbol, displayLabel } = option;
        return baseSymbol.toLowerCase().includes(normalized) || displayLabel.toLowerCase().includes(normalized);
      });
    }

    // Sort by yield if specified
    if (sortOrder !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        if (sortOrder === 'high') {
          return b.annualizedRate - a.annualizedRate;
        }
        return a.annualizedRate - b.annualizedRate;
      });
    }

    // Separate favorites and non-favorites
    const favoritePairs = filtered.filter((option) => favorites.includes(option.baseSymbol));
    const nonFavoritePairs = filtered.filter((option) => !favorites.includes(option.baseSymbol));

    // Return favorites first, then non-favorites
    return [...favoritePairs, ...nonFavoritePairs];
  }, [pairOptions, searchTerm, favorites, sortOrder]);

  // Handle click outside to close the list
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsListOpen(false);
      }
    };

    if (isListOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isListOpen]);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('yield-pair-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (baseSymbol) => {
    setFavorites((prev) => {
      if (prev.includes(baseSymbol)) {
        return prev.filter((symbol) => symbol !== baseSymbol);
      }
      return [...prev, baseSymbol];
    });
  };

  const handleSortToggle = () => {
    if (sortOrder === 'none') {
      setSortOrder('high');
    } else if (sortOrder === 'high') {
      setSortOrder('low');
    } else {
      setSortOrder('none');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Backspace' && selectedOption && !searchTerm) {
      event.preventDefault();
      onPairChange(null);
      setSearchTerm('');
    }
  };

  return (
    <Box ref={containerRef}>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          fullWidth
          InputProps={{
            startAdornment: selectedOption && (
              <InputAdornment position='start'>
                <Chip
                  icon={<TokenIcon style={{ width: 16, height: 16 }} tokenName={selectedOption.baseSymbol} />}
                  label={selectedOption.displayLabel}
                  size='small'
                  sx={{ mr: 1 }}
                  onDelete={() => {
                    onPairChange(null);
                    setSearchTerm('');
                  }}
                />
              </InputAdornment>
            ),
            endAdornment: isListOpen && (
              <InputAdornment position='end'>
                <IconButton
                  size='small'
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsListOpen(false);
                  }}
                >
                  <Close fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          }}
          placeholder={selectedOption ? '' : 'Search pairs'}
          size='small'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onClick={() => setIsListOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {isListOpen && (
          <Paper sx={{ maxHeight: 320, display: 'flex', flexDirection: 'column' }} variant='outlined'>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 0.5,
                bgcolor: theme.palette.action.hover,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography sx={{ flex: 1, fontWeight: 600 }} variant='caption'>
                Pair
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  width: 120,
                  justifyContent: 'flex-end',
                  '&:hover': {
                    bgcolor: theme.palette.action.selected,
                  },
                  borderRadius: 1,
                  px: 0.25,
                  py: 0.125,
                }}
                onClick={handleSortToggle}
              >
                <Typography sx={{ fontWeight: 600 }} variant='caption'>
                  APY
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <KeyboardArrowUp
                    fontSize='small'
                    sx={{
                      fontSize: 12,
                      color: sortOrder === 'high' ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  />
                  <KeyboardArrowDown
                    fontSize='small'
                    sx={{
                      fontSize: 12,
                      color: sortOrder === 'low' ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <List disablePadding sx={{ overflowY: 'auto', flex: 1 }}>
              {filteredOptions.map((option) => {
                const isSelected = option.baseSymbol === selectedBase;
                const positiveYield = option.annualizedRate >= 0;
                const isFavorite = favorites.includes(option.baseSymbol);

                return (
                  <ListItemButton
                    key={option.baseSymbol}
                    selected={isSelected}
                    sx={{
                      px: 2,
                      py: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      '&:not(:last-of-type)': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                    onClick={() => {
                      onPairChange(option.baseSymbol);
                      setSearchTerm('');
                      setIsListOpen(false);
                    }}
                  >
                    <Stack alignItems='center' direction='row' spacing={1.5} sx={{ flex: 1 }}>
                      <TokenIcon style={{ width: 20, height: 20 }} tokenName={option.baseSymbol} />
                      <Typography variant='body2'>{option.baseSymbol}</Typography>
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        color={positiveYield ? 'success.light' : 'error.main'}
                        sx={{ textAlign: 'right', width: 80 }}
                        variant='body2'
                      >
                        {positiveYield ? '+' : ''}
                        {option.annualizedRate.toFixed(2)}%
                      </Typography>
                      <IconButton
                        size='small'
                        sx={{ p: 0.5 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(option.baseSymbol);
                        }}
                      >
                        {isFavorite ? (
                          <Star fontSize='small' sx={{ color: theme.palette.warning.main }} />
                        ) : (
                          <StarBorder fontSize='small' />
                        )}
                      </IconButton>
                    </Box>
                  </ListItemButton>
                );
              })}

              {!filteredOptions.length && (
                <Box sx={{ px: 2, py: 3 }}>
                  <Typography color='text.secondary' variant='body2'>
                    No pairs match your search.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
