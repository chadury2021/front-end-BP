import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  InputAdornment,
  ListSubheader,
  Box,
  FormHelperText,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { permissionTemplates, deriveRoleFromPermissions } from '@/components/groups/constants';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { useToast } from '@/shared/context/ToastProvider';
import { titleCase } from '@/util';

function AddMemberDialog({
  open,
  groupName,
  users = [],
  memberFormData,
  onChange,
  onCancel,
  onSubmit,
  existingMemberIds = [],
}) {
  const [userQuery, setUserQuery] = React.useState('');

  // Clear search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setUserQuery('');
    }
  }, [open]);

  const normalized = userQuery.trim().toLowerCase();
  const filteredUsers = normalized
    ? users.filter((u) => u.username.toLowerCase().includes(normalized) || u.email.toLowerCase().includes(normalized))
    : users;
  const isDuplicate =
    !!memberFormData.user_id && existingMemberIds.map((id) => Number(id)).includes(Number(memberFormData.user_id));
  const hasAtLeastOnePermission = Object.values(memberFormData?.permissions || {}).some((v) => !!v);

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={onCancel}>
      <DialogTitle>Add Member to {groupName}</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
          Add a user to this trading group with specific permissions.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth error={isDuplicate}>
              <InputLabel>Select User</InputLabel>
              <Select
                label='Select User'
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1,
                      maxHeight: 300,
                      overflow: 'auto',
                    },
                  },
                  anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
                  transformOrigin: { horizontal: 'left', vertical: 'top' },
                  disablePortal: false,
                }}
                value={memberFormData.user_id || ''}
                onChange={(e) => onChange({ user_id: Number(e.target.value) || null })}
              >
                <Box
                  sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
                  onClick={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseUp={(e) => e.preventDefault()}
                >
                  <TextField
                    autoFocus
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    placeholder='Search'
                    value={userQuery}
                    onBlur={(e) => e.stopPropagation()}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      // Prevent Select from intercepting keystrokes and closing dropdown
                      e.stopPropagation();
                    }}
                    onKeyUp={(e) => {
                      // Also prevent on keyup to ensure dropdown stays open
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  />
                </Box>
                {filteredUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </MenuItem>
                ))}
              </Select>
              {isDuplicate && <FormHelperText>This member is already in the group.</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label='Role'
                value={deriveRoleFromPermissions(memberFormData.permissions)}
                onChange={(e) => onChange({ permissions: permissionTemplates[e.target.value] })}
              >
                {['trader', 'viewer', 'isolated_trader'].map((role) => (
                  <MenuItem key={role} value={role}>
                    {titleCase(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom variant='subtitle2'>
              Permissions
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={memberFormData.permissions.can_trade}
                    onChange={(e) =>
                      onChange({ permissions: { ...memberFormData.permissions, can_trade: e.target.checked } })
                    }
                  />
                }
                label='Can Trade'
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={memberFormData.permissions.can_view}
                    onChange={(e) =>
                      onChange({ permissions: { ...memberFormData.permissions, can_view: e.target.checked } })
                    }
                  />
                }
                label='Can View All Orders'
              />
            </FormGroup>
            {!hasAtLeastOnePermission && (
              <FormHelperText error sx={{ mt: 1 }}>
                Select at least one permission.
              </FormHelperText>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          disabled={!memberFormData.user_id || isDuplicate || !hasAtLeastOnePermission}
          variant='contained'
          onClick={onSubmit}
        >
          Add Member
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddMemberDialog;
