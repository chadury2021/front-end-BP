import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Stack, Link } from '@mui/material';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import { ArrowBackIos, LockReset } from '@mui/icons-material';
import { forgotPassword } from '@/apiServices';
import { ErrorAlert } from './Alerts';

function ForgotPasswordContent() {
  const { openLoginModal } = useAuthModal();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    if (!email) {
      setErrors(['Please enter your email address']);
      return;
    }

    if (!validateEmail(email)) {
      setErrors(['Please enter a valid email address']);
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.error) {
        setErrors([result.error]);
      } else {
        setIsSubmitted(true);
        setSuccessMessage('Reset link sent! Please check your email inbox.');
      }
    } catch (err) {
      setErrors([err.message || 'An error occurred. Please try again later.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    openLoginModal();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingX: 10,
        boxSizing: 'border-box',
      }}
    >
      <Stack
        alignItems='center'
        alignSelf='flex-start'
        direction='row'
        spacing={1}
        sx={{ cursor: 'pointer', mb: 2 }}
        onClick={handleBack}
      >
        <ArrowBackIos sx={{ fontSize: '12px' }} />
        <Typography variant='body2'>Back</Typography>
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
        <Box
          sx={{
            height: 50,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LockReset sx={{ fontSize: 40 }} />
        </Box>
        <Typography sx={{ mb: 1 }} variant='h5'>
          Reset Your Password
        </Typography>
        <Typography
          color={isSubmitted ? 'success.main' : 'text.secondary'}
          sx={{
            mt: 1,
            maxWidth: '400px',
          }}
          variant='body2'
        >
          {isSubmitted
            ? 'A password reset link has been sent to your email. The link will expire in 30 minutes.'
            : "Enter your email address and we'll send you a link to reset your password."}
        </Typography>
      </Box>

      <ErrorAlert errors={errors} />

      {!isSubmitted ? (
        <Box noValidate component='form' sx={{ width: '100%' }} onSubmit={handleSubmit}>
          <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
            Email Address
          </Typography>
          <TextField
            fullWidth
            required
            id='email'
            name='email'
            size='small'
            sx={{ mb: 3 }}
            type='email'
            value={email}
            variant='outlined'
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            fullWidth
            color='primary'
            disabled={isLoading}
            sx={{
              py: 1.2,
              mb: 2,
            }}
            type='submit'
            variant='contained'
          >
            Reset My Password
          </Button>
        </Box>
      ) : (
        <Box sx={{ width: '100%', mt: 2 }}>
          <Button
            fullWidth
            color='primary'
            sx={{
              py: 1.2,
              mb: 2,
            }}
            variant='contained'
            onClick={handleBack}
          >
            Return to Login
          </Button>
        </Box>
      )}

      <Typography color='text.secondary' variant='body2'>
        Having trouble? <Link href='mailto:support@tread.fi'>Contact Support</Link>
      </Typography>
    </Box>
  );
}

export default ForgotPasswordContent;
