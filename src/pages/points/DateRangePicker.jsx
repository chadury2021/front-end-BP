import React from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

export const DateRange = {
  WEEK: { days: 7, display: '7D', key: 'week', grouping: 1, seconds: 7 * 24 * 60 * 60 },
  MONTH: { days: 31, display: '1M', key: 'month', grouping: 1, seconds: 30 * 24 * 60 * 60 },
  YEAR: { days: 365, display: '1Y', key: 'year', grouping: 30, seconds: 365 * 24 * 60 * 60 },
};

const DATE_RANGE_BY_KEY = Object.values(DateRange).reduce((acc, range) => {
  acc[range.key] = range;
  return acc;
}, {});

export default function DateRangePicker({ dateRange, onSelectDateRange }) {
  const handleChange = (event, rawValue) => {
    if (!rawValue) {
      return;
    }

    const selectedRange = DATE_RANGE_BY_KEY[rawValue];

    if (selectedRange) {
      onSelectDateRange(selectedRange);
    }
  };

  return (
    <ToggleButtonGroup
      exclusive
      color='primary'
      size='small'
      value={dateRange?.key}
      onChange={handleChange}
    >
      {Object.values(DateRange).map((dr) => (
        <ToggleButton key={dr.key} sx={{ px: 4 }} value={dr.key}>
          {dr.display}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
