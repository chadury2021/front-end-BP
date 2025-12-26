import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
} from '@mui/material';
import { GroupAdd as GroupAddIcon } from '@mui/icons-material';
import GroupBasicInfoPanel from './editPanels/GroupBasicInfoPanel';
import ExchangeAccountsPanel from './editPanels/ExchangeAccountsPanel';
import UsersPermissionsPanel from './editPanels/UsersPermissionsPanel';
import { permissionTemplates } from './constants';

function CreateEditGroupDialog({
  open,
  mode = 'create',
  formData,
  onChange,
  onCancel,
  onSubmit,
  users = [],
  exchangeAccounts = [],
}) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState(new Set());

  React.useEffect(() => {
    if (open) {
      setActiveStep(0);
      setCompletedSteps(new Set());
    }
  }, [open]);

  const steps = [
    { label: 'Group Details', description: 'Basic information' },
    { label: 'Users & Permissions', description: 'Add users and set permissions' },
    { label: 'Exchange Accounts', description: 'Select trading accounts' },
  ];

  // Remove progressive disclosure; always show all steps.
  // Only allow clicking completed steps (and current step), disable future steps.
  const handleUpdate = (partial) => {
    onChange({ ...formData, ...partial });
  };

  // Validation functions for each step
  const isStepValid = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Basic Info
        return formData.name?.trim().length > 0;
      case 1: // Users & Permissions (moved to second)
        if (!formData.selectedUsers?.length) return false;
        // Require at least one permission selected per selected user
        return formData.selectedUsers.every((userId) => {
          const perms = formData.userPermissions?.[userId]?.permissions || {};
          return Object.values(perms).some((v) => !!v);
        });
      case 2: // Exchange Accounts (moved to third)
        return formData.selectedAccounts?.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(activeStep)) {
      setCompletedSteps((prev) => new Set([...prev, activeStep]));
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleStepClick = (stepIndex) => {
    // Allow navigation only to already completed steps (or current)
    if (completedSteps.has(stepIndex) || stepIndex === activeStep) {
      setActiveStep(stepIndex);
    }
  };

  const handleToggleAccount = (accountId) => {
    const isSelected = formData.selectedAccounts.includes(accountId);
    const selectedAccounts = isSelected
      ? formData.selectedAccounts.filter((id) => id !== accountId)
      : [...formData.selectedAccounts, accountId];
    handleUpdate({ selectedAccounts });
  };

  const handleUserSelection = (userId, selected) => {
    let updatedUsers = [...formData.selectedUsers];
    const updatedPermissions = { ...formData.userPermissions };

    if (selected) {
      updatedUsers.push(userId);
      updatedPermissions[userId] = {
        role: 'trader',
        permissions: { ...permissionTemplates.trader },
      };
    } else {
      updatedUsers = updatedUsers.filter((id) => id !== userId);
      delete updatedPermissions[userId];
    }
    handleUpdate({ selectedUsers: updatedUsers, userPermissions: updatedPermissions });
  };

  const handleBatchPermissionChange = (permission, value) => {
    const updatedPermissions = { ...formData.userPermissions };
    formData.selectedUsers.forEach((userId) => {
      if (updatedPermissions[userId]) {
        updatedPermissions[userId].permissions = {
          ...updatedPermissions[userId].permissions,
          [permission]: value,
        };
      }
    });
    handleUpdate({ userPermissions: updatedPermissions });
  };

  const handleBatchRoleChange = (role) => {
    const updatedPermissions = { ...formData.userPermissions };
    formData.selectedUsers.forEach((userId) => {
      if (updatedPermissions[userId]) {
        updatedPermissions[userId] = {
          role,
          permissions: { ...permissionTemplates[role] },
        };
      }
    });
    handleUpdate({ userPermissions: updatedPermissions });
  };

  return (
    <Dialog fullWidth maxWidth='md' open={open} PaperProps={{ sx: { height: '80vh' } }} onClose={onCancel}>
      <DialogTitle>
        {mode === 'create' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupAddIcon />
            Create New Trading Group
          </Box>
        ) : (
          'Edit Trading Group'
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Stepper alternativeLabel activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => {
            const isClickable = completedSteps.has(index) || index === activeStep;
            return (
              <Step
                completed={completedSteps.has(index)}
                disabled={!isClickable}
                key={step.label}
                sx={{ cursor: isClickable ? 'pointer' : 'default' }}
                onClick={() => isClickable && handleStepClick(index)}
              >
                <StepLabel>
                  <Box>
                    <Typography color='text.secondary' variant='caption'>
                      {step.description}
                    </Typography>
                    <Typography variant='subtitle2'>{step.label}</Typography>
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        {/* Step Content */}
        {activeStep === 0 && <GroupBasicInfoPanel formData={formData} onUpdate={handleUpdate} />}

        {activeStep === 1 && (
          <UsersPermissionsPanel
            formData={formData}
            users={users}
            onBatchPermissionChange={handleBatchPermissionChange}
            onBatchRoleChange={handleBatchRoleChange}
            onUpdate={handleUpdate}
            onUserSelection={handleUserSelection}
          />
        )}

        {activeStep === 2 && (
          <ExchangeAccountsPanel
            exchangeAccounts={exchangeAccounts}
            formData={formData}
            onToggleAccount={handleToggleAccount}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onCancel}>Cancel</Button>

        <Box sx={{ flex: '1 1 auto' }} />

        {activeStep > 0 && (
          <Button sx={{ mr: 1 }} onClick={handleBack}>
            Back
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button disabled={!isStepValid(activeStep)} variant='contained' onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            disabled={
              mode === 'create' &&
              (!formData.name?.trim() || !formData.selectedAccounts?.length || !formData.selectedUsers?.length)
            }
            variant='contained'
            onClick={onSubmit}
          >
            {mode === 'create'
              ? `Create Group with ${formData.selectedUsers?.length || 0} Users & ${formData.selectedAccounts?.length || 0} Accounts`
              : 'Save Changes'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default CreateEditGroupDialog;
