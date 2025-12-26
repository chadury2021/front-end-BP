import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

function GroupListTable({ title = 'Trading Groups', groups = [], onOpenEdit, onDelete }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuGroupId, setMenuGroupId] = React.useState(null);

  const handleMenuClick = (event, groupId) => {
    setAnchorEl(event.currentTarget);
    setMenuGroupId(groupId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuGroupId(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const selectedGroup = groups.find((g) => g.id === menuGroupId);

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant='h6'>
          {title} ({groups.length})
        </Typography>
        <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
          Overview of all trading groups and their member status
        </Typography>

        <TableContainer component={Paper} variant='outlined'>
          <Table
            sx={{
              '& td, & th': {
                borderBottom: (theme) => `1px solid ${theme.palette.common.transparent}`,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Group Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Accounts</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow hover key={group.id}>
                  <TableCell>
                    <Typography fontWeight='medium' variant='subtitle2'>
                      {group.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 300 }} variant='body1'>
                      {group.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon color='action' fontSize='small' />
                      <Typography variant='body1'>
                        {Array.isArray(group.memberships) ? group.memberships.length : 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant='body1'>{group.exchange_credentials.length}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body1'>{formatDate(group.created_at)}</Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <IconButton size='small' onClick={(e) => handleMenuClick(e, group.id)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              if (selectedGroup && onOpenEdit) onOpenEdit(selectedGroup);
              handleMenuClose();
            }}
          >
            <EditIcon fontSize='small' sx={{ mr: 1 }} />
            Edit Group
          </MenuItem>
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              if (menuGroupId && onDelete) onDelete(menuGroupId);
              handleMenuClose();
            }}
          >
            <DeleteIcon fontSize='small' sx={{ mr: 1 }} />
            Delete Group
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}

export default GroupListTable;
