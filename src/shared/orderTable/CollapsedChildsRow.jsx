import { useTheme } from '@emotion/react';
import { Button, Collapse, IconButton, Link, Stack, TableHead, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import React, { useContext, useState, useEffect } from 'react';
import { getBulkOrder } from '../../apiServices';
import DisplayRowDetails from './DisplayRowDetails';
import { ThinLoader } from '../Loader';
import { ErrorContext } from '../context/ErrorProvider';

export default function CollapsedChildsRow({
  row,
  childOrders,
  StyledCell,
  columns,
  visibleColumns,
  open,
  ViewOrderTooltip,
}) {
  const [childOrderDetails, setChildOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useContext(ErrorContext);

  const theme = useTheme();

  async function fetchChildOrders(orders) {
    try {
      const fetchedDetails = await getBulkOrder(orders);
      setChildOrderDetails(fetchedDetails);
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Error fetching child orders: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchChildOrders(childOrders);
    }
  }, [open]);

  return (
    <Collapse in={open}>
      {loading || !childOrderDetails ? (
        childOrders.map((childId) => {
          return (
            <Box key={`collapased box${childId}`} style={{ padding: '10px' }}>
              <ThinLoader />
            </Box>
          );
        })
      ) : (
        <Table aria-label='child collapsed table' size='small'>
          <TableHead>
            <TableRow>
              {columns.map(
                (column) =>
                  visibleColumns[column.id] && (
                    <StyledCell
                      align={column.align}
                      key={`collapsable child${column.id}${row.id}`}
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
            {childOrderDetails.map((orderRow) => {
              const childRow = orderRow;
              childRow.strategy = orderRow.strategy || null;

              return (
                <TableRow
                  hover
                  key={`collapasable row${orderRow.id}`}
                  sx={{
                    // already a border on collapseable row
                    '& .MuiTableCell-root': {
                      borderBottom: 0,
                    },
                    justifyContent: 'flex-end',
                    alignItems: 'right',
                  }}
                >
                  {columns.map(
                    (column) =>
                      visibleColumns[column.id] &&
                      DisplayRowDetails({
                        row: orderRow,
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
                    <ViewOrderTooltip orderRow={orderRow} />
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
