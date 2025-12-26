import React, { useState } from 'react';
import { Box, Stack, Typography, useTheme, IconButton, Tooltip, styled } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DeleteOutline, AddCircleOutline, ImportExport, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

import { Loader } from '@/shared/Loader';
import DataComponent from '@/shared/DataComponent';
import { numberWithCommas, smartRound, formatPrice } from '@/util';
import { ExchangeIcon, TokenIcon } from '@/shared/components/Icons';
import { getPositionData } from '@/util/positionUtils';
import { renderPriceWithSubscript } from '@/util/priceFormatting';

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

function PositionsTab({
  selectedExchanges = [],
  balances = [],
  loading = false,
  handleLiquidate,
  handleDoubleDown,
  handleReverse,
  handleTokenClick,
  isAuthenticated = false,
  isMobile = false,
  balancesPairFilter = '',
  shouldIncludeBalance = (balanceExchangeName, selectedExchangesList) => {
    if (selectedExchangesList.length === 0) return true;
    return selectedExchangesList.includes(balanceExchangeName);
  },
}) {
  const [sortConfig, setSortConfig] = useState({
    key: 'notional',
    direction: sortOrder.DESC,
  });
  const theme = useTheme();

  const isTokenClickable = (token, exchange) => {
    if (!token || !handleTokenClick) return false;
    const upperTok = token.toUpperCase();

    // Make options non-clickable (options trading is done through dedicated Options page)
    if (upperTok.includes('CALL') || upperTok.includes('PUT')) return false;

    return true;
  };

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
      if (['quantity', 'notional', 'unrealizedPnl', 'roi', 'entryPrice', 'marginRatio'].includes(sortConfig.key)) {
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

  // Filter and flatten balances to create table rows for positions only
  const getTableRows = () => {
    const rows = [];

    Object.values(balances).forEach((balance) => {
      // Filter by selected exchanges
      if (!shouldIncludeBalance(balance.exchange_name, selectedExchanges)) {
        return;
      }

      if (!balance.assets || balance.assets.length === 0) return;

      balance.assets.forEach((asset) => {
        // Only show position assets (filter out tokens)
        if (asset.asset_type !== 'position') return;

        // Include positions with borrowed amounts or significant value (>$1)
        const hasBorrowed = asset.borrowed && Number(asset.borrowed) > 0;
        const hasSignificantValue = Math.abs(asset.notional || 0) > 1;
        if (!hasBorrowed && !hasSignificantValue) return;

        if (balancesPairFilter && asset.symbol !== balancesPairFilter) return;
        // Calculate ROI percentage
        const roi =
          asset.notional && asset.notional !== 0
            ? ((asset.unrealized_profit || 0) / Math.abs(asset.notional)) * 100
            : 0;

        // Get position data with entry price and margin ratio
        const positionData = getPositionData(asset);

        rows.push({
          exchange: balance.exchange_name,
          account: balance.account_name,
          token: asset.symbol,
          quantity: (asset.amount || 0) - (asset.borrowed || 0), // Subtract borrowed from quantity
          notional: asset.notional || 0,
          unrealizedPnl: asset.unrealized_profit || 0,
          roi,
          entryPrice: positionData.entryPrice,
          marginRatio: positionData.marginRatio,
          formattedEntryPrice: positionData.formattedEntryPrice,
          formattedMarginRatio: positionData.formattedMarginRatio,
          marginRatioColor: positionData.marginRatioColor,
          assetType: asset.asset_type,
          accountId: balance.account_id,
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
          <Typography variant='subtitle1'>No positions found</Typography>
        ) : (
          <Stack direction='row' gap={1}>
            <Typography sx={{ paddingTop: '4px' }} variant='body1'>
              Please log in to view your positions
            </Typography>
          </Stack>
        )}
      </Box>
    );
  }

  return (
    <DataComponent showLoadingOnFirstLoadOnly isLoading={loading} loadingComponent={<Loader />}>
      {tableRows.length === 0 ? (
        <Box alignItems='center' display='flex' height='calc(100% - 60px)' justifyContent='center' sx={{ p: 2 }}>
          <Typography gutterBottom color='text.secondary' variant='h6'>
            No Positions Found
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table stickyHeader aria-label='positions table' size='small'>
              <TableHead>
                <TableRow sx={{ borderBottom: `1px solid ${theme.palette.grey[600]}` }}>
                  <StyledHeaderTableCell align='center' sx={{ width: '20px', p: 0 }}>
                    {/* Exchange icon column - no header */}
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='left' sx={{ width: '15%' }}>
                    <Typography sx={{ textAlign: 'left' }} variant='body1Strong'>
                      Accounts
                    </Typography>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='left' sx={{ width: '12%' }}>
                    <Typography sx={{ textAlign: 'left' }} variant='body1Strong'>
                      Pair
                    </Typography>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '12%' }}>
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
                  <StyledHeaderTableCell align='right' sx={{ width: '12%' }}>
                    <Stack
                      direction='row'
                      spacing={0.5}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSort('notional')}
                    >
                      <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                        Notional
                      </Typography>
                      {getSortIcon('notional', sortConfig.key, sortConfig.direction)}
                    </Stack>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '12%' }}>
                    <Stack
                      direction='row'
                      spacing={0.5}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSort('unrealizedPnl')}
                    >
                      <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                        Unrealized PnL
                      </Typography>
                      {getSortIcon('unrealizedPnl', sortConfig.key, sortConfig.direction)}
                    </Stack>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '8%' }}>
                    <Stack direction='row' spacing={0.5} sx={{ cursor: 'pointer' }} onClick={() => handleSort('roi')}>
                      <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                        ROI
                      </Typography>
                      {getSortIcon('roi', sortConfig.key, sortConfig.direction)}
                    </Stack>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '12%' }}>
                    <Stack
                      direction='row'
                      spacing={0.5}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSort('entryPrice')}
                    >
                      <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                        Entry Price
                      </Typography>
                      {getSortIcon('entryPrice', sortConfig.key, sortConfig.direction)}
                    </Stack>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '12%' }}>
                    <Stack
                      direction='row'
                      spacing={0.5}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSort('marginRatio')}
                    >
                      <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                        Margin Ratio
                      </Typography>
                      {getSortIcon('marginRatio', sortConfig.key, sortConfig.direction)}
                    </Stack>
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='right' sx={{ width: '5%' }}>
                    <Typography sx={{ textAlign: 'right', width: '100%' }} variant='body1Strong'>
                      Actions
                    </Typography>
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow
                    hover
                    key={`${row.exchange}-${row.account}-${row.token}-${row.quantity}-${row.notional}`}
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
                        <TokenIcon style={{ height: '20px', width: '20px' }} tokenName={row.token} />
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
                              // Handle grey spans specially to maintain synchronized timing
                              if (element.tagName === 'SPAN' && element.textContent.includes('-')) {
                                element.style.color = theme.palette.text.subtitle;
                              } else {
                                element.style.color = '';
                              }
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
                              {row.token}
                            </Typography>
                          );
                        })()}
                      </Stack>
                    </StyledTableCell>
                    <StyledTableCell align='right'>
                      <Typography
                        sx={{ color: row.quantity >= 0 ? theme.palette.success.main : theme.palette.error.main }}
                      >
                        {numberWithCommas(smartRound(row.quantity))}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align='right'>
                      <Typography
                        sx={{ color: row.notional >= 0 ? theme.palette.success.main : theme.palette.error.main }}
                      >
                        <span style={{ color: theme.palette.text.subtitle }}>$</span>
                        {numberWithCommas(Number(row.notional).toFixed(2))}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align='right'>
                      <Typography
                        sx={{ color: row.unrealizedPnl >= 0 ? theme.palette.success.main : theme.palette.error.main }}
                      >
                        <span style={{ color: theme.palette.text.subtitle }}>$</span>
                        {numberWithCommas(smartRound(row.unrealizedPnl))}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align='right'>
                      <Typography sx={{ color: row.roi >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                        {row.roi >= 0 ? '+' : ''}
                        {smartRound(row.roi)}%
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align='right'>
                      <Typography>
                        <span style={{ color: theme.palette.text.subtitle }}>$</span>
                        {row.entryPrice && row.entryPrice !== 0
                          ? renderPriceWithSubscript(formatPrice(row.entryPrice))
                          : '-'}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align='right'>
                      <Typography sx={{ color: row.marginRatioColor }}>{row.formattedMarginRatio}</Typography>
                    </StyledTableCell>
                    <StyledTableCell align='right'>
                      <Stack direction='row' spacing={1}>
                        <Tooltip arrow title='Liquidate position'>
                          <IconButton
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
                        <Tooltip arrow title='Reverse position'>
                          <IconButton
                            size='small'
                            sx={{
                              color: 'warning.main',
                              padding: '0',
                              '&:hover': {
                                backgroundColor: `${theme.palette.warning[500]}1A`, // 10% opacity
                              },
                            }}
                            onClick={(e) => {
                              handleReverse(row);
                            }}
                          >
                            <ImportExport />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </DataComponent>
  );
}

export default PositionsTab;
