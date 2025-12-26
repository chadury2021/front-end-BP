import React from 'react';
import { Chip } from '@mui/material';

/**
 * A reusable chip component for displaying consensus status
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.hasConsensus - Whether consensus has been achieved
 * @param {string} [props.positiveLabel='Consensus'] - Label to display when consensus is achieved
 * @param {string} [props.negativeLabel='No Consensus'] - Label to display when consensus is not achieved
 * @param {string} [props.size='small'] - Size of the chip (small, medium)
 * @returns {React.ReactElement} Styled chip indicating consensus status
 */
function ConsensusChip({
  hasConsensus,
  positiveLabel = 'Success',
  negativeLabel = 'Failed',
  size = 'small',
}) {
  return (
    <Chip
      label={hasConsensus ? positiveLabel : negativeLabel}
      size={size}
      sx={{
        backgroundColor: hasConsensus ? 'success.dark2' : 'error.dark',
        borderRadius: '4px',
        color: hasConsensus ? 'success.main' : 'error.light',
        fontWeight: 'medium',
        px: 1,
      }}
    />
  );
}

export default ConsensusChip;
