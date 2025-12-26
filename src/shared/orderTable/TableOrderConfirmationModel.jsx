/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { CircularProgress, Divider, Stack, SwipeableDrawer } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import LabelTooltip, { TreadTooltip } from '@/shared/components/LabelTooltip';
import EditTableOrder from './EditTableOrder';
import { StrategyParamsParsed, StyledBorderTableCell, StyledHeaderTableCell, buySellToBaseQuote } from './util';
import useViewport from '../hooks/useViewport';

const formatAmount = (base) => {
  const amount = base;
  return Number(amount).toFixed(2);
};

const getCleanTokenSymbol = (token) => {
  if (!token) return 'Token';
  // Remove address (everything before ':') if present
  const cleaned = token.includes(':') ? token.split(':')[0] : token;
  // If it's still a long address, show 'Token' instead
  return cleaned.length > 10 && cleaned.startsWith('0x') ? 'Token' : cleaned;
};

const getCleanPairDisplay = (pair) => {
  if (!pair) return 'Unknown Pair';
  const [base, quote] = pair.split('-');
  const cleanBase = getCleanTokenSymbol(base);
  const cleanQuote = getCleanTokenSymbol(quote);
  return `${cleanBase}-${cleanQuote}`;
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: 'min-content',
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  boxShadow: 24,
  borderRadius: 3,
};

function ModalContainer({ open, setOpen, children }) {
  return (
    <Modal
      closeAfterTransition
      aria-describedby='transition-modal-description'
      aria-labelledby='transition-modal-title'
      open={open}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
      slots={{ backdrop: Backdrop }}
      onClose={() => setOpen(false)}
    >
      <Fade in={open}>
        <Box display='flex' flexDirection='column' justifyContent='center' sx={modalStyle}>
          {children}
        </Box>
      </Fade>
    </Modal>
  );
}

function MobileModalContainer({ open, setOpen, children }) {
  return (
    <SwipeableDrawer
      anchor='bottom'
      elevation={0}
      ModalProps={{ keepMounted: false }}
      open={open}
      onClose={() => setOpen(false)}
    >
      {children}
    </SwipeableDrawer>
  );
}

