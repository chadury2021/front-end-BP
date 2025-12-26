import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

function CountdownTimer({ timeRemaining, onComplete }) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setDisplayTime(0);
      if (onComplete) onComplete();
      return undefined;
    }

    setDisplayTime(timeRemaining);

    const interval = setInterval(() => {
      setDisplayTime((prevTime) => {
        const newTime = Math.max(0, prevTime - 1);
        if (newTime === 0 && onComplete) {
          onComplete();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete, timeRemaining]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00:00:00';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const containerStyle = {
    display: 'inline-block',
    transition: 'color 0.3s ease',
  };

  return (
    <Typography style={containerStyle} variant="body1">
      {formatTime(displayTime)}
    </Typography>
  );
}

export default CountdownTimer;