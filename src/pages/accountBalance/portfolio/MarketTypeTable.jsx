import { CASH_ASSETS, MARKET_TYPES } from '@/constants';
import { useTheme } from '@emotion/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Collapse,
  IconButton,
  Stack,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import { styled } from '@mui/system';
import { useState } from 'react';
import { capitalizeFirstLetter, isEmpty, msAndKs } from '@/util';
import { CHAIN_CONFIGS, getTokenInfo } from '@/shared/dexUtils';
import { ChainIcon } from '@/shared/components/Icons';
import { AccountAssetTable } from './AccountAssetTable';

const filterByMarketType = (assets, marketType) => {
  const isCashAsset = (asset) => CASH_ASSETS.includes(asset);
  let absMarketTypeTotalValue = 0;
  let marketTypeTotalValue = 0;
  let marketTypeAssets = [];

  if (marketType === 'cash') {
    marketTypeAssets = assets.filter((asset) => {
      if (isCashAsset(asset.symbol)) {
        marketTypeTotalValue += asset.notional || 0;
        absMarketTypeTotalValue += Math.abs(asset.notional || 0);
        return true;
      }
      return false;
    });
  } else {
    marketTypeAssets = assets.filter((asset) => {
      if (asset.market_type === marketType) {
        if (marketType === 'spot' && isCashAsset(asset.symbol)) {
          return false;
        }
        marketTypeTotalValue += asset.notional || 0;
        absMarketTypeTotalValue += Math.abs(asset.notional || 0);
        return true;
      }
      return false;
    });
  }

  return { marketTypeAssets, marketTypeTotalValue, absMarketTypeTotalValue };
};

const ExpandMore = styled(IconButton)(({ theme, expand }) => ({
  marginLeft: 'auto',
  borderRadius: '8px',
  backgroundColor: 'None',
  '&:hover': {
    backgroundColor: 'None',
  },
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  transform: expand ? 'rotate(0deg)' : 'rotate(180deg)',
}));

const displayMarketType = (marketType) => {
  if (marketType === 'perp') {
    return 'Perpetual Futures';
  }
  return capitalizeFirstLetter(marketType);
};

// Get chain ID from chain name
const getChainId = (chainName) => {
  switch (chainName) {
    case 'Ethereum Mainnet':
      return '1';
    case 'BSC':
      return '56';
    case 'Base':
      return '8453';
    case 'Solana':
      return '501';
    default:
      return null;
  }
};

// Group DEX assets by chain for separate tables
const groupDexAssetsByChain = (assets, exchange) => {
  const isDexExchange = exchange === 'OKXDEX';
  if (!isDexExchange) {
    return { groupedAssets: assets, hasChainGroups: false };
  }

  const groupedAssets = {};
  const hasChainGroups = true;

  assets.forEach((asset) => {
    // Check if this is a DEX asset (has contract_address:chain_id format)
    const tokenInfo = getTokenInfo(asset.symbol);
    if (tokenInfo && tokenInfo.chainId) {
      const { chainId } = tokenInfo;
      const chainName = CHAIN_CONFIGS[chainId]?.name || `Chain ${chainId}`;

      if (!groupedAssets[chainName]) {
        groupedAssets[chainName] = [];
      }
      groupedAssets[chainName].push(asset);
    } else {
      // For non-DEX assets, put them in a default group
      if (!groupedAssets.Other) {
        groupedAssets.Other = [];
      }
      groupedAssets.Other.push(asset);
    }
  });

  return { groupedAssets, hasChainGroups };
};

