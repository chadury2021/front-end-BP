import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Typography, useTheme } from '@mui/material';

const digitPositions = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

function TwoFactorInput({ onChange, error }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const theme = useTheme();
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    if (onChange) {
      onChange(digits.join(''));
    }
  }, [digits, onChange]);

  const handleInputChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length === 1) {
      const newDigits = [...digits];
      newDigits[idx] = val;
      setDigits(newDigits);
      if (idx < 5) {
        inputRefs.current[idx + 1]?.focus();
      }
    } else if (val.length > 1) {
      const vals = val.split('');
      const newDigits = [...digits];
      for (let i = 0; i < 6 - idx && i < vals.length; i += 1) {
        newDigits[idx + i] = vals[i];
      }
      setDigits(newDigits);
      const nextIdx = Math.min(idx + vals.length, 5);
      inputRefs.current[nextIdx]?.focus();
    } else {
      const newDigits = [...digits];
      newDigits[idx] = '';
      setDigits(newDigits);
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (digits[idx] === '') {
        if (idx > 0) {
          inputRefs.current[idx - 1]?.focus();
          setDigits((prev) => {
            const updated = [...prev];
            updated[idx - 1] = '';
            return updated;
          });
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    if (pastedData.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6 && i < pastedData.length; i += 1) {
        newDigits[i] = pastedData[i];
      }
      setDigits(newDigits);
      const nextIdx = Math.min(pastedData.length, 5);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  const handleBoxClick = (idx) => {
    inputRefs.current[idx]?.focus();
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          justifyContent: 'center',
          cursor: 'text',
        }}
      >
        {digits.map((digit, idx) => (
          <TextField
            autoFocus={idx === 0}
            inputProps={{
              maxLength: 1,
              style: {
                width: '40px',
                height: '56px',
                textAlign: 'center',
                fontSize: '2rem',
                padding: 0,
                color: theme.palette.primary.main,
              },
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            inputRef={(el) => {
              if (el) inputRefs.current[idx] = el;
            }}
            key={`digit-${digitPositions[idx]}`}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: '1px solid',
                  borderColor: error ? 'error.main' : 'divider',
                  borderRadius: '4px',
                },
                backgroundColor: 'action.hover',
                transition: 'all 0.2s',
                boxShadow: digits.join('').length === idx ? '0 0 0 2px rgba(255, 181, 106, 0.5)' : 'none',
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
            type='tel'
            value={digit}
            onChange={(e) => handleInputChange(e, idx)}
            onClick={() => handleBoxClick(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
          />
        ))}
      </Box>
      {error && (
        <Typography color='error' sx={{ mt: 1, textAlign: 'center' }} variant='body2'>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default TwoFactorInput;