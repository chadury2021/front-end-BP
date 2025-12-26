import { useTheme, keyframes } from '@emotion/react';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import React, { useState, memo } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { StyledBorderTableCell } from '@/shared/orderTable/util';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { refreshAccountBalanceCache } from '@/apiServices';
import { msAndKs, truncate } from '@/util';
import ExchangeIcons from '@images/exchange_icons';
import { WalletProviderIcon } from '@/shared/components/Icons';
import useLiquidationRisk from '@/hooks/useLiquidationRisk';
import { getMarginRatioHexColor, formatMarginRatio, getMarginRatioColors } from '@/util/marginRatioUtils';
import { balanceToRow } from './util';
import RenameAccountDialog from './RenameAccountDialog';

// Helper functions
const diffStyleByValue = (value) => {
  if (value >= 0) {
    return 'success.main';
  }
  return 'error.main';
};

const formatDiff = (value) => {
  const percentage = Number(Math.abs(value));
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${percentage.toFixed(2)}%`;
};

// Get color for liquidation risk score (0-100, where 0 = highest risk, 100 = safest)
const getLiquidationRiskColor = (riskScore, theme) => {
  const colors = getMarginRatioColors(theme);
  if (riskScore === null || riskScore === undefined) {
    return colors.NEUTRAL;
  }

  if (riskScore >= 80) {
    return colors.VERY_SAFE; // Green - very safe
  } if (riskScore >= 60) {
    return colors.SAFE; // Green - safe
  } if (riskScore >= 40) {
    return colors.MODERATE; // Yellow - moderate
  } if (riskScore >= 20) {
    return colors.RISKY; // Orange - risky
  }
    return colors.VERY_RISKY; // Red - very risky

};

// Separate component for account row that can use hooks
const AccountRow = memo(({
  handleAccountClick,
  handleRenameClick,
  isRecentlyUpdated,
  isSelected,
  refreshCacheOnClick,
  renderIcon,
  rotate,
  row,
  theme,
  updatingAccountId,
  user
}) => {
  const liquidationRiskData = useLiquidationRisk(row.accountBalance);
  const hasLiquidationRisk = liquidationRiskData.hasPerpExposure && liquidationRiskData.perPosition.length > 0;
  const riskScore = hasLiquidationRisk ? liquidationRiskData.riskScore : null;
  const isAtRisk = riskScore !== null && riskScore < 50; // Risk threshold at 50% (lower score = higher risk)

  const displayAccName = user.user_id !== row.userId ? `${row.username} - ${row.name}` : row.name;

  return (
    <Button
      key={`${row.accountId} ${row.name}`}
      style={{
        width: '100%',
        border: `solid 1px ${isSelected ? theme.palette.primary.light : 'transparent'}`,
        backgroundColor: isSelected ? theme.palette.primary.dark2 : 'inherit',
      }}
      variant='text'
      onClick={() => handleAccountClick(row)}
    >
      <Table style={{ tableLayout: 'fixed' }} sx={{ marginY: 1 }}>
        <TableBody>
          <TableRow key={`${row.accountId} ${row.name} TableRow`}>
            <StyledBorderTableCell
              align='left'
              key={`${row.accountId} ${row.name} TableCell`}
              style={{
                whiteSpace: 'nowrap',
                padding: '4px 16px',
                width: '100%',
              }}
            >
              <Stack direction='column' spacing={2}>
                <Stack alignItems='center' direction='row' spacing={2}>
                  {renderIcon(row)}
                  <Typography overflow='hidden' textOverflow='ellipsis' variant='body1' whiteSpace='nowrap'>
                    {displayAccName}
                  </Typography>
                  {user.user_id === row.userId && (
                    <Tooltip title='Rename account'>
                      <IconButton
                        size='small'
                        sx={{
                          '& .MuiSvgIcon-root': {
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                          },
                          padding: '2px',
                        }}
                        onClick={(e) => handleRenameClick(e, row)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {hasLiquidationRisk && riskScore !== null && (
                    <Chip
                      icon={isAtRisk ? <CancelIcon /> : <CheckCircleIcon />}
                      label={`${riskScore}%`}
                      size='small'
                      sx={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${getLiquidationRiskColor(riskScore, theme)}`,
                        color: getLiquidationRiskColor(riskScore, theme),
                        fontSize: '0.75rem',
                        height: '20px',
                        '& .MuiChip-icon': {
                          color: getLiquidationRiskColor(riskScore, theme),
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                  )}
                </Stack>
                <Stack alignItems='center' direction='row' spacing={1}>
                  <Typography gutterBottom color='text.dark' display='block' variant='caption'>
                    {`${row.lastUpdated}`}
                  </Typography>
                  <Tooltip title='Update to latest account balance'>
                    <IconButton
                      disabled={updatingAccountId === row.accountId}
                      onClick={(e) => refreshCacheOnClick(e, row.accountId)}
                    >
                      <SyncIcon
                        sx={{
                          fontSize: '1rem',
                          color: theme.palette.primary.main,
                          animation:
                            updatingAccountId === row.accountId || isRecentlyUpdated(row.lastUpdated)
                              ? `${rotate} 1s linear infinite`
                              : 'none',
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </StyledBorderTableCell>
            <StyledBorderTableCell
              align='right'
              key='totalNotional'
              style={{
                whiteSpace: 'nowrap',
                padding: '4px 16px',
                width: '50%',
              }}
            >
              <Stack direction='column'>
                <Typography sx={{ fontFamily: 'IBM Plex Mono', marginBottom: '5px' }}>
                  {`$${msAndKs(truncate(row.totalValue || 0))}`}
                </Typography>
                {row.dayAgoDiffPercentage ? (
                  <Box
                    alignItems='center'
                    display='flex'
                    justifyContent='right'
                    marginBottom={row.weekAgoDiff ? '0px' : '5px'}
                    width='100%'
                  >
                    <Typography color={diffStyleByValue(row.dayAgoDiffPercentage)} variant='body2'>
                      {formatDiff(row.dayAgoDiffPercentage)}
                    </Typography>
                    <Typography color='text.subtitle' marginLeft='0.8rem' variant='body2' width='0.8rem'>
                      1d
                    </Typography>
                  </Box>
                ) : null}
                {row.weekAgoDiffPercentage ? (
                  <Box alignItems='center' display='flex' justifyContent='right' marginBottom='5px' width='100%'>
                    <Typography color={diffStyleByValue(row.weekAgoDiffPercentage)} variant='body2'>
                      {formatDiff(row.weekAgoDiffPercentage)}
                    </Typography>
                    <Typography color='text.subtitle' marginLeft='0.8rem' variant='body2' width='0.8rem'>
                      7d
                    </Typography>
                  </Box>
                ) : null}
              </Stack>
            </StyledBorderTableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Button>
  );
});

