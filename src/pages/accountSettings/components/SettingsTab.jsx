import { updateUserPreferences } from '@/apiServices';
import {
  OPEN_NEW_TAB_ON_SUBMIT,
  OPEN_VIEW_STATUS_IN_NEW_TAB,
  QUICK_SUBMIT_ENABLED,
  USER_PREF_RECEIVE_ALL_NOTIFICATIONS,
  USER_PREF_CHART_TIMEZONE,
} from '@/constants';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { AccountSettingTableCell } from '@/shared/orderTable/util';
import {
  Box,
  Divider,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableRow,
  Tooltip,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import React from 'react';
import { useThemeContext } from '@/theme/ThemeContext';

export default function SettingsTab() {
  const { user, setUser, loadUserMetadata } = useUserMetadata();
  const { showAlert } = React.useContext(ErrorContext);
  const { currentTheme, setTheme } = useThemeContext();

  const handlePreferenceSwitchChange = async (name, value) => {
    // Update local state immediately for responsive UI
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        [name]: value,
      },
    };
    setUser(updatedUser);

    try {
      await updateUserPreferences({ [name]: value });
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to update preferences: ${error.message}`,
      });
      // Revert on error
      setUser(user);
    }
    // Don't reload metadata - it causes the app to think it's a fresh load
  };

  const getGeneralPreferences = (preferences) => {
    return Object.entries(preferences).filter(([name]) => {
      return (
        !name.startsWith('notification') &&
        name !== USER_PREF_RECEIVE_ALL_NOTIFICATIONS &&
        name !== QUICK_SUBMIT_ENABLED &&
        name !== USER_PREF_CHART_TIMEZONE
      );
    });
  };

  const renderPrefName = (name) => {
    let msg = '';
    let label = '';
    switch (name) {
      case OPEN_NEW_TAB_ON_SUBMIT:
        label = 'Order submit: New tab';
        msg = 'Open new tab to order details on order submit';
        break;
      case USER_PREF_RECEIVE_ALL_NOTIFICATIONS:
        label = 'Track all orders';
        msg = 'Receive notifications on orders from all users based on your notification preferences';
        break;
      default:
        msg = '';
    }

    return (
      <Stack direction='column' spacing={1}>
        <Typography variant='body1Strong'>{label}</Typography>
        <Typography color='text.secondary'>{msg}</Typography>
      </Stack>
    );
  };

  const renderAppearanceThemePreference = () => {
    return (
      <Stack direction='column' spacing={1}>
        <Typography variant='body1Strong'>Theme</Typography>
        <Typography color='text.secondary'>
          Switch between available themes. Currently using {currentTheme} theme.
        </Typography>
      </Stack>
    );
  };

  const renderThemeDropdown = () => {
    return (
      <FormControl size='small' sx={{ minWidth: 100 }}>
        <Select
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: 'var(--background-paper)',
                '& .MuiMenuItem-root': {
                  backgroundColor: 'var(--background-paper)',
                  color: 'var(--text-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--ui-background-light)',
                  },
                },
                '& .MuiMenuItem-root.Mui-selected': {
                  backgroundColor: 'var(--ui-background-light)',
                  '&:hover': {
                    backgroundColor: 'var(--ui-background-light)',
                  },
                },
              },
            },
          }}
          value={currentTheme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <MenuItem value='dark'>Dark</MenuItem>
          <MenuItem value='og'>OG</MenuItem>
          <MenuItem value='blue'>Blue</MenuItem>
          <MenuItem value='hyperliquid'>Hyperliquid</MenuItem>
          <MenuItem value='binance'>Binance</MenuItem>
          <MenuItem value='bybit'>Bybit</MenuItem>
          <MenuItem value='deribit'>Deribit</MenuItem>
          <MenuItem value='gate'>Gate</MenuItem>
          <MenuItem value='aster'>Aster</MenuItem>
          <MenuItem value='bip01'>Bip01</MenuItem>
        </Select>
      </FormControl>
    );
  };

  const renderValueAsInputField = (name, value) => {
    if (typeof value === 'boolean') {
      return (
        <Switch
          checked={value}
          onChange={(e) => {
            handlePreferenceSwitchChange(name, e.target.checked);
          }}
        />
      );
    }
    return <Typography>{value}</Typography>;
  };

  const renderNotifValueAsInputField = (name, value) => {
    if (typeof value === 'boolean') {
      const disabled = !user.telegram_chat_id;
      return (
        <Tooltip disableHoverListener={!disabled} title='Link telegram to configure'>
          <Box>
            <Switch
              checked={value}
              disabled={disabled}
              onChange={(e) => {
                handlePreferenceSwitchChange(name, e.target.checked);
              }}
            />
          </Box>
        </Tooltip>
      );
    }
    return <Typography>{value}</Typography>;
  };

  if (!user || Object.keys(user).length === 0) {
    return null;
  }

  const preferences = user?.preferences || {};

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography gutterBottom variant='h6'>
          Preferences
        </Typography>
        <Divider sx={{ mb: 4 }} />
        <Table>
          <TableBody>
            {/* Other Preferences */}
            {getGeneralPreferences(preferences).map(([name, value]) => (
              <TableRow key={name}>
                <AccountSettingTableCell sx={{ width: '80%', paddingLeft: 0 }}>
                  {renderPrefName(name)}
                </AccountSettingTableCell>
                <AccountSettingTableCell align='right'>{renderValueAsInputField(name, value)}</AccountSettingTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography gutterBottom variant='h6'>
          Appearance
        </Typography>
        <Divider sx={{ mb: 4 }} />
        <Table>
          <TableBody>
            <TableRow>
              <AccountSettingTableCell sx={{ width: '80%', paddingLeft: 0 }}>
                {renderAppearanceThemePreference()}
              </AccountSettingTableCell>
              <AccountSettingTableCell align='right'>{renderThemeDropdown()}</AccountSettingTableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
      {user.is_superuser && (
        <Paper elevation={0} sx={{ p: 4 }}>
          <Typography gutterBottom variant='h6'>
            Superuser Settings
          </Typography>
          <Divider sx={{ mb: 4 }} />
          <Table>
            <TableBody>
              <TableRow>
                <AccountSettingTableCell sx={{ width: '80%', paddingLeft: 0 }}>
                  {renderPrefName(USER_PREF_RECEIVE_ALL_NOTIFICATIONS)}
                </AccountSettingTableCell>
                <AccountSettingTableCell align='right'>
                  {renderNotifValueAsInputField(
                    USER_PREF_RECEIVE_ALL_NOTIFICATIONS,
                    user.preferences[USER_PREF_RECEIVE_ALL_NOTIFICATIONS]
                  )}
                </AccountSettingTableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
