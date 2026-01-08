import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LOGOS from '@/../images/logos';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import WalletSelector from '@/shared/components/WalletSelector';
import { useWalletAuth } from '@/pages/login/walletAuth';
import { ErrorAlert, SuccessAlert } from './Alerts';

function LoginContent() {
  const theme = useTheme();
  const { messageDetails } = useAuthModal();
  const { signInWithWallet, walletAuthError } = useWalletAuth();
  const [openWalletSelector, setOpenWalletSelector] = useState(false);
  const [isWalletLoggingIn, setIsWalletLoggingIn] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleClose = () => {
    setOpenWalletSelector(false);
  };

  const handleWalletLogin = async (wallet) => {
    setErrors([]);
    setIsWalletLoggingIn(true);
    handleClose();

    let isAuthed = false;
    try {
      isAuthed = await signInWithWallet(wallet);
    } catch (error) {
      setErrors([error.message || 'Failed to connect wallet']);
      setIsWalletLoggingIn(false);
      return;
    }

    if (isAuthed) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (walletAuthError) {
      setErrors([walletAuthError]);
      setIsWalletLoggingIn(false);
    }
  };

  return (
    <>
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
            Log in to access the trading console.
          </Typography>
        </Box>

        <Box noValidate component='form' sx={{ width: '100%' }}>
          <ErrorAlert errors={errors} />

          {messageDetails.messageType === 'success' && <SuccessAlert messages={messageDetails.messages} />}
          {messageDetails.messageType === 'error' && <ErrorAlert errors={messageDetails.messages} />}

          {/* <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'> */}
          {/*   Username */}
          {/* </Typography> */}
          {/* <TextField */}
          {/*   fullWidth */}
          {/*   required */}
          {/*   autoComplete='username' */}
          {/*   id='username' */}
          {/*   name='username' */}
          {/*   size='small' */}
          {/*   sx={{ mb: 2 }} */}
          {/*   value={formData.username} */}
          {/*   variant='outlined' */}
          {/*   onChange={handleInputChange} */}
          {/* /> */}
          
          {/* <Typography sx={{ mb: 1, fontWeight: 500 }} variant='body2'> */}
          {/*   Password */}
          {/* </Typography> */}
          {/* <TextField */}
          {/*   fullWidth */}
          {/*   required */}
          {/*   autoComplete='current-password' */}
          {/*   id='password' */}
          {/*   InputProps={{ */}
          {/*     endAdornment: ( */}
          {/*       <InputAdornment position='end'> */}
          {/*         <IconButton */}
          {/*           aria-label='toggle password visibility' */}
          {/*           edge='end' */}
          {/*           size='small' */}
          {/*           sx={{ */}
          {/*             padding: 0.5, */}
          {/*             '& .MuiSvgIcon-root': { */}
          {/*               fontSize: '1rem', */}
          {/*             }, */}
          {/*           }} */}
          {/*           onClick={() => setShowPassword(!showPassword)} */}
          {/*         > */}
          {/*           {showPassword ? <Visibility /> : <VisibilityOff />} */}
          {/*         </IconButton> */}
          {/*       </InputAdornment> */}
          {/*     ), */}
          {/*   }} */}
          {/*   name='password' */}
          {/*   size='small' */}
          {/*   sx={{ mb: 1 }} */}
          {/*   type={showPassword ? 'text' : 'password'} */}
          {/*   value={formData.password} */}
          {/*   variant='outlined' */}
          {/*   onChange={handleInputChange} */}
          {/* /> */}

          {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 1 }}> */}
          {/*   <FormControlLabel */}
          {/*     control={ */}
          {/*       <Checkbox */}
          {/*         checked={formData.rememberMe} */}
          {/*         color='primary' */}
          {/*         name='rememberMe' */}
          {/*         size='small' */}
          {/*         onChange={handleInputChange} */}
          {/*       /> */}
          {/*     } */}
          {/*     label={<Typography variant='body2'>Remember me</Typography>} */}
          {/*   /> */}
          {/*   <Button */}
          {/*     color='primary' */}
          {/*     sx={{ */}
          {/*       paddingX: 1, */}
          {/*     }} */}
          {/*     variant='small' */}
          {/*     onClick={(e) => { */}
          {/*       e.preventDefault(); */}
          {/*       openForgotPasswordModal(); */}
          {/*     }} */}
          {/*   > */}
          {/*     <Typography variant='body2'>Forgot your password?</Typography> */}
          {/*   </Button> */}
          {/* </Box> */}
          
          {/* <Button */}
          {/*   fullWidth */}
          {/*   color='primary' */}
          {/*   disabled={isLoading} */}
          {/*   sx={{ */}
          {/*     py: 1.2, */}
          {/*     mb: 2, */}
          {/*   }} */}
          {/*   type='submit' */}
          {/*   variant='contained' */}
          {/* > */}
          {/*   Login */}
          {/* </Button> */}
          
          {/* <Divider sx={{ my: 2 }}> */}
          {/*   <Typography color='text.secondary' variant='body2'> */}
          {/*     or */}
          {/*   </Typography> */}
          {/* </Divider> */}

          <Button
            fullWidth
            color='primary'
            disabled={isWalletLoggingIn}
            variant='outlined'
            onClick={() => setOpenWalletSelector(true)}
          >
            {isWalletLoggingIn ? <CircularProgress size={20} /> : 'Login with Wallet'}
          </Button>

          {/* <Stack alignItems='center' direction='row' justifyContent='center' spacing={1}> */}
          {/*   <Typography color='text.secondary' variant='body2'> */}
          {/*     Don&apos;t have an account? */}
          {/*   </Typography> */}
          {/*   <Button */}
          {/*     onClick={(e) => { */}
          {/*       e.preventDefault(); */}
          {/*       openSignupModal(); */}
          {/*     }} */}
          {/*   > */}
          {/*     <Typography color='primary' sx={{ textDecoration: 'underline' }} variant='body2'> */}
          {/*       Sign Up */}
          {/*     </Typography> */}
          {/*   </Button> */}
          {/* </Stack> */}
        </Box>
      </Box>
      <Dialog fullWidth maxWidth='sm' open={openWalletSelector} onClose={handleClose}>
        <DialogContent>
          <WalletSelector onConnect={handleWalletLogin} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default LoginContent;
