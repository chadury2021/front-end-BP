import React, { useState, useCallback, useEffect } from 'react';
import { Box, TextField, Button, Typography, InputAdornment, IconButton, FormHelperText, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LOGOS from '@/../images/logos';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import ReCAPTCHA from 'react-google-recaptcha';
import { signup } from '@/apiServices';
import { ErrorAlert } from './Alerts';

function PasswordStrengthIndicator({ passwordStrength }) {
  const requirements = [
    { key: 'hasLength', label: 'At least 8 characters', met: passwordStrength.hasLength },
    { key: 'hasUppercase', label: '1 uppercase letter', met: passwordStrength.hasUppercase },
    { key: 'hasLowercase', label: '1 lowercase letter', met: passwordStrength.hasLowercase },
    { key: 'hasNumber', label: '1 number', met: passwordStrength.hasNumber },
    { key: 'hasSpecial', label: '1 special character', met: passwordStrength.hasSpecial },
  ];

  return (
    <FormHelperText sx={{ mb: 2, color: 'text.secondary', fontSize: '0.65rem' }}>
      Password requirements:
      <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
        {requirements.map((req) => (
          <li
            key={req.key}
            style={{
              color: req.met ? 'primary' : 'inherit',
              textDecoration: req.met ? 'line-through' : 'none',
            }}
          >
            {req.label}
          </li>
        ))}
      </ul>
    </FormHelperText>
  );
}

function SignUpContent({ captchaKey }) {
  const theme = useTheme();
  const { openLoginModal, closeModal, updateMessageDetails, modalData } = useAuthModal();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [emailValidationTimeout, setEmailValidationTimeout] = useState(null);

  // Get referral code from localStorage or modalData
  const getReferralCode = () => {
    return localStorage.getItem('referralCode') || (modalData && modalData.referralCode) || '';
  };

  const debouncedEmailValidation = useCallback(
    (email) => {
      if (emailValidationTimeout) {
        clearTimeout(emailValidationTimeout);
      }

      const timeout = setTimeout(() => {
        if (email && !/\S+@\S+\.\S+/.test(email)) {
          setFieldErrors((prev) => ({
            ...prev,
            email: 'Email is invalid',
          }));
        } else if (email) {
          setFieldErrors((prev) => ({
            ...prev,
            email: null,
          }));
        }
      }, 500);

      setEmailValidationTimeout(timeout);
    },
    [emailValidationTimeout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailValidationTimeout) {
        clearTimeout(emailValidationTimeout);
      }
    };
  }, [emailValidationTimeout]);

  const validateField = (fieldName, value) => {
    const validationErrors = {};

    switch (fieldName) {
      case 'username':
        if (!value) validationErrors.username = 'Username is required';
        break;
      case 'email':
        if (!value) {
          validationErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          validationErrors.email = 'Email is invalid';
        }
        break;
      case 'password':
        // Password validation is handled by real-time strength indicator
        // No error state needed since we show requirements visually
        break;
      case 'confirmPassword':
        if (formData.password && value !== formData.password) {
          validationErrors.confirmPassword = 'Passwords do not match';
        }
        break;
      default:
        break;
    }

    return validationErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Update password strength in real-time
    if (name === 'password') {
      setPasswordStrength({
        hasLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }

    // Debounced email validation
    if (name === 'email') {
      debouncedEmailValidation(value);
    }
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    const fieldValidationErrors = validateField(name, value);

    setFieldErrors((prev) => ({
      ...prev,
      ...fieldValidationErrors,
    }));
  };

  const validateForm = () => {
    const newErrors = [];

    // Basic validation
    if (!formData.username) newErrors.push('Username is required');
    if (!formData.email) newErrors.push('Email is required');
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.push('Email is invalid');

    // Password validation
    if (!formData.password) {
      newErrors.push('Password is required');
    } else {
      const hasLength = formData.password.length >= 8;
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasLowercase = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

      if (!hasLength) newErrors.push('Password must be at least 8 characters long');
      if (!hasUppercase) newErrors.push('Password must contain at least 1 uppercase letter');
      if (!hasLowercase) newErrors.push('Password must contain at least 1 lowercase letter');
      if (!hasNumber) newErrors.push('Password must contain at least 1 number');
      if (!hasSpecial) newErrors.push('Password must contain at least 1 special character');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    if (captchaKey && !captchaVerified) {
      newErrors.push('Please complete the captcha verification');
    }

    return newErrors;
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      return false;
    }

    // Check email format
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return false;
    }

    // Check password requirements
    const hasLength = formData.password.length >= 8;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

    if (!hasLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      return false;
    }

    // Check CAPTCHA if required
    if (captchaKey && !captchaVerified) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsLoading(true);

    try {
      const referralCode = getReferralCode();
      const result = await signup({ ...formData, referralCode });
      if (result.created) {
        // Clear referral code from localStorage after successful signup
        localStorage.removeItem('referralCode');
        updateMessageDetails({ messages: [result.message], messageType: 'success' });
        closeModal();
        openLoginModal();
      } else {
        setErrors([result.error]);
      }
    } catch (err) {
      setErrors([err.message || 'An error occurred during signup']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaVerify = () => {
    setCaptchaVerified(true);
  };

  return (
    <Box sx={{ paddingX: 10, boxSizing: 'border-box' }}>
      <Box
        sx={{
          textAlign: 'center',
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box alt='Logo' component='img' src={LOGOS.treadDark} sx={{ height: 50, mb: 2 }} />
        <Typography
          color='text.secondary'
          sx={{
            fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
            mt: 1,
          }}
          variant='body2'
        >
          Fill in your details to get started.
        </Typography>
      </Box>

      <ErrorAlert errors={errors} />

      <Box noValidate component='form' sx={{ width: '100%' }} onSubmit={handleSubmit}>
        <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
          Username*
        </Typography>
        <TextField
          fullWidth
          required
          FormHelperTextProps={{
            sx: { color: fieldErrors.username ? 'error.main' : 'text.secondary' },
          }}
          helperText={fieldErrors.username}
          id='username'
          name='username'
          size='small'
          sx={{ mb: 2 }}
          value={formData.username}
          variant='outlined'
          onBlur={handleFieldBlur}
          onChange={handleInputChange}
        />

        <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
          Email*
        </Typography>
        <TextField
          fullWidth
          required
          FormHelperTextProps={{
            sx: { color: fieldErrors.email ? 'error.main' : 'text.secondary' },
          }}
          helperText={fieldErrors.email}
          id='email'
          name='email'
          size='small'
          sx={{ mb: 2 }}
          type='email'
          value={formData.email}
          variant='outlined'
          onBlur={handleFieldBlur}
          onChange={handleInputChange}
        />

        <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
          Password*
        </Typography>
        <TextField
          fullWidth
          required
          id='password'
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
          name='password'
          size='small'
          sx={{ mb: 2 }}
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          variant='outlined'
          onChange={handleInputChange}
        />

        <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
          Confirm Password*
        </Typography>
        <TextField
          fullWidth
          required
          FormHelperTextProps={{
            sx: { color: fieldErrors.confirmPassword ? 'error.main' : 'text.secondary' },
          }}
          helperText={fieldErrors.confirmPassword}
          id='confirmPassword'
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  aria-label='toggle confirm password visibility'
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
          name='confirmPassword'
          size='small'
          sx={{ mb: 1 }}
          type={showPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          variant='outlined'
          onBlur={handleFieldBlur}
          onChange={handleInputChange}
        />

        <PasswordStrengthIndicator passwordStrength={passwordStrength} />

        {captchaKey && (
          <>
            <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'>
              Captcha*
            </Typography>
            <Box
              sx={{
                mb: 3,
                boxSizing: 'border-box',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <ReCAPTCHA sitekey={captchaKey} onChange={handleCaptchaVerify} />
            </Box>
          </>
        )}
        <Button
          fullWidth
          color='primary'
          disabled={isLoading || !isFormValid()}
          sx={{
            py: 1.2,
            mb: 2,
          }}
          type='submit'
          variant='contained'
        >
          Sign Up
        </Button>
        <Stack alignItems='center' direction='row' justifyContent='center' textAlign='center'>
          <Typography color='text.secondary' variant='body2'>
            Already have an account?{' '}
          </Typography>
          <Button
            onClick={(e) => {
              e.preventDefault();
              openLoginModal();
            }}
          >
            <Typography color='primary' sx={{ textDecoration: 'underline' }} variant='body2'>
              Login
            </Typography>
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default SignUpContent;
