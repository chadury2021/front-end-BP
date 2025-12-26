import { useTheme, Link, TableRow, TableHead, Table, TableBody, TableCell, Typography, Stack } from '@mui/material';
import { BASEURL, smartRound } from '@/util';
import { Loader } from '@/shared/Loader';
import { StyledHeaderTableCellWithLine, StyledTableCell } from '@/shared/orderTable/util';
import DisplayRowDetails from '@/shared/orderTable/DisplayRowDetails';
import { createPairLink } from '@/shared/orderDetail/util/orderDetailUtils';

const columns = [
  {
    id: 'pair' || 'pairs',
    label: 'Pair',
    width: '12.5%',
    align: 'left',
  },

  { id: 'accounts', label: 'Accounts', width: '12.5%', align: 'left' },
  { id: 'side', label: 'Side', width: '12.5%', align: 'left' },

  {
    id: 'target_notional',
    label: 'Target Notional',
    width: '12.5%',
    align: 'right',
  },
  {
    id: 'executed_price',
    label: 'Executed Price',
    width: '12.5%',
    align: 'right',
    hasLoader: true,
  },
  {
    id: 'executed_notional',
    label: 'Executed Notional',
    width: '12.5%',
    align: 'right',
    hasLoader: true,
  },

  {
    id: 'pct_filled',
    label: 'Filled',
    width: '12.5%',
    align: 'center',
    fullWidth: true,
  },
  { id: 'status', label: 'Status', width: '14.2%', align: 'left' },
];

export function ChildOrderTable({ childOrders, includeHeaders }) {
  const theme = useTheme();

  const customCase = {
    pair: (row) => {
      return createPairLink({
        pairName: row.pair,
        orderId: row.id,
      });
    },
  };

  if (childOrders === undefined || Object.keys(childOrders).length === 0) {
    return <Loader />;
  }

  return (
    <Table style={{ width: '100%' }}>
      {includeHeaders && (
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <StyledHeaderTableCellWithLine
                align={column.align}
                key={`main header${column.id}`}
                style={{
                  minWidth: column.minWidth,
                  width: column.width || undefined,
                }}
              >
                <Typography color='text.secondary' variant='body2'>
                  {column.label}
                </Typography>
              </StyledHeaderTableCellWithLine>
            ))}
          </TableRow>
        </TableHead>
      )}
      <TableBody style={{ overflow: 'auto' }}>
        {childOrders.map((child) => (
          <TableRow key={`child_table_${child.id}`}>
            {columns.map((column) => {
              return DisplayRowDetails({
                row: child,
                column,
                StyledCell: StyledTableCell,
                theme,
                customCase,
              });
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
