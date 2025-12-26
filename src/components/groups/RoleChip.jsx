import React from 'react';
import { Chip } from '@mui/material';
import { deriveRoleFromPermissions, getRoleColor, snakeToTitleCase } from '@/components/groups/constants';

export default function RoleChip({ permissions = {}, role = null, size = 'small', variant = 'contained' }) {
  let resolvedRole = role;
  if (!resolvedRole) {
    try {
      resolvedRole = deriveRoleFromPermissions(permissions || {});
    } catch (e) {
      return <Chip color='default' label='-' size={size} variant={variant} />;
    }
  }
  return (
    <Chip color={getRoleColor(resolvedRole)} label={snakeToTitleCase(resolvedRole)} size={size} variant={variant} />
  );
}