AccountRow.displayName = 'AccountRow';

export default function AccountSummaryTable({
  accountsById,
  balances,
  pastSnapshots,
  setSelectedAccount,
  selectedAccount,
  showAlert,
  getAccounts,
}) {
  const [updatingAccountId, setUpdatingAccountId] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [accountToRename, setAccountToRename] = useState(null);
  const theme = useTheme();
  const { user } = useUserMetadata();

  // Define the rotation animation
  const rotate = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `;

  // Check if the row was recently updated (within 5 seconds)
  const isRecentlyUpdated = (lastUpdated) => {
    if (!lastUpdated) return false;

    const now = new Date();
    const updatedTime = new Date(lastUpdated);
    const diffInSeconds = (now - updatedTime) / 1000;

    return diffInSeconds <= 5; // Within 5 seconds
  };

  const sortedBalances = (balanceInput) => {
    if (balanceInput.length === 0) {
      return [];
    }

    const sortedOtherBalances = balanceInput.sort((a, b) => {
      const aName = a.account_name.toLowerCase();
      const bName = b.account_name.toLowerCase();
      return aName.localeCompare(bName);
    });

    return sortedOtherBalances;
  };

  const refreshCacheOnClick = async (event, accountId) => {
    event.stopPropagation();

    setUpdatingAccountId(accountId);

    try {
      await refreshAccountBalanceCache(accountId);
    } catch (e) {
      showAlert({ severity: 'error', message: e.message });
    }

    getAccounts(false);
    setUpdatingAccountId('');
  };



  const handleAccountClick = (account) => {
    const scopedAccName = user.user_id === account.userId ? account.name : `${account.username}/${account.name}`;
    setSelectedAccount({
      account_id: account.accountId,
      account_name: scopedAccName,
      exchange_name: account.exchange,
      vcefi_enabled: account.vcefi_enabled,
    });
  };

  const handleRenameClick = (event, account) => {
    event.stopPropagation();
    setAccountToRename(account);
    setRenameDialogOpen(true);
  };

  const handleRenameSuccess = () => {
    getAccounts(false);
    showAlert({ severity: 'success', message: 'Account renamed successfully' });
  };

  const handleRenameClose = () => {
    setRenameDialogOpen(false);
    setAccountToRename(null);
  };

  const renderIcon = (row) => {
    if (row.exchange === 'OKXDEX' && accountsById[row.accountId]) {
      const credMeta = accountsById[row.accountId];
      return <WalletProviderIcon walletProvider={credMeta.wallet_provider} walletType={credMeta.wallet_type} />;
    }

    return (
      <img
        alt={row.exchange}
        src={ExchangeIcons[row.exchange.toLowerCase()]}
        style={{
          height: '24px',
          width: '24px',
          borderRadius: '50%',
        }}
      />
    );
  };



    return (
    <TableContainer sx={{ maxHeight: '90%' }}>
      {sortedBalances(balances).map((x, i) => {
        const row = balanceToRow(x, pastSnapshots);
        const isSelected = selectedAccount.accountId === row.accountId;

        return (
          <AccountRow
            handleAccountClick={handleAccountClick}
            handleRenameClick={handleRenameClick}
            isRecentlyUpdated={isRecentlyUpdated}
            isSelected={isSelected}
            key={`${row.accountId} ${row.name}`}
            refreshCacheOnClick={refreshCacheOnClick}
            renderIcon={renderIcon}
            rotate={rotate}
            row={{ ...row, accountBalance: x }}
            theme={theme}
            updatingAccountId={updatingAccountId}
            user={user}
          />
        );
      })}
      <RenameAccountDialog
        account={accountToRename}
        open={renameDialogOpen}
        onClose={handleRenameClose}
        onSuccess={handleRenameSuccess}
      />
    </TableContainer>
  );
}
