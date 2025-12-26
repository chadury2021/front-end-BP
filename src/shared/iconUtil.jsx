import React from 'react';
import { Box, Icon, Tooltip } from '@mui/material';
import ICONS from '@images/exchange_icons';
import { useUserMetadata } from './context/UserMetadataProvider';

export function ExchangeIcons({ exchanges, pairId, accountNames, style }) {
  const { user } = useUserMetadata();
  const username = user?.username || 'Unknown User';

  return (
    <Box display='flex' flexDirection='row' marginLeft='0.3rem'>
      {exchanges
        .filter((exchange) => exchange !== 'MockExchange')
        .map((exchange, index) => {
          const url = ICONS[exchange.toLowerCase()] || ICONS.default;
          const tooltipTitle = accountNames ? `${username} — ${accountNames}` : exchange;

          return (
            <Tooltip arrow key={`${exchange}-${pairId}`} title={tooltipTitle}>
              <Icon
                sx={{
                  borderRadius: '50%',
                  width: '1.4rem',
                  height: '1.4rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  '& svg': {
                    maxWidth: '100%',
                    maxHeight: '100%',
                  },
                  '& png': {
                    maxWidth: '100%',
                    maxHeight: '100%',
                  },
                  zIndex: index + 1,
                  mx: '-0.3rem',
                  ...style,
                }}
              >
                <img alt='exchange icon' src={url} style={{ height: 'inherit', width: 'inherit' }} />
              </Icon>
            </Tooltip>
          );
        })}
    </Box>
  );
}
