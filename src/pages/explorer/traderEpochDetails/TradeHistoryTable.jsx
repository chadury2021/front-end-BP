import { getArweaveTransactionRaw } from '@/apiServices';
import { useDecryptTrade } from '@/pages/explorer/tradeUtils/useDecryptTrade';
import PrettyRelativeTimestamp from '@/shared/components/PrettyRelativeTimestamp';
import { StyledHeaderTableCellWithLine, StyledTableCell } from '@/shared/orderTable/util';
import { getUnderlying, formatQty } from '@/util';
import { useTheme } from '@emotion/react';
import { Alert, Stack, Table, TableBody, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { TokenIcon } from '@/shared/components/Icons';
import { formatSide, mapSideToColor } from '../utils/side';

const columns = [
  // { id: 'trade_id', label: 'Trade ID', width: 200, align: 'left' }, // keeping as comment in case we want to add it back
  { id: 'symbol', label: 'Symbol', width: 100, align: 'left' }, // Pair
  { id: 'side', label: 'Side', width: 80, align: 'left' },
  { id: 'amount', label: 'Executed Quantity', width: 120, align: 'right' },
  { id: 'price', label: 'Executed Price', width: 120, align: 'right' },
  { id: 'timestamp', label: 'Timestamp', width: 180, align: 'left' },
];

const balanceColumns = [
  { id: 'symbol', label: 'Symbol', width: 100, align: 'left' },
  { id: 'asset_type', label: 'Asset Type', width: 80, align: 'left' },
  { id: 'instrument_type', label: 'Instrument Type', width: 80, align: 'left' },
  { id: 'quantity', label: 'Quantity', width: 120, align: 'right' },
];

const priceColumns = [
  { id: 'symbol', label: 'Symbol', width: 100, align: 'left' },
  { id: 'instrument_type', label: 'Instrument Type', width: 80, align: 'left' },
  { id: 'price', label: 'Price', width: 120, align: 'right' },
];

function DecryptedPriceRow({ price }) {
  const symbol = price?.symbol?.split('USDT')[0];
  const base = getUnderlying(symbol);
  return (
    <TableRow hover>
      <StyledTableCell align='left'>
        <Stack
          direction='row'
          gap={1}
          sx={{
            alignItems: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <TokenIcon style={{ height: '30px', width: '30px' }} tokenName={base} />
          {price.symbol || 'N/A'}
        </Stack>
      </StyledTableCell>
      <StyledTableCell align='left'>{price.instrument_type || 'N/A'}</StyledTableCell>
      <StyledTableCell align='right'>
        {price.price} {base}
      </StyledTableCell>
    </TableRow>
  );
}

function DecryptedBalanceRow({ balance }) {
  // Icon
  const symbol = balance?.symbol;
  const base = getUnderlying(symbol);

  return (
    <TableRow hover>
      <StyledTableCell align='left'>
        <Stack
          direction='row'
          gap={1}
          sx={{
            alignItems: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <TokenIcon style={{ height: '30px', width: '30px' }} tokenName={base} />
          {balance.symbol || 'N/A'}
        </Stack>
      </StyledTableCell>
      <StyledTableCell align='left'>{balance.asset_type || 'N/A'}</StyledTableCell>
      <StyledTableCell align='left'>{balance.instrument_type || 'N/A'}</StyledTableCell>
      <StyledTableCell align='right'>
        {balance.quantity} {base}
      </StyledTableCell>
    </TableRow>
  );
}

function DecryptedTradeRow({ trade }) {
  const theme = useTheme();
  // Side
  const formattedSide = formatSide(trade.side);
  // Icon
  const symbol = trade?.symbol;
  const base = getUnderlying(symbol);

  return (
    <TableRow hover>
      <StyledTableCell align='left'>
        <Stack
          direction='row'
          gap={1}
          sx={{
            alignItems: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <TokenIcon style={{ height: '30px', width: '30px' }} tokenName={base} />
          {trade.symbol || 'N/A'}
        </Stack>
      </StyledTableCell>
      <StyledTableCell
        align='left'
        sx={{
          color: mapSideToColor(formattedSide),
        }}
      >
        {formattedSide || 'N/A'}
      </StyledTableCell>
      {/* Amount */}
      <StyledTableCell align='right' sx={{ fontFamily: theme.typography.fontFamilyConfig.data }}>
        {formatQty(trade.amount) || 'N/A'}
      </StyledTableCell>
      {/* Price */}
      <StyledTableCell align='right' sx={{ fontFamily: theme.typography.fontFamilyConfig.data }}>
        {formatQty(trade.price, true) || 'N/A'}
      </StyledTableCell>
      {/* Timestamp */}
      <StyledTableCell align='left'>
        <PrettyRelativeTimestamp timestamp={trade.timestamp}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <PrettyRelativeTimestamp.ISO />
            <PrettyRelativeTimestamp.Relative />
          </Box>
        </PrettyRelativeTimestamp>
      </StyledTableCell>
    </TableRow>
  );
}

export default function TradeHistoryTable({ cid, parameterId, traderId, hideTitle = false, onRecordCountUpdate }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const { decryptedData, loading: decryptLoading, error: decryptError, decrypt } = useDecryptTrade();

  useEffect(() => {
    async function fetchData() {
      if (!cid) return;

      setLoading(true);
      try {
        const result = await getArweaveTransactionRaw(cid);
        if (result?.raw_data) {
          await decrypt(cid, traderId, result.raw_data);
        }
      } catch (err) {
        console.error('Error fetching raw data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [cid]);

  // Report record count to parent when decryptedData changes
  useEffect(() => {
    if (!decryptLoading && !loading && decryptedData) {
      onRecordCountUpdate?.(decryptedData.length);
    }
  }, [decryptedData, decryptLoading, loading, onRecordCountUpdate]);

  const renderTableBody = () => {
    if (loading || decryptLoading) {
      return (
        <TableRow>
          <StyledTableCell align='center' colSpan={columns.length}>
            <ScaleLoader color={theme.palette.primary.main} size={8} />
          </StyledTableCell>
        </TableRow>
      );
    }

    if (decryptError) {
      return (
        <TableRow>
          <StyledTableCell align='center' colSpan={columns.length}>
            <Alert severity='warning' sx={{ my: 2 }}>
              {decryptError}
            </Alert>
          </StyledTableCell>
        </TableRow>
      );
    }

    if (!decryptedData || decryptedData.length === 0) {
      return (
        <TableRow>
          <StyledTableCell align='center' colSpan={columns.length}>
            <Typography>No decrypted trade data available</Typography>
          </StyledTableCell>
        </TableRow>
      );
    }

    if (parameterId === 0) {
      return decryptedData.map((trade) => <DecryptedTradeRow key={trade.trade_id} trade={trade} />);
    }

    if (parameterId === 1) {
      return decryptedData.map((balance) => <DecryptedBalanceRow balance={balance} key={balance.symbol} />);
    }

    return decryptedData.map((price) => <DecryptedPriceRow key={price.symbol} price={price} />);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!hideTitle && (
        <Typography sx={{ mb: 2 }} variant='h5'>
          Trade History
        </Typography>
      )}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TableContainer
          sx={{
            mt: 2,
            maxHeight: '400px',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Table stickyHeader aria-label='trade history table'>
            <TableHead>
              <TableRow>
                {(() => {
                  let columnsToMap;
                  if (parameterId === 0) {
                    columnsToMap = columns;
                  } else if (parameterId === 1) {
                    columnsToMap = balanceColumns;
                  } else {
                    columnsToMap = priceColumns;
                  }
                  return columnsToMap.map((column) => (
                    <StyledHeaderTableCellWithLine align={column.align} key={column.id} sx={{ width: column.width }}>
                      {column.label}
                    </StyledHeaderTableCellWithLine>
                  ));
                })()}
              </TableRow>
            </TableHead>
            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
