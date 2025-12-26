/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { groupBy } from 'lodash';
import { capitalizeFirstLetter, getUnderlying, isEmpty, msAndKs, numberWithCommas, smartRound } from '../../../util';
import { StyledBorderTableCell, StyledNoBorderTableCell, StyledTableCell } from '../../../shared/orderTable/util';
import AssetsTableCell from '../AssetsTableCell';
import ICONS from '../../../../images/exchange_icons';

const calculatePnL = (row) => {
  if (row.asset_type === 'token') {
    return 0;
  }

  // Skip if notional is 0 or undefined
  if (!row.notional || row.notional === 0) {
    return 0;
  }

  return 100 * (row.unrealized_profit / Math.abs(row.notional));
};

const exchangeTypeColumns = [
  { id: 'account_name', label: 'Sub Account', width: 150, align: 'left' },
  { id: 'symbol', label: 'Group', width: 150, align: 'left' },
  { id: 'assetType', label: 'Assets', width: 100, align: 'left' },
  {
    id: 'amount',
    label: 'Quantity',
    width: 150,
    align: 'left',
    format: (value, row) => `${msAndKs(value, 2)} ${getUnderlying(row?.symbol)}`,
  },

  {
    id: 'notional',
    label: 'Notional',
    width: 150,
    align: 'right',
    number: true,
    format: (value) => `$${numberWithCommas(value.toFixed(2))}`,
  },
  {
    id: 'unrealized_profit_percentage',
    label: 'ROI(%)',
    width: 50,
    align: 'right',
    number: true,
    format: (value, row) => calculatePnL(row),
  },
  {
    id: 'unrealized_profit',
    label: 'ROI($)',
    width: 50,
    align: 'right',
    number: true,
  },
];

function groupByUnderlyingAsset(data) {
  if (!data || isEmpty(data)) {
    return [];
  }
  return data.reduce((acc, obj) => {
    // Extract the underlying asset
    const underlyingAsset = getUnderlying(obj.symbol);

    if (!acc[underlyingAsset]) {
      acc[underlyingAsset] = [];
    }

    acc[underlyingAsset].push(obj);
    return acc;
  }, {});
}

