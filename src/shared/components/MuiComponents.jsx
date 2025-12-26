import { Card, styled, Typography } from '@mui/material';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import { isolatedHolographicStyles } from '@/theme/holographicEffects';

export const LightCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

export function HeaderTypography(props) {
  return <Typography color='text' variant='small2' {...props} />;
}

export function ValueTypography(props) {
  return <Typography variant='body3' {...props} />;
}

export const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  backgroundColor: 'var(--background-paper)',
  color: 'var(--text-primary)',
  fontSize: 'var(--font-size-body2)',
  paddingTop: 'var(--spacing-1)',
  paddingBottom: 'var(--spacing-1)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-1)',
}));

export const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  backgroundColor: theme.palette.ui.cardBackground,
  color: theme.palette.text.primary,
  paddingLeft: '2em',
  borderRadius: 0, // Remove rounded corners
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.secondary,
  },
  ...isolatedHolographicStyles(theme),
}));
