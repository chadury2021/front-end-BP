// React and hooks
import { useTheme } from '@emotion/react';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Icon,
  Link,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { Box, Stack } from '@mui/system';

// Context
import { AccountsContext } from '@/shared/context/AccountsProvider';

// Components
import { CopyableValue } from '@/shared/components/CopyableValue';
import { RefreshOutlined } from '@mui/icons-material';
import ScaleLoader from 'react-spinners/ScaleLoader';

// Assets
import ICONS from '@images/exchange_icons';
import arweaveLight from '@images/logos/arweave-light.png';

// Utils
import { matchesTraderId } from '@/shared/cryptoUtil';
import { displayDefaultTableCell, StyledHeaderTableCellWithLine, StyledTableCell } from '@/shared/orderTable/util';
import { insertEllipsis } from './insertEllipsis';
import { TraderIdAutocomplete } from './TraderIdAutocomplete';
import { useTradeBlobsPagination } from './tradeUtils/useTradesPagination';
import { PAGINATION_CONFIG } from './utils/uiConfig';

const columns = [
  { id: 'epoch', label: 'Epoch', width: 40, align: 'left' },
  { id: 'trader_id', label: 'Trader ID', width: 60, align: 'left' },
  { id: 'exchange_name', label: 'Exchange', width: 50, align: 'left' },
  { id: 'id', label: 'Transaction ID', width: 260, align: 'left' },
  { id: 'merkle_root', label: 'Merkle Root', width: 80, align: 'left' },
  // { id: 'usd_volume', label: 'Volume', width: 30, align: 'right' },
];

/**
 * Component that displays a table of tokenized trades from the blockchain
 * @param {boolean} isPreviewOnly - Whether to display a preview of the trades
 * @param {boolean} hideFiltersAndPagination - Whether to hide the filters and pagination
 * @param {array} externalTrades - An array of external trades to display
 */
