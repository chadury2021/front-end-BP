import React from 'react';
import { Box, Typography, Grid, TextField } from '@mui/material';

function GroupBasicInfoPanel({ formData, onUpdate }) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
        Set up the basic information for your trading group.
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label='Group Name'
            placeholder='Enter group name'
            value={formData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            label='Description'
            placeholder="Describe the trading group's purpose and strategy"
            rows={4}
            value={formData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default GroupBasicInfoPanel;
