import React, { useContext, useState, useEffect } from 'react';
import { useTheme } from '@emotion/react';
import { Collapse, Box, Table, TableBody, TableRow, TableHead } from '@mui/material';
import { getBulkChainedOrders } from '../../apiServices';
import DisplayRowDetails from './DisplayRowDetails';
import { ThinLoader } from '../Loader';
import { ErrorContext } from '../context/ErrorProvider';

export default function CollapsedChainedsRow({
  ordersInChain,
  StyledCell,
  columns,
  visibleColumns,
  open,
  ViewOrderTooltip,
}) {
  const [chainedOrderDetails, setChainedOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useContext(ErrorContext);
  const theme = useTheme();

  const chainIds = ordersInChain.map((order) => order.order_id);

  async function fetchChainedOrders(orders) {
    try {
      const fetchedDetails = await getBulkChainedOrders(orders);
      setChainedOrderDetails(fetchedDetails);
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Error fetching chained orders: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchChainedOrders(chainIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Collapse in={open}>
      {loading || !chainedOrderDetails ? (
        chainIds.map((chainedId) => (
          <Box key={`collapsed box${chainedId}`} style={{ padding: '10px' }}>
            <ThinLoader />
          </Box>
        ))
      ) : (
        <Table aria-label='chained collapsed table' size='small'>
          <TableHead>
            <TableRow>
              {columns.map(
                (column) =>
                  visibleColumns[column.id] && (
                    <StyledCell
                      align={column.align}
                      key={`collapsable chained header${column.id}`}
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
            {chainedOrderDetails.map((row) => {
              const { order } = row;
              order.super_strategy = order.super_strategy_name; // chained order has displayable name in super_strategy_name
              return (
                <TableRow
                  hover
                  key={`collapsed chained${order.id}`}
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
                        row: order,
                        column,
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
                    <ViewOrderTooltip orderRow={order} />
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
