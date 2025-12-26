import CreateEditGroupDialog from '@/components/groups/CreateEditGroupDialog';
import ViewGroupDialog from '@/components/groups/ViewGroupDialog';
import { permissionTemplates } from '@/components/groups/constants';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import { useAdminPanelData } from '@/shared/context/AdminPanelDataProvider';
import { useToast } from '@/shared/context/ToastProvider';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  ReceiptLong as ReceiptLongIcon,
  People as PeopleIcon,
  Groups as GroupsIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, CardHeader, Grid, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

export default function Dashboard() {
  const theme = useTheme();
  const { groups, users, accounts, openOrders, createGroup, reload } = useAdminPanelData();
  const { showToastMessage } = useToast();
  const stats = [
    { name: 'Open Orders', value: openOrders?.length ?? 0, icon: ReceiptLongIcon },
    { name: 'Total Users', value: users?.length ?? 0, icon: PeopleIcon },
    { name: 'Trading Groups', value: groups?.length ?? 0, icon: GroupsIcon },
    { name: 'Accounts', value: accounts?.length ?? 0, icon: AccountBalanceWalletIcon },
  ];

  const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = React.useState(false);
  const [isViewGroupOpen, setIsViewGroupOpen] = React.useState(false);
  const [selectedGroupForView, setSelectedGroupForView] = React.useState(null);
  const [groupForm, setGroupForm] = React.useState({
    name: '',
    description: '',
    status: 'active',
    selectedAccounts: [],
    selectedUsers: [],
    userPermissions: {},
  });
  const [groupsPage, setGroupsPage] = React.useState(1);
  const groupsPerPage = 10;
  const [usersPage, setUsersPage] = React.useState(1);
  const usersPerPage = 10;
  return (
    <>
      <Stack spacing={4}>
        <Grid container spacing={3}>
          {stats.map((stat) => {
            const IconComp = stat.icon;
            return (
              <Grid item key={stat.name} lg={3} sm={6} xs={12}>
                <Card>
                  <CardHeader
                    action={<IconComp />}
                    subheaderTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                    sx={{ pb: 0.5 }}
                    title={
                      <Typography color='text.secondary' sx={{ fontWeight: 500 }} variant='subtitle2'>
                        {stat.name}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ pt: 0.5 }}>
                    <Typography sx={{ ...theme.typography.h2 }}>{stat.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          <Grid item lg={6} xs={12}>
            <Card>
              <CardHeader
                action={
                  <Button size='small' startIcon={<AddIcon />} onClick={() => setIsCreateGroupOpen(true)}>
                    New Group
                  </Button>
                }
                subheader={
                  <Typography color='text.secondary'>Overview of your trading groups and their status</Typography>
                }
                title={<Typography variant='h6'>Recent Trading Groups</Typography>}
              />
              <CardContent>
                <Stack spacing={4}>
                  {(() => {
                    const sorted = [...(groups || [])].sort(
                      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
                    );
                    const total = sorted.length;
                    const maxPage = Math.max(1, Math.ceil(total / groupsPerPage));
                    const clampedPage = Math.min(groupsPage, maxPage);
                    const start = (clampedPage - 1) * groupsPerPage;
                    const end = Math.min(start + groupsPerPage, total);
                    const pageItems = sorted.slice(start, end);
                    return pageItems.map((group) => {
                      const memberCount = Array.isArray(group.memberships) ? group.memberships.length : 0;
                      const accountCount = Array.isArray(group.exchange_credentials)
                        ? group.exchange_credentials.length
                        : 0;
                      const exchangesCount = accountCount; // fallback approximation
                      const addedDate = group.created_at ? new Date(group.created_at) : null;
                      const addedLabel = addedDate
                        ? addedDate.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-';
                      return (
                        <Box
                          key={group.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Stack spacing={1}>
                            <Typography sx={{ ...theme.typography.h6Strong }}>{group.name}</Typography>
                            <Typography color='text.secondary' sx={{ ...theme.typography.body1 }}>
                              Added: {addedLabel}
                            </Typography>
                            <Typography color='text.secondary' sx={{ ...theme.typography.body1 }}>
                              {memberCount} Members • {accountCount} Accounts • {exchangesCount} Exchanges
                            </Typography>
                          </Stack>
                          <Stack alignItems='flex-start' direction='row' spacing={1}>
                            <IconButton
                              aria-label='view group'
                              size='small'
                              onClick={() => {
                                setSelectedGroupForView(group);
                                setIsViewGroupOpen(true);
                              }}
                            >
                              <VisibilityIcon fontSize='small' />
                            </IconButton>
                          </Stack>
                        </Box>
                      );
                    });
                  })()}
                  <Box alignItems='center' display='flex' justifyContent='flex-end'>
                    {(() => {
                      const total = (groups || []).length;
                      const maxPage = Math.max(1, Math.ceil(total / groupsPerPage));
                      const clampedPage = Math.min(groupsPage, maxPage);
                      const start = total === 0 ? 0 : (clampedPage - 1) * groupsPerPage + 1;
                      const end = Math.min(clampedPage * groupsPerPage, total);
                      return (
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <Typography color='text.secondary'>
                            {start}–{end} of {total}
                          </Typography>
                          <IconButton
                            aria-label='Previous page'
                            disabled={clampedPage <= 1}
                            size='small'
                            onClick={() => setGroupsPage((p) => Math.max(1, p - 1))}
                          >
                            <ChevronLeftIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            aria-label='Next page'
                            disabled={clampedPage >= maxPage}
                            size='small'
                            onClick={() => setGroupsPage((p) => Math.min(maxPage, p + 1))}
                          >
                            <ChevronRightIcon fontSize='small' />
                          </IconButton>
                        </Stack>
                      );
                    })()}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item lg={6} xs={12}>
            <Card>
              <CardHeader
                action={
                  <Button size='small' startIcon={<AddIcon />} onClick={() => setIsCreateUserOpen(true)}>
                    Add User
                  </Button>
                }
                subheader={<Typography color='text.secondary'>Latest user assignments and permissions</Typography>}
                title={<Typography variant='h6'>Recent Users</Typography>}
              />
              <CardContent>
                <Stack spacing={2}>
                  {(() => {
                    const sortedUsers = [...(users || [])].sort(
                      (a, b) => new Date(b.joined_at || 0) - new Date(a.joined_at || 0)
                    );
                    const totalUsers = sortedUsers.length;
                    const maxUserPage = Math.max(1, Math.ceil(totalUsers / usersPerPage));
                    const clampedUsersPage = Math.min(usersPage, maxUserPage);
                    const startIdx = (clampedUsersPage - 1) * usersPerPage;
                    const endIdx = Math.min(startIdx + usersPerPage, totalUsers);
                    const pageUsers = sortedUsers.slice(startIdx, endIdx);
                    return pageUsers.map((user) => {
                      const memberships = Array.isArray(user.memberships) ? user.memberships : [];
                      const topMemberships = memberships.slice(0, 3);
                      const extraCount = Math.max(0, memberships.length - topMemberships.length);
                      return (
                        <Box
                          key={user.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                ...theme.typography.h6Strong,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                whiteSpace: 'normal',
                              }}
                            >
                              {user.username}
                            </Typography>
                            <Typography color='text.secondary' sx={{ ...theme.typography.body1 }}>
                              {user.email}
                            </Typography>
                            {(() => {
                              const roles = [];
                              if (user.is_staff) roles.push('Staff');
                              if (user.is_superuser) roles.push('Superuser');
                              if (roles.length === 0) return null;
                              return (
                                <Stack alignItems='center' direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                                  <Typography color='text.secondary' sx={{ ...theme.typography.subtitle2 }}>
                                    Roles:
                                  </Typography>
                                  <Typography sx={{ ...theme.typography.body1 }}>{roles.join(', ')}</Typography>
                                </Stack>
                              );
                            })()}
                            {memberships.length > 0 && (
                              <Stack alignItems='center' direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                                <Typography color='text.secondary' sx={{ ...theme.typography.subtitle2 }}>
                                  Groups:
                                </Typography>
                                {topMemberships.map((m) => (
                                  <Box
                                    key={`${user.id}-${m.group_id}`}
                                    sx={{
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: 999,
                                      backgroundColor: 'primary.dark',
                                      color: 'primary.main',
                                    }}
                                  >
                                    <Typography sx={{ ...theme.typography.body2 }}>{m.group_name}</Typography>
                                  </Box>
                                ))}
                                {extraCount > 0 && (
                                  <Box
                                    sx={{
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: 999,
                                      backgroundColor: 'grey.dark',
                                      color: 'text.secondary',
                                    }}
                                  >
                                    <Typography sx={{ ...theme.typography.body2 }}>{`+${extraCount} more`}</Typography>
                                  </Box>
                                )}
                              </Stack>
                            )}
                          </Stack>
                          {/* right-side container removed; roles now appear inline under email */}
                        </Box>
                      );
                    });
                  })()}
                  <Box alignItems='center' display='flex' justifyContent='flex-end'>
                    {(() => {
                      const total = (users || []).length;
                      const maxPage = Math.max(1, Math.ceil(total / usersPerPage));
                      const clampedPage = Math.min(usersPage, maxPage);
                      const start = total === 0 ? 0 : (clampedPage - 1) * usersPerPage + 1;
                      const end = Math.min(clampedPage * usersPerPage, total);
                      return (
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <Typography color='text.secondary'>
                            {start}–{end} of {total}
                          </Typography>
                          <IconButton
                            aria-label='Previous page'
                            disabled={clampedPage <= 1}
                            size='small'
                            onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                          >
                            <ChevronLeftIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            aria-label='Next page'
                            disabled={clampedPage >= maxPage}
                            size='small'
                            onClick={() => setUsersPage((p) => Math.min(maxPage, p + 1))}
                          >
                            <ChevronRightIcon fontSize='small' />
                          </IconButton>
                        </Stack>
                      );
                    })()}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
      <CreateEditGroupDialog
        exchangeAccounts={accounts}
        formData={groupForm}
        mode='create'
        open={isCreateGroupOpen}
        permissionTemplates={permissionTemplates}
        users={users}
        onCancel={() => {
          setIsCreateGroupOpen(false);
          setGroupForm({
            name: '',
            description: '',
            status: 'active',
            selectedAccounts: [],
            selectedUsers: [],
            userPermissions: {},
          });
        }}
        onChange={(updated) => setGroupForm(updated)}
        onSubmit={async () => {
          const accountIds = groupForm.selectedAccounts || [];
          const initialMembers = (groupForm.selectedUsers || []).map((userId) => {
            const perms = groupForm.userPermissions?.[userId]?.permissions || permissionTemplates.trader;
            return { user: userId, permissions: perms };
          });
          try {
            await createGroup({
              name: groupForm.name,
              description: groupForm.description,
              accountIds,
              initialMembers,
            });
            await reload();
            setIsCreateGroupOpen(false);
            setGroupForm({
              name: '',
              description: '',
              status: 'active',
              selectedAccounts: [],
              selectedUsers: [],
              userPermissions: {},
            });
          } catch (error) {
            showToastMessage({
              message: error?.message || 'Failed to create trading group',
              anchor: 'bottom-middle',
              type: 'error',
            });
          }
        }}
      />
      <CreateUserDialog open={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} />
      <ViewGroupDialog
        readOnly
        exchangeAccounts={accounts}
        group={selectedGroupForView}
        open={isViewGroupOpen}
        onClose={() => setIsViewGroupOpen(false)}
      />
    </>
  );
}