function AccountLayerRow({ account, index, toggleRow, open, columns }) {
  const exchangeName = account.exchange_name;
  return (
    <TableRow>
      {columns.map((column) => {
        let value = account[column.id];
        if (column.id === 'account_name') {
          value = (
            <Stack
              direction='row'
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <IconButton aria-label='expand row' size='small' onClick={() => toggleRow(index)}>
                {open[index] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
              <img
                alt={exchangeName}
                src={ICONS[exchangeName.toLowerCase()]}
                style={{ height: '15px', width: '15px', borderRadius: '50%' }}
              />
              <Typography variant='body1'>{account.account_name}</Typography>
            </Stack>
          );
        }
        if (column.id === 'notional') {
          value = account.totalValue;
        }
        return (
          <StyledTableCell
            align={column.align}
            key={`${account.account_name}-${column.id}`}
            style={{ minWidth: column.minWidth, width: column.width }}
          >
            {column.format && value ? column.format(value) : value}
          </StyledTableCell>
        );
      })}
    </TableRow>
  );
}

function UnderlyingAssetLayerRow({ underlyingAssets, account, columns, toggleRow, open }) {
  if (Object.keys(underlyingAssets).length === 0) {
    return (
      <Box margin={1}>
        <Typography>No Assets</Typography>
      </Box>
    );
  }
  return (
    <Box margin={1}>
      <Table aria-label='sub-table'>
        <TableBody>
          {Object.keys(underlyingAssets).map((asset, childIndex) => {
            const keyIndex = `underlying${asset}${childIndex}`;
            let TableCellRender = StyledTableCell;
            if (childIndex === Object.keys(underlyingAssets).length - 1) {
              TableCellRender = StyledNoBorderTableCell;
            }

            return (
              <React.Fragment key={keyIndex}>
                <TableRow>
                  {columns.map((column) => {
                    let value = account[column.id];
                    if (column.id === 'account_name') {
                      value = null;
                    }
                    if (column.id === 'symbol') {
                      value = (
                        <div key={`${account.account_name}-${column.id}`}>
                          <IconButton aria-label='expand row' size='small' onClick={() => toggleRow(keyIndex)}>
                            {open[keyIndex] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                          {asset}
                        </div>
                      );
                    }
                    if (column.id === 'notional') {
                      value = account.totalValue;
                    }
                    return (
                      <TableCellRender
                        align={column.align}
                        key={`${account.account_name}-${column.id}`}
                        style={{
                          minWidth: column.minWidth,
                          width: column.width,
                        }}
                      >
                        {column.format && value ? column.format(value) : value}
                      </TableCellRender>
                    );
                  })}
                </TableRow>

                <TableRow>
                  <TableCellRender colSpan={columns.length} style={{ padding: 0 }}>
                    <Collapse unmountOnExit in={open[keyIndex]} timeout='auto'>
                      <AssetLayerRow
                        account={account}
                        asset={asset}
                        columns={columns}
                        underlyingAssets={underlyingAssets}
                      />
                    </Collapse>
                  </TableCellRender>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

function AssetLayerRow({ underlyingAssets, asset, account, columns }) {
  return (
    <Box margin={1}>
      <Table>
        <TableBody>
          {underlyingAssets[asset].map((assetRow, i) => {
            let TableCellRender = StyledTableCell;
            if (i === underlyingAssets[asset].length - 1) {
              TableCellRender = StyledNoBorderTableCell;
            }
            return (
              <TableRow key={account.account_name + assetRow.symbol + assetRow.notional}>
                {columns.map((column, colIndex) => {
                  let assetValue = assetRow[column.id];

                  switch (column.id) {
                    case 'unrealized_profit_percentage':
                      assetValue = calculatePnL(assetRow);
                      break;
                    case 'symbol':
                      return (
                        <TableCellRender
                          align={column.align}
                          key={`${account.account_name}-${column.id}`}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width,
                          }}
                        />
                      );

                    case 'assetType':
                      return (
                        <TableCellRender
                          align={column.align}
                          key={`${account.account_name}-${column.id}`}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width,
                          }}
                        >
                          {assetRow.symbol}
                        </TableCellRender>
                      );

                    case 'amount':
                      return (
                        <TableCellRender
                          align={column.align}
                          key={`${account.account_name}-${column.id}`}
                          style={{
                            minWidth: column.minWidth,
                            width: column.width,
                          }}
                        >
                          {column.format && assetValue ? column.format(assetValue, assetRow) : assetValue}
                        </TableCellRender>
                      );

                    default:
                      break;
                  }
                  return (
                    <AssetsTableCell
                      cellRender={TableCellRender}
                      column={column}
                      key={column.id}
                      row={assetRow}
                      value={assetValue}
                    />
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

export function ExchangeGroupTable({ exchangeAccount, topN = 10 }) {
  const [open, setOpen] = useState({});

  const columns = exchangeTypeColumns;

  const toggleRow = (rowId) => {
    setOpen((prevState) => ({
      ...prevState,
      [rowId]: !prevState[rowId],
    }));
  };

  return (
    <TableContainer>
      <Table stickyHeader aria-label='sticky table'>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <StyledTableCell
                align={column.align}
                key={column.id}
                style={{
                  minWidth: column.minWidth,
                  width: column.width || 'auto',
                }}
              >
                {column.label}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.values(exchangeAccount).map((account, index) => {
            const underlyingAssets = groupByUnderlyingAsset(account.assets);
            return (
              <React.Fragment key={index}>
                <AccountLayerRow account={account} columns={columns} index={index} open={open} toggleRow={toggleRow} />
                {/* Collapsible Row */}
                <TableRow>
                  <TableCell colSpan={columns.length} style={{ padding: 0 }}>
                    <Collapse unmountOnExit in={open[index]} timeout='auto'>
                      <UnderlyingAssetLayerRow
                        account={account}
                        columns={columns}
                        open={open}
                        toggleRow={toggleRow}
                        underlyingAssets={underlyingAssets}
                      />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export const ExchangeTypeTable = (accounts, selectedAccountObj) => {
  const exchangeMapping = groupBy(accounts, 'exchange_name');

  return Object.entries(exchangeMapping).map(([exchangeName, exchangeAccounts]) => {
    // only render selected account exchanges
    if (selectedAccountObj.exchange_name !== exchangeName) {
      return null;
    }

    const exchangeTotalValue = exchangeAccounts.reduce((acc, account) => {
      if (!account.assets && !isEmpty(account.assets)) {
        return acc;
      }
      const totalValue = account.assets.reduce((assetAcc, asset) => {
        return assetAcc + asset.notional;
      }, 0);
      return acc + totalValue;
    }, 0);

    return (
      <Box key={`${exchangeName}card`} sx={{ height: '100%' }}>
        <Stack direction='column' spacing={1}>
          <Stack
            alignItems='center'
            direction='row'
            spacing={3}
            sx={{
              width: '100%',
            }}
          >
            <Typography color='text.secondary' variant='h2'>
              {exchangeName?.toLowerCase() === 'okxdex' ? 'OKXDEX' : capitalizeFirstLetter(exchangeName)}
            </Typography>
            <Typography variant='h2'>{numberWithCommas(smartRound(exchangeTotalValue))}</Typography>
            <Typography variant='h4'>USDT</Typography>
          </Stack>
          <ExchangeGroupTable exchangeAccount={exchangeAccounts} />
        </Stack>
      </Box>
    );
  });
};
