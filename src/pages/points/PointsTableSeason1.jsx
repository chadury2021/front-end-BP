import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Link,
  useTheme,
  TableSortLabel,
} from '@mui/material';
import { StyledHeaderTableCellWithLine, StyledTableCell, formatDateTime } from '@/shared/orderTable/util';
import { insertEllipsis, numberWithCommas, smartRound } from '@/util';

const COLUMNS = [
  { id: 'granted_at', label: 'Date', width: 100, align: 'left' },
  { id: 'points', label: 'Points', width: 75, align: 'right' },
  { id: 'volume', label: 'Volume', width: 100, align: 'right' },
  { id: 'adjusted_volume', label: 'Adjusted Volume', width: 100, align: 'right' },
  { id: 'description', label: 'Description', width: 150, align: 'right' },
];

function PointsTableCell({ row, column }) {
  const value = row[column.id];
  switch (column.id) {
    case 'granted_at':
      return formatDateTime(value);
    case 'points':
      return smartRound(value, 2);
    case 'volume':
      return value > 0 ? `$${numberWithCommas(smartRound(value, 2))}` : '-';
    case 'adjusted_volume':
      return value > 0 ? `$${numberWithCommas(smartRound(value, 2))}` : '-';
    default:
      return value;
  }
}

function descendingComparator(a, b, orderBy) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];

  // Handle null/undefined values - treat them as lowest priority
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;

  // For date columns, convert to Date objects for proper comparison
  if (orderBy === 'granted_at') {
    aValue = new Date(aValue);
    bValue = new Date(bValue);
  }

  // For numeric columns, ensure numeric comparison
  if (orderBy === 'points' || orderBy === 'volume' || orderBy === 'adjusted_volume') {
    aValue = Number(aValue) || 0;
    bValue = Number(bValue) || 0;
  }

  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function PointsTableSeason1({ pointsActivity }) {
  const theme = useTheme();
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('granted_at');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedPointsActivity = useMemo(() => {
    if (!pointsActivity) return [];
    return pointsActivity.slice().sort(getComparator(order, orderBy));
  }, [pointsActivity, order, orderBy]);

  return (
    <Box sx={{ height: '100%' }}>
      <TableContainer style={{ height: 'calc(100% - 60px)' }}>
        <Table
          stickyHeader
          aria-label='sticky table'
          sx={{
            borderCollapse: 'separate',
            borderSpacing: '0 8px',
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${theme.palette.common.transparent}`,
            },
          }}
        >
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <StyledHeaderTableCellWithLine
                  align={column.align}
                  key={`main header${column.id}`}
                  sortDirection={orderBy === column.id ? order : false}
                  style={{
                    width: column.width,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </StyledHeaderTableCellWithLine>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={{ overflow: 'auto' }}>
            {sortedPointsActivity.map((row) => (
              <TableRow
                hover
                key={`${row.earned_date}-${row.source_data || row.source_type}`}
                sx={{ '& > td, & > th': { py: 1.5 } }}
              >
                {COLUMNS.map((column) => (
                  <StyledTableCell
                    align={column.align}
                    key={column.id}
                    style={{
                      width: column.width,
                    }}
                  >
                    <PointsTableCell column={column} row={row} />
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default PointsTableSeason1;
