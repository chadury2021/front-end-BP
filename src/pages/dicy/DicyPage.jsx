import React, { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Typography,
  Box,
  CardContent,
  TableBody,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TableContainer,
  Table,
} from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { useTheme } from '@emotion/react';
import { getNettingStats } from '../../apiServices';
import {
  displayDefaultTableCell,
  StyledHeaderTableCellWithLine,
  StyledSummaryTableCell,
  StyledTableCell,
} from '../../shared/orderTable/util';

const columns = [
  { id: 'fill_time', label: 'Fill Time', width: 80, align: 'left' },
  { id: 'order_id', label: 'Order ID', width: 80, align: 'left' },
  { id: 'buy_token', label: 'Buy Token', width: 80, align: 'left' },
  { id: 'sell_token', label: 'Sell Token', width: 80, align: 'left' },
  { id: 'executed_price', label: 'Executed Price', width: 80, align: 'left' },
  { id: 'executed_qty', label: 'Executed Quantity', width: 80, align: 'left' },
  {
    id: 'executed_notional',
    label: 'Executed Notinoal',
    width: 80,
    align: 'left',
  },
];

const statsColumns = [
  { id: 'executed_price', label: 'Executed Price', width: 80, align: 'left' },
  { id: 'executed_qty', label: 'Executed Quantity', width: 80, align: 'left' },
  {
    id: 'executed_notional',
    label: 'Executed Notinoal',
    width: 80,
    align: 'left',
  },
];

export default function DicyPage() {
  const [fills, setFills] = useState([]);
  const [num_orders, setNumOrders] = useState(0);
  const [num_slices, setNumSlices] = useState(0);
  const [filled_notional, setFilledNotional] = useState(0);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const theme = useTheme();

  useEffect(() => {
    const fetchNettingData = async () => {
      setLoading(true);
      const stats = await getNettingStats();
      const {
        fills: statFills,
        num_orders: statNumOrders,
        num_slices: statNumSlices,
        filled_notional: statsFilledNotional,
      } = stats;

      setFills(statFills);
      setNumOrders(statNumOrders);
      setNumSlices(statNumSlices);
      setFilledNotional(statsFilledNotional);
      setLoading(false);
    };

    fetchNettingData();
  }, []);

  return (
    <Box
      spacing={2}
      sx={{
        height: '850px',
        width: '80%',
        margin: '0 auto',
      }}
    >
      <Stack dirction='column' spacing={2}>
        <Stack
          alignItems='center'
          direction='row'
          justifyContent='space-between'
          sx={{ height: 'auto', width: '100%' }}
        >
          <div
            style={{
              height: '60px',
              paddingTop: '10px',
              paddingBottom: '10px',
            }}
          >
            <Box>
              <Typography fontFamily='Jost' fontSize={28} fontWeight={400} variant='h2'>
                Internal Cross Fills
              </Typography>
            </Box>
          </div>

          <Card sx={{ flexShrink: 0 }}>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <StyledSummaryTableCell>
                      <Typography>Number of Orders:</Typography>
                    </StyledSummaryTableCell>
                    <StyledSummaryTableCell sx={{ textAlign: 'right' }}>
                      <Typography>{num_orders}</Typography>
                    </StyledSummaryTableCell>
                  </TableRow>
                  <TableRow>
                    <StyledSummaryTableCell>
                      <Typography>Number of Slices:</Typography>
                    </StyledSummaryTableCell>
                    <StyledSummaryTableCell sx={{ textAlign: 'right' }}>
                      <Typography>{num_slices}</Typography>
                    </StyledSummaryTableCell>
                  </TableRow>
                  <TableRow>
                    <StyledSummaryTableCell>
                      <Typography>Filled Notional:</Typography>
                    </StyledSummaryTableCell>
                    <StyledSummaryTableCell sx={{ textAlign: 'right' }}>
                      <Typography>{filled_notional}</Typography>
                    </StyledSummaryTableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Stack>

        <Card sx={{ height: '75vh', width: '100%' }}>
          <CardContent sx={{ height: '100%' }}>
            <Box sx={{ height: '100%' }}>
              {loading ? (
                <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
                  <ScaleLoader color={theme.palette.text.offWhite} />
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 'calc(100% - 80px)' }}>
                  <Table stickyHeader aria-label='sticky table'>
                    <TableHead>
                      <TableRow>
                        {columns.map((column) => (
                          <StyledHeaderTableCellWithLine
                            align={column.align}
                            key={column.id}
                            sx={{
                              minWidth: column.minWidth,
                              width: column.width || undefined,
                            }}
                          >
                            {column.label}
                          </StyledHeaderTableCellWithLine>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ overflowY: 'auto' }}>
                      {fills && fills.length > 0
                        ? fills.slice(page * 25, page * 25 + 25).map((tx) => (
                            <TableRow hover key={tx.id}>
                              {columns.map((column) => {
                                const value = tx[column.id];
                                return displayDefaultTableCell(column, value, {}, StyledTableCell);
                              })}
                            </TableRow>
                          ))
                        : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <TablePagination
                component='div'
                count={fills.length}
                page={page}
                rowsPerPage={25}
                rowsPerPageOptions={[25]}
                sx={{ height: '60px' }}
                onPageChange={(event, newPage) => {
                  setPage(newPage);
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
