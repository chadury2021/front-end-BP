import { Box, Typography } from '@mui/material';
import { React } from 'react';
import { Loader } from '../../shared/Loader';
import OrderBookChart from './charts/OrderBookChart';
import { usePriceDataContext } from './orderEntry/PriceDataContext';

function PriceCard({ exchangeName }) {
  const { orderBookData, isL2DataLoading, noL2Data, contractValue, isInverse } = usePriceDataContext();
  const data = orderBookData[exchangeName];

  if (noL2Data) {
    return (
      <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
        <Typography color='grey.main' variant='h6'>
          L2 Data Unavailable
        </Typography>
      </Box>
    );
  }

  if (isL2DataLoading || !data) {
    return (
      <Box height='100%'>
        <Loader />
      </Box>
    );
  }

  return (
    <Box height='100%' sx={{ px: 4, pt: 4, height: 'calc(100% - 16px)' }}>
      <OrderBookChart contractValue={contractValue} isInverse={isInverse} orderBookDataByExchange={data} />
    </Box>
  );
}

export default PriceCard;
