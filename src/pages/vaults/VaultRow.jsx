import { StyledTableCell } from '@/shared/orderTable/util';
import { Button, TableRow, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SparkChart from './graphs/SparkChart';
import { useVaultData } from './data/useVaultOverviewData';

/**
 * Component that renders a single row in the vault table
 *
 * @param {Object} props - Component props
 * @param {string} props.vaultAddress - The address of the vault to display
 * @param {number} props.index - The index of this row in the table
 * @param {number} props.totalRows - The total number of rows in the table, used for borderBottom
 * @param {Array<Object>} props.columns - Array of column definitions with id and name properties
 * @returns {JSX.Element} A table row displaying vault information
 */
export function VaultRow({ vaultAddress, index, totalRows, columns }) {
  const navigate = useNavigate();
  const { vaultData: row, loading, error } = useVaultData(vaultAddress);

  if (loading) {
    return (
      <TableRow>
        <StyledTableCell
          align='center'
          colSpan={columns.length}
          sx={{
            borderBottom: index === totalRows - 1 && 0,
          }}
        >
          <CircularProgress size={24} />
        </StyledTableCell>
      </TableRow>
    );
  }

  if (error || !row) {
    return (
      <TableRow>
        <StyledTableCell
          align='center'
          colSpan={columns.length}
          sx={{
            borderBottom: index === totalRows - 1 && 0,
          }}
        >
          Error loading vault data
        </StyledTableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      {columns.map((column) => {
        if (column.id === 'name') {
          return (
            <StyledTableCell
              align='center'
              key={column.id}
              sx={{
                borderBottom: index === totalRows - 1 && 0,
              }}
            >
              <Button
                color='primary'
                component='button'
                underline='hover'
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/vault/${row.address}`);
                }}
              >
                {row[column.id]}
              </Button>
            </StyledTableCell>
          );
        }
        if (column.id === 'actions') {
          return (
            <StyledTableCell
              align='center'
              key={column.id}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderBottom: index === totalRows - 1 && 0,
              }}
            >
              <SparkChart data={row[column.id]} key={`${row.address}spark_graph`} />
            </StyledTableCell>
          );
        }

        return (
          <StyledTableCell
            align='center'
            key={column.id}
            sx={{
              borderBottom: index === totalRows - 1 && 0,
            }}
          >
            {row[column.id]}
          </StyledTableCell>
        );
      })}
    </TableRow>
  );
}
