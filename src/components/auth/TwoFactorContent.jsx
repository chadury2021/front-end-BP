import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Stack, useTheme } from '@mui/material';
import Lock from '@mui/icons-material/Lock';
import { verify_login_2FA } from '@/apiServices';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import TwoFactorInput from './TwoFactorInput';

function TwoFactorContent({ data }) {
  const { closeModal, openLoginModal } = useAuthModal();

  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaError, setTwoFaError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTwoFaSubmit = async () => {
    setTwoFaError('');

    // Validate the token
    if (twoFaCode.length !== 6) {
      setTwoFaError('Please enter a complete 6-digit token.');
      return;
    }

    setIsLoading(true);

    try {
      await verify_login_2FA(twoFaCode, data?.username);

      closeModal();
      window.location.reload();
    } catch (err) {
      setTwoFaError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    openLoginModal();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && twoFaCode.length === 6 && !isLoading) {
        handleTwoFaSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [twoFaCode, isLoading]);

  return (
    <>
      <Stack
        alignItems='center'
        alignSelf='flex-start'
        direction='row'
        spacing={1}
        sx={{ cursor: 'pointer', mb: 2, position: 'absolute', top: '20px', left: '20px' }}
        onClick={handleBack}
      >
        <Typography variant='body2'>Back to Login</Typography>
      </Stack>

      <Box
        sx={{
          textAlign: 'center',
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Lock sx={{ fontSize: 40, mb: 2 }} />
        <Typography sx={{ mb: 1 }} variant='h6'>
          Two-Factor Authentication
        </Typography>
        <Typography
          color='text.secondary'
          sx={{
            mt: 1,
          }}
          variant='body2'
        >
          Please enter the 6-digit code from your authenticator app.
        </Typography>
      </Box>

      <Stack alignItems='center' direction='column' spacing={4} sx={{ width: '100%' }}>
        <TwoFactorInput error={twoFaError} onChange={setTwoFaCode} />

        <Button
          color='primary'
          disabled={isLoading}
          sx={{ width: '200px' }}
          variant='contained'
          onClick={handleTwoFaSubmit}
        >
          Verify
        </Button>
      </Stack>
    </>
  );
}

export default TwoFactorContent;
