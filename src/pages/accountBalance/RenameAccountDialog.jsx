import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { renameAccount } from '@/apiServices';

export default function RenameAccountDialog({ open, onClose, account, onSuccess }) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open && account) {
      setNewName(account.name || '');
      setError('');
    }
  }, [open, account]);

  const handleSubmit = async () => {
    if (!newName.trim()) {
      setError('Account name cannot be empty');
      return;
    }

    if (newName.trim() === account.name) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await renameAccount({
        account_id: account.accountId,
        new_name: newName.trim(),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to rename account');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewName('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
      <DialogTitle>Rename Account</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            Enter a new name for your account &ldquo;{account?.name}&rdquo;.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            disabled={loading}
            error={!!error}
            helperText={error}
            label="Account Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={handleClose}>
          Cancel
        </Button>
        <Button
          disabled={loading || !newName.trim() || newName.trim() === account?.name}
          variant="contained"
          onClick={handleSubmit}
        >
          {loading ? 'Renaming...' : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}