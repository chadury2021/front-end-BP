import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme } from '@mui/material/styles';
import useViewport from '@/shared/hooks/useViewport';
import { ModalContainer, MobileModalContainer } from './OrderConfirmationModal';

function StyledTableCell({ children, align = 'left', sx, ...props }) {
  return (
    <TableCell
      align={align}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        ...sx,
      }}
      {...props}
    >
      {children}
    </TableCell>
  );
}

function StyledHeaderTableCell({ children, align = 'left', sx, ...props }) {
  return (
    <TableCell
      align={align}
      sx={{
        borderBottom: '2px solid',
        borderColor: 'divider',
        fontWeight: 'bold',
        py: 1.5,
        backgroundColor: 'background.default',
        ...sx,
      }}
      {...props}
    >
      {children}
    </TableCell>
  );
}

function CsvOrderConfirmation({ validatedRows, onClose, onSubmit, submitLoading }) {
  const theme = useTheme();
  const { isMobile } = useViewport();
  const validRows = validatedRows.filter((row) => row.isValid);
  const invalidRows = validatedRows.filter((row) => !row.isValid);
  const hasValidRows = validRows.length > 0;
  const hasInvalidRows = invalidRows.length > 0;

  const handleSubmit = (event) => {
    event?.preventDefault?.();
    if (!submitLoading && hasValidRows && onSubmit) {
      onSubmit(validatedRows);
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getOrderSummary = (row) => {
    if (!row.isValid || !row.payload) return null;
    const { accounts, pair, side, base_asset_qty, quote_asset_qty } = row.payload;
    const qty = base_asset_qty || quote_asset_qty;
    const qtyType = base_asset_qty ? 'base' : 'quote';

    const { baseSymbol } = row;
    const { quoteSymbol } = row;
    const strategyName = row.strategyName || row.payload.strategy;

    return {
      accounts: Array.isArray(accounts) ? accounts.join(', ') : accounts,
      pair,
      side,
      qty,
      qtyType,
      baseSymbol,
      quoteSymbol,
      strategyName,
    };
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
      <CardHeader
        title={
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography variant='h6'>CSV Upload Confirmation</Typography>
            <IconButton aria-label='Close' size='small' onClick={onClose}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Stack>
        }
      />
      <Divider />
      <CardContent sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Stack direction='column' spacing={3}>
          {/* Summary */}
          <Box>
            <Typography gutterBottom variant='subtitle1'>
              Summary
            </Typography>
            <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
              <Chip color='success' icon={<CheckCircleIcon />} label={`${validRows.length} Valid`} variant='outlined' />
              {hasInvalidRows && (
                <Chip color='error' icon={<ErrorIcon />} label={`${invalidRows.length} Invalid`} variant='outlined' />
              )}
            </Stack>
          </Box>

          {!hasValidRows && <Alert severity='error'>No valid orders found. Please fix the errors and try again.</Alert>}

          {/* Valid Orders Table */}
          {hasValidRows && (
            <Box>
              <Typography gutterBottom sx={{ mb: 1 }} variant='subtitle1'>
                Valid Orders ({validRows.length})
              </Typography>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <StyledHeaderTableCell>Row</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Status</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Accounts</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Pair</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Side</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Quantity</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Strategy</StyledHeaderTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validRows.map((row) => {
                      const summary = getOrderSummary(row);
                      if (!summary) return null;
                      return (
                        <TableRow key={row.rowNumber}>
                          <StyledTableCell>{row.rowNumber}</StyledTableCell>
                          <StyledTableCell>
                            <Chip color='success' icon={<CheckCircleIcon />} label='Valid' size='small' />
                          </StyledTableCell>
                          <StyledTableCell>{summary.accounts}</StyledTableCell>
                          <StyledTableCell>{summary.pair}</StyledTableCell>
                          <StyledTableCell>
                            <Chip
                              color={summary.side === 'buy' ? 'success' : 'error'}
                              label={summary.side.toUpperCase()}
                              size='small'
                            />
                          </StyledTableCell>
                          <StyledTableCell>
                            {formatValue(summary.qty)}{' '}
                            {summary.qtyType === 'base' ? summary.baseSymbol || 'base' : summary.quoteSymbol || 'quote'}
                          </StyledTableCell>
                          <StyledTableCell>{summary.strategyName}</StyledTableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Invalid Orders Table */}
          {hasInvalidRows && (
            <Box>
              <Typography gutterBottom sx={{ mb: 1 }} variant='subtitle1'>
                Invalid Orders ({invalidRows.length})
              </Typography>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <StyledHeaderTableCell>Row</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Status</StyledHeaderTableCell>
                      <StyledHeaderTableCell>Error Message</StyledHeaderTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invalidRows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <StyledTableCell>{row.rowNumber}</StyledTableCell>
                        <StyledTableCell>
                          <Chip color='error' icon={<ErrorIcon />} label='Invalid' size='small' />
                        </StyledTableCell>
                        <StyledTableCell>
                          <Typography color='error' variant='body2'>
                            {row.errorMessage || 'Validation failed'}
                          </Typography>
                        </StyledTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 3 }}>
        <Stack alignItems='center' direction='row' justifyContent='space-between' sx={{ width: '100%' }}>
          <Button color='inherit' disabled={submitLoading} variant='outlined' onClick={onClose}>
            Cancel
          </Button>
          <Button color='primary' disabled={submitLoading || !hasValidRows} variant='contained' onClick={handleSubmit}>
            {submitLoading ? (
              <CircularProgress size={20} />
            ) : (
              `Submit ${validRows.length} Order${validRows.length === 1 ? '' : 's'}`
            )}
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}

export function CsvOrderConfirmationModal({ validatedRows, open, setOpen, onSubmit, submitLoading }) {
  const { isMobile } = useViewport();
  const Wrapper = isMobile ? MobileModalContainer : ModalContainer;

  if (!open) return null;

  return (
    <Wrapper open={open} setOpen={setOpen}>
      {validatedRows && validatedRows.length > 0 ? (
        <CsvOrderConfirmation
          submitLoading={submitLoading}
          validatedRows={validatedRows}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
        />
      ) : (
        <Box alignItems='center' display='flex' height='100%' justifyContent='center' sx={{ p: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Wrapper>
  );
}
