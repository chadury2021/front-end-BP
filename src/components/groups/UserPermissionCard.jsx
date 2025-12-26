import { snakeToTitleCase } from '@/components/groups/constants';
import { titleCase } from '@/util';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import React from 'react';

function UserPermissionCard({ user, isSelected, userPermissions, onToggleSelected, onChangeRole, onTogglePermission }) {
  const hasAtLeastOnePermission = !!(
    userPermissions &&
    userPermissions.permissions &&
    Object.values(userPermissions.permissions).some((v) => !!v)
  );
  let borderColor = 'divider';
  if (isSelected) {
    borderColor = hasAtLeastOnePermission ? 'primary.main' : 'error.main';
  }

  return (
    <Card sx={{ border: isSelected ? 2 : 1, borderColor }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Checkbox checked={isSelected} onChange={(e) => onToggleSelected?.(e.target.checked)} />
          <Box>
            <Typography variant='subtitle1'>{user.username}</Typography>
            <Typography color='text.secondary' variant='body2'>
              {user.email}
            </Typography>
          </Box>
        </Box>

        {isSelected && (
          <Box sx={{ mt: 2, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <FormControl fullWidth size='small' sx={{ mb: 2, mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                fullWidth
                value={userPermissions?.role || 'trader'}
                onChange={(e) => onChangeRole?.(e.target.value)}
              >
                {['trader', 'viewer', 'isolated_trader'].map((role) => (
                  <MenuItem key={role} value={role}>
                    {titleCase(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography color='text.secondary' sx={{ mb: 1 }} variant='body2'>
              Permissions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {Object.entries(userPermissions?.permissions || {}).map(([perm, enabled]) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!enabled}
                      onChange={(e) => {
                        onTogglePermission?.(perm, e.target.checked);
                      }}
                    />
                  }
                  key={perm}
                  label={snakeToTitleCase(perm)}
                  sx={{ mr: 2 }}
                />
              ))}
            </Box>
            {!hasAtLeastOnePermission && (
              <Typography color='error' sx={{ mt: 1 }} variant='body3'>
                Select at least one permission.
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default UserPermissionCard;
