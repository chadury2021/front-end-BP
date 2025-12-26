import React, { useState } from 'react';
import { Box, Stack, Typography, useTheme, IconButton, Tooltip, styled } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DeleteOutline, AddCircleOutline, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

import { Loader } from '@/shared/Loader';
import DataComponent from '@/shared/DataComponent';
import { numberWithCommas, smartRound } from '@/util';
import { ExchangeIcon, TokenIcon } from '@/shared/components/Icons';

// List of stable coins to filter out
const STABLE_COINS = [
  'USDT',
  'USDC',
  'BUSD',
  'DAI',
  'TUSD',
  'FRAX',
  'USDP',
  'USDD',
  'GUSD',
  'LUSD',
  'FDUSD',
  'USD',
  'USDE',
  'USDH',
];

// Sorting order
const sortOrder = {
  ASC: 'asc',
  DESC: 'desc',
};

// Helper function to render sort icon
const getSortIcon = (currentKey, sortKey, direction) => {
  if (currentKey !== sortKey) {
    return <KeyboardArrowUp fontSize='small' sx={{ opacity: 0.3 }} />;
  }
  return direction === 'asc' ? <KeyboardArrowUp fontSize='small' /> : <KeyboardArrowDown fontSize='small' />;
};

// Styled components matching SharedOrderTable
function StyledTableCell({ children, align = 'left', sx = {}, ...props }) {
  const theme = useTheme();
  return (
    <TableCell
      align={align}
      sx={{
        borderBottom: `1px solid ${theme.palette.grey[600]}`,
        fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
        fontSize: '0.875rem',
        padding: '4px 16px',
        ...sx,
      }}
      {...props}
    >
      {children}
    </TableCell>
  );
}

const StyledHeaderTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.grey[600]}`,
  fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
  fontSize: '0.875rem',
  padding: '6px 16px',
  backgroundColor: theme.palette.ui?.backgroundDark || theme.palette.background.default,
  textAlign: 'left',
}));

function BalancesTab({
  selectedExchanges = [],
  balances = [],
  loading = false,
  handleLiquidate,
  handleDoubleDown,
  handleTokenClick,
  balancesPairFilter = '',
  isAuthenticated = false,
  isMobile = false,
  shouldIncludeBalance = (balanceExchangeName, selectedExchangesList) => {
    if (selectedExchangesList.length === 0) return true;
    return selectedExchangesList.includes(balanceExchangeName);
  },
}) {
  const [sortConfig, setSortConfig] = useState({
    key: 'value',
    direction: sortOrder.DESC,
  });
  const theme = useTheme();

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === sortOrder.ASC ? sortOrder.DESC : sortOrder.ASC,
    }));
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Coerce numeric columns to numbers for consistent sorting
      if (['quantity', 'value'].includes(sortConfig.key)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === sortOrder.ASC ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === sortOrder.ASC ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter and flatten balances to create table rows
  const getTableRows = () => {
    const rows = [];

    Object.values(balances).forEach((balance) => {
      // Filter by selected exchanges
      if (!shouldIncludeBalance(balance.exchange_name, selectedExchanges)) {
        return;
      }

      if (!balance.assets || balance.assets.length === 0) return;

      balance.assets.forEach((asset) => {
        // Only show token assets (filter out positions)
        if (asset.asset_type !== 'token') return;

        // Include assets with borrowed amounts or significant value (>$1)
        const hasBorrowed = asset.borrowed && Number(asset.borrowed) > 0;
        const hasSignificantValue = Math.abs(asset.notional || 0) > 1;
        if (!hasBorrowed && !hasSignificantValue) return;

        if (balancesPairFilter && asset.symbol !== balancesPairFilter) return;

        rows.push({
          exchange: balance.exchange_name,
          account: balance.account_name,
          token: asset.symbol,
          quantity: (asset.amount || 0) - (asset.borrowed || 0), // Subtract borrowed from quantity
          value: asset.notional || 0,
          assetType: asset.asset_type,
          accountId: balance.account_id,
          tokenSymbol: asset.token_symbol || asset.symbol,
          logoUrl: asset.logo_url,
        });
      });
    });

    return sortData(rows);
  };

  const tableRows = getTableRows();

  const emptyMobileView = !loading && isMobile && balances.length === 0;

  if (emptyMobileView) {
    return (
      <Box alignItems='center' display='flex' justifyContent='center'>
        {isAuthenticated ? (
          <Typography variant='subtitle1'>No balances found</Typography>
        ) : (
          <Stack direction='row' gap={1}>
            <Typography sx={{ paddingTop: '4px' }} variant='body1'>
              Please log in to view your balances
            </Typography>
          </Stack>
        )}
      </Box>
    );
  }

  const isTokenClickable = (token, exchange) => {
    if (!token || !handleTokenClick) return false;
    const upperTok = token.toUpperCase();

    // Make USD, USDT, and OKXDEX tokens non-clickable
    if (upperTok === 'USD' || upperTok === 'USDT' || exchange === 'OKXDEX') {
      return false;
    }

    return true;
  };

  return (
    <DataComponent showLoadingOnFirstLoadOnly isLoading={loading} loadingComponent={<Loader />}>
      {tableRows.length === 0 ? (
        <Box alignItems='center' display='flex' height='calc(100% - 60px)' justifyContent='center' sx={{ p: 2 }}>
          <Typography gutterBottom color='text.secondary' variant='h6'>
            No Token Balances Found
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table stickyHeader aria-label='balances table' size='small'>
              <TableHead>
                <TableRow sx={{ borderBottom: `1px solid ${theme.palette.grey[600]}` }}>
                  <StyledHeaderTableCell align='center' sx={{ width: '20px', p: 0 }}>
                    {/* Exchange icon column - no header */}
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='left' sx={{ width: '30%' }}>
                    <Typography sx={{ textAlign: 'left' }} variant='body1Strong'>
                      Accounts
                    </Typography>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='left' sx={{ width: '20%' }}>
                    <Typography sx={{ textAlign: 'left' }} variant='body1Strong'>
                      Token
                    </Typography>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '20%' }}>
                    <Stack
                      direction='row'
                      spacing={0.5}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSort('quantity')}
                    >
                      <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                        Quantity
                      </Typography>
                      {getSortIcon('quantity', sortConfig.key, sortConfig.direction)}
                    </Stack>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '40%' }}>
                    <Stack direction='row' spacing={0.5} sx={{ cursor: 'pointer' }} onClick={() => handleSort('value')}>
                      <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                        Value
                      </Typography>
                      {getSortIcon('value', sortConfig.key, sortConfig.direction)}
                    </Stack>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '15%' }}>
                    <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                      Actions
                    </Typography>
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => {
                  const disableActions = STABLE_COINS.includes(row.token) || row.exchange === 'OKXDEX';
                  return (
                    <TableRow
                      hover
                      key={`${row.exchange}-${row.account}-${row.token}-${row.quantity}-${row.value}`}
                      sx={{
                        '&:hover': {
                          backgroundColor: `${theme.palette.grey[800]}66`, // 40% opacity
                        },
                      }}
                    >
                      <StyledTableCell align='center' sx={{ width: '20px', p: 0 }}>
                        <ExchangeIcon exchangeName={row.exchange} style={{ height: '23px', width: '23px' }} />
                      </StyledTableCell>
                      <StyledTableCell align='left'>
                        <Typography>{row.account}</Typography>
                      </StyledTableCell>
                      <StyledTableCell align='left'>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <TokenIcon
                            logoUrl={row.logoUrl}
                            style={{ height: '20px', width: '20px' }}
                            tokenName={row.token}
                          />
                          {(() => {
                            const isClickable = isTokenClickable(row.token, row.exchange);

                            const handleClick = (event) => {
                              if (!isClickable) return;
                              event.stopPropagation();
                              handleTokenClick(row);
                            };

                            const handleMouseEnter = (event) => {
                              if (!isClickable) return;
                              const targetElement = event.currentTarget;
                              targetElement.style.color = theme.palette.semantic.warning;
                              const allChildren = targetElement.querySelectorAll('*');
                              allChildren.forEach((childElementNode) => {
                                const element = childElementNode;
                                element.style.color = theme.palette.semantic.warning;
                              });
                            };

                            const handleMouseLeave = (event) => {
                              if (!isClickable) return;
                              const targetElement = event.currentTarget;
                              targetElement.style.color = '';
                              const allChildren = targetElement.querySelectorAll('*');
                              allChildren.forEach((childElementNode) => {
                                const element = childElementNode;
                                element.style.color = '';
                              });
                            };

                            return (
                              <Typography
                                style={{
                                  cursor: isClickable ? 'pointer' : 'default',
                                  transition: 'color 0.2s ease',
                                  display: 'inline-block',
                                }}
                                onClick={isClickable ? handleClick : undefined}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                              >
                                {row.tokenSymbol}
                              </Typography>
                            );
                          })()}
                        </Stack>
                      </StyledTableCell>
                      <StyledTableCell align='right'>
                        <Typography>
                          {numberWithCommas(smartRound(row.quantity))}{' '}
                          <span style={{ color: theme.palette.text.subtitle }}>{row.tokenSymbol}</span>
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align='right'>
                        <Typography>
                          <span style={{ color: theme.palette.text.subtitle }}>$</span>
                          {numberWithCommas(Number(row.value).toFixed(2))}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align='right'>
                        <Stack direction='row' spacing={1}>
                          <Tooltip arrow title='Liquidate position'>
                            <IconButton
                              disabled={disableActions}
                              size='small'
                              sx={{
                                color: 'error.main',
                                padding: '0',
                                '&:hover': {
                                  backgroundColor: `${theme.palette.error[500]}1A`, // 10% opacity
                                },
                              }}
                              onClick={(e) => {
                                handleLiquidate(row);
                              }}
                            >
                              <DeleteOutline />
                            </IconButton>
                          </Tooltip>
                          <Tooltip arrow title='Double down (buy more)'>
                            <IconButton
                              disabled={disableActions}
                              size='small'
                              sx={{
                                color: 'success.main',
                                padding: '0',
                                '&:hover': {
                                  backgroundColor: `${theme.palette.success[500]}1A`, // 10% opacity
                                },
                              }}
                              onClick={(e) => {
                                handleDoubleDown(row);
                              }}
                            >
                              <AddCircleOutline />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </StyledTableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </DataComponent>
  );
}

export default BalancesTab;
