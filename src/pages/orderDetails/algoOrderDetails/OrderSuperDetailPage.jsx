import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Stack, Table, TableBody, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Loader } from '@/shared/Loader';
import { smartRound, formatDateTime } from '@/util';
import { StyledTableCell, StyledHeaderTableCellWithLine } from '@/shared/orderTable/util';
import PlacementsTable from '@/shared/orderDetail/PlacementsTable';
import { ErrorContext } from '../../../shared/context/ErrorProvider';
import { fetchSuperOrderDetailData } from '../../../apiServices';

function OrderSuperDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const { showAlert } = useContext(ErrorContext);

  // Determine network from order data
  const getNetworkFromOrder = () => {
    if (!orderData.order) return '1';

    // Check if this is a DEX order by looking at unique_venues
    const isDexOrder =
      Array.isArray(orderData.order.unique_venues) &&
      orderData.order.unique_venues.some((venue) => venue.includes('OKXDEX'));

    if (isDexOrder) {
      // For DEX orders, we need to determine the chain from the target_token
      if (orderData.order.target_token && orderData.order.target_token.includes(':')) {
        const chainId = orderData.order.target_token.split(':')[1];
        return chainId;
      }
      // Default to Ethereum for DEX orders if we can't determine the chain
      return '1';
    }

    // For non-DEX orders, default to Ethereum
    return '1';
  };

  useEffect(() => {
    const loadOrderData = async () => {
      if (!uuid) {
        navigate('/');
        return;
      }
      let response;
      setIsLoading(true);
      try {
        response = await fetchSuperOrderDetailData(uuid);
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Failed to fetch order details: ${e.message}`,
        });
        return;
      } finally {
        setIsLoading(false);
      }

      setOrderData(response);
    };

    loadOrderData();
  }, []);

  if (!uuid) {
    navigate('/');
    return <div />;
  }

  if (isLoading) {
    return <Loader />;
  }

  const network = getNetworkFromOrder();

  // Determine if this is a DEX order
  const isDexOrder =
    orderData.order &&
    Array.isArray(orderData.order.unique_venues) &&
    orderData.order.unique_venues.some((venue) => venue.includes('OKXDEX'));

  return (
    <Box height='100%' overflow='auto'>
      <Stack direction='column' sx={{ backgroundColor: 'card.main' }}>
        <OrderDetails orderData={orderData} />
        <MessageTable orderMessages={orderData.errors} />
        <Box height='550px'>
          <PlacementsTable
            initPageSize={100}
            isDexOrder={isDexOrder}
            network={network}
            orderActive={false}
            orderId={uuid}
          />
        </Box>
        <FillsTable fills={orderData.fills} />
      </Stack>
    </Box>
  );
}

function OrderDetails({ orderData }) {
  return (
    <Box margin='16px'>
      <TableContainer>
        <Table>
          <TableBody>
            <TableRow>
              <StyledTableCell>Target Qty</StyledTableCell>
              <StyledTableCell>
                {smartRound(orderData.order.target_order_qty)} {orderData.order.target_token}
              </StyledTableCell>
            </TableRow>
            <TableRow>
              <StyledTableCell>Executed Qty</StyledTableCell>
              <StyledTableCell>
                {smartRound(orderData.order.target_executed_qty)} {orderData.order.target_token}
              </StyledTableCell>
            </TableRow>
            <TableRow>
              <StyledTableCell># of Active Placements</StyledTableCell>
              <StyledTableCell>{orderData.num_active_placements}</StyledTableCell>
            </TableRow>
            <TableRow>
              <StyledTableCell># of Fills</StyledTableCell>
              <StyledTableCell>{orderData.fills.length}</StyledTableCell>
            </TableRow>
            <TableRow>
              <StyledTableCell>Missing Qty</StyledTableCell>
              <StyledTableCell>{smartRound(orderData.order.missing_qty)}</StyledTableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function FillsTable({ fills }) {
  const roleColor = (type) => {
    switch (type) {
      case 'MAKE':
        return 'success.main';
      case 'TAKE':
        return 'error.main';
      default:
        return 'text.offWhite';
    }
  };

  return (
    <Stack direction='column' sx={{ margin: '16px' }}>
      <Typography variant='h4'>Fills</Typography>
      <TableContainer style={{ maxHeight: '500px' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledHeaderTableCellWithLine>Placement ID</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>External ID</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Timestamp</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Price</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Ex Qty</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Role</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Fee</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Created At</StyledHeaderTableCellWithLine>
            </TableRow>
          </TableHead>
          <TableBody sx={{ overflow: 'auto' }}>
            {fills.map((fill) => (
              <TableRow key={fill.id}>
                <StyledTableCell>{fill.placement_id}</StyledTableCell>
                <StyledTableCell>{fill.external_id}</StyledTableCell>
                <StyledTableCell>{formatDateTime(fill.fill_time)}</StyledTableCell>
                <StyledTableCell>{smartRound(fill.executed_price)}</StyledTableCell>
                <StyledTableCell>{smartRound(fill.executed_qty)}</StyledTableCell>
                <StyledTableCell>
                  <Typography color={roleColor(fill.role)}>{fill.role}</Typography>
                </StyledTableCell>
                <StyledTableCell>{smartRound(fill.fee)}</StyledTableCell>
                <StyledTableCell>{formatDateTime(fill.created_at)}</StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function MessageTable({ orderMessages }) {
  const messageTypeColor = (type) => {
    switch (type) {
      case 'ERROR':
        return 'error';
      case 'WARN':
        return 'warning';
      case 'INFO':
        return 'info';
      default:
        return type;
    }
  };

  return (
    <Stack direction='column' sx={{ margin: '16px' }}>
      <Typography variant='h4'>Messages</Typography>
      <TableContainer style={{ maxHeight: '500px' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledHeaderTableCellWithLine>Timestamp</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Sender</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Type</StyledHeaderTableCellWithLine>
              <StyledHeaderTableCellWithLine>Message</StyledHeaderTableCellWithLine>
            </TableRow>
          </TableHead>
          <TableBody sx={{ overflow: 'auto' }}>
            {orderMessages.map((message) => (
              <TableRow key={message.id}>
                <StyledTableCell>
                  <Typography variant='body2'>{formatDateTime(message.created_at)}</Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant='body2'>{message.sender}</Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography color={messageTypeColor(message.message_type)} variant='body2'>
                    {message.message_type}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant='body2'>{message.message}</Typography>
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default OrderSuperDetailPage;
