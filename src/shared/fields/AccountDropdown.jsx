import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';

import Typography from '@mui/material/Typography';
import { ExchangeIcon, WalletProviderIcon } from '@/shared/components/Icons';
import { useState } from 'react';
import Stack from '@mui/material/Stack';
import { StyledListSubheader, StyledMenuItem } from '@/shared/components/MuiComponents';

function AccountIcon({ account }) {
  if (account.exchangeName === 'OKXDEX') {
    return <WalletProviderIcon walletProvider={account.walletProvider} walletType={account.walletType} />;
  }
  return <ExchangeIcon exchangeName={account.exchangeName} style={{ height: '20px', width: '20px' }} />;
}

export default function AccountDropdown({
  accounts,
  extraStyling = {},
  isDex = false,
  multiple = false,
  selectedAccounts,
  simpleChip = false, // flag to render chip for simple order
  handleSelectedAccountsChange,
  handleSelectedAccountsDelete = () => {},
  multiOrder = false, // flag to indicate multi-order context
}) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  // Define exchange priority order
  const EXCHANGE_PRIORITY = isDex
    ? ['OKXDEX', 'Binance', 'Bybit', 'OKX', 'Hyperliquid']
    : ['Binance', 'Bybit', 'OKX', 'Hyperliquid', 'OKXDEX'];

  // Function to format exchange name display
  const formatExchangeNameDisplay = (name) => {
    if (name?.toLowerCase() === 'okx') {
      return 'OKX';
    }
    if (name?.toLowerCase() === 'okxdex') {
      return 'OKXDEX';
    }
    return name;
  };

  const handleChange = (event) => {
    setOpen(false);
    handleSelectedAccountsChange(event);
  };

  const chipSxProps = (value) => {
    let color = theme.palette.exchangeColors?.OKXTransparent || 'rgba(169, 169, 169, 0.75)';

    const chipExchangeName = accounts ? accounts[value].exchangeName : null;
    if (theme.palette.exchangeColors && Object.keys(theme.palette.exchangeColors).includes(chipExchangeName)) {
      color = theme.palette.exchangeColors[`${chipExchangeName}Transparent`];
    }

    return {
      fontSize: '0.65rem',
      fontFamily: theme.typography.fontFamilyConfig.ui, // Use Helvetica for UI text
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      backgroundColor: color,
      color: theme.palette.text.grey,
    };
  };

  const createChip = (value) => {
    const exchangeName = accounts[value]?.exchangeName;

    const simpleSxProps = {
      border: `1px solid ${theme.palette.grey.main}`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      pl: 1.5,
      '& .MuiChip-label': {
        padding: 2,
      },
    };

    const handleDelete = multiple
      ? () => {
          const filteredSelection = selectedAccounts.filter((selected) => selected !== value);
          handleSelectedAccountsDelete(filteredSelection);
        }
      : undefined;

    return (
      <Chip
        clickable={false}
        icon={simpleChip && <ExchangeIcon exchangeName={exchangeName} style={{ height: '20px', width: '20px' }} />}
        key={value}
        label={value}
        sx={{ ...(simpleChip ? simpleSxProps : chipSxProps(value)) }}
        onClick={() => {
          setOpen(true);
        }}
        onDelete={handleDelete}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      />
    );
  };

  // Group accounts by exchange and sort by priority
  const groupedAccounts = Object.values(accounts).reduce((acc, account) => {
    const { exchangeName } = account;

    // Filter out OKXDEX accounts for multi-order
    if (multiOrder && exchangeName === 'OKXDEX') {
      return acc;
    }

    if (!acc[exchangeName]) {
      acc[exchangeName] = [];
    }
    acc[exchangeName].push(account);
    return acc;
  }, {});

  // Sort exchanges by priority
  const sortedExchanges = Object.keys(groupedAccounts).sort((a, b) => {
    const aIndex = EXCHANGE_PRIORITY.indexOf(a);
    const bIndex = EXCHANGE_PRIORITY.indexOf(b);

    // If both exchanges are in priority list, sort by their priority
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only one exchange is in priority list, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // If neither is in priority list, sort alphabetically
    return a.localeCompare(b);
  });

  // Custom styles for group header and menu item
  const customListSubheaderStyle = {
    backgroundColor: 'transparent !important',
    // ...other styles can be added here if needed
  };

  const customMenuItemStyle = {
    backgroundColor: `${theme.palette.ui.cardBackground} !important`,
    color: theme.palette.text.primary,
    paddingLeft: '2em',
    margin: 0,
    borderRadius: 0,
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.text.secondary,
    },
  };

  const formControl = (
    <FormControl fullWidth sx={{ fontSize: '0.75rem' }}>
      <InputLabel id='accounts-label'>Accounts</InputLabel>
      <Select
        id='accounts'
        input={
          <OutlinedInput
            label='Accounts'
            sx={{
              '& .MuiInputBase-input': {
                padding: '12px 8px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
            }}
          />
        }
        labelId='accounts-label'
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
              backdropFilter: 'blur(15px)',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              '& .MuiMenuItem-root': {
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: `${theme.palette.action.hover}80`, // 50% opacity
                },
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}40`, // 25% opacity
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}60`, // 37% opacity
                  },
                },
              },
              '& .MuiListSubheader-root': {
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
              },
            },
          },
        }}
        multiple={multiple}
        open={open}
        renderValue={(selected) => {
          if (multiple) {
            const values = Array.isArray(selected) ? selected : [];
            if (!values.length) return null;
            return (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  flexWrap: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {values.map((value) => createChip(value))}
              </Box>
            );
          }

          if (!selected) {
            return null;
          }

          return (
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                flexWrap: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {createChip(selected)}
            </Box>
          );
        }}
        sx={{
          ...extraStyling,
        }}
        value={selectedAccounts}
        onChange={handleChange}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
      >
        {Object.values(accounts).length > 0 &&
          sortedExchanges.map((exchangeName) =>
            groupedAccounts[exchangeName] && groupedAccounts[exchangeName].length > 0
              ? [
                  <StyledListSubheader key={`header-${exchangeName}`} sx={customListSubheaderStyle}>
                    <Typography variant='body2'>{formatExchangeNameDisplay(exchangeName)}</Typography>
                  </StyledListSubheader>,
                  ...groupedAccounts[exchangeName].map((acc) => (
                    <StyledMenuItem key={acc.id} sx={customMenuItemStyle} value={acc.name}>
                      <Stack alignItems='center' direction='row' spacing={1}>
                        <Box pr={1} sx={{ position: 'relative', height: '20px', width: '20px' }}>
                          <AccountIcon account={acc} />
                        </Box>
                        <span>{acc.name}</span>
                      </Stack>
                    </StyledMenuItem>
                  )),
                ]
              : null
          )}
      </Select>
    </FormControl>
  );

  return formControl;
}
