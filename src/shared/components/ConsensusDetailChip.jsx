import React from 'react';
import { Chip } from '@mui/material';

/**
 * A reusable chip component for displaying consensus or status information
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} [props.hasConsensus] - Whether consensus has been achieved (for consensus mode)
 * @param {string} [props.status] - Status text to display (for status mode);
 * Available values: 'Proposed', 'Skipped', 'Confirmed'
 * @param {string} [props.positiveLabel='Consensus'] - Label to display when consensus is achieved
 * @param {string} [props.negativeLabel='No Consensus'] - Label to display when consensus is not achieved
 * @param {string} [props.size='small'] - Size of the chip (small, medium)
 * @param {string} [props.variant='consensus'] - Variant of the chip ('consensus' or 'status')
 * @returns {React.ReactElement} Styled chip indicating consensus or status
 */
function ConsensusDetailChip({ status, size = 'small' }) {
  // Status color mapping using theme values
  const chipProps = {
    label: status,
    size,
  };

  // Map status to theme colors
  const statusStyleMap = {
    Proposed: {
      backgroundColor: 'info.dark2',
      color: 'info.main',
      fontWeight: 'medium',
    },
    Skipped: {
      backgroundColor: 'error.dark2',
      color: 'error.main',
      fontWeight: 'medium',
    },
    Confirmed: {
      backgroundColor: 'success.dark2',
      color: 'success.main',
      fontWeight: 'medium',
    },
    // Default/fallback styling
    default: {
      backgroundColor: 'info.dark2',
      color: 'info.main',
      fontWeight: 'medium',
    },
  };

  chipProps.sx = statusStyleMap[status] || statusStyleMap.default;

  return <Chip {...chipProps} />;
}

export default ConsensusDetailChip;
