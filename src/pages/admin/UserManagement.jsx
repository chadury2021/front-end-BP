import React, { useContext, useState, useEffect, useRef } from 'react';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Groups as GroupsIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  LinkOff as UnlinkIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { deriveRoleFromPermissions, permissionTemplates, getRoleColor } from '@/components/groups/constants';
import RoleChip from '@/components/groups/RoleChip';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import { useAdminPanelData } from '@/shared/context/AdminPanelDataProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { titleCase } from '@/util';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';

export function UserManagement() {
  const { showAlert } = useContext(ErrorContext);
  const { user: currentUser } = useUserMetadata();
  const { users, groups, createUser, reload, editUser, addOrUpdateMember, removeMember, isLoading, deleteUser } =
    useAdminPanelData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [groupQuery, setGroupQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [assignFormData, setAssignFormData] = useState({
    group_id: null,
    role: 'trader',
    permissions: { ...permissionTemplates.trader },
  });

  // Confirmation for unlinking a group membership
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [pendingUnlinkGroup, setPendingUnlinkGroup] = useState({ id: null, name: '' });

  // Confirmation for deleting a user
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState({ id: null, username: '' });

  const getBadgeLabelForRole = (role) => (role && typeof role === 'string' ? role[0].toUpperCase() : '');

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.memberships.some((membership) => membership.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => new Date(b.joined_at || 0) - new Date(a.joined_at || 0));

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      is_staff: selectedUser?.is_staff || false,
      is_superuser: selectedUser?.is_superuser || false,
    });
  };

  const resetAssignForm = () => {
    setAssignFormData({
      group_id: null,
      role: 'trader',
      permissions: { ...permissionTemplates.trader },
    });
  };

  // Keep selectedUser in sync with latest users after add/remove membership
  useEffect(() => {
    if (selectedUser) {
      const updated = users.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  }, [users]);

  const handleEditUser = async (user) => {
    if (!selectedUser) return;

    // Only superusers can make other users superusers
    if (!currentUser?.is_superuser && formData.is_superuser && !selectedUser.is_superuser) {
      showAlert({ message: 'Only superusers can grant superuser status', severity: 'error' });
      return;
    }

    const changes = Object.entries(formData)
      .filter(([key, value]) => value !== selectedUser[key])
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    try {
      await editUser({ user_id: user.id, changes });
    } catch (error) {
      showAlert({ message: error.message, severity: 'error' });
      return;
    }
    await reload();
    resetForm();
    setSelectedUser(null);
    setIsEditDialogOpen(false);
  };

  const handleAssignToGroup = async () => {
    if (!selectedUser || !assignFormData.group_id) return;

    const selectedGroup = groups.find((g) => g.id === assignFormData.group_id);
    if (!selectedGroup) return;

    const existingMembership = selectedUser.memberships.find((m) => m.group_id === assignFormData.group_id);

    if (existingMembership) {
      showAlert({ message: 'User is already a member of this group', severity: 'warning' });
      return;
    }

    try {
      await addOrUpdateMember({
        groupId: assignFormData.group_id,
        userId: selectedUser.id,
        permissions: assignFormData.permissions,
      });
    } catch (error) {
      showAlert({ message: error.message, severity: 'error' });
      return;
    }
    resetAssignForm();
    setIsAssignDialogOpen(false);
  };

  const handleRemoveFromGroup = async (userId, groupId) => {
    try {
      await removeMember({ groupId, userId });
    } catch (error) {
      showAlert({ message: error.message, severity: 'error' });
      return;
    }
    // Keep Manage Group Memberships dialog open and refresh the user data
    const updated = (users || []).find((u) => u.id === (selectedUser?.id || userId));
    if (updated) setSelectedUser(updated);
    resetAssignForm();
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser({ userId });
    } catch (error) {
      showAlert({ message: error.message, severity: 'error' });
      return;
    }
    setIsDeleteConfirmOpen(false);
    setPendingDeleteUser({ id: null, username: '' });
  };

  const openDeleteConfirmDialog = (user) => {
    setPendingDeleteUser({ id: user.id, username: user.username });
    setIsDeleteConfirmOpen(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      is_staff: !!user.is_staff,
      is_superuser: !!user.is_superuser,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = React.useCallback((user) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  }, []);

  const openAssignDialog = (user) => {
    setSelectedUser(user);
    resetAssignForm();
    setIsAssignDialogOpen(true);
  };

  // Clear group search when dialog closes
  useEffect(() => {
    if (!isAssignDialogOpen) setGroupQuery('');
  }, [isAssignDialogOpen]);

  const handleMenuClick = React.useCallback((event, userId) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  }, []);

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Virtualized static row sizing
  const getItemSize = React.useCallback(() => 60, []);

  const Row = React.useCallback(
    ({ index, style, data }) => {
      const user = data.users[index];
      if (!user) return null;
      return (
        <Box
          style={style}
          sx={{
            alignItems: 'center',
            display: 'grid',
            gridTemplateColumns: 'minmax(180px,1fr) 200px 140px 140px 140px 120px',
            gap: 2,
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography fontWeight='medium' variant='subtitle2'>
                {user.username}
              </Typography>
              <Typography color='text.secondary' variant='body2'>
                {user.email}
              </Typography>
            </Box>
          </Box>
          {/* Group Memberships */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 300 }}>
            {(user.memberships || []).slice(0, 2).map((membership) => {
              let role;
              try {
                role = deriveRoleFromPermissions(membership.permissions || {});
              } catch (e) {
                role = null;
              }
              const isCustomRole = role === 'custom';
              return (
                <Box
                  key={membership.group_id}
                  sx={{ display: 'inline-flex', overflow: 'visible', position: 'relative' }}
                >
                  <Chip
                    color={role ? getRoleColor(role) : 'default'}
                    label={
                      <Box
                        sx={{
                          alignItems: 'center',
                          display: 'flex',
                          gap: 0.5,
                          overflow: 'visible',
                          position: 'relative',
                        }}
                      >
                        <Typography variant='body1'>{membership.group_name}</Typography>
                      </Box>
                    }
                    size='small'
                    sx={{ overflow: 'visible', minWidth: 50 }}
                    variant='outlined'
                  />
                  <Badge
                    anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                    badgeContent={role ? getBadgeLabelForRole(role) : ''}
                    color={role ? getRoleColor(role) : 'default'}
                    overlap='rectangular'
                    sx={{
                      '& .MuiBadge-badge': {
                        height: 16,
                        minWidth: 16,
                        right: -6,
                        top: -6,
                        transform: 'none',
                        fontSize: '0.65rem',
                        zIndex: 1,
                      },
                    }}
                  >
                    <span />
                  </Badge>
                </Box>
              );
            })}
            {(user.memberships || []).length > 2 && (
              <Chip
                label={`+${(user.memberships || []).length - 2} more`}
                size='small'
                sx={{ cursor: 'pointer' }}
                variant='outlined'
                onClick={() => openViewDialog(user)}
              />
            )}
          </Box>
          {/* Total Groups */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupsIcon color='action' fontSize='small' />
            <Typography variant='body1'>{(user.memberships || []).length}</Typography>
          </Box>
          {/* Joined */}
          <Typography variant='body1'>{formatDate(user.joined_at)}</Typography>
          {/* Last Login */}
          {user.last_login ? (
            <Box>
              <Typography variant='body1'>{formatDate(user.last_login)}</Typography>
              <Typography color='text.secondary' variant='body2'>
                {formatTime(user.last_login)}
              </Typography>
            </Box>
          ) : (
            <Typography variant='body1'>Never</Typography>
          )}
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton size='small' onClick={(e) => handleMenuClick(e, user.id)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      );
    },
    [handleMenuClick, openViewDialog]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography gutterBottom component='h1' variant='h4'>
            User Management
          </Typography>
          <Typography color='text.secondary' variant='body1'>
            Manage users and their multiple trading group memberships with granular permissions
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant='contained' onClick={() => setIsCreateDialogOpen(true)}>
          Add User
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          placeholder='Search users by name, email, or group...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      <Card>
        <CardContent>
          <Typography gutterBottom variant='h6'>
            Users ({filteredUsers.length})
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
            Overview of all users and their group memberships with permissions
          </Typography>

          {isLoading ? (
            <Stack spacing={1.5}>
              {[...Array(8)].map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton animation='wave' height={56} key={`user-skeleton-${idx}`} variant='rounded' />
              ))}
            </Stack>
          ) : (
            <Paper variant='outlined'>
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px,1fr) 200px 140px 140px 140px 120px',
                  gap: 2,
                  px: 2,
                  py: 1,
                  mr: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
              >
                <Typography variant='body2'>User</Typography>
                <Typography variant='body2'>Group Memberships</Typography>
                <Typography variant='body2'>Total Groups</Typography>
                <Typography variant='body2'>Joined</Typography>
                <Typography variant='body2'>Last Login</Typography>
                <Typography align='center' variant='body2'>
                  Actions
                </Typography>
              </Box>
              <Box sx={{ height: 540, mt: 1 }}>
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      height={height}
                      itemCount={sortedUsers.length}
                      itemData={{ users: sortedUsers }}
                      itemSize={getItemSize}
                      style={{ scrollbarGutter: 'stable', overflowX: 'hidden' }}
                      width={width}
                    >
                      {Row}
                    </List>
                  )}
                </AutoSizer>
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            const user = users.find((u) => u.id === menuUserId);
            if (user) openViewDialog(user);
            handleMenuClose();
          }}
        >
          <SettingsIcon fontSize='small' sx={{ mr: 1 }} />
          Manage Group Memberships
        </MenuItem>
        <MenuItem
          onClick={() => {
            const user = users.find((u) => u.id === menuUserId);
            if (user) openEditDialog(user);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize='small' sx={{ mr: 1 }} />
          Edit User
        </MenuItem>

        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            const user = users.find((u) => u.id === menuUserId);
            if (user) openDeleteConfirmDialog(user);
            handleMenuClose();
          }}
        >
          <DeleteIcon fontSize='small' sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      <Dialog fullWidth maxWidth='lg' open={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>{`Manage Group Memberships (${selectedUser?.memberships.length || 0})`}</Typography>
            <IconButton aria-label='Close' edge='end' onClick={() => setIsViewDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser?.memberships && selectedUser.memberships.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <TableContainer sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <Table
                  size='medium'
                  sx={{
                    '& td, & th': {
                      borderBottom: (theme) => `1px solid ${theme.palette.common.transparent}`,
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Group</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Permission</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align='right'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedUser.memberships.map((membership) => {
                      const permissions = [];
                      if (membership.permissions?.can_trade) permissions.push('Trade');
                      if (membership.permissions?.can_view) permissions.push('View');
                      return (
                        <TableRow hover key={membership.group_id}>
                          <TableCell>
                            <Typography variant='subtitle2'>{membership.group_name}</Typography>
                          </TableCell>
                          <TableCell>
                            <RoleChip permissions={membership.permissions} />
                          </TableCell>
                          <TableCell>
                            <Typography variant='body1'>{permissions.join(', ') || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body1'>{formatDate(membership.joined_at)}</Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <IconButton
                              size='small'
                              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                              onClick={() => {
                                setPendingUnlinkGroup({ id: membership.group_id, name: membership.group_name });
                                setIsUnlinkConfirmOpen(true);
                              }}
                            >
                              <UnlinkIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  variant='outlined'
                  onClick={() => {
                    if (selectedUser) openAssignDialog(selectedUser);
                  }}
                >
                  Add to Group
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Alert severity='info' sx={{ mt: 2 }}>
                This user is not a member of any trading groups yet.
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  variant='outlined'
                  onClick={() => {
                    if (selectedUser) openAssignDialog(selectedUser);
                  }}
                >
                  Add to Group
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {/* Confirm unlink membership dialog */}
      <Dialog fullWidth maxWidth='xs' open={isUnlinkConfirmOpen} onClose={() => setIsUnlinkConfirmOpen(false)}>
        <DialogTitle>{`Remove ${pendingUnlinkGroup.name || 'this group'} from user?`}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} variant='body1'>
            This user will no longer be a member of this trading group.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 6 }}>
            <Button sx={{ color: 'grey.light' }} onClick={() => setIsUnlinkConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={() => {
                if (selectedUser && pendingUnlinkGroup.id) {
                  handleRemoveFromGroup(selectedUser.id, pendingUnlinkGroup.id);
                }
                setIsUnlinkConfirmOpen(false);
                setPendingUnlinkGroup({ id: null, name: '' });
              }}
            >
              Remove
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Confirm delete user dialog */}
      <Dialog fullWidth maxWidth='xs' open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <DialogTitle>{`Remove ${pendingDeleteUser.username || 'this user'}?`}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} variant='body1'>
            This user will be permanently deleted. This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 6 }}>
            <Button sx={{ color: 'grey.light' }} onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={() => {
                if (pendingDeleteUser.id) {
                  handleDeleteUser(pendingDeleteUser.id);
                }
              }}
            >
              Remove
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <CreateUserDialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />

      <Dialog fullWidth maxWidth='sm' open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
            Update user information. Group memberships are managed separately.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Username'
                placeholder='Enter username'
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
              <TextField disabled fullWidth label='Current Password' value='••••••••' />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label='toggle password visibility'
                        edge='end'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                label='New Password'
                placeholder='Enter new password or leave blank to keep current'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!formData.is_staff}
                    onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                  />
                }
                label='Staff'
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!formData.is_superuser}
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
          <Button
            onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant='contained' onClick={() => handleEditUser(selectedUser)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth='sm' open={isAssignDialogOpen} onClose={() => setIsAssignDialogOpen(false)}>
        <DialogTitle>Add User to Trading Group</DialogTitle>
        <DialogContent>
          <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
            Add {selectedUser?.username} to a trading group with specific role and permissions.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography gutterBottom variant='subtitle2'>
                User
              </Typography>
              <Paper sx={{ p: 2 }} variant='outlined'>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography fontWeight='medium' variant='subtitle2'>
                      {selectedUser?.username}
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      {selectedUser?.email}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trading Group</InputLabel>
                <Select
                  label='Trading Group'
                  MenuProps={{
                    PaperProps: {
                      sx: { mt: 1, maxHeight: 300, overflow: 'auto' },
                    },
                    anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
                    transformOrigin: { horizontal: 'left', vertical: 'top' },
                    disablePortal: false,
                  }}
                  value={assignFormData.group_id || ''}
                  onChange={(e) =>
                    setAssignFormData({ ...assignFormData, group_id: e.target.value ? e.target.value : null })
                  }
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
                      value={groupQuery}
                      onBlur={(e) => e.stopPropagation()}
                      onChange={(e) => setGroupQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                      }}
                      onKeyUp={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                    />
                  </Box>
                  {(() => {
                    const normalized = groupQuery.trim().toLowerCase();
                    const existingIds = selectedUser?.memberships.map((m) => m.group_id) || [];
                    const available = groups.filter((g) => !existingIds.includes(g.id));
                    const filtered = normalized
                      ? available.filter((g) => g.name.toLowerCase().includes(normalized))
                      : available;
                    return filtered.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label='Role'
                  value={deriveRoleFromPermissions(assignFormData.permissions)}
                  onChange={(e) =>
                    setAssignFormData({
                      ...assignFormData,
                      permissions: { ...permissionTemplates[e.target.value] },
                    })
                  }
                >
                  {Object.keys(permissionTemplates).map((role) => (
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.keys(permissionTemplates.trader).map((permKey) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!assignFormData.permissions[permKey]}
                        onChange={(e) =>
                          setAssignFormData({
                            ...assignFormData,
                            permissions: {
                              ...assignFormData.permissions,
                              [permKey]: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    key={permKey}
                    label={permKey.replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase())}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAssignDialogOpen(false);
              resetAssignForm();
            }}
          >
            Cancel
          </Button>
          <Button disabled={!assignFormData.group_id} variant='contained' onClick={handleAssignToGroup}>
            Add to Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
