import {
  getTelegramMetadata,
  link_telegram_oauth,
  unlink_telegram,
  updateUserProfile,
  updateUserPreferences,
  verify2FA,
  verifyPassword,
} from '@/apiServices';
import Grid from '@mui/material/Unstable_Grid2';
import useViewport from '@/shared/hooks/useViewport';
import {
  NOTIFICATION_ORDER_COMPLETE,
  NOTIFICATION_ORDER_FIRST_FILL,
  NOTIFICATION_ORDER_OVERFILL,
  NOTIFICATION_ORDER_PARTIALLY_FILLED,
  NOTIFICATION_ORDER_PAUSE_WORKFLOW,
  NOTIFICATION_ORDER_PROGRESS,
  NOTIFICATION_ORDER_RESUME_WORKFLOW,
} from '@/constants';
import { CopyableValue } from '@/shared/components/CopyableValue';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { AccountSettingTableCell, AccountSettingsLabelTableCell } from '@/shared/orderTable/util';
import { formatDateTime } from '@/util';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useContext, useEffect, useState } from 'react';

export default function AccountTab() {
  const { user, setUser, loadUserMetadata } = useUserMetadata();
  const theme = useTheme();
  const { isMobile } = useViewport();
  const [telegramMetadata, setTelegramMetadata] = useState({});
  const [isTelegramMetadataLoading, setIsTelegramMetadataLoading] = useState(false);
  const { showAlert } = useContext(ErrorContext);
  const [isEmailModalOpen, setEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCodeInput, setMfaCodeInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const updateTelegramMetadata = (key, value) => {
    setTelegramMetadata({ ...telegramMetadata, [key]: value });
  };

  const fetchTelegramMetadata = async () => {
    setIsTelegramMetadataLoading(true);
    try {
      const data = await getTelegramMetadata();
      setTelegramMetadata(data);
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Error fetching Telegram metadata: ${error.message}`,
      });
    } finally {
      setIsTelegramMetadataLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramMetadata();
  }, []);

  const getNotificationPreferences = (preferences) => {
    return Object.entries(preferences).filter(([name]) => {
      return name.startsWith('notification');
    });
  };

  const handlePreferenceSwitchChange = async (name, value) => {
    user.preferences[name] = value;
    setUser(user);
    try {
      await updateUserPreferences({ [name]: value });
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to update preferences: ${error.message}`,
      });
    }
    loadUserMetadata();
  };

  const renderPrefNameTG = (name) => {
    let label = '';
    let msg = '';
    switch (name) {
      case NOTIFICATION_ORDER_COMPLETE:
        label = 'Order Completion';
        msg = 'Receive a notification when orders finish';
        break;
      case NOTIFICATION_ORDER_PROGRESS:
        label = 'Order Progress';
        msg = 'Receive a notification for order progress on 25%, 50%, 75%';
        break;
      case NOTIFICATION_ORDER_FIRST_FILL:
        label = 'First Fill';
        msg = 'Receive a notification for the first fill of an order';
        break;
      case NOTIFICATION_ORDER_PARTIALLY_FILLED:
        label = 'Partially Filled';
        msg = 'Receive a notification when an order finishes partially filled';
        break;
      case NOTIFICATION_ORDER_OVERFILL:
        label = 'Order Overfill';
        msg = 'Receive a notification when an order overfills';
        break;
      case NOTIFICATION_ORDER_PAUSE_WORKFLOW:
        label = 'Order Pause';
        msg = 'Receive a notification when an order pauses';
        break;
      case NOTIFICATION_ORDER_RESUME_WORKFLOW:
        label = 'Order Resume';
        msg = 'Receive a notification when an order resumes';
        break;
      default:
        msg = '';
    }

    return (
      <Stack direction='column' spacing={1}>
        <Typography variant='body2Strong'>{label}</Typography>
        <Typography color='text.secondary' variant='body2'>
          {msg}
        </Typography>
      </Stack>
    );
  };

  const renderValueAsInputField = (name, value) => {
    if (typeof value === 'boolean') {
      return (
        <Switch
          checked={value}
          size='small'
          onChange={(e) => {
            handlePreferenceSwitchChange(name, e.target.checked);
          }}
        />
      );
    }
    return <Typography>{value}</Typography>;
  };

  const handleTelegramOAuth = async (authData) => {
    console.log('Processing Telegram OAuth data:', authData);
    try {
      const response = await link_telegram_oauth(authData);
      console.log('Telegram OAuth response:', response);
      if (response.message) {
        showAlert({ severity: 'success', message: response.message });
        fetchTelegramMetadata();
      } else {
        console.error('Failed response:', response);
        showAlert({
          severity: 'error',
          message: 'Failed to link Telegram account. Please try again.',
        });
      }
    } catch (error) {
      console.error('Telegram OAuth error:', error);
      showAlert({
        severity: 'error',
        message: `An error occurred while linking Telegram: ${error.message}`,
      });
    }
  };

  const handleTelegramLogin = () => {
    if (!telegramMetadata.telegram_bot_id) {
      console.log('Telegram bot ID not found:', telegramMetadata);
      return;
    }

    const width = 550;
    const height = 470;
    const left = Math.max(0, (window.screen.width - width) / 2) + (window.screen.availLeft || 0);
    const top = Math.max(0, (window.screen.height - height) / 2) + (window.screen.availTop || 0);

    const relayUrlBase = (telegramMetadata.tg_relay_url || '').trim();
    let popup;
    let relayOrigin = '';

    if (relayUrlBase) {
      try {
        relayOrigin = new URL(relayUrlBase).origin;
      } catch (_) {
        // invalid relay URL, ignore and fallback
      }

      if (relayOrigin) {
        const params = new URLSearchParams({
          bot_username: telegramMetadata.telegram_bot_username || '',
          opener_origin: window.location.origin,
        });
        const relayUrl = `${relayUrlBase}?${params.toString()}`;
        console.log('Opening Telegram Relay popup with URL:', relayUrl);
        popup = window.open(relayUrl, 'Telegram Login', `width=${width},height=${height},left=${left},top=${top}`);
      }
    }

    // Fallback to direct OAuth flow if relay not available
    if (!popup) {
      const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}`;
      const authUrl = `https://oauth.telegram.org/auth?bot_id=${encodeURIComponent(telegramMetadata.telegram_bot_id)}&origin=${encodeURIComponent(origin)}&return_to=${encodeURIComponent(window.location.href)}`;
      console.log('Opening Telegram OAuth popup with URL:', authUrl);
      popup = window.open(authUrl, 'Telegram Login', `width=${width},height=${height},left=${left},top=${top}`);
    }

    if (!popup) {
      showAlert({
        severity: 'error',
        message: 'Popup blocked. Please allow popups for this site.',
      });
      return;
    }

    const onMessage = (event) => {
      try {
        // Handle both stringified and direct object data
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (event.source !== popup) return;
        if (data.event === 'auth_result') {
          popup.close();
          handleTelegramOAuth(data.result);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    const checkClose = () => {
      if (!popup || popup.closed) {
        window.removeEventListener('message', onMessage);
        return;
      }
      setTimeout(checkClose, 100);
    };

    window.addEventListener('message', onMessage);
    popup.focus();
    checkClose();
  };

  const handleUnlinkTelegram = async (tgUsername) => {
    try {
      const response = await unlink_telegram(tgUsername);
      if (response.message) {
        showAlert({ severity: 'success', message: response.message });
        fetchTelegramMetadata();
      } else {
        showAlert({
          severity: 'error',
          message: 'Failed to unlink Telegram account. Please try again.',
        });
      }
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `An error occurred while unlinking Telegram: ${error.message}`,
      });
    }
  };

  const handleUpdateEmail = async () => {
    setIsUpdatingEmail(true);
    try {
      if (user.is_2fa_enabled) {
        const verifyResult = await verify2FA(mfaCodeInput);
        if (!verifyResult.success) {
          showAlert({
            severity: 'error',
            message: verifyResult.message || 'Invalid 2FA code.',
          });
          setIsUpdatingEmail(false);
          return;
        }
      }

      const verifyResult = await verifyPassword(passwordInput);
      if (!verifyResult.is_password_correct) {
        showAlert({ severity: 'error', message: 'Invalid password.' });
        setIsUpdatingEmail(false);
        return;
      }

      await updateUserProfile({ email: emailInput });
      showAlert({ severity: 'success', message: 'Email updated successfully' });
      setUser(user);
      loadUserMetadata();
      setEmailModalOpen(false);
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to update email: ${error.message}`,
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleCloseEmailModal = () => setEmailModalOpen(false);

  if (!user || Object.keys(user).length === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ px: 4, py: 5 }}>
        <Typography gutterBottom variant='h6'>
          Profile
        </Typography>
        <Divider sx={{ mb: 6 }} />
        <Table>
          <TableBody>
            <TableRow>
              <AccountSettingsLabelTableCell>
                <Typography variant='subtitle2'>Username</Typography>
              </AccountSettingsLabelTableCell>
              <AccountSettingTableCell>
                <Typography>{user.username}</Typography>
              </AccountSettingTableCell>
            </TableRow>
            <TableRow>
              <AccountSettingsLabelTableCell>
                <Typography variant='subtitle2'>Email</Typography>
              </AccountSettingsLabelTableCell>
              <AccountSettingTableCell>
                <Stack alignItems='center' direction='row' justifyContent='space-between' spacing={2}>
                  <Typography>{user.email}</Typography>
                  <Button variant='outlined' onClick={() => setEmailModalOpen(true)}>
                    Edit
                  </Button>
                </Stack>
              </AccountSettingTableCell>
            </TableRow>
            <TableRow>
              <AccountSettingsLabelTableCell>
                <Typography variant='subtitle2'>Account Created</Typography>
              </AccountSettingsLabelTableCell>
              <AccountSettingTableCell>
                <Typography>{formatDateTime(user.date_joined)}</Typography>
              </AccountSettingTableCell>
            </TableRow>
            {user.is_retail && (
              <>
                <TableRow>
                  <AccountSettingsLabelTableCell>
                    <Typography variant='subtitle2'>Referral Code</Typography>
                  </AccountSettingsLabelTableCell>
                  <AccountSettingTableCell>
                    <CopyableValue value={user.referral_code} />
                  </AccountSettingTableCell>
                </TableRow>
                <TableRow>
                  <AccountSettingsLabelTableCell>
                    <Typography variant='subtitle2'>Referred By</Typography>
                  </AccountSettingsLabelTableCell>
                  <AccountSettingTableCell>
                    <Typography>{user.referrer_code || 'N/A'}</Typography>
                  </AccountSettingTableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper elevation={0} sx={{ px: 4, py: 5 }}>
        <Typography gutterBottom variant='h6'>
          Connect Telegram
        </Typography>
        <Divider sx={{ mb: 6 }} />
        {isTelegramMetadataLoading ? (
          <Stack alignItems='center' direction='row' spacing={2}>
            <Stack direction='column' flexGrow={1} spacing={1}>
              <Skeleton height={28} variant='text' width={120} />
              <Skeleton height={20} variant='text' width={220} />
            </Stack>
            <Skeleton height={32} sx={{ borderRadius: 1 }} variant='rectangular' width={80} />
          </Stack>
        ) : (
          <Grid container rowGap={4} spacing={2}>
            <Grid alignItems='center' xs={isMobile ? 12 : 5}>
              <Stack direction='column' flexGrow={1} spacing={1}>
                <Typography variant='body1Strong'>Link account</Typography>
                <Typography color='text.secondary' sx={{ width: '360px' }}>
                  Connect a telegram account to submit orders and receive updates.
                </Typography>
              </Stack>
            </Grid>
            <Grid alignItems='center' marginTop={4} xs={isMobile ? 12 : 7}>
              <Stack direction={isMobile ? 'column' : 'row'} flexGrow={1} justifyContent='flex-end' spacing={4}>
                {telegramMetadata.telegram_chat_id && (
                  <Box display='flex' flexDirection='row' flexGrow={1} gap={1}>
                    <CheckCircleOutline sx={{ color: 'success.main', fontSize: 24 }} />
                    <Typography>{telegramMetadata.telegram_username}</Typography>
                  </Box>
                )}
                {telegramMetadata.telegram_chat_id ? (
                  <Button variant='outlined' onClick={() => handleUnlinkTelegram(telegramMetadata.telegram_username)}>
                    Unlink
                  </Button>
                ) : (
                  <Button
                    disabled={!telegramMetadata.telegram_bot_id}
                    variant='contained'
                    onClick={handleTelegramLogin}
                  >
                    Connect Telegram
                  </Button>
                )}
              </Stack>
            </Grid>
            {telegramMetadata.telegram_chat_id && (
              <>
                <Grid xs={isMobile ? 12 : 5}>
                  <Stack direction='column' width='40%'>
                    <Typography gutterBottom variant='body1Strong'>
                      Telegram Notifications
                    </Typography>
                    <Typography color='text.secondary' sx={{ width: '360px' }}>
                      Manage which notifications you&apos;d like to receive. You can turn these off at any time.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid xs={isMobile ? 12 : 7}>
                  <Table sx={{ flex: 1 }}>
                    <TableBody>
                      {getNotificationPreferences(user.preferences).map(([name, value]) => (
                        <TableRow key={name}>
                          <AccountSettingTableCell sx={{ paddingLeft: 0 }}>
                            {renderPrefNameTG(name)}
                          </AccountSettingTableCell>
                          <AccountSettingTableCell align='right'>
                            {renderValueAsInputField(name, value)}
                          </AccountSettingTableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </Paper>

      {/* Email Modal */}
      <Dialog fullWidth maxWidth={isMobile ? '100%' : 'xs'} open={isEmailModalOpen} onClose={handleCloseEmailModal}>
        <DialogTitle sx={{ p: 4, bgcolor: theme.palette.background.paper }}>
          <Typography variant='h6'>Edit email address</Typography>
          <IconButton
            aria-label='close'
            size='large'
            sx={{ position: 'absolute', right: 8, top: 8, color: theme.palette.text.primary }}
            onClick={handleCloseEmailModal}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.background.paper, p: 4 }}>
          <Stack spacing={4}>
            <Divider />
            <TextField
              fullWidth
              InputLabelProps={{ sx: { color: theme.palette.text.secondary } }}
              label='New email address'
              placeholder='Enter new email address'
              value={emailInput}
              variant='outlined'
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <TextField
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    edge='end'
                    sx={{ color: theme.palette.text.secondary }}
                    onClick={() => setShowPassword((show) => !show)}
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                ),
              }}
              label='Password'
              placeholder='Enter password'
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              variant='outlined'
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {user.is_2fa_enabled && (
              <TextField
                fullWidth
                label='2FA Code'
                placeholder='Enter the code'
                value={mfaCodeInput}
                variant='outlined'
                onChange={(e) => setMfaCodeInput(e.target.value)}
              />
            )}
            <Button
              fullWidth
              color='primary'
              disabled={!emailInput || !passwordInput || (user.is_2fa_enabled && !mfaCodeInput) || isUpdatingEmail}
              variant='contained'
              onClick={handleUpdateEmail}
            >
              Confirm
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
