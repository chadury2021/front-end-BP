import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import React, { useMemo } from 'react';

export default function OpenOrdersFilters({
  availableStatuses,
  excludedStatuses,
  hasActiveFilters,
  onExcludedStatusesChange,
  onReset,
}) {
  const statuses = useMemo(() => {
    if (!Array.isArray(availableStatuses)) {
      return [];
    }
    return [...availableStatuses].sort((a, b) => a.label.localeCompare(b.label));
  }, [availableStatuses]);

  const handleChipToggle = (statusValue) => {
    if (!onExcludedStatusesChange) return;

    const isCurrentlyExcluded = excludedStatuses.includes(statusValue);
    const next = isCurrentlyExcluded
      ? excludedStatuses.filter((value) => value !== statusValue)
      : [...excludedStatuses, statusValue];
    onExcludedStatusesChange(next);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack
          alignItems={{ xs: 'flex-start', md: 'center' }}
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          spacing={2}
        >
          <Stack alignItems='center' direction='row' spacing={1.5}>
            <FilterAltOutlinedIcon color='primary' />
            <Typography variant='h6'>Open Orders Filters</Typography>
          </Stack>
          <Stack spacing={2} sx={{ width: '100%' }}>
            {statuses.length ? (
              <Stack
                alignItems='center'
                direction='row'
                flexWrap='wrap'
                gap={1}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  p: 1.5,
                  backgroundColor: 'background.card',
                }}
              >
                {statuses.map((status) => {
                  const isExcluded = excludedStatuses.includes(status.value);
                  return (
                    <Chip
                      color={isExcluded ? 'warning' : 'default'}
                      key={status.value}
                      label={status.label}
                      size='small'
                      sx={{
                        borderRadius: 999,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                      variant={isExcluded ? 'filled' : 'outlined'}
                      onClick={() => handleChipToggle(status.value)}
                    />
                  );
                })}
              </Stack>
            ) : (
              <Typography color='text.secondary' variant='body2'>
                Status filters become available once open orders load.
              </Typography>
            )}
            <Stack alignItems='flex-start'>
              <Button color='secondary' disabled={!hasActiveFilters} size='small' variant='outlined' onClick={onReset}>
                Clear Filters
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
