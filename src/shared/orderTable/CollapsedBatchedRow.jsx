import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@emotion/react';
import { Collapse, Box, Table, TableBody, TableRow, TableHead, Stack } from '@mui/material';
import { getBulkBatchedOrders } from '../../apiServices';
import DisplayRowDetails from './DisplayRowDetails';
import { ThinLoader } from '../Loader';
import { ErrorContext } from '../context/ErrorProvider';
import { PauseOrderButton, ResumeOrderButton, CancelOrderButton } from './tableActions';

export default function CollapsedBatchedRow({
  ordersInBatch,
  StyledCell,
  columns,
  visibleColumns,
  open,
  ViewOrderTooltip,
  orderRefresh,
  orderRefreshTick = 0,
}) {
  const [batchedOrderDetails, setBatchedOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useContext(ErrorContext);
  const theme = useTheme();

  const batchIds = ordersInBatch;
  const batchIdKey = useMemo(() => (Array.isArray(batchIds) ? batchIds.join(',') : ''), [batchIds]);
  const stableBatchIds = useMemo(() => (Array.isArray(batchIds) ? [...batchIds] : []), [batchIdKey]);
  const isFetchingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const fetchBatchedOrders = useCallback(
    async (orders) => {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      try {
        const fetchedDetails = await getBulkBatchedOrders(orders);
        console.log('Fetched batch order details:', fetchedDetails);
        // Log any problematic rows
        if (fetchedDetails && fetchedDetails.length > 0) {
          const invalidRows = fetchedDetails.filter(row => !row || !row.order || !row.order.id);
          if (invalidRows.length > 0) {
            console.warn('Found invalid batch order rows:', invalidRows);
          }
        }
        hasLoadedRef.current = true;
        setBatchedOrderDetails(fetchedDetails);
      } catch (error) {
        showAlert({
          severity: 'error',
          message: `Error fetching batched orders: ${error}`,
        });
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [showAlert]
  );

  const handleIndividualOrderAction = () => {
    // Refresh the parent batch order data after individual order action
    if (orderRefresh) {
      orderRefresh(false);
    }

    if (open) {
      fetchBatchedOrders(stableBatchIds);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    fetchBatchedOrders(stableBatchIds);
  }, [open, batchIdKey, orderRefreshTick, fetchBatchedOrders, stableBatchIds]);

  return (
    <Collapse in={open}>
      {loading || !batchedOrderDetails ? (
        batchIds.map((batchId) => (
          <Box key={`collapsed box${batchId}`} style={{ padding: '10px' }}>
            <ThinLoader />
          </Box>
        ))
      ) : (
        <Table aria-label='batched collapsed table' size='small'>
          <TableHead>
            <TableRow>
              {columns.map(
                (column) =>
                  visibleColumns[column.id] && (
                    <StyledCell
                      align={column.align}
                      key={`collapsable batched header${column.id}`}
                      style={{
                        minWidth: column.minWidth,
                        width: column.width || undefined,
                      }}
                    />
                  )
              )}
              <StyledCell align='left' key='actions' style={{ width: 190 }}>
                {}
              </StyledCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batchedOrderDetails
              .filter(row => row && row.order && row.order.id) // Filter out null/undefined rows or rows without valid order data
              .map((row) => {
              const { order } = row;
              const orderData = { ...order };
              return (
                <TableRow
                  hover
                  key={`collapsed batched${orderData.id}`}
                  sx={{
                    '& .MuiTableCell-root': {
                      borderBottom: 0,
                    },
                    width: '70%',
                    justifyContent: 'flex-end',
                    alignItems: 'right',
                  }}
                >
                  {columns.map(
                    (column) =>
                      visibleColumns[column.id] &&
                      DisplayRowDetails({
                        column,
                        row: orderData,
                        StyledCell,
                        theme,
                      })
                  )}
                  <StyledCell
                    sx={{
                      height: 32,
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      width: 190,
                      textAlign: 'end',
                    }}
                  >
                    <Stack alignItems='center' direction='row' spacing={0.5}>
                      <ViewOrderTooltip orderRow={orderData} />
                      {orderData.status === 'PAUSED' ? (
                        <ResumeOrderButton
                          orderRefresh={handleIndividualOrderAction}
                          orderRow={orderData}
                          orderType="Single"
                        />
                      ) : (
                        <PauseOrderButton
                          orderRefresh={handleIndividualOrderAction}
                          orderRow={orderData}
                          orderType="Single"
                        />
                      )}
                      <CancelOrderButton
                        disabled={['COMPLETE', 'CANCELED'].includes(orderData.status)}
                        onClick={(event) => {
                          event.stopPropagation();
                          // Handle cancel for individual order
                          handleIndividualOrderAction();
                        }}
                      />
                    </Stack>
                  </StyledCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Collapse>
  );
}
