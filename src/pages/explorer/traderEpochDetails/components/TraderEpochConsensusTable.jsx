/**
 * Reusable consensus table component used for displaying consensus data.
 * It handles common table functionality like pagination, loading states, and empty states.
 *
 * Used by DataConsensusTable and RiskConsensusTable to display consensus information.
 * Consumers provide column definitions, data, and row rendering functions.
 * The component manages its own pagination state and UI.
 * Supports skeleton loading states for better UX during data fetching.
 */

import LabelTooltip from '@/shared/components/LabelTooltip';
import ConsensusDetailChip from '@/shared/components/ConsensusDetailChip';
import { CopyableValue } from '@/shared/components/CopyableValue';
import PrettyRelativeTimestamp from '@/shared/components/PrettyRelativeTimestamp';
import { StyledHeaderTableCellWithLine, StyledTableCell } from '@/shared/orderTable/util';
import ICONS from '@images/exchange_icons';
import arweaveLight from '@images/logos/arweave-light.png';
import monadLight from '@images/logos/monad-light.png';
import {
  Box,
  Paper,
  Button,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback } from 'react';
import { ARWEAVE_BASE_URL, MONAD_BASE_URL } from '@/apiServices';
import { insertEllipsis } from '../../insertEllipsis';

const DATA_COLUMNS = [
  {
    id: 'epoch',
    label: (
      <Stack alignItems='center' direction='row' gap={1}>
        <img alt='Tread' src={ICONS.tread} style={{ height: '16px', marginRight: '4px' }} />
        Block
      </Stack>
    ),
    // tooltip: 'Click on a block to view detailed information',
    width: '8%',
    align: 'left',
  },
  {
    id: 'status',
    label: 'Status',
    width: '13%',
    align: 'left',
  },
  {
    id: 'attester',
    label: 'Attester',
    width: '18%',
    align: 'left',
  },
  {
    id: 'cid',
    label: 'CID',
    tooltip: 'Content Identifier for the data',
    width: '18%',
    align: 'left',
  },
  {
    id: 'timestamp',
    label: 'Timestamp',
    width: '15%',
    align: 'left',
  },
  {
    id: 'actions',
    label: '',
    width: '10%',
    align: 'center',
  },
];

const RISK_COLUMNS = [
  {
    id: 'epoch',
    label: (
      <Stack alignItems='center' direction='row' gap={1}>
        <img alt='Tread' src={ICONS.tread} style={{ height: '16px', marginRight: '4px' }} />
        Block
      </Stack>
    ),
    // tooltip: 'Click on an epoch to view detailed information',
    width: '8%',
    align: 'left',
  },
  {
    id: 'status',
    label: 'Status',
    width: '13%',
    align: 'left',
  },
  {
    id: 'attester',
    label: 'Attester',
    width: '18%',
    align: 'left',
  },
  {
    id: 'value',
    label: 'Value',
    tooltip: 'Risk value attested by the validators',
    width: '18%',
    align: 'left',
  },
  {
    id: 'timestamp',
    label: 'Timestamp',
    width: '15%',
    align: 'left',
  },
  {
    id: 'actions',
    label: '',
    width: '10%',
    align: 'center',
  },
];

/**
 * Data Consensus Table Row Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.row - Row data
 * @param {string} props.traderId - Trader ID
 * @returns {React.ReactElement} Data consensus table row
 */
