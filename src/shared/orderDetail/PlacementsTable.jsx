import React, { useEffect, useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Box, Typography } from '@mui/material';
import usePlacementsData from './hooks/usePlacementsData';
import OrderDetailTable from './OrderDetailTable';

function PlacementsTable({
  orderId,
  orderActive = false,
  isSimpleOrderView = false,
  isDetailOrderView = false,
  initPageSize = 10,
  network = '1', // Default to Ethereum mainnet
  isDexOrder = false, // Add isDexOrder prop
  targetToken = null, // Add target token for DEX orders
  targetBaseToken = null, // Add target base token for DEX orders
}) {
  const [onlyActive, setOnlyActive] = useState(false);
  useEffect(() => {
    setOnlyActive(orderActive);
  }, [orderActive]);
  const {
    placementsDataLoading,
    placementsData,
    totalPlacements,
    currentPageNumber,
    setCurrentPageNumber,
    currentPageSize,
  } = usePlacementsData(orderId, orderActive, onlyActive, initPageSize);

  const paginationProps = isSimpleOrderView
    ? {}
    : {
        totalRows: totalPlacements,
        currentPageNumber,
        setCurrentPageNumber,
        currentPageSize,
      };

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(100% - 30px)',
      }}
    >
      <OrderDetailTable
        data={placementsData}
        dataLoading={placementsDataLoading}
        isDetailOrderView={isDetailOrderView}
        isDexOrder={isDexOrder}
        isSimpleOrderView={isSimpleOrderView}
        network={network}
        paginationProps={paginationProps}
        targetBaseToken={targetBaseToken}
        targetToken={targetToken}
        title={onlyActive ? 'Active Placements' : 'Placements'}
      />
      {isDetailOrderView && (placementsData?.length > 0 || onlyActive) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <FormControlLabel
            control={<Checkbox checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />}
            label={<Typography variant='small2'>Active Placements Only</Typography>}
          />
        </Box>
      )}
    </Box>
  );
}

export default PlacementsTable;
