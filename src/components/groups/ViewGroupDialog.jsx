import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Divider,
  Alert,
  Grid,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalanceWallet as AccountIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import ExchangeAccountsPanel from '@/components/groups/editPanels/ExchangeAccountsPanel';
import RoleChip from '@/components/groups/RoleChip';
import { ExchangeIcon } from '@/shared/components/Icons';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} id={`tabpanel-${index}`} role='tabpanel' {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ViewGroupDialog({
  open,
  group,
  exchangeAccounts = [],
  readOnly = false,
  onClose,
  onAddMember,
  onEditMember,
  onRemoveMember,
  onAddAccount,
  onRemoveAccount,
  onEditGroupDetails,
}) {
  const [tabValue, setTabValue] = React.useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [pendingAccountId, setPendingAccountId] = React.useState(null);
  const [pendingAccountName, setPendingAccountName] = React.useState('');
  const [isMemberConfirmOpen, setIsMemberConfirmOpen] = React.useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [isSavingDetails, setIsSavingDetails] = React.useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false);
  const [tempSelectedAccounts, setTempSelectedAccounts] = React.useState([]);
  const [pendingMemberUserId, setPendingMemberUserId] = React.useState(null);
  const [pendingMemberName, setPendingMemberName] = React.useState('');
  React.useEffect(() => {
    if (open) setTabValue(0);
  }, [open]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      open={open}
      PaperProps={{ sx: { height: '80vh', display: 'flex', flexDirection: 'column' } }}
      onClose={onClose}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6'>Group Settings</Typography>
          <IconButton aria-label='Close' edge='end' onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ minHeight: '60vh' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label='Members' />
            <Tab label='Exchange Accounts' />
            <Tab label='Group Details' />
          </Tabs>
        </Box>

        <TabPanel index={0} value={tabValue}>
          {group?.memberships && group.memberships.length > 0 ? (
            <Box>
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
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Permission</TableCell>
                      <TableCell>Joined</TableCell>
                      {!readOnly && <TableCell align='right'>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.memberships.map((member) => {
                      const permissions = [];
                      if (member.permissions?.can_trade) permissions.push('Trade');
                      if (member.permissions?.can_view) permissions.push('View');
                      return (
                        <TableRow hover key={member.user_id}>
                          <TableCell>
                            <Box>
                              <Typography variant='subtitle1'>{member.username}</Typography>
                              <Typography color='text.secondary' variant='body2'>
                                {member.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <RoleChip permissions={member.permissions} />
                          </TableCell>
                          <TableCell>
                            <Typography variant='body1'>{permissions.join(', ') || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body1'>{formatDate(member.created_at)}</Typography>
                          </TableCell>
                          {!readOnly && (
                            <TableCell align='right'>
                              <IconButton
                                aria-label='Delete member'
                                size='small'
                                sx={{ color: 'text.secondary', mr: 0.5, '&:hover': { color: 'text.primary' } }}
                                onClick={() => {
                                  setPendingMemberUserId(member.user_id);
                                  setPendingMemberName(member.username || 'this member');
                                  setIsMemberConfirmOpen(true);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                              <IconButton
                                aria-label='Edit member'
                                size='small'
                                sx={{ color: 'primary.main', '&:hover': { color: 'primary.light' } }}
                                onClick={() => onEditMember?.(member)}
                              >
                                <EditIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {!readOnly && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    sx={{
                      color: 'primary.main',
                      borderColor: 'primary.main',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                    variant='outlined'
                    onClick={onAddMember}
                  >
                    Add Member
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Alert severity='info'>No members in this group yet.</Alert>
              {!readOnly && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    sx={{
                      color: 'primary.main',
                      borderColor: 'primary.main',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                    variant='outlined'
                    onClick={onAddMember}
                  >
                    Add Member
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel index={1} value={tabValue}>
          {group?.exchange_credentials && group.exchange_credentials.length > 0 ? (
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
                    <TableCell>Account name</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Exchange</TableCell>
                    {!readOnly && onRemoveAccount && <TableCell align='right'>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.exchange_credentials
                    .map((acctId) => exchangeAccounts.find((a) => a.id === acctId))
                    .filter(Boolean)
                    .map((account) => (
                      <TableRow hover key={account.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ExchangeIcon exchangeName={account.exchange} style={{ height: 24, width: 24 }} />
                            <Typography variant='subtitle2'>{account.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{account.username}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={account.exchange} size='small' variant='outlined' />
                        </TableCell>
                        {!readOnly && onRemoveAccount && (
                          <TableCell align='right'>
                            <IconButton
                              aria-label='Remove account'
                              size='small'
                              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                              onClick={() => {
                                setPendingAccountId(account.id);
                                setPendingAccountName(account.name || 'this account');
                                setIsConfirmOpen(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity='info'>No accounts linked to this group.</Alert>
          )}
          {!readOnly && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                startIcon={<AddIcon />}
                sx={{ color: 'primary.main', borderColor: 'primary.main', '&:hover': { borderColor: 'primary.light' } }}
                variant='outlined'
                onClick={() => {
                  setTempSelectedAccounts([...(group?.exchange_credentials || [])]);
                  setIsAddAccountOpen(true);
                }}
              >
                Add Account
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel index={2} value={tabValue}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                <Typography color='text.secondary' sx={{ minWidth: 120 }} variant='subtitle2'>
                  Group Name
                </Typography>
                <Typography variant='body1'>{group?.name}</Typography>
              </Box>
              {!readOnly && (
                <Button
                  size='small'
                  sx={{
                    color: 'primary.main',
                    borderColor: 'primary.main',
                    '&:hover': { borderColor: 'light' },
                  }}
                  variant='outlined'
                  onClick={() => {
                    setEditName(group?.name || '');
                    setEditDescription(group?.description || '');
                    setIsEditDetailsOpen(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography color='text.secondary' sx={{ minWidth: 120 }} variant='subtitle2'>
                Created At
              </Typography>
              <Typography variant='body1'>{formatDate(group?.created_at)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
              <Typography color='text.secondary' sx={{ minWidth: 120, mt: 0.5 }} variant='subtitle2'>
                Description
              </Typography>
              <Typography
                sx={{
                  flex: 1,
                  maxWidth: '100%',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
                variant='body1'
              >
                {group?.description || '-'}
              </Typography>
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>
      {/* Confirm remove account dialog */}
      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogTitle>{`Remove ${pendingAccountName} from group?`}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} variant='body1'>
            This exchange account will no longer be linked to this group.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 6 }}>
            <Button sx={{ color: 'grey.light' }} onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={() => {
                if (onRemoveAccount && pendingAccountId) {
                  onRemoveAccount(group.id, pendingAccountId);
                }
                setIsConfirmOpen(false);
                setPendingAccountId(null);
              }}
            >
              Remove
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Add Account dialog using ExchangeAccountsPanel layout */}
      <Dialog fullWidth maxWidth='lg' open={isAddAccountOpen} onClose={() => setIsAddAccountOpen(false)}>
        <DialogTitle>Select Exchange Accounts</DialogTitle>
        <DialogContent sx={{ minHeight: '60vh', pb: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ExchangeAccountsPanel
              exchangeAccounts={exchangeAccounts}
              formData={{ selectedAccounts: tempSelectedAccounts }}
              onToggleAccount={(id) => {
                setTempSelectedAccounts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
              }}
            />
            <Box sx={{ height: 56 }} />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.default',
            borderTop: 1,
            borderColor: 'divider',
            px: 3,
            py: 2,
          }}
        >
          <Box sx={{ flex: 1 }} />
          <Button sx={{ color: 'grey.light' }} onClick={() => setIsAddAccountOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={async () => {
              const currentSet = new Set(group?.exchange_credentials || []);
              const selectedSet = new Set(tempSelectedAccounts);
              const toAdd = Array.from(selectedSet).filter((id) => !currentSet.has(id));
              const toRemove = Array.from(currentSet).filter((id) => !selectedSet.has(id));

              if (toAdd.length && typeof onAddAccount === 'function') {
                await Promise.all(toAdd.map((id) => onAddAccount(group.id, id)));
              }
              if (toRemove.length && typeof onRemoveAccount === 'function') {
                await Promise.all(toRemove.map((id) => onRemoveAccount(group.id, id)));
              }
              setIsAddAccountOpen(false);
            }}
          >
            Save Changed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Details dialog */}
      <Dialog fullWidth maxWidth='sm' open={isEditDetailsOpen} onClose={() => setIsEditDetailsOpen(false)}>
        <DialogTitle>Edit Group Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 5 }}>
            <TextField
              fullWidth
              label='Group Name'
              sx={{ mt: 1 }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              label='Description'
              minRows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button onClick={() => setIsEditDetailsOpen(false)}>Cancel</Button>
              <Button
                disabled={isSavingDetails || !editName?.trim()}
                variant='contained'
                onClick={async () => {
                  try {
                    setIsSavingDetails(true);
                    if (typeof onEditGroupDetails === 'function') {
                      await onEditGroupDetails(group.id, {
                        name: editName.trim(),
                        description: editDescription,
                      });
                    }
                    setIsEditDetailsOpen(false);
                  } finally {
                    setIsSavingDetails(false);
                  }
                }}
              >
                {isSavingDetails ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      {/* Confirm remove member dialog */}
      <Dialog open={isMemberConfirmOpen} onClose={() => setIsMemberConfirmOpen(false)}>
        <DialogTitle>{`Remove ${pendingMemberName} from group?`}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} variant='body1'>
            This member will no longer be part of this group.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 6 }}>
            <Button sx={{ color: 'grey.light' }} onClick={() => setIsMemberConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={() => {
                if (onRemoveMember && pendingMemberUserId) {
                  onRemoveMember(group.id, pendingMemberUserId);
                }
                setIsMemberConfirmOpen(false);
                setPendingMemberUserId(null);
              }}
            >
              Remove
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default ViewGroupDialog;
