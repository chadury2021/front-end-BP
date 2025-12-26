import BuildIcon from '@mui/icons-material/Build';
import { Box, Card, CardContent, Chip, Stack, Switch, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import ExchangeIcons from '@images/exchange_icons';
import { ExchangeIcon } from '@/shared/components/Icons';

export default function MaintenanceModeCard({
  maintenanceMode,
  onToggle,
  availableExchanges = [],
  selectedExchanges = [],
  onSelectedExchangesChange,
}) {
  const EXCLUDED_EXCHANGES = useMemo(() => new Set(['xyz', 'vntl', 'tread', 'flx']), []);

  const allExchanges = useMemo(
    () =>
      Object.keys(ExchangeIcons)
        .filter((key) => key !== 'default' && !EXCLUDED_EXCHANGES.has(key))
        .sort(),
    [EXCLUDED_EXCHANGES]
  );

  // Show all known exchanges, not just those with active orders. If
  // availableExchanges is provided, we still use the full list so the
  // operator can always see every venue.
  const exchangesToRender = allExchanges;
  const handleToggle = (event) => {
    if (onToggle) {
      onToggle(event);
    }
  };

  const handleExchangeClick = (exchange) => {
    if (!onSelectedExchangesChange) return;
    const normalized = String(exchange).toLowerCase();
    const current = Array.isArray(selectedExchanges) ? selectedExchanges.map((ex) => String(ex).toLowerCase()) : [];
    const next = current.includes(normalized) ? current.filter((ex) => ex !== normalized) : [...current, normalized];
    onSelectedExchangesChange(next);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack alignItems='flex-start' direction='column' spacing={2}>
          <Stack alignItems='center' direction='row' spacing={4} sx={{ width: '100%' }}>
            <Stack alignItems='center' direction='row' spacing={2}>
              <BuildIcon sx={{ color: maintenanceMode ? 'warning.main' : 'text.secondary' }} />
              <Box>
                <Typography variant='h6'>Maintenance Mode</Typography>
                <Typography color='text.secondary' variant='body2'>
                  Optional: Target exchanges
                </Typography>
              </Box>
            </Stack>
            <Stack alignItems='center' direction='row' spacing={1}>
              <Typography variant='body2'>{maintenanceMode ? 'ON' : 'OFF'}</Typography>
              <Switch checked={maintenanceMode} color='warning' onChange={handleToggle} />
            </Stack>
          </Stack>

          {exchangesToRender?.length > 0 && (
            <Stack
              alignItems='center'
              direction='row'
              flexWrap='wrap'
              gap={1.5}
              justifyContent='flex-start'
              sx={{ pt: 0.5 }}
            >
              {exchangesToRender.map((exchange) => {
                const isSelected =
                  Array.isArray(selectedExchanges) &&
                  selectedExchanges.map((ex) => String(ex).toLowerCase()).includes(String(exchange).toLowerCase());
                return (
                  <Chip
                    color={isSelected ? 'warning' : 'default'}
                    icon={
                      <ExchangeIcon
                        exchangeName={exchange}
                        style={{ height: '18px', width: '18px', minHeight: '18px', minWidth: '18px' }}
                      />
                    }
                    key={exchange}
                    label={exchange}
                    size='medium'
                    sx={{
                      borderRadius: 999,
                      fontWeight: 600,
                      px: 1.5,
                      py: 0.5,
                    }}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => handleExchangeClick(exchange)}
                  />
                );
              })}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
