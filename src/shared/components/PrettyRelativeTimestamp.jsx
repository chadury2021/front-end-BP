import { Box, Typography } from '@mui/material';
import moment from 'moment';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

// Create context to share timestamp data between parent and child components
const TimestampContext = createContext(null);

/**
 * Component that displays a timestamp with customizable layout through compound components.
 * Use the subcomponents (ISO and Relative) to control the layout of different parts.
 *
 * @param {Object} props - Component props
 * @param {number|string} props.timestamp - Unix timestamp (seconds) or ISO string
 * @param {Object} props.sx - MUI styling props
 * @param {React.ReactNode} props.children - Child components
 */
function PrettyRelativeTimestamp({ timestamp, sx = {}, children }) {
  const [relativeTime, setRelativeTime] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [formattedTime, setFormattedTime] = useState('');

  const updateTimes = (momentTime) => {
    setRelativeTime(momentTime.fromNow());
    setFormattedDate(momentTime.format('YYYY-MM-DD'));
    setFormattedTime(momentTime.format('HH:mm:ss'));
  };

  useEffect(() => {
    // Handle different timestamp formats
    let momentTime;

    if (typeof timestamp === 'number' || !Number.isNaN(Number(timestamp))) {
      // Convert to number if it's a string representation of a number
      const numericTimestamp = typeof timestamp === 'number' ? timestamp : Number(timestamp);

      // Check if timestamp is in milliseconds (13 digits) or seconds (10 digits)
      // If it's a very large number (future date), assume it's milliseconds and convert
      if (numericTimestamp > 10000000000) {
        momentTime = moment(numericTimestamp).utc(); // Treat as milliseconds
      } else {
        momentTime = moment.unix(numericTimestamp).utc(); // Treat as seconds
      }
    } else {
      // Handle as a date string
      momentTime = moment(timestamp).utc();
    }

    // Set initial values
    updateTimes(momentTime);

    // Update relative time every minute
    const intervalId = setInterval(() => {
      updateTimes(momentTime);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [timestamp]);

  // Use useMemo to prevent creating a new context value on every render
  const contextValue = useMemo(
    () => ({
      relativeTime,
      formattedDate,
      formattedTime,
    }),
    [relativeTime, formattedDate, formattedTime]
  );

  // If no children are provided, render the default layout
  if (!children) {
    return (
      <TimestampContext.Provider value={contextValue}>
        <Box sx={{ display: 'flex', flexDirection: 'column', ...sx }}>
          <PrettyRelativeTimestamp.ISO color='text.primary' timeColor='text.secondary' variant='body2' />
          <PrettyRelativeTimestamp.Relative color='text.secondary' variant='body2' />
        </Box>
      </TimestampContext.Provider>
    );
  }

  return (
    <TimestampContext.Provider value={contextValue}>
      <Box sx={{ ...sx }}>{children}</Box>
    </TimestampContext.Provider>
  );
}

/**
 * Displays the ISO format of the timestamp (YYYY-MM-DD HH:MM:SS)
 *
 * @param {Object} props - Component props
 * @param {string} props.color - MUI Typography color for the date portion
 * @param {string} props.timeColor - MUI Typography color for the time portion
 * @param {string} props.variant - MUI Typography variant
 * @param {Object} props.sx - MUI styling props
 */
function ISO({ color = 'text.primary', timeColor = 'text.secondary', variant = 'body2', sx = {} }) {
  const context = useContext(TimestampContext);

  if (!context) {
    throw new Error('ISO component must be used within a PrettyRelativeTimestamp');
  }

  const { formattedDate, formattedTime } = context;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Typography color={color} component='span' variant={variant}>
        {formattedDate}
      </Typography>
      <Typography color={timeColor} component='span' sx={{ ml: 1 }} variant={variant}>
        {formattedTime}
      </Typography>
    </Box>
  );
}

/**
 * Displays the relative time format (e.g., "1 min ago")
 *
 * @param {Object} props - Component props
 * @param {string} props.color - MUI Typography color
 * @param {string} props.variant - MUI Typography variant
 * @param {Object} props.sx - MUI styling props
 * @param {boolean} props.showParentheses - Whether to show parentheses around the relative time
 */
function Relative({ color = 'text.secondary', variant = 'body2', sx = {}, showParentheses = true }) {
  const context = useContext(TimestampContext);

  if (!context) {
    throw new Error('Relative component must be used within a PrettyRelativeTimestamp');
  }

  const { relativeTime } = context;

  return (
    <Typography color={color} component='span' sx={{ fontSize: '0.85em', ...sx }} variant={variant}>
      {showParentheses ? `(${relativeTime})` : relativeTime}
    </Typography>
  );
}

// Attach subcomponents to the main component
PrettyRelativeTimestamp.ISO = ISO;
PrettyRelativeTimestamp.Relative = Relative;

export default PrettyRelativeTimestamp;
