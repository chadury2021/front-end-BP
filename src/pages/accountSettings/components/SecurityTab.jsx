import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  useTheme,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { resetPassword, setup2FA, verify2FA, reset2FA } from '@/apiServices';
import useViewport from '@/shared/hooks/useViewport';
import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import TwoFactorInput from '@/components/auth/TwoFactorInput';

const TOKEN_POSITIONS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

export default function SecurityTab() {
  const { user, setUser, loadUserMetadata } = useUserMetadata();
  const theme = useTheme();
  const { isMobile } = useViewport();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFAToken, setTwoFAToken] = useState('');
  const [reset2FAToken, setReset2FAToken] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { showAlert } = React.useContext(ErrorContext);
  const inputRefs = useRef([]);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password2FACode, setPassword2FACode] = useState('');
  const navigate = useNavigate();
  const { openLoginModal, updateMessageDetails } = useAuthModal();

  useEffect(() => {
    if (user && user.user_id) {
      setIs2FAEnabled(user.is_2fa_enabled || false);
    }
  }, [user]);

  const handle2FASetup = async () => {
    try {
      const qrCodeCall = await setup2FA();
      setQrCode(qrCodeCall);
      setQrDialogOpen(true);
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to set up 2FA: ${error.message}`,
      });
    }
  };

  const handle2FAVerification = async () => {
    setIs2FALoading(true);
    try {
      const response = await verify2FA(twoFAToken);
      if (response.success) {
        showAlert({
          severity: 'success',
          message: '2FA verified and enabled successfully!',
        });
        setIs2FAEnabled(true);
        loadUserMetadata();
        setQrDialogOpen(false);
      } else {
        showAlert({
          severity: 'error',
          message: response.message || 'Invalid 2FA token. Please try again.',
        });
      }
    } catch (error) {
      showAlert({ severity: 'error', message: 'Failed to verify 2FA' });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handle2FAReset = async () => {
    try {
      const response = await reset2FA(reset2FAToken);
      if (response.message === '2FA has been reset.') {
        setResetDialogOpen(false);
        loadUserMetadata();
        showAlert({ severity: 'success', message: '2FA has been reset.' });
      } else {
        showAlert({
          severity: 'error',
          message: response.message || 'Invalid 2FA token. Please try again.',
        });
      }
    } catch (error) {
      showAlert({ severity: 'error', message: `Failed to reset 2FA` });
    }
  };

  const handlePasswordChangeSubmit = async (event) => {
    event.preventDefault();
    setIsPasswordLoading(true);
    try {
      if (user.is_2fa_enabled) {
        const response = await verify2FA(password2FACode);
        if (!response.success) {
          showAlert({
            severity: 'error',
            message: response.message || 'Invalid 2FA code.',
          });
          setIsPasswordLoading(false);
          return;
        }
      }
      await resetPassword(user.user_id, oldPassword, newPassword, confirmPassword);
      showAlert({
        severity: 'success',
        message: 'Password changed successfully!',
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword2FACode('');
      setPasswordOpen(false);
      navigate('/');
      setUser({});
      if (openLoginModal) {
        openLoginModal();
        updateMessageDetails({
          message: 'Log in again with the new password.',
          severity: 'success',
        });
      }
    } catch (error) {
      showAlert({ severity: 'error', message: `Failed to change password: ${error.message}` });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const dialogStyle = isMobile ? { '& .MuiDialog-paper': { m: 0, width: '100%' } } : {};

  const twoFaInputStyle = {
    textAlign: 'center',
    width: '100%',
    height: '100%',
    padding: 0,
    fontSize: '2rem',
    color: theme.palette.primary.main,
    border: `2px solid ${theme.palette.border.twoFa}`,
    backgroundColor: theme.palette.background.twoFa,
    borderRadius: '8px',
  };

  if (!user || Object.keys(user).length === 0) {
    return null;
  }

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Paper elevation={0} sx={{ px: 4, py: 5 }}>
        <Typography gutterBottom variant='h6'>
          Password
        </Typography>
        <Divider sx={{ mb: 6 }} />
        <Stack alignItems='center' direction='row' justifyContent='space-between' spacing={1}>
          <Box>
            <Typography gutterBottom variant='body1Strong'>
              Account login password
            </Typography>
            <Typography color='text.secondary'>
              Secure your account by managing and updating your login password.
            </Typography>
          </Box>
          <Button variant='outlined' onClick={() => setPasswordOpen(true)}>
            Change
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ px: 4, py: 5 }}>
        <Typography gutterBottom variant='h6'>
          Two-Factor Authentication
        </Typography>
        <Divider sx={{ mb: 6 }} />
        <Stack alignItems='center' direction='row' justifyContent='space-between'>
          <Box>
            <Typography gutterBottom variant='body1Strong'>
              Authenticator app
            </Typography>
            <Typography color='text.secondary'>
              Secure your account by enabling two-factor authentication with an authenticator app.
            </Typography>
          </Box>
          <Button
            variant={is2FAEnabled ? 'outlined' : 'contained'}
            onClick={is2FAEnabled ? () => setResetDialogOpen(true) : handle2FASetup}
          >
            {is2FAEnabled ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </Paper>

      {/* Password Reset Dialog */}
      <Dialog fullWidth maxWidth={isMobile ? '100%' : 'sm'} open={passwordOpen} onClose={() => setPasswordOpen(false)}>
        <DialogTitle sx={{ p: 4, bgcolor: theme.palette.background.paper }}>
          <Typography variant='h6'>Change Password</Typography>
          <IconButton
            aria-label='close'
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setPasswordOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.background.paper, p: 4 }}>
          <form onSubmit={handlePasswordChangeSubmit}>
            <Stack spacing={2} sx={{ pt: 2 }}>
              <TextField
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      aria-label={showOldPassword ? 'Hide password' : 'Show password'}
                      edge='end'
                      tabIndex={-1}
                      onClick={() => setShowOldPassword((show) => !show)}
                    >
                      {showOldPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  ),
                }}
                label='Old Password'
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <TextField
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      edge='end'
                      tabIndex={-1}
                      onClick={() => setShowNewPassword((show) => !show)}
                    >
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  ),
                }}
                label='New Password'
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      edge='end'
                      tabIndex={-1}
                      onClick={() => setShowNewPassword((show) => !show)}
                    >
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  ),
                }}
                label='Confirm Password'
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {user.is_2fa_enabled && (
                <TextField
                  fullWidth
                  label='2FA Code'
                  placeholder='Enter the code'
                  value={password2FACode}
                  onChange={(e) => setPassword2FACode(e.target.value)}
                />
              )}
              <Typography color='textSecondary' variant='body2'>
                To secure your account, your new password must contain at least:
                <ul>
                  <li>8 characters long</li>
                  <li>1 uppercase letter</li>
                  <li>1 lowercase letter</li>
                  <li>1 number</li>
                  <li>1 special character (e.g., !, @, #, $, etc.)</li>
                </ul>
              </Typography>
              <Button
                disabled={isPasswordLoading || (user.is_2fa_enabled && !password2FACode)}
                type='submit'
                variant='contained'
              >
                Confirm
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog
        fullWidth
        maxWidth={isMobile ? '100%' : 'sm'}
        open={qrDialogOpen}
        sx={dialogStyle}
        onClose={() => setQrDialogOpen(false)}
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography variant='h5'>Enable Two-Factor Authentication</Typography>
            <IconButton aria-label='close' sx={{ p: 0 }} onClick={() => setQrDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={4} sx={{ width: '100%', alignItems: 'center', py: 4 }}>
            <img alt='qr code' src={qrCode} />
            <TwoFactorInput onChange={setTwoFAToken} />
            <Button disabled={is2FALoading} sx={{ width: '200px' }} variant='contained' onClick={handle2FAVerification}>
              Enable 2FA
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog
        fullWidth
        maxWidth={isMobile ? '100%' : 'sm'}
        open={resetDialogOpen}
        sx={dialogStyle}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography variant='h5'>Disable Two-Factor Authentication</Typography>
            <IconButton aria-label='close' sx={{ p: 0 }} onClick={() => setResetDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={4} sx={{ alignItems: 'center', py: 4 }}>
            <Typography>Enter the 6-digit code from your authenticator app.</Typography>
            <TwoFactorInput onChange={setReset2FAToken} />
            <Button sx={{ width: '200px' }} variant='contained' onClick={handle2FAReset}>
              Disable 2FA
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
