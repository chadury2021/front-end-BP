import React from 'react';
import OrderDetailTable from '@/shared/orderDetail/OrderDetailTable';

function FillOrderTable({ fills, network = '1', isDexOrder = false, targetToken = null, targetBaseToken = null }) {
  return <OrderDetailTable isFillsView data={fills} dataLoading={false} isDexOrder={isDexOrder} network={network} targetBaseToken={targetBaseToken} targetToken={targetToken} title='Fills' />;
}

export { FillOrderTable };
