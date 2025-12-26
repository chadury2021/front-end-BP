import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getSlippageForUrgency, formatUrgencyDisplay, getUrgencyKeyForTheme } from '@/util/urgencyUtils';
import { TreadTooltip } from './LabelTooltip';

const EXIT_CONDITION_BOX_SX = {
  px: 2,
  py: 2,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

function ExitConditionBox({ condition, type, urgency }) {
  const theme = useTheme();

  if (!condition) {
    return null;
  }

  const isTakeProfit = type === 'takeProfit';
  const titleColor = isTakeProfit ? 'success.main' : 'error.main';
  const title = isTakeProfit ? 'Take Profit' : 'Stop Loss';

  return (
    <Box sx={EXIT_CONDITION_BOX_SX}>
      <Stack direction='column' spacing={1.5}>
        <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography color={titleColor} sx={{ fontWeight: 600 }} variant='small1'>
            {title}
          </Typography>
          <Typography sx={{ fontWeight: 600 }} variant='small1'>
            ${condition.price}
          </Typography>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <Typography variant='small2'>Urgency</Typography>
          <Typography
            sx={{
              color: theme.palette.orderUrgency[getUrgencyKeyForTheme(urgency)] || theme.palette.primary.main,
              fontWeight: 500,
            }}
            variant='small2'
          >
            {formatUrgencyDisplay(urgency)}
          </Typography>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <TreadTooltip labelTextVariant='small2' placement='left' variant='max_slippage' />
          <Typography variant='small2'>{getSlippageForUrgency(urgency)}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

ExitConditionBox.propTypes = {
  condition: PropTypes.shape({
    price: PropTypes.string.isRequired,
  }),
  type: PropTypes.oneOf(['takeProfit', 'stopLoss']).isRequired,
  urgency: PropTypes.string.isRequired,
};

ExitConditionBox.defaultProps = {
  condition: null,
};

export default ExitConditionBox;
