import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Paper, Container, useTheme, Divider, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useThemeContext } from '@/theme/ThemeContext';
import AccountTab from './components/AccountTab';
import SecurityTab from './components/SecurityTab';
import SettingsTab from './components/SettingsTab';

export default function AccountSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const tabMap = { account: 0, security: 1, settings: 2 };
  const [currentTab, setCurrentTab] = useState(tabMap[tabFromUrl] ?? 0);
  const theme = useTheme();
  const { currentTheme } = useThemeContext();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);

    const tabName = Object.keys(tabMap).find((key) => tabMap[key] === newValue);
    setSearchParams({ tab: tabName });
  };

  useEffect(() => {
    const tabIndex = tabMap[tabFromUrl] ?? 0;
    if (tabIndex !== currentTab) {
      setCurrentTab(tabIndex);
    }
  }, [tabFromUrl]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        // Fix for Hyperliquid theme: use app background to eliminate outer background visibility
        ...(currentTheme === 'hyperliquid' && {
          backgroundColor: theme.palette.background.app,
        }),
      }}
    >
      <Container
        maxWidth='lg'
        sx={{
          px: { xs: 0, sm: 2 },
          bgcolor: currentTheme === 'hyperliquid' ? 'background.app' : 'background.base',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            bgcolor: 'inherit',
            boxShadow: 'none',
          }}
        >
          <Tabs
            sx={{
              height: '32px',
              minHeight: '32px',
              '& .MuiButtonBase-root': { py: 0, height: '32px', minHeight: '32px' },
              '& .MuiTabs-flexContainer': { height: '32px' },
            }}
            value={currentTab}
            onChange={handleTabChange}
          >
            <Tab label={<Typography variant='button1'>Account</Typography>} />
            <Tab label={<Typography variant='button1'>Security</Typography>} />
            <Tab label={<Typography variant='button1'>Settings</Typography>} />
          </Tabs>
          <Divider />
        </Paper>

        <Box sx={{ flex: 1, overflow: 'auto', marginTop: 2 }}>
          {currentTab === 0 && <AccountTab />}
          {currentTab === 1 && <SecurityTab />}
          {currentTab === 2 && <SettingsTab />}
        </Box>
      </Container>
    </Box>
  );
}
