import React from 'react';
import { useTheme } from '@mui/material/styles';
import { getExplorerUrl } from './util';

/**
 * Creates a clickable transaction hash component for notifications
 * @param {string} txHash - The transaction hash to make clickable
 * @param {string} network - The network chain ID (optional, defaults to '1' for Ethereum)
 * @param {Object} theme - The Material-UI theme object
 * @returns {JSX.Element} Clickable transaction hash component
 */
export const createClickableTransactionHash = (txHash, network = '1') => {
  const explorerUrl = getExplorerUrl(txHash, network, 'transaction');

  if (!explorerUrl) {
    return txHash; // Return plain text if no explorer URL available
  }

  return (
    <a
      href={explorerUrl}
      rel='noopener noreferrer'
      style={{
        color: 'primary.main',
        textDecoration: 'underline',
        cursor: 'pointer',
      }}
      target='_blank'
    >
      {txHash}
    </a>
  );
};

/**
 * Parses a notification message and makes transaction hashes clickable
 * @param {string} message - The notification message
 * @param {string} network - The network chain ID (optional, defaults to '1' for Ethereum)
 * @param {Object} theme - The Material-UI theme object
 * @returns {JSX.Element|string} Message with clickable transaction hashes or plain string
 */
export const makeTransactionHashesClickable = (message, theme, network = '1') => {
  if (!message || typeof message !== 'string') {
    return message;
  }

  // Regex to match transaction hashes (0x followed by 64 hex characters)
  const txHashRegex = /(0x[a-fA-F0-9]{64})/g;

  // Check if the message contains transaction hashes
  if (!txHashRegex.test(message)) {
    return message;
  }

  // Split the message by transaction hashes and create clickable links
  const parts = message.split(txHashRegex);

  return parts.map((part, index) => {
    // Check if this part is a transaction hash
    if (txHashRegex.test(part)) {
      return createClickableTransactionHash(part, theme, network);
    }
    return part;
  });
};

/**
 * React component for displaying a clickable transaction hash
 * @param {Object} props - Component props
 * @param {string} props.txHash - The transaction hash to display
 * @param {string} props.network - The network chain ID (optional, defaults to '1' for Ethereum)
 * @param {Object} props.style - Additional styles to apply
 * @returns {JSX.Element} Clickable transaction hash component
 */
export function TransactionHashLink({ txHash, network = '1', style = {} }) {
  const theme = useTheme();
  const explorerUrl = getExplorerUrl(txHash, network, 'transaction');

  if (!explorerUrl) {
    return <span style={style}>{txHash}</span>;
  }

  return (
    <a
      href={explorerUrl}
      rel='noopener noreferrer'
      style={{
        color: theme.palette.primary.main,
        textDecoration: 'underline',
        cursor: 'pointer',
        ...style,
      }}
      target='_blank'
    >
      {txHash}
    </a>
  );
}

export default TransactionHashLink;
