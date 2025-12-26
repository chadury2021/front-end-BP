import React from 'react';
import { Table, TableBody, TableContainer, TableHead, TableRow, TablePagination, Box, Link } from '@mui/material';
import { StyledHeaderTableCellWithLine, StyledTableCell, formatDateTime } from '@/shared/orderTable/util';
import { insertEllipsis, numberWithCommas, smartRound } from '@/util';

const COLUMNS = [
  { id: 'earned_date', label: 'Date', width: 200, align: 'left' },
  { id: 'source', label: 'Source', width: 150, align: 'left' },
  { id: 'volume', label: 'Volume', width: 150, align: 'right' },
  { id: 'points_earned', label: 'Points', width: 150, align: 'right' },
];

function PointsTableCell({ row, column, achievements }) {
  const value = row[column.id];
  switch (column.id) {
    case 'earned_date':
      return formatDateTime(value);
    case 'points_earned':
      return smartRound(value, 2);
    case 'volume':
      return value ? `$${numberWithCommas(smartRound(value, 2))}` : '-';
    case 'source':
      if (row.source_type === 'order') {
        return <Link href={`/order/${row.source_data}`}>{insertEllipsis(row.source_data, 8, 6)}</Link>;
      }
      if (row.source_type === 'referral') {
        return 'Referral Bonus';
      }
      if (row.source_type === 'beta_bonus') {
        return 'Beta Tester Bonus';
      }
      if (row.source_type === 'achievement') {
        const achievement = achievements[row.source_data];
        return `${achievement?.title || row.source_data} achievement`;
      }
      break;
    default:
      return value;
  }
}

function PointsTable({
  pointsActivity,
  pointsActivityCount,
  activityPage,
  onPageChange,
  achievements,
  rowsPerPage = 10,
}) {
  const handleChangePage = (event, newPage) => {
    onPageChange(newPage);
  };

  return (
    <Box sx={{ height: '100%' }}>
      <TableContainer style={{ height: 'calc(100% - 60px)' }}>
        <Table stickyHeader aria-label='sticky table' sx={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <StyledHeaderTableCellWithLine
                  align={column.align}
                  key={`main header${column.id}`}
                  style={{
                    width: column.width,
                  }}
                >
                  {column.label}
                </StyledHeaderTableCellWithLine>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={{ overflow: 'auto' }}>
            {pointsActivity.map((row) => (
              <TableRow hover key={`${row.earned_date}-${row.points_earned}`} sx={{ '& > td, & > th': { py: 1.5 } }}>
                {COLUMNS.map((column) => (
                  <StyledTableCell
                    align={column.align}
                    key={column.id}
                    style={{
                      width: column.width,
                    }}
                  >
                    <PointsTableCell achievements={achievements} column={column} row={row} />
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component='div'
        count={pointsActivityCount}
        page={activityPage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
        sx={{ height: '60px' }}
        onPageChange={handleChangePage}
      />
    </Box>
  );
}

export default PointsTable;