function MarketTypeCard({ marketType, marketTypeTotalValue, marketTypeAssets, absMarketTypeTotalValue, exchange }) {
  const [expanded, setExpanded] = useState(true);
  const theme = useTheme();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const isChainMarket = exchange === 'OKXDEX' && getChainId(marketType) !== null;

  return (
    <Stack direction='column' spacing={1}>
      <Stack
        alignItems='baseline'
        direction='row'
        spacing={4}
        sx={{
          width: '100%',
        }}
      >
        {isChainMarket ? (
          <Stack alignItems='center' direction='row' spacing={1}>
            <ChainIcon
              chainId={getChainId(marketType)}
              style={{
                height: '15px',
                width: '15px',
              }}
            />
            <Typography color='text.secondary' fontWeight={300} variant='body1'>
              {marketType}
            </Typography>
          </Stack>
        ) : (
          <Typography color='text.secondary' fontWeight={300} variant='body1'>
            {displayMarketType(marketType)}
          </Typography>
        )}

        {/* Spacer to push the ExpandMore to the right */}
        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{
            borderRadius: '8px',
            backgroundColor: theme.palette.button.grey,
            '&:hover': {
              backgroundColor: theme.palette.button.lightGrey,
            },
          }}
        >
          <ExpandMore aria-expanded={expanded} aria-label='show more' expand={expanded} onClick={handleExpandClick}>
            <ExpandMoreIcon />
          </ExpandMore>
        </Box>
      </Stack>

      <Collapse unmountOnExit in={expanded} timeout='auto'>
        <AccountAssetTable exchange={exchange} marketType={marketType} marketTypeAssets={marketTypeAssets} />
      </Collapse>
    </Stack>
  );
}

export const MarketTypeTable = ({ assets, exchange }) => {
  const isDexExchange = exchange === 'OKXDEX';

  if (isDexExchange) {
    // For DEX, create separate sections for each chain
    const { groupedAssets, hasChainGroups } = groupDexAssetsByChain(assets, exchange);

    if (!hasChainGroups) {
      // Fallback to regular market types if no chain groups
      return MARKET_TYPES.map((marketType) => {
        const { marketTypeAssets, marketTypeTotalValue, absMarketTypeTotalValue } = filterByMarketType(
          assets,
          marketType
        );
        if (!marketTypeAssets || isEmpty(marketTypeAssets)) {
          return null;
        }

        return (
          <Box key={`${marketType}card`} sx={{ height: '100%' }}>
            <MarketTypeCard
              absMarketTypeTotalValue={absMarketTypeTotalValue}
              exchange={exchange}
              marketType={marketType}
              marketTypeAssets={marketTypeAssets}
              marketTypeTotalValue={marketTypeTotalValue}
            />
          </Box>
        );
      });
    }

    // Create separate sections for each chain
    return Object.entries(groupedAssets).map(([chainName, chainAssets]) => {
      if (chainAssets.length === 0) return null;

      // Calculate totals for this chain
      const chainTotalValue = chainAssets.reduce((acc, asset) => acc + (asset.notional || 0), 0);
      const chainAbsTotalValue = chainAssets.reduce((acc, asset) => acc + Math.abs(asset.notional || 0), 0);

      return (
        <Box key={`${chainName}card`} sx={{ height: '100%' }}>
          <MarketTypeCard
            absMarketTypeTotalValue={chainAbsTotalValue}
            exchange={exchange}
            marketType={chainName} // Use chain name as market type
            marketTypeAssets={chainAssets}
            marketTypeTotalValue={chainTotalValue}
          />
        </Box>
      );
    });
  }
  // For non-DEX exchanges, use regular market types
  return MARKET_TYPES.map((marketType) => {
    const { marketTypeAssets, marketTypeTotalValue, absMarketTypeTotalValue } = filterByMarketType(assets, marketType);
    if (!marketTypeAssets || isEmpty(marketTypeAssets)) {
      return null;
    }

    return (
      <Box key={`${marketType}card`} sx={{ height: '100%' }}>
        <MarketTypeCard
          absMarketTypeTotalValue={absMarketTypeTotalValue}
          exchange={exchange}
          marketType={marketType}
          marketTypeAssets={marketTypeAssets}
          marketTypeTotalValue={marketTypeTotalValue}
        />
      </Box>
    );
  });
};
