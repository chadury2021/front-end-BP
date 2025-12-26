import { Box, Typography } from '@mui/material';
import { CASH_ASSETS } from '@/constants';
import {
  PerpTable,
  SpotMarginTable,
  SpotTable,
  CashTable,
  UncategorizedTable,
  isMarginedAsset,
  OptionTable,
} from './index';

export function AccountAssetTable({ exchange, marketType, marketTypeAssets }) {
  const perpAssets = marketTypeAssets.filter((asset) => asset.market_type === 'perp');
  const spotAssets = marketTypeAssets.filter((asset) => asset.market_type === 'spot' && !isMarginedAsset(asset));
  const spotMarginAssets = marketTypeAssets.filter((asset) => asset.market_type === 'spot' && isMarginedAsset(asset));
  const optionAssets = marketTypeAssets.filter((asset) => asset.market_type === 'option');
  const cashAssets = marketTypeAssets.filter(
    (asset) => asset.market_type === 'cash' || CASH_ASSETS.includes(asset.symbol)
  );
  const uncategorizedAssets = marketTypeAssets.filter(
    (asset) =>
      !['perp', 'spot', 'cash', 'option'].includes(asset.market_type) &&
      !CASH_ASSETS.includes(asset.symbol) &&
      !isMarginedAsset(asset)
  );

  if (marketType === 'perp' && perpAssets.length > 0) {
    return <PerpTable assets={perpAssets} exchange={exchange} />;
  }

  if (marketType === 'spot' || exchange === 'OKXDEX') {
    if (spotMarginAssets.length > 0) {
      return <SpotMarginTable assets={spotMarginAssets} exchange={exchange} />;
    }
    if (spotAssets.length > 0) {
      return <SpotTable assets={spotAssets} exchange={exchange} />;
    }
  }

  if (marketType === 'cash' && cashAssets.length > 0) {
    return <CashTable assets={cashAssets} exchange={exchange} />;
  }

  if (marketType === 'option' && optionAssets.length > 0) {
    return <OptionTable assets={optionAssets} exchange={exchange} />;
  }

  if (uncategorizedAssets.length > 0) {
    return (
      <Box>
        <Typography sx={{ mb: 2 }} variant='h6'>
          Other Assets
        </Typography>
        <UncategorizedTable assets={uncategorizedAssets} exchange={exchange} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography color='text.secondary' variant='body1'>
        No assets found for this market type.
      </Typography>
    </Box>
  );
}