export default function ExplorerTradesTable({
  isPreviewOnly,
  hideFiltersAndPagination = false,
  externalTrades = null,
}) {
  let rowsPerPage;
  if (hideFiltersAndPagination) {
    rowsPerPage = Number.MAX_SAFE_INTEGER; // Show all trades when embedded
  } else if (isPreviewOnly) {
    rowsPerPage = PAGINATION_CONFIG.PREVIEW_ROWS;
  } else {
    rowsPerPage = PAGINATION_CONFIG.DEFAULT_ROWS;
  }

  console.debug('[ExplorerTradesTable] calling useTradesPagination with rowsPerPage', rowsPerPage);
  const {
    trades: internalTrades,
    page,
    loading,
    error,
    retryFetch,
    handlePageChange,
    hasMore,
    totalItems,
  } = useTradeBlobsPagination({
    pageSize: rowsPerPage,
    skip: !!externalTrades, // Bypass fetching if using external trades
    protocol: 'tread',
  });

  const trades = externalTrades || internalTrades;

  const [traderIdFilter, setTraderIdFilter] = useState('');

  const theme = useTheme();
  const navigate = useNavigate();
  const { accounts } = useContext(AccountsContext);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '95%',
        width: '100%',
      }}
    >
      {isPreviewOnly && (
        <CardHeader
          subheader={
            <Typography align='left' sx={{ mt: 1 }} variant='subtitle2'>
              Trades are securely stored on Arweave for permanent and transparent record-keeping.
            </Typography>
          }
          title={
            <Stack alignItems='flex-start' direction='row' spacing={2} style={{ flexShrink: 0 }}>
              <img alt='Arweave Logo Light' src={arweaveLight} style={{ height: '1.8rem' }} />
              <Typography align='left' variant='h4'>
                Tokenized Trades
              </Typography>
            </Stack>
          }
        />
      )}
      <CardContent
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          overflow: 'hidden', // Prevent content overflow
        }}
      >
        <Box sx={{ flexShrink: 0, mb: 2 }}>
          {!hideFiltersAndPagination && (
            <TraderIdAutocomplete
              accounts={accounts}
              value={traderIdFilter}
              onChange={(event, newValue) => {
                setTraderIdFilter(newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                setTraderIdFilter(newInputValue);
              }}
            />
          )}
        </Box>

        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader aria-label='trade blob table'>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledHeaderTableCellWithLine
                    align={column.align}
                    key={column.id}
                    style={{
                      minWidth: column.minWidth,
                      width: column.width || undefined,
                    }}
                  >
                    {column.label}
                  </StyledHeaderTableCellWithLine>
                ))}
              </TableRow>
            </TableHead>
            <TableBody sx={{ overflow: 'auto' }}>
              {loading && (
                <TableRow>
                  <StyledTableCell align='center' colSpan={columns.length}>
                    <Box display='flex' justifyContent='center' width='100%'>
                      <ScaleLoader color={theme.palette.primary.main} />
                    </Box>
                  </StyledTableCell>
                </TableRow>
              )}
              {!loading && error && (
                <TableRow>
                  <StyledTableCell align='center' colSpan={columns.length}>
                    <Stack alignItems='center' spacing={2}>
                      <Typography color='error'>Failed to load trades</Typography>
                      <Button startIcon={<RefreshOutlined />} variant='contained' onClick={retryFetch}>
                        Retry
                      </Button>
                    </Stack>
                  </StyledTableCell>
                </TableRow>
              )}
              {!loading && !error && trades.length === 0 && (
                <TableRow>
                  <StyledTableCell align='center' colSpan={columns.length}>
                    No trades found
                  </StyledTableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                trades
                  .filter((tx) => !traderIdFilter || matchesTraderId(traderIdFilter, tx.trader_id))
                  .map((tx) => {
                    return (
                      <TableRow hover key={tx.id}>
                        {columns.map((column) => {
                          const value = tx[column.id];
                          switch (column.id) {
                            case 'exchange_name':
                              return (
                                <StyledTableCell align={column.align} key={column.id}>
                                  <Stack alignItems='center' direction='row' spacing={1}>
                                    <Icon
                                      sx={{
                                        alignItems: 'center',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        height: '1.4rem',
                                        justifyContent: 'center',
                                        mx: '-0.3rem',
                                        width: '1.4rem',
                                        '& svg': {
                                          maxHeight: '100%',
                                          maxWidth: '100%',
                                        },
                                      }}
                                    >
                                      <img alt='exchange icon' src={ICONS[value.toLowerCase()] || ICONS.default} />
                                    </Icon>
                                    <Typography variant='body1'>
                                      {value.charAt(0).toUpperCase() + value.slice(1)}
                                    </Typography>
                                  </Stack>
                                </StyledTableCell>
                              );
                            case 'merkle_root':
                              return (
                                <StyledTableCell align={column.align} key={column.id}>
                                  <CopyableValue displayValue={insertEllipsis(value, 8, 6)} value={value} />
                                </StyledTableCell>
                              );

                            case 'trader_id':
                              return (
                                <StyledTableCell align={column.align} key={column.id}>
                                  <CopyableValue
                                    displayValue={
                                      value.startsWith('0x') ? insertEllipsis(value) : insertEllipsis(`0x${value}`)
                                    }
                                    value={value.startsWith('0x') ? value : `0x${value}`}
                                  />
                                </StyledTableCell>
                              );
                            case 'epoch':
                              return (
                                <StyledTableCell align={column.align} key={column.id}>
                                  <Link
                                    component='a'
                                    href={`/explorer/trades/${tx.id}`}
                                    sx={{
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      p: 0,
                                      display: 'inline-block',
                                    }}
                                    underline='hover'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(`/explorer/trades/${tx.id}`);
                                    }}
                                  >
                                    {value && !Number.isNaN(value) ? Number(value).toLocaleString() : value}
                                  </Link>
                                </StyledTableCell>
                              );
                            case 'id':
                              return (
                                <StyledTableCell align={column.align} key={column.id}>
                                  <Link href={`//arweave.app/tx/${value}`}>{insertEllipsis(value, 8, 6)}</Link>
                                </StyledTableCell>
                              );

                            default:
                              return displayDefaultTableCell(column, value, {}, StyledTableCell);
                          }
                        })}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ flexShrink: 0, mt: 2 }}>
          {!hideFiltersAndPagination && isPreviewOnly && (
            <Button
              sx={{
                border: 0,
                borderColor: theme.palette.text.offWhite,
                color: theme.palette.text.offWhite,
                height: '50px',
                width: '100%',
              }}
              variant='outlined'
              onClick={() => navigate('/explorer/trades')}
            >
              View all trades
            </Button>
          )}
          {!hideFiltersAndPagination && !isPreviewOnly && (
            <TablePagination
              component='div'
              count={-1}
              labelDisplayedRows={({ from, to }) => `${from}-${to} of ${hasMore ? 'more than' : ''} ${totalItems}`}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[rowsPerPage]}
              onPageChange={handlePageChange}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
