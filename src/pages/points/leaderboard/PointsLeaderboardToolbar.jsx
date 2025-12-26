import React from 'react';
import { Box, Stack, Typography, TextField, InputAdornment, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function PointsLeaderboardToolbar({ search, onSearchChange, title = 'Leaderboard' }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
      }}
    >
      <Typography variant='h6'>{title}</Typography>
      <TextField
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon fontSize='small' sx={{ color: theme.palette.text.secondary }} />
            </InputAdornment>
          ),
        }}
        placeholder='Search Trader'
        size='small'
        sx={{
          width: { xs: '100%', sm: 300 },
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 1,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.success.main,
              borderWidth: '1px',
              boxShadow: `0 0 0 1px ${theme.palette.success.main}`,
            },
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.7,
              },
            },
          },
        }}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </Box>
  );
}

export default PointsLeaderboardToolbar;
