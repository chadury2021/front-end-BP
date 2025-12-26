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
} from '@mui/material';
import { permissionTemplates } from '@/components/groups/constants';
import { titleCase } from '@/util';

function EditMemberDialog({ open, username, memberFormData, onChange, onCancel, onSubmit, groupName }) {
  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={onCancel}>
      <DialogTitle>Edit Member Permissions</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
          Update {username}&apos;s role and permissions in {groupName}.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label='Role'
                value={memberFormData.role}
                onChange={(e) =>
                  onChange({
                    role: e.target.value,
                    permissions: permissionTemplates[e.target.value],
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
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant='contained' onClick={onSubmit}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditMemberDialog;
