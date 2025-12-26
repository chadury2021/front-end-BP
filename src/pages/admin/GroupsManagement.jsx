import AddMemberDialog from '@/components/groups/AddMemberDialog';
import { deriveRoleFromPermissions, permissionTemplates } from '@/components/groups/constants';
import CreateEditGroupDialog from '@/components/groups/CreateEditGroupDialog';
import EditMemberDialog from '@/components/groups/EditMemberDialog';
import GroupListTable from '@/components/groups/GroupListTable';
import ViewGroupDialog from '@/components/groups/ViewGroupDialog';
import { useAdminPanelData } from '@/shared/context/AdminPanelDataProvider';
import { useToast } from '@/shared/context/ToastProvider';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { React, useEffect, useState } from 'react';

const toSnakePermissions = (perms = {}) => ({
  can_trade: !!(perms?.can_trade ?? perms?.canTrade),
  can_view: !!(perms?.can_view ?? perms?.canView),
});

export function GroupsManagement() {
  const {
    groups,
    users,
    accounts,
    createGroup,
    patchGroup,
    removeGroup,
    addOrUpdateMember,
    setMemberPermissions,
    removeMember,
    attachCredentials,
    detachCredentials,
    reload,
    isLoading,
  } = useAdminPanelData();
  const { showToastMessage } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Edit now uses the View layout; no separate edit dialog state needed
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedAccounts: [],
    selectedUsers: [],
    userPermissions: {},
  });

  const [memberFormData, setMemberFormData] = useState({
    user_id: null,
    username: '',
    role: 'trader',
    permissions: { ...permissionTemplates.trader },
  });

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedGroups = [...filteredGroups].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      selectedAccounts: [],
      selectedUsers: [],
      userPermissions: {},
    });
  };

  const resetMemberForm = () => {
    setMemberFormData({
      user_id: null,
      username: '',
      role: 'trader',
      permissions: { ...permissionTemplates.trader },
    });
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !memberFormData.user_id) return;
    try {
      await addOrUpdateMember({
        groupId: selectedGroup.id,
        userId: memberFormData.user_id,
        permissions: toSnakePermissions(memberFormData.permissions),
      });
      resetMemberForm();
      setIsAddMemberDialogOpen(false);
      // Keep the Group Settings dialog visible
    } catch (error) {
      showToastMessage({
        message: error?.message || 'Failed to add member to this group',
        anchor: 'bottom-middle',
        type: 'error',
      });
    }
  };

  const handleEditMember = async () => {
    if (!selectedGroup || !selectedMember) return;
    try {
      await setMemberPermissions({
        groupId: selectedGroup.id,
        userId: selectedMember.user_id,
        permissions: toSnakePermissions(memberFormData.permissions),
      });
      resetMemberForm();
      setSelectedMember(null);
      setIsEditMemberDialogOpen(false);
    } catch (error) {
      showToastMessage({
        message: error?.message || 'Failed to update member permissions',
        anchor: 'bottom-middle',
        type: 'error',
      });
    }
  };

  const handleRemoveMember = async (groupId, userId) => {
    try {
      await removeMember({ groupId, userId });
      await reload();
      resetMemberForm();
      setSelectedMember(null);
    } catch (error) {
      showToastMessage({
        message: error?.message || 'Failed to remove member from this group',
        anchor: 'bottom-middle',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      const updated = groups.find((g) => g.id === selectedGroup.id);
      if (updated) setSelectedGroup(updated);
    }

    if (selectedMember) {
      const updated = users.find((u) => u.id === selectedMember.user_id);
      if (updated) setSelectedMember(updated);
    }
  }, [groups, users]);

  const openEditMemberDialog = (member) => {
    setSelectedMember(member);
    setMemberFormData({
      user_id: member.user_id,
      username: member.username,
      role: deriveRoleFromPermissions(member.permissions),
      permissions: { ...member.permissions },
    });
    setIsEditMemberDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    const accountIds = formData.selectedAccounts || [];
    const initialMembers = (formData.selectedUsers || []).map((userId) => {
      const perms = formData.userPermissions?.[userId]?.permissions || permissionTemplates.trader;
      return { user: userId, permissions: toSnakePermissions(perms) };
    });

    try {
      await createGroup({
        name: formData.name,
        description: formData.description,
        accountIds,
        initialMembers,
      });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      showToastMessage({
        message: error?.message || 'Failed to create trading group',
        anchor: 'bottom-middle',
        type: 'error',
      });
    }
  };

  // Previous stepper-based edit flow removed in favor of View layout

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState(null);

  const handleDeleteGroup = async (groupId) => {
    const g = groups.find((gr) => gr.id === groupId);
    setPendingDeleteGroup(g || { id: groupId, name: '' });
    setIsDeleteConfirmOpen(true);
  };

  const handleRemoveAccountFromGroup = async (groupId, accountId) => {
    await detachCredentials(groupId, [accountId]);
  };

  const handleAddAccountToGroup = async (groupId, accountId) => {
    await attachCredentials(groupId, [accountId]);
    await reload();
  };

  const handleEditGroupDetails = async (groupId, { name, description }) => {
    await patchGroup(groupId, { name, description });
    await reload();
  };

  const openEditDialog = (group) => {
    // Use the ViewGroupDialog layout for editing
    setSelectedGroup(group);
    setIsViewDialogOpen(true);
  };

  // View action removed from menu; edit opens the view-style dialog

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography gutterBottom component='h1' variant='h4'>
            Trading Groups
          </Typography>
          <Typography color='text.secondary' variant='body1'>
            Manage trading groups and user memberships with granular permissions
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant='contained' onClick={() => setIsCreateDialogOpen(true)}>
          Create Group
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
          placeholder='Search groups by name or description...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {isLoading ? (
        <Card>
          <CardContent>
            <Typography gutterBottom variant='h6'>
              Trading Groups
            </Typography>
            <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
              Loading groups…
            </Typography>
            <Stack spacing={1.5}>
              {[...Array(6)].map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton animation='wave' height={56} key={`group-skeleton-${idx}`} variant='rounded' />
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <GroupListTable
          groups={sortedGroups}
          onDelete={(groupId) => handleDeleteGroup(groupId)}
          onOpenEdit={(group) => openEditDialog(group)}
        />
      )}

      <ViewGroupDialog
        exchangeAccounts={accounts}
        group={selectedGroup}
        open={isViewDialogOpen}
        onAddAccount={handleAddAccountToGroup}
        onAddMember={() => {
          setIsAddMemberDialogOpen(true);
        }}
        onClose={() => setIsViewDialogOpen(false)}
        onEditGroupDetails={handleEditGroupDetails}
        onEditMember={(member) => openEditMemberDialog(member)}
        onRemoveAccount={handleRemoveAccountFromGroup}
        onRemoveMember={(groupId, userId) => handleRemoveMember(groupId, userId)}
      />

      <AddMemberDialog
        existingMemberIds={(selectedGroup?.memberships || []).map((m) => m.user_id)}
        groupName={selectedGroup?.name}
        memberFormData={memberFormData}
        open={isAddMemberDialogOpen}
        users={users}
        onCancel={() => {
          setIsAddMemberDialogOpen(false);
          resetMemberForm();
        }}
        onChange={(partial) => setMemberFormData({ ...memberFormData, ...partial })}
        onSubmit={handleAddMember}
      />

      <EditMemberDialog
        groupName={selectedGroup?.name}
        memberFormData={memberFormData}
        open={isEditMemberDialogOpen}
        userId={selectedMember?.user_id}
        username={selectedMember?.username}
        onCancel={() => {
          setIsEditMemberDialogOpen(false);
          resetMemberForm();
          setSelectedMember(null);
        }}
        onChange={(partial) => setMemberFormData({ ...memberFormData, ...partial })}
        onSubmit={handleEditMember}
      />

      <CreateEditGroupDialog
        exchangeAccounts={accounts}
        formData={formData}
        mode='create'
        open={isCreateDialogOpen}
        users={users}
        onCancel={() => {
          resetForm();
          setIsCreateDialogOpen(false);
        }}
        onChange={(updated) => setFormData(updated)}
        onSubmit={handleCreateGroup}
      />

      {/* Delete group confirmation */}
      <Dialog fullWidth maxWidth='xs' open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <DialogTitle>{`Remove ${pendingDeleteGroup?.name || 'this group'}?`}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} variant='body2'>
            This group will be permanently deleted. This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button sx={{ color: 'grey.light' }} onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={async () => {
                await removeGroup(pendingDeleteGroup?.id);
                setIsDeleteConfirmOpen(false);
                setPendingDeleteGroup(null);
              }}
            >
              Remove
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit dialog removed; edit now uses ViewGroupDialog */}
    </Box>
  );
}
