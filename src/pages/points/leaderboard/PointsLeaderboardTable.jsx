import React from 'react';
import { Table, TableBody, TableContainer, TableHead, TableRow, Box, useTheme } from '@mui/material';
import { StyledHeaderTableCellWithLine, StyledTableCell } from '@/shared/orderTable/util';
import { numberWithCommas, smartRound } from '@/util';

const COLUMNS = [
  { id: 'rank', label: 'Rank', width: '10%', align: 'left' },
  { id: 'trader', label: 'Trader', width: '15%', align: 'left' },
  { id: 'volume', label: 'Season 1 Volume', width: '35%', align: 'right' },
  { id: 'boosted_volume', label: 'Boosted Volume', width: '40%', align: 'right' },
];

function PointsLeaderboardTableCell({ row, column, userRank }) {
  const value = row[column.id];
  const isYou = row.rank === userRank;
  switch (column.id) {
    case 'rank':
      return row.rank || '-';
    case 'trader':
      return isYou ? (
        <Box component='span' sx={{ color: 'warning.main' }}>
          {row.trader_id} (You)
        </Box>
      ) : (
        row.trader_id || '-'
      );
    case 'volume':
      if (row.volume === null || row.volume === undefined) {
        return '-';
      }
      return `$${numberWithCommas(smartRound(row.volume, 2))}`;
    case 'boosted_volume': {
      // Support both boosted_volume and adjusted_volume for backward compatibility
      const boostedVolume = row.boosted_volume ?? row.adjusted_volume;
      if (boostedVolume === null || boostedVolume === undefined) {
        return '-';
      }
      return (
        <Box component='span' sx={{ color: 'warning.main' }}>
          {`$${numberWithCommas(smartRound(boostedVolume, 2))}`}
        </Box>
      );
    }
    default:
      return value || '-';
  }
}

function PointsLeaderboardTable({ leaderboardRows = [], userRank }) {
  const theme = useTheme();

  return (
    <Box sx={{ height: '100%' }}>
      <TableContainer>
        <Table
          stickyHeader
          aria-label='leaderboard table'
          sx={{
            borderCollapse: 'separate',
            borderSpacing: `0 ${theme.spacing(1)}`,
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
                  key={`header-${column.id}`}
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
            {leaderboardRows.map((row) => (
              <TableRow hover key={`${row.rank}-${row.trader_id}`} sx={{ '& > td, & > th': { py: 1.5 } }}>
                {COLUMNS.map((column) => (
                  <StyledTableCell
                    align={column.align}
                    key={column.id}
                    style={{
                      width: column.width,
                    }}
                  >
                    <PointsLeaderboardTableCell column={column} row={row} userRank={userRank} />
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

export default PointsLeaderboardTable;
