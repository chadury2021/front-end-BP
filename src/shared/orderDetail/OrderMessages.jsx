import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  Stack,
  TableRow,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  TablePagination,
  TableFooter,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { BASEURL, isEmpty } from '@/util';
import { openInNewTab } from '@/apiServices';
import { useSound } from '@/hooks/useSound';
import { StyledBenchmarkTableCell, formatDateTime } from '../orderTable/util';

function EmptyMessages() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Typography variant='small2'>No messages</Typography>
    </Box>
  );
}

function LoadingMessages() {
  return <div />;
}

function SidePairHeader({ side, pair, theme }) {
  return (
    <Stack direction='row' justifyContent='space-between' spacing={1} width='100%'>
      <Typography
        sx={{
          color: side === 'Buy' ? theme.palette.charts.green : theme.palette.charts.red,
          fontWeight: '500',
        }}
        variant='small1'
      >
        {side}
      </Typography>
      <Typography color='text.primary' variant='small1'>
        {pair}
      </Typography>
    </Stack>
  );
}

function TableMessages({ orderMessages, pageNumber, rowsPerPage, setCurrentPageNumber }) {
  const theme = useTheme();

  let visibleMessages = orderMessages;
  if (orderMessages && !isEmpty(orderMessages)) {
    visibleMessages = orderMessages.slice(pageNumber * rowsPerPage, pageNumber * rowsPerPage + rowsPerPage);
  }

  return (
    <TableContainer>
      <Table>
        <TableBody>
          {visibleMessages.map((message) => (
            <TableRow key={`${message.order}-${message.id}`}>
              <StyledBenchmarkTableCell
                align='left'
                sx={{
                  color: message.message_type === 'ERROR' ? theme.palette.message.error : theme.palette.message.info,
                }}
              >
                <Stack direction='column'>
                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='small2'>{formatDateTime(message.created_at)}</Typography>
                    <Stack alignItems='center' direction='row' spacing={2} width='50%'>
                      {message.side && message.pair && (
                        <SidePairHeader pair={message.pair} side={message.side} theme={theme} />
                      )}
                      {message?.childId && (
                        <IconButton
                          size='small'
                          style={{ height: '16px', width: '16px' }}
                          sx={{ color: 'secondary.main' }}
                          variant='outlined'
                          onClick={() => {
                            openInNewTab(`${BASEURL}/order/${message.childId}`);
                          }}
                        >
                          <OpenInNewIcon style={{ height: '16px', width: '16px' }} />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  <Typography variant='small1'>{message.message}</Typography>
                </Stack>
              </StyledBenchmarkTableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              count={orderMessages ? Object.keys(orderMessages).length : 0}
              page={pageNumber}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
              sx={{
                border: 0,
                overflow: 'visible',
                '& .MuiTablePagination-displayedRows': {
                  fontSize: '10px',
                },
                '& .MuiTablePagination-actions': {
                  marginLeft: '4px',
                },
              }}
              onPageChange={(e, newPage) => setCurrentPageNumber(newPage)}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

function OrderMessages({ orderMessages, simpleView = false, parentOrder = undefined }) {
  const [currentPageNumber, setCurrentPageNumber] = useState(0);
  const rowsPerPage = 10;
  const previousMessagesRef = useRef([]);
  const { playErrorSound } = useSound();

  useEffect(() => {
    if (orderMessages && orderMessages.length > 0) {
      const previousMessages = previousMessagesRef.current;
      const newErrorMessages = orderMessages.filter(
        (message) => message.message_type === 'ERROR' && !previousMessages.some((prev) => prev.id === message.id)
      );

      if (newErrorMessages.length > 0) {
        playErrorSound();
      }

      previousMessagesRef.current = orderMessages;
    }
  }, [orderMessages]);

  let content;
  let styles = {};
  if (orderMessages === null || orderMessages === undefined) {
    content = <LoadingMessages />;
  } else if (orderMessages.length === 0) {
    content = <EmptyMessages />;
  } else {
    content = (
      <TableMessages
        orderMessages={orderMessages}
        pageNumber={currentPageNumber}
        rowsPerPage={rowsPerPage}
        setCurrentPageNumber={setCurrentPageNumber}
      />
    );
    styles = { overflow: 'auto' };
  }

  const hasErrorMessage = orderMessages && orderMessages.some((item) => item.message_type === 'ERROR');

  return (
    <Stack direction='column' marginX={2}>
      <Stack alignItems='center' direction='row' marginLeft={2} marginTop={2} spacing={1}>
        <Typography variant={simpleView ? 'small1' : 'cardTitle'}>Messages</Typography>
        {hasErrorMessage && <ErrorIcon color='error' sx={{ height: '16px' }} />}
        {parentOrder && (
          <Tooltip placement='top' title='Open parent order'>
            <IconButton
              size='small'
              style={{ height: '16px', width: '16px' }}
              sx={{ color: 'secondary.main' }}
              variant='outlined'
              onClick={() => {
                openInNewTab(`${BASEURL}/multi_order/${parentOrder}`);
              }}
            >
              <OpenInNewIcon style={{ height: '16px', width: '16px' }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {content}
    </Stack>
  );
}

function useMultiOrderMessages(multiOrderStats) {
  const [orderMessages, setOrderMessages] = useState(null);

  useEffect(() => {
    if (multiOrderStats?.child_orders) {
      const messages = multiOrderStats.child_orders
        .reduce((acc, childOrder) => {
          const { id, side, pair } = childOrder;

          if (multiOrderStats[id]?.order_messages) {
            const childMessages = multiOrderStats[id].order_messages.map((message) => ({
              ...message,
              side: side === 'buy' ? 'Buy' : 'Sell',
              pair,
              childId: id,
            }));
            return [...acc, ...childMessages];
          }
          return acc;
        }, [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrderMessages(messages);
    }
  }, [multiOrderStats]);

  return orderMessages;
}

export { OrderMessages, useMultiOrderMessages };
