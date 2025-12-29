import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Select,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import signupGraphic from '@images/login/signup.png';
import forgotPasswordGraphic from '@images/login/forgotpassword.png';
import { useAuthModal, MODAL_TYPES } from '@/shared/context/AuthModalProvider';
import { useThemeContext } from '@/theme/ThemeContext';
import { getLoginImageForTheme } from '@/shared/assets/loginImages';
import LoginContent from './LoginContent';
import SignUpContent from './SignUpContent';
import ForgotPasswordContent from './ForgotPasswordContent';
import TwoFactorContent from './TwoFactorContent';
/**
 * A single authentication modal that can display different content based on the modalType.
 */
function AuthModal({ captchaKey }) {
  const { modalType, modalData, closeModal } = useAuthModal();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentTheme, setTheme } = useThemeContext();
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);

  // Theme name mapping for display
  const getThemeDisplayName = (themeValue) => {
    const themeNames = {
      dark: 'Dark',
      og: 'OG',
      blue: 'Blue',
      hyperliquid: 'Hyperliquid',
      binance: 'Binance',
      bybit: 'Bybit',
      deribit: 'Deribit',
      gate: 'Gate',
      aster: 'Aster',
      bip01: 'Bip01',
    };
    return themeNames[themeValue] || themeValue;
  };

  // Reset loading state when theme has actually changed
  useEffect(() => {
    if (pendingTheme && currentTheme === pendingTheme) {
      // Minimum delay to show loading state and ensure theme is fully applied
      const timer = setTimeout(() => {
        setIsChangingTheme(false);
        setPendingTheme(null);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentTheme, pendingTheme]);

  // Determine if the modal is open
  const isOpen = modalType !== MODAL_TYPES.NONE;

  // Get the appropriate image source based on the modal type
  const getModalImage = () => {
    switch (modalType) {
      case MODAL_TYPES.LOGIN:
      case MODAL_TYPES.TWO_FACTOR:
        return getLoginImageForTheme(currentTheme);
      case MODAL_TYPES.SIGNUP:
        return signupGraphic;
      case MODAL_TYPES.FORGOT_PASSWORD:
        return forgotPasswordGraphic;
      default:
        return getLoginImageForTheme(currentTheme);
    }
  };

  // Get the appropriate image alt text based on the modal type
  const getImageAlt = () => {
    switch (modalType) {
      case MODAL_TYPES.LOGIN:
        return 'Login illustration';
      case MODAL_TYPES.SIGNUP:
        return 'Signup illustration';
      case MODAL_TYPES.FORGOT_PASSWORD:
        return 'Forgot password illustration';
      case MODAL_TYPES.TWO_FACTOR:
        return 'Two-factor authentication';
      default:
        return 'Authentication';
    }
  };

  const renderThemeSelector = (positionSx) => (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 2,
        ...positionSx,
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 1.5,
          boxShadow: 3,
          p: 0.5,
        }}
      >
        <Select
          disabled={isChangingTheme}
          MenuProps={{
            anchorOrigin: { vertical: 'top', horizontal: 'right' },
            transformOrigin: { vertical: 'bottom', horizontal: 'right' },
          }}
          renderValue={(value) => {
            if (isChangingTheme) {
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                </Box>
              );
            }
            return getThemeDisplayName(value);
          }}
          size='small'
          sx={{
            minWidth: 80,
            height: 36,
            borderRadius: 1,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'grey.500',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
            '& .MuiSelect-select': {
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
            },
          }}
          value={currentTheme}
          variant='outlined'
          onChange={(e) => {
            const newTheme = e.target.value;
            // Only show loading if theme is actually changing
            if (newTheme !== currentTheme) {
              setIsChangingTheme(true);
              setPendingTheme(newTheme);
              setTheme(newTheme);
            }
          }}
        >
          {/* Keep order as per design reference */}
          <MenuItem value='bitfrostPrime'>Bitfrost Prime</MenuItem>
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
      </Box>
    </Box>
  );

  // Render the appropriate content based on the modal type
  const renderContent = () => {
    switch (modalType) {
      case MODAL_TYPES.LOGIN:
        return <LoginContent />;
      case MODAL_TYPES.SIGNUP:
        return <SignUpContent captchaKey={captchaKey} />;
      case MODAL_TYPES.FORGOT_PASSWORD:
        return <ForgotPasswordContent />;
      case MODAL_TYPES.TWO_FACTOR:
        return <TwoFactorContent data={modalData} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth='lg'
      open={isOpen}
      PaperProps={{
        sx: {
          borderRadius: '8px',
          overflow: 'hidden',
          m: { xs: 2, sm: 4 },
          maxHeight: '90vh',
          height: { xs: 'auto', md: '800px' },
          width: '80%',
          boxSizing: 'border-box',
        },
      }}
      onClose={closeModal}
    >
      <IconButton
        aria-label='close'
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'grey.500',
          zIndex: 1,
        }}
        onClick={closeModal}
      >
        <Close />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Left panel with image - hide on mobile */}
          {!isMobile && (
            <Box
              sx={{
                flex: '1 0 60%',
                display: { xs: 'none', md: 'block' },
                position: 'relative',
              }}
            >
              <img
                alt={getImageAlt()}
                src={getModalImage()}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* {renderThemeSelector({ */}
              {/*   right: { md: 20 }, */}
              {/*   bottom: { md: 16 }, */}
              {/* })} */}
            </Box>
          )}

          {/* Right panel with content */}
          <Box
            sx={{
              flex: { xs: '1 0 100%', md: '1 0 40%' },
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: { xs: 3, sm: 4, md: 5 },
              position: 'relative',
              boxSizing: 'border-box',
              overflow: 'auto',
              height: '100%',
              width: '100%',
            }}
          >
            {renderContent()}
            {/* {isMobile && */}
            {/*   renderThemeSelector({ */}
            {/*     right: 16, */}
            {/*     bottom: 12, */}
            {/*   })} */}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
