import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Chip,
  InputAdornment,
  ButtonGroup,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import UserPermissionCard from '@/components/groups/UserPermissionCard';
import { snakeToTitleCase, permissionTemplates, deriveRoleFromPermissions } from '@/components/groups/constants';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

function UsersPermissionsPanel({
  users,
  formData,
  onUpdate,
  onUserSelection,
  onBatchRoleChange,
  onBatchPermissionChange,
}) {
  const [userSearch, setUserSearch] = React.useState('');
  const listRef = React.useRef(null);
  const [batchRole, setBatchRole] = React.useState(null);
  const [batchPermissions, setBatchPermissions] = React.useState(() => ({ ...permissionTemplates.trader }));

  const normalizedQuery = userSearch.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter(
        (u) => u.username.toLowerCase().includes(normalizedQuery) || u.email.toLowerCase().includes(normalizedQuery)
      )
    : users;

  const displayedUsers = filteredUsers;

  const getItemSize = React.useCallback(
    (index) => {
      const user = displayedUsers[index];
      if (!user) return 96;
      const isSelected = formData.selectedUsers?.includes(user.id);
      return isSelected ? 208 : 96;
    },
    [displayedUsers, formData.selectedUsers]
  );

  React.useEffect(() => {
    if (listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [displayedUsers, formData.selectedUsers, formData.userPermissions]);

  const Row = React.useCallback(({ index, style, data }) => {
    const { usersData, formData: dataFormData, onUpdate: dataOnUpdate, onUserSelection: dataOnUserSelection } = data;
    const user = usersData[index];
    return (
      <Box style={style} sx={{ px: 1, boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
        <UserPermissionCard
          isSelected={dataFormData.selectedUsers?.includes(user.id)}
          user={user}
          userPermissions={dataFormData.userPermissions?.[user.id]}
          onChangeRole={(role) => {
            dataOnUpdate({
              userPermissions: {
                ...dataFormData.userPermissions,
                [user.id]: { role, permissions: { ...permissionTemplates[role] } },
              },
            });
          }}
          onTogglePermission={(permission, enabled) => {
            const current = dataFormData.userPermissions?.[user.id]?.permissions || {};
            const updatedPerms = { ...current, [permission]: enabled };
            const updatedRole = deriveRoleFromPermissions(updatedPerms);
            dataOnUpdate({
              userPermissions: {
                ...dataFormData.userPermissions,
                [user.id]: {
                  role: updatedRole,
                  permissions: updatedPerms,
                },
              },
            });
          }}
          onToggleSelected={(selected) => dataOnUserSelection(user.id, selected)}
        />
      </Box>
    );
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h6'>Add Users & Set Permissions</Typography>
        <Chip color='primary' label={`${formData.selectedUsers?.length} users selected`} variant='outlined' />
      </Box>

      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          placeholder='Search users by name or email...'
          size='medium'
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
      </Box>

      {formData.selectedUsers?.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography sx={{ mb: 2 }} variant='subtitle1'>
              Batch Actions
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', mb: 2 }}>
              <ButtonGroup aria-label='batch role actions'>
                <Button
                  color={batchRole === 'trader' ? 'primary' : 'inherit'}
                  size='small'
                  variant={batchRole === 'trader' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setBatchRole('trader');
                    onBatchRoleChange('trader');
                  }}
                >
                  Make All Traders
                </Button>
                <Button
                  color={batchRole === 'viewer' ? 'primary' : 'inherit'}
                  size='small'
                  variant={batchRole === 'viewer' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setBatchRole('viewer');
                    onBatchRoleChange('viewer');
                  }}
                >
                  Make All Viewers
                </Button>
                <Button
                  color={batchRole === 'isolated_trader' ? 'primary' : 'inherit'}
                  size='small'
                  variant={batchRole === 'isolated_trader' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setBatchRole('isolated_trader');
                    onBatchRoleChange('isolated_trader');
                  }}
                >
                  Make All Isolated Traders
                </Button>
              </ButtonGroup>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 240 }}>
                {Object.keys(permissionTemplates.trader).map((permission) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={batchPermissions[permission] || false}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setBatchPermissions((prev) => ({ ...prev, [permission]: newValue }));
                          onBatchPermissionChange(permission, newValue);
                        }}
                      />
                    }
                    key={permission}
                    label={snakeToTitleCase(permission)}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {displayedUsers.length === 0 ? (
        <Typography color='text.secondary' variant='body2'>
          No users found.
        </Typography>
      ) : (
        <Box sx={{ height: 540, mt: 1 }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={displayedUsers.length}
                itemData={{
                  usersData: displayedUsers,
                  formData,
                  onUpdate,
                  onUserSelection,
                }}
                itemSize={getItemSize}
                ref={listRef}
                style={{ scrollbarGutter: 'stable', overflowX: 'hidden' }}
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </Box>
      )}
    </Box>
  );
}

export default UsersPermissionsPanel;
