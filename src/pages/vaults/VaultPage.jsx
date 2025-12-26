import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableContainer,
  TableRow,
  TableHead,
  TableBody,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  TablePagination,
  Paper,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import React, { useState } from 'react';
import { StyledHeaderTableCell } from '@/shared/orderTable/util';
import { useNavigate } from 'react-router-dom';
import { VaultRow } from './VaultRow';
import { useVaultList } from './data/useVaultList';

// IDs need to be mapped to corred graphQL fields
const columns = [
  { id: 'name', name: 'Field Name', width: 200 },
  { id: 'tvl', name: 'TVL', width: 200 },
  { id: 'borrowed', name: 'Borrowed', width: 200 },
  { id: 'apy', name: 'Net APY', width: 200 },
  { id: 'curator', name: 'Curator', width: 200 },
  { id: 'deposit', name: 'Your Deposit', width: 200 },
  { id: 'actions', name: 'Actions', width: 200 },
];

function VaultTable({ searchQuery, vaultType }) {
  const navigate = useNavigate();
  const { vaults, loading: vaultsLoading, error: vaultsError } = useVaultList();

  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const page = 0;
  const totalPages = 1;

  // Filter vaults based on search query
  // The actual filtering by name/address happens within each VaultRow component
  const filteredVaults = vaults;

  if (vaultsLoading) {
    return (
      <Paper
        elevation={0}
        sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (vaultsError) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
        <Typography color='error'>Error loading vaults: {vaultsError.message}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 4 }}>
      <TableContainer>
        <Table columns={columns} rows={filteredVaults}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <StyledHeaderTableCell align='center' key={column.id}>
                  {column.name}
                </StyledHeaderTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVaults.map((vaultAddress, index) => (
              <VaultRow
                columns={columns}
                index={index}
                key={vaultAddress}
                totalRows={filteredVaults.length}
                vaultAddress={vaultAddress}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component='div'
        count={filteredVaults.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
        sx={{
          height: '60px',
        }}
        onPageChange={() => {}}
      />
    </Paper>
  );
}

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [toggleVaultType, setToggleVaultType] = useState('active');

  return (
    <Box
      spacing={2}
      sx={{
        height: '90%',
        width: '90%',
        margin: '2% auto',
      }}
    >
      <Stack dirction='column' spacing={2}>
        <Stack
          alignItems='center'
          direction='row'
          justifyContent='space-between'
          sx={{ height: 'auto', width: '100%' }}
        >
          <Stack direction='row' spacing={2}>
            <Stack direction='column' spacing={2}>
              <Box>
                <Typography variant='h2'>Portfolio</Typography>
              </Box>
              <Stack direction='row' spacing={8}>
                <Stack direction='column' spacing={2}>
                  <Box>
                    <Typography variant='body2'>Deposited</Typography>
                  </Box>
                  <Box>
                    <Typography variant='h3'>$0</Typography>
                  </Box>
                </Stack>
                <Stack direction='column' spacing={2}>
                  <Box>
                    <Typography variant='body2'>Total Earnings</Typography>
                  </Box>
                  <Box>
                    <Typography variant='h3'>$0</Typography>
                  </Box>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
          <Stack direction='column' spacing={2}>
            <Box>
              <Typography variant='h2'>Platform</Typography>
            </Box>
            <Typography variant='body2'>Total Value Locked</Typography>
            <Typography variant='h3'>$238,439,340</Typography>
          </Stack>
        </Stack>
        <Divider fullWidth sx={{ paddingTop: 4 }} />
        <Stack direction='row' justifyContent='space-between' spacing={2} sx={{ py: 6 }}>
          <Typography fontSize={30} fontWeight={400} variant='h1'>
            Vaults
          </Typography>
          <Stack direction='row' spacing={2}>
            <TextField
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              placeholder='Search by vault name or owner address...'
              size='small'
              sx={{ width: '400px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ToggleButtonGroup color='primary' size='small' value={toggleVaultType}>
              <ToggleButton value='active' onClick={(e) => setToggleVaultType('active')}>
                Active
              </ToggleButton>
              <ToggleButton value='deposited' onClick={(e) => setToggleVaultType('deposited')}>
                Deposited
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <VaultTable searchQuery={searchQuery} vaultType={toggleVaultType} />
      </Stack>
    </Box>
  );
}