export default function TableOrderConfirmationModel({
  open,
  setOpen,
  data,
  handleResubmit,
  handleResubmitRemaining,
  dashboardView,
  isResubmit,
  isBuy,
  modalText,
}) {
  const [loading, setLoading] = useState(false);
  const { isMobile } = useViewport();

  const buttonStyle = {
    marginTop: 1,
    marginBottom: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const closeButtonStyle = {
    position: 'absolute',
    right: 12,
    top: 12,
  };

  const strategyName = data.super_strategy || data.strategy;

  const handleConfirm = (row) => {
    if (isResubmit) {
      setLoading(true);
      handleResubmit(row).then(() => {
        setLoading(false);
      });
    } else {
      setLoading(true);
      handleResubmitRemaining(row).then(() => {
        setLoading(false);
      });
    }
  };

  const displayQuantity = (row) => {
    if (row.buy_token_amount) {
      return row.buy_token_amount;
    }
    return row.sell_token_amount;
  };

  const displayToken = (row) => {
    if (row.buy_token_amount) {
      return getCleanTokenSymbol(row.buy_token);
    }
    return getCleanTokenSymbol(row.sell_token);
  };

  const Wrapper = isMobile ? MobileModalContainer : ModalContainer;
  return (
    <Wrapper open={open} setOpen={setOpen}>
      <Typography gutterBottom style={{ marginTop: '12px', marginLeft: '12px' }} variant='h6'>
        Order Confirmation
      </Typography>
      <IconButton aria-label='close' sx={closeButtonStyle} onClick={() => setOpen(false)}>
        <CloseIcon />
      </IconButton>
      <Divider variant='middle' />
      <Stack direction='column' style={{ whiteSpace: 'nowrap' }}>
        <Stack direction={isMobile ? 'column' : 'row'} style={{ whiteSpace: 'nowrap' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <StyledHeaderTableCell align='left' key='buy sell' style={{ width: 300 }}>
                  Side
                </StyledHeaderTableCell>
                <StyledHeaderTableCell align='left' key='token' style={{ width: 300 }}>
                  Token
                </StyledHeaderTableCell>
                <StyledHeaderTableCell align='left' key='avg exec price' style={{ width: 300 }}>
                  Quantity
                </StyledHeaderTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <StyledBorderTableCell>{isBuy ? 'Buy' : 'Sell'}</StyledBorderTableCell>
                <StyledBorderTableCell>{getCleanPairDisplay(data.pair)}</StyledBorderTableCell>
                <StyledBorderTableCell>
                  {`${formatAmount(
                    isResubmit ? displayQuantity(data) : displayQuantity(buySellToBaseQuote(data))
                  )} ${data.market_type === 'option' ? 'Contracts' : displayToken(data)}`}
                </StyledBorderTableCell>
              </TableRow>
            </TableBody>
            <TableHead>
              <TableRow>
                <StyledHeaderTableCell align='left' key='duration' style={{ width: 300 }}>
                  <TreadTooltip variant='duration' />
                </StyledHeaderTableCell>
                <StyledHeaderTableCell align='left' key='strategy' style={{ width: 300 }}>
                  <Box>
                    <TreadTooltip variant='strategy' />
                  </Box>
                </StyledHeaderTableCell>
                <StyledHeaderTableCell align='left' key='notional' style={{ width: 300 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <StyledBorderTableCell>{Number(data.duration).toFixed(1)} s</StyledBorderTableCell>
                <StyledBorderTableCell>{strategyName}</StyledBorderTableCell>
                <StyledBorderTableCell />
              </TableRow>
            </TableBody>
            {data.updated_leverage && (
              <>
                <TableHead>
                  <TableRow>
                    <StyledHeaderTableCell align='left' key='buy sell' style={{ width: 300 }}>
                      Pair Leverage
                    </StyledHeaderTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <StyledBorderTableCell>{data.updated_leverage}</StyledBorderTableCell>
                  </TableRow>
                </TableBody>
              </>
            )}
          </Table>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <StyledHeaderTableCell align='left' key='strategy_params' style={{ width: 300 }}>
                  <LabelTooltip
                    label='Strategy Configurations'
                    link='https://tread-labs.gitbook.io/api-docs/strategy-configuration'
                  />
                </StyledHeaderTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow
                sx={{
                  '&.MuiTableRow-root': {
                    verticalAlign: 'top',
                  },
                }}
              >
                <StyledBorderTableCell>
                  <StrategyParamsParsed
                    useIBM
                    alpha_tilt={data.alpha_tilt}
                    engine_passiveness={data.engine_passiveness}
                    pov_limit={data.pov_limit}
                    pov_target={data.pov_target}
                    schedule_discretion={data.schedule_discretion}
                    strategy_params={data.strategy_params}
                  />
                </StyledBorderTableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Stack>
        <Divider variant='middle' />
        <Typography
          color='primary'
          style={{
            wordWrap: 'break-word',
            marginLeft: '12px',
            marginRight: '12px',
            marginTop: '12px',
          }}
          variant='subtitle2'
        >
          {modalText}
        </Typography>
      </Stack>
      <Box display='flex' justifyContent='center' sx={{ marginBottom: '12px', width: '100%' }}>
        <Stack direction='row' spacing={2}>
          <EditTableOrder
            dashboardView={dashboardView}
            data={data}
            isResubmit={isResubmit}
            loading={loading}
            setLoading={setLoading}
            setOpen={setOpen}
          />
          {!loading ? (
            <Button
              color={isBuy ? 'success' : 'error'}
              sx={{ ...buttonStyle, width: '200px' }}
              variant='contained'
              onClick={() => handleConfirm(data)}
            >
              <Typography color={isBuy ? 'text.offBlack' : 'text.offWhite'} style={{ whiteSpace: 'nowrap' }}>
                Place {isBuy ? 'Buy' : 'Sell'} Order
              </Typography>
            </Button>
          ) : (
            <Button disabled sx={{ ...buttonStyle, width: '200px' }} variant='contained'>
              <CircularProgress size={20} />
            </Button>
          )}
        </Stack>
      </Box>
    </Wrapper>
  );
}
