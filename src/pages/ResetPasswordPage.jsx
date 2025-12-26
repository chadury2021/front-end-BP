import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Stack, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { resetPasswordWithToken } from '@/apiServices';
import { ErrorAlert } from '@/components/auth/Alerts';

function ResetPasswordPage() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (!newPassword || !confirmPassword) {
      setErrors(['Please fill in all fields']);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors(['Passwords do not match']);
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordWithToken({ uidb64, token, new_password: newPassword, confirm_password: confirmPassword });
      setSuccess(true);
    } catch (err) {
      const msg = err?.message || 'Failed to reset password. Please try again.';
      setErrors([msg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
      <Box sx={{ width: 420, maxWidth: '100%', backgroundColor: 'background.paper', p: 4, borderRadius: 2 }}>
        <Typography sx={{ mb: 1 }} variant='h5'>
          Reset Password
        </Typography>
        <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
          Create a new password for your account.
        </Typography>

        <ErrorAlert errors={errors} />

        {!success ? (
          <Box noValidate component='form' onSubmit={onSubmit}>
            <Stack spacing={2}>
              <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
                New Password*
              </Typography>
              <TextField
                fullWidth
                required
                id='new_password'
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label='toggle password visibility'
                        edge='end'
                        size='small'
                        sx={{
                          padding: 0.5,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1rem',
                          },
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                name='new_password'
                size='small'
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
                Confirm Password*
              </Typography>
              <TextField
                fullWidth
                required
                id='confirm_password'
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label='toggle password visibility'
                        edge='end'
                        size='small'
                        sx={{
                          padding: 0.5,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1rem',
                          },
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                name='confirm_password'
                size='small'
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button disabled={isLoading} type='submit' variant='contained'>
                Set New Password
              </Button>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={2}>
            <Typography color='success.main' variant='body2'>
              Your password has been reset successfully.
            </Typography>
            <Button variant='contained' onClick={() => navigate('/')}>
              Return to Login
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default ResetPasswordPage;
