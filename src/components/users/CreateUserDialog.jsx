import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAdminPanelData } from '@/shared/context/AdminPanelDataProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';

export default function CreateUserDialog({ open, onClose }) {
  const { user: currentUser } = useUserMetadata();
  const { createUser, reload } = useAdminPanelData();
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    is_staff: false,
    is_superuser: false,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (open) setFormData({ username: '', email: '', password: '', is_staff: false, is_superuser: false });
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.username?.trim() || !formData.password?.trim()) return;
    setIsSubmitting(true);
    try {
      await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        is_staff: formData.is_staff,
        is_superuser: formData.is_superuser,
      });
      await reload();
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={onClose}>
      <DialogTitle>Add New User</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
          Create a new user. You can assign them to trading groups later.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label='Username'
              placeholder='Enter username'
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      aria-label='toggle password visibility'
                      edge='end'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              label='Password'
              placeholder='Enter password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Email Address'
              placeholder='Enter email address'
              type='email'
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_staff}
                  onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                />
              }
              label='Staff'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_superuser}
                  disabled={!currentUser?.is_superuser}
                  onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                />
              }
              label='Superuser'
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!formData.username?.trim() || !formData.password?.trim() || isSubmitting}
          variant='contained'
          onClick={handleSubmit}
        >
          Add User
        </Button>
      </DialogActions>
    </Dialog>
  );
}