function DataConsensusTableRow({ row }) {
  return (
    <TableRow
      hover
      key={`row-${row.txHash || `index-${row.index}`}`}
      sx={{
        '&:last-child td, &:last-child th': {
          border: 0,
        },
      }}
    >
      <StyledTableCell>
        <Typography
          sx={{
            textAlign: 'left',
            p: 0,
            display: 'inline-block',
          }}
        >
          {row.epoch}
        </Typography>
      </StyledTableCell>
      <StyledTableCell>
        <ConsensusDetailChip status={row.status} variant='status' />
      </StyledTableCell>
      <StyledTableCell>
        <Button
          size='small'
          sx={{
            textTransform: 'none',
            p: 0,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: 'transparent',
            },
          }}
          onClick={() => {
            const url = `https://testnet.monadexplorer.com/address/${row.attester.includes('...') ? row.fullAttester : row.attester}`;
            window.open(url, '_blank');
          }}
        >
          <Typography sx={{ color: 'primary.main' }} variant='body1'>
            {row.attester}
          </Typography>
        </Button>
      </StyledTableCell>
      <StyledTableCell>
        {row.cid !== '-' ? <CopyableValue displayValue={insertEllipsis(row.cid, 6, 4)} value={row.cid} /> : row.cid}
      </StyledTableCell>
      <StyledTableCell>
        <PrettyRelativeTimestamp timestamp={row.timestamp}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <PrettyRelativeTimestamp.ISO variant='body2' />
            <PrettyRelativeTimestamp.Relative variant='body2' />
          </Box>
        </PrettyRelativeTimestamp>
      </StyledTableCell>
      <StyledTableCell align='right'>
        <Button
          disabled={!row.cid || row.cid === '-'}
          size='small'
          sx={{
            borderRadius: '4px',
            minWidth: 'auto',
            padding: '4px 8px',
            textTransform: 'none',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
            },
          }}
          variant='outlined'
          onClick={() => {
            const url = `${ARWEAVE_BASE_URL}${row.cid || 'unknown'}`;
            window.open(url, '_blank');
          }}
        >
          <Stack alignItems='center' direction='row' spacing={1}>
            <Typography variant='body1'>Proof</Typography>
            <img alt='Arweave Logo' src={arweaveLight} style={{ height: '16px' }} />
          </Stack>
        </Button>
      </StyledTableCell>
    </TableRow>
  );
}

/**
 * Risk Consensus Table Row Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.row - Row data
 * @param {string} props.traderId - Trader ID
 * @returns {React.ReactElement} Risk consensus table row
 */
function RiskConsensusTableRow({ row }) {
  return (
    <TableRow
      hover
      key={`row-${row.txHash || `index-${row.index}`}`}
      sx={{
        '&:last-child td, &:last-child th': {
          border: 0,
        },
      }}
    >
      <StyledTableCell>
        <Typography
          sx={{
            textAlign: 'left',
            p: 0,
            display: 'inline-block',
          }}
        >
          {row.epoch}
        </Typography>
      </StyledTableCell>
      <StyledTableCell>
        <ConsensusDetailChip status={row.status} variant='status' />
      </StyledTableCell>
      <StyledTableCell>
        <Button
          size='small'
          sx={{
            textTransform: 'none',
            p: 0,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: 'transparent',
            },
          }}
          onClick={() => {
            const url = `https://testnet.monadexplorer.com/address/${row.attester.includes('...') ? row.fullAttester : row.attester}`;
            window.open(url, '_blank');
          }}
        >
          <Typography sx={{ color: 'primary.main' }} variant='body1'>
            {row.attester}
          </Typography>
        </Button>
      </StyledTableCell>
      <StyledTableCell>
        <Typography variant='body2'>{row.value !== undefined ? row.value.toLocaleString() : '-'}</Typography>
      </StyledTableCell>
      <StyledTableCell>
        <PrettyRelativeTimestamp timestamp={row.timestamp}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <PrettyRelativeTimestamp.ISO variant='body2' />
            <PrettyRelativeTimestamp.Relative variant='body2' />
          </Box>
        </PrettyRelativeTimestamp>
      </StyledTableCell>
      <StyledTableCell align='right'>
        <Button
          size='small'
          sx={{
            borderRadius: '4px',
            minWidth: 'auto',
            padding: '4px 8px',
            textTransform: 'none',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
            },
          }}
          variant='outlined'
          onClick={() => {
            const url = `${MONAD_BASE_URL}${row.txHash || 'unknown'}`;
            window.open(url, '_blank');
          }}
        >
          <Stack alignItems='center' direction='row' spacing={1}>
            <Typography variant='body1'>Proof</Typography>
            <img alt='Monad Logo' src={monadLight} style={{ height: '16px' }} />
          </Stack>
        </Button>
      </StyledTableCell>
    </TableRow>
  );
}

