'use client';

import { Dashboard, Group, People, Person, ReceiptLong } from '@mui/icons-material';
import {
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const ADMIN_BASE = '/admin_panel';
const navigation = [
  { name: 'Dashboard', to: `${ADMIN_BASE}`, icon: Dashboard },
  { name: 'Open Orders', to: `${ADMIN_BASE}/open_orders`, icon: ReceiptLong },
  { name: 'Trading Groups', to: `${ADMIN_BASE}/groups`, icon: Group },
  { name: 'Users', to: `${ADMIN_BASE}/users`, icon: Person },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentPath = `${location.pathname}${location.hash || ''}`;
  const isSelected = (to) => currentPath === to || location.pathname === to;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography noWrap component='div' sx={{ fontWeight: 'Semibold' }} variant='h6'>
          Admin Panel
        </Typography>
      </Toolbar>
      <List>
        {navigation.map((item) => (
          <ListItem disablePadding key={item.name}>
            <ListItemButton
              component={Link}
              selected={isSelected(item.to)}
              sx={{
                '&.Mui-selected, &:focus-visible': {
                  backgroundColor: 'primary.main',
                  color: 'common.pureBlack',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'common.pureBlack',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'common.pureBlack',
                  },
                },
              }}
              to={item.to}
            >
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 60px)' }}>
      <Box component='nav' sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          ModalProps={{
            keepMounted: true,
          }}
          open={mobileOpen}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              top: '60px',
              height: 'calc(100vh - 60px)',
              zIndex: (theme) => theme.zIndex.appBar - 1,
            },
          }}
          variant='temporary'
          onClose={handleDrawerToggle}
        >
          {drawer}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              top: '60px',
              height: 'calc(100vh - 60px)',
              zIndex: (theme) => theme.zIndex.appBar - 1,
            },
          }}
          variant='permanent'
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component='main'
        sx={{
          flexGrow: 1,
          px: 3,
          pt: 1,
          pb: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflow: 'visible',
        }}
      >
        <Container maxWidth='xl'>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
