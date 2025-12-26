import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Typography,
  useTheme,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  ApiError,
  createExchangeIntegration,
  updateExchangeIntegration,
  deleteExchangeIntegration,
} from '@/apiServices';

function ExchangeIntegrationAdminForm({ exchangeIntegrations, onRefresh, showAlert }) {
  const theme = useTheme();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    logo_url: '',
    integration_bonus: '',
    fee_rebates: '',
    title: '',
    others: '',
  });
  const [errors, setErrors] = useState({});

  const handleOpenCreateDialog = () => {
    setFormData({
      description: '',
      logo_url: '',
      integration_bonus: '',
      fee_rebates: '',
      title: '',
      others: '',
    });
    setErrors({});
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setFormData({
      description: '',
      logo_url: '',
      integration_bonus: '',
      fee_rebates: '',
      title: '',
      others: '',
    });
    setErrors({});
  };

  const handleOpenEditDialog = (integration) => {
    setSelectedIntegration(integration);
    const rawOthers = integration.others;
    let othersText = '';
    let title = '';
    if (rawOthers && typeof rawOthers === 'object') {
      if (rawOthers.text) {
        othersText = String(rawOthers.text);
      }
      if (rawOthers.title) {
        title = String(rawOthers.title);
      }
    } else if (typeof rawOthers === 'string') {
      othersText = rawOthers;
    } else if (rawOthers) {
      othersText = JSON.stringify(rawOthers);
    }
    setFormData({
      description: integration.description || '',
      logo_url: integration.logo_url || '',
      integration_bonus: integration.integration_bonus ? String(integration.integration_bonus) : '',
      fee_rebates: integration.fee_rebates ? String(integration.fee_rebates) : '',
      title,
      others: othersText,
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedIntegration(null);
    setFormData({
      description: '',
      logo_url: '',
      integration_bonus: '',
      fee_rebates: '',
      title: '',
      others: '',
    });
    setErrors({});
  };

  const handleOpenDeleteDialog = (integration) => {
    setSelectedIntegration(integration);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedIntegration(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        description: formData.description.trim(),
      };
      if (formData.logo_url && formData.logo_url.trim() !== '') {
        payload.logo_url = formData.logo_url.trim();
      }
      if (formData.integration_bonus && formData.integration_bonus.trim() !== '') {
        payload.integration_bonus = formData.integration_bonus.trim();
      }
      if (formData.fee_rebates && formData.fee_rebates.trim() !== '') {
        payload.fee_rebates = formData.fee_rebates.trim();
      }
      if ((formData.title && formData.title.trim() !== '') || (formData.others && formData.others.trim() !== '')) {
        payload.others = {};
        if (formData.title && formData.title.trim() !== '') {
          payload.others.title = formData.title.trim();
        }
        if (formData.others && formData.others.trim() !== '') {
          payload.others.text = formData.others.trim();
        }
      }

      await createExchangeIntegration(payload);
      showAlert({
        severity: 'success',
        message: 'Exchange integration created successfully',
      });
      handleCloseCreateDialog();
      onRefresh();
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to create exchange integration';
      showAlert({
        severity: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedIntegration || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {};
      if (formData.description.trim() !== '') {
        payload.description = formData.description.trim();
      }
      if (formData.logo_url && formData.logo_url.trim() !== '') {
        payload.logo_url = formData.logo_url.trim();
      } else if (formData.logo_url === '') {
        payload.logo_url = null;
      }
      if (formData.integration_bonus && formData.integration_bonus.trim() !== '') {
        payload.integration_bonus = formData.integration_bonus.trim();
      } else if (formData.integration_bonus === '') {
        payload.integration_bonus = null;
      }
      if (formData.fee_rebates && formData.fee_rebates.trim() !== '') {
        payload.fee_rebates = formData.fee_rebates.trim();
      } else if (formData.fee_rebates === '') {
        payload.fee_rebates = null;
      }
      if ((formData.title && formData.title.trim() !== '') || (formData.others && formData.others.trim() !== '')) {
        payload.others = {};
        if (formData.title && formData.title.trim() !== '') {
          payload.others.title = formData.title.trim();
        }
        if (formData.others && formData.others.trim() !== '') {
          payload.others.text = formData.others.trim();
        }
      } else if (!formData.title && !formData.others) {
        payload.others = null;
      }

      await updateExchangeIntegration(selectedIntegration.id, payload);
      showAlert({
        severity: 'success',
        message: 'Exchange integration updated successfully',
      });
      handleCloseEditDialog();
      onRefresh();
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to update exchange integration';
      showAlert({
        severity: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIntegration) return;

    setIsSubmitting(true);
    try {
      await deleteExchangeIntegration(selectedIntegration.id);
      showAlert({
        severity: 'success',
        message: 'Exchange integration deleted successfully',
      });
      handleCloseDeleteDialog();
      onRefresh();
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to delete exchange integration';
      showAlert({
        severity: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          backgroundColor: 'var(--background-card)',
          border: '1px solid var(--ui-border)',
          borderRadius: 'var(--border-radius-medium)',
          mb: 4,
        }}
      >
        <CardContent>
          <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ color: 'var(--text-primary)' }} variant='h6'>
              Admin: Manage Exchange Integrations
            </Typography>
            {/* eslint-disable-next-line react/jsx-sort-props */}
            <Button
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: 'var(--primary-main)',
                color: 'var(--text-on-primary)',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark)',
                },
              }}
              variant='contained'
              onClick={handleOpenCreateDialog}
            >
              Add Integration
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          {exchangeIntegrations.length === 0 ? (
            <Typography color='text.secondary' variant='body2'>
              No exchange integrations found
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {exchangeIntegrations.map((integration) => {
                const rawOthers = integration.others;
                let othersText = '';
                if (rawOthers && typeof rawOthers === 'object' && rawOthers.text) {
                  othersText = String(rawOthers.text);
                } else if (typeof rawOthers === 'string') {
                  othersText = rawOthers;
                } else if (rawOthers) {
                  othersText = JSON.stringify(rawOthers);
                }

                return (
                  <Box
                    key={integration.id}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 3,
                      p: 3,
                      backgroundColor: 'var(--ui-background-light)',
                      borderRadius: 'var(--border-radius-small)',
                      width: '100%',
                    }}
                  >
                    {/* Left: basic info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 600 }} variant='body1'>
                        {integration.description || `Integration #${integration.id}`}
                      </Typography>
                      <Typography color='text.secondary' sx={{ fontSize: '0.75rem', mt: 0.5 }} variant='caption'>
                        ID: {integration.id} | Votes: {parseFloat(integration.total_votes || '0').toLocaleString()}
                      </Typography>
                    </Box>

                    {/* Right: details columns */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2.5,
                        flex: 2,
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: 'var(--text-secondary)', mb: 0.5 }} variant='body2'>
                          Integration fee
                        </Typography>
                        <Typography sx={{ color: 'var(--text-primary)' }} variant='body1'>
                          {integration.integration_bonus || '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: 'var(--text-secondary)', mb: 0.5 }} variant='body2'>
                          Fee Rebates
                        </Typography>
                        <Typography sx={{ color: 'var(--text-primary)' }} variant='body1'>
                          {integration.fee_rebates || '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ color: 'var(--text-secondary)', mb: 0.5 }} variant='body2'>
                          Others
                        </Typography>
                        <Typography sx={{ color: 'var(--text-primary)' }} variant='body1'>
                          {othersText || '—'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        gap: 1,
                      }}
                    >
                      <IconButton
                        color='primary'
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          },
                        }}
                        onClick={() => handleOpenEditDialog(integration)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color='error'
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          },
                        }}
                        onClick={() => handleOpenDeleteDialog(integration)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            border: '1px solid var(--ui-border)',
            color: 'var(--text-primary)',
            minWidth: '500px',
          },
        }}
        onClose={handleCloseCreateDialog}
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.background.paper }}>Create Exchange Integration</DialogTitle>
        <DialogContent sx={{ backgroundColor: theme.palette.background.paper }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              error={!!errors.description}
              helperText={errors.description}
              label='Title *'
              value={formData.description}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              fullWidth
              error={!!errors.logo_url}
              helperText={errors.logo_url || 'Paste SVG markup for the exchange logo'}
              label='Logo SVG'
              value={formData.logo_url}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              error={!!errors.title}
              helperText={errors.title}
              label='Description'
              minRows={3}
              value={formData.title}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              fullWidth
              error={!!errors.integration_bonus}
              helperText={errors.integration_bonus || 'Optional integration bonus'}
              label='Integration Bonus'
              value={formData.integration_bonus}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, integration_bonus: e.target.value })}
            />
            <TextField
              fullWidth
              error={!!errors.fee_rebates}
              helperText={errors.fee_rebates || 'Optional fee rebates'}
              label='Fee Rebates'
              value={formData.fee_rebates}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, fee_rebates: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              error={!!errors.others}
              helperText={errors.others || 'Optional additional details (displayed under “Others”)'}
              label='Others'
              minRows={2}
              value={formData.others}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, others: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: theme.palette.background.paper }}>
          <Button sx={{ color: 'var(--text-secondary)' }} onClick={handleCloseCreateDialog}>
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            sx={{
              backgroundColor: 'var(--primary-main)',
              '&:hover': { backgroundColor: 'var(--primary-dark)' },
            }}
            variant='contained'
            onClick={handleCreate}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            border: '1px solid var(--ui-border)',
            color: 'var(--text-primary)',
            minWidth: '500px',
          },
        }}
        onClose={handleCloseEditDialog}
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.background.paper }}>Edit Exchange Integration</DialogTitle>
        <DialogContent sx={{ backgroundColor: theme.palette.background.paper }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              error={!!errors.description}
              helperText={errors.description}
              label='Title *'
              value={formData.description}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              fullWidth
              error={!!errors.logo_url}
              helperText={errors.logo_url || 'Paste SVG markup for the exchange logo'}
              label='Logo SVG'
              value={formData.logo_url}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              error={!!errors.title}
              helperText={errors.title}
              label='Description'
              minRows={3}
              value={formData.title}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              fullWidth
              error={!!errors.integration_bonus}
              helperText={errors.integration_bonus || 'Optional integration bonus'}
              label='Integration Bonus'
              value={formData.integration_bonus}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, integration_bonus: e.target.value })}
            />
            <TextField
              fullWidth
              error={!!errors.fee_rebates}
              helperText={errors.fee_rebates || 'Optional fee rebates'}
              label='Fee Rebates'
              value={formData.fee_rebates}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, fee_rebates: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              error={!!errors.others}
              helperText={errors.others || 'Optional additional details (displayed under “Others”)'}
              label='Others'
              minRows={2}
              value={formData.others}
              variant='outlined'
              onChange={(e) => setFormData({ ...formData, others: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: theme.palette.background.paper }}>
          <Button sx={{ color: 'var(--text-secondary)' }} onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            sx={{
              backgroundColor: 'var(--primary-main)',
              '&:hover': { backgroundColor: 'var(--primary-dark)' },
            }}
            variant='contained'
            onClick={handleUpdate}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            border: '1px solid var(--ui-border)',
            color: 'var(--text-primary)',
          },
        }}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.background.paper }}>Delete Exchange Integration</DialogTitle>
        <DialogContent sx={{ backgroundColor: theme.palette.background.paper }}>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This action cannot be undone. Make sure no points are delegated to this integration before deleting.
          </Alert>
          <Typography variant='body1'>
            Are you sure you want to delete{' '}
            <strong>{selectedIntegration?.description || `Integration #${selectedIntegration?.id}`}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: theme.palette.background.paper }}>
          <Button sx={{ color: 'var(--text-secondary)' }} onClick={handleCloseDeleteDialog}>
            Cancel
          </Button>
          <Button color='error' disabled={isSubmitting} variant='contained' onClick={handleDelete}>
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ExchangeIntegrationAdminForm.propTypes = {
  exchangeIntegrations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      description: PropTypes.string,
      logo_url: PropTypes.string,
      total_votes: PropTypes.string,
      integration_bonus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fee_rebates: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      others: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    })
  ).isRequired,
  onRefresh: PropTypes.func.isRequired,
  showAlert: PropTypes.func.isRequired,
};

export default ExchangeIntegrationAdminForm;