/**
 * Helper to create a skeleton row component
 *
 * @param {Array} columns - Column definitions
 * @returns {Function} Skeleton row renderer function
 */
export function createSkeletonRowRenderer(columns) {
  const SkeletonRowRenderer = function SkeletonRowRenderer(key) {
    return (
      <TableRow key={key}>
        {columns.map((column) => {
          // Determine width based on column type
          let boxWidth = 100; // Default width
          if (column.id === 'actions') {
            boxWidth = 70;
          } else if (column.id === 'epoch') {
            boxWidth = 40;
          }

          // Determine height based on column type
          let boxHeight = 20;
          if (column.id === 'timestamp') {
            boxHeight = 40;
          } else if (column.id === 'status') {
            boxHeight = 24;
          }

          return (
            <StyledTableCell align={column.align} key={`${key}-cell-${column.id}`} width={column.width}>
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                  height: boxHeight,
                  width: boxWidth,
                  ...(column.id === 'actions' ? { ml: 'auto' } : {}),
                }}
              />
            </StyledTableCell>
          );
        })}
      </TableRow>
    );
  };

  SkeletonRowRenderer.displayName = 'SkeletonRowRenderer';
  return SkeletonRowRenderer;
}

/**
 * Reusable consensus table component for both data and risk consensus
 *
 * @param {Object} props - Component props
 * @param {Array} props.columns - Column definitions
 * @param {Array} props.data - Table data
 * @param {Function} props.renderRow - Function to render a table row
 * @param {Function} props.renderSkeletonRow - Function to render a skeleton row
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 * @param {string} props.emptyMessage - Message to show when no data
 * @returns {React.ReactElement} Consensus table
 */
export default function ConsensusTable({ data = [], traderId, eventType = 'data' }) {
  const columns = eventType === 'data' ? DATA_COLUMNS : RISK_COLUMNS;
  const emptyMessage =
    eventType === 'data'
      ? 'No consensus data available for this epoch'
      : 'No risk consensus data available for this epoch';

  // Create a memoized row renderer function to prevent unnecessary recreations
  const renderRow = useCallback(
    (row) =>
      eventType === 'data' ? (
        <DataConsensusTableRow key={`row-${row.txHash || `index-${row.index}`}`} row={row} traderId={traderId} />
      ) : (
        <RiskConsensusTableRow key={`row-${row.txHash || `index-${row.index}`}`} row={row} traderId={traderId} />
      ),
    [traderId, eventType]
  );

  // Render column header with optional tooltip
  const renderColumnHeader = (column) => {
    if (!column.tooltip) {
      return column.label;
    }

    if (column.id === 'epoch') {
      return (
        <Tooltip arrow placement='bottom' title={column.tooltip}>
          <Typography sx={{ textDecoration: 'underline dotted' }} variant='subtitle2'>
            {column.label}
          </Typography>
        </Tooltip>
      );
    }

    return (
      <LabelTooltip
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              color: 'text.primary',
              boxShadow: 1,
              fontSize: '0.875rem',
              p: 1,
              zIndex: 9999,
            },
          },
        }}
        label={column.label}
        labelTextVariant='subtitle2'
        placement='bottom'
        title={column.tooltip}
      />
    );
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <TableContainer sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Table
          stickyHeader
          aria-label='consensus table'
          sx={{
            tableLayout: 'fixed',
          }}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <StyledHeaderTableCellWithLine align={column.align} key={column.id} sx={{ width: column.width }}>
                  {renderColumnHeader(column)}
                </StyledHeaderTableCellWithLine>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              if (data.length > 0) {
                return data.map(renderRow);
              }

              return (
                <TableRow>
                  <StyledTableCell align='center' colSpan={columns.length}>
                    {emptyMessage}
                  </StyledTableCell>
                </TableRow>
              );
            })()}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
