import React from 'react';
import { Box, InputAdornment } from '@mui/material';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import AlgoNumberField from './AlgoNumberField';

function MaxClipSizeField({ maxClipSize, setMaxClipSize, ...props }) {
  return (
    <Box marginY={1}>
      <AlgoNumberField
        InputProps={{
          step: 'any',
          startAdornment: <InputAdornment position='start'> $ </InputAdornment>,
        }}
        label={<TreadTooltip placement='left' variant='max_clip_size' />}
        placeholder='Adapts to book if not set'
        size='small'
        value={maxClipSize}
        onChange={(e) => setMaxClipSize(e.target.value)}
        {...props}
      />
    </Box>
  );
}

export default MaxClipSizeField;
