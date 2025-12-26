// Shared constants and helpers for Groups management

export const permissionTemplates = {
  isolated_trader: {
    can_trade: true,
    can_view: false,
  },
  trader: {
    can_trade: true,
    can_view: true,
  },
  viewer: {
    can_trade: false,
    can_view: true,
  },
};

export const arePermissionsEqual = (a, b) => {
  const aKeys = Object.keys(a || {});
  const bKeys = Object.keys(b || {});
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => !!a[key] === !!b[key]);
};

export const deriveRoleFromPermissions = (perms) => {
  if (arePermissionsEqual(perms, permissionTemplates.trader)) return 'trader';
  if (arePermissionsEqual(perms, permissionTemplates.viewer)) return 'viewer';
  if (arePermissionsEqual(perms, permissionTemplates.isolated_trader)) return 'isolated_trader';
  return '';
};

export const snakeToTitleCase = (str) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function getRoleColor(role) {
  switch (role) {
    case 'trader':
      return 'primary';
    case 'viewer':
      return 'secondary';
    case 'isolated_trader':
      return 'info';
    default:
      return 'default';
  }
}
