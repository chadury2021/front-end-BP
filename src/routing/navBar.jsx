import React, { useState } from 'react';
import { useTheme } from '@emotion/react';
import {
  AccountBalanceWalletRounded,
  AccountCircleRounded,
  Info,
  LogoutOutlined,
  WarningAmberRounded,
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  SwipeableDrawer,
  List,
  Divider,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import useViewport from '@/shared/hooks/useViewport';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import { useKeyManagementModal } from '@/shared/context/KeyManagementModalProvider';
import TutorialHighlight from '@/shared/onboarding/TutorialHighlight';
import LOGOS from '../../images/logos';
import { logout } from '../apiServices';
import { NavBarItem, MobileNavBarItem } from '../shared/LinkMenu';
import { useUserMetadata } from '../shared/context/UserMetadataProvider';

const ONBOARDING_KEY_MANAGEMENT_NAV_BAR = 'key_management_nav_bar';

const NAV_BAR_LINKS = Object.freeze({
  TRADE: { label: 'Trade', dropdownIndicator: true },
  BOTS: { label: 'Bots' },
  MAIN: { label: 'Terminal', path: '/' },
  SWAP: { label: 'Algo Swap', path: '/swap' },
  MULTI: { label: 'Portfolio & Basis', path: '/enter_multi_order' },
  OPTIONS: { label: 'Options', path: '/enter_option_order' },
  CHAINED: { label: 'Chained Orders', path: '/enter_chained_order' },
  VOLUME_BOT: { label: 'Market Maker Bot', path: '/volume_bot' },
  DELTA_NEUTRAL_BOT: { label: 'Delta Neutral Bot', path: '/delta_neutral_bot' },
  ORDERS: { label: 'Orders', path: '/view_orders' },
  ANALYTICS: { label: 'Analytics', path: '/transaction_costs' },
  EXPLORE: { label: 'Explore', path: '/explore' },
  POINTS: { label: 'Points', path: '/points' },
  REFERRAL: { label: 'Referral', path: '/referral' },
  VAULT: { label: 'Vault', path: '/vault' },
  DICY: { label: 'Dicy', path: '/dicy' },
  YIELD: { label: 'Yield', path: '/yield' },
  PORTFOLIO: { label: 'Portfolio', path: '/account_balances' },
  API_KEYS: {
    icon: <AccountBalanceWalletRounded sx={{ fontSize: '1.5rem' }} />,
    onClick: 'openKeyManagement',
  },
  API_KEYS_MOBILE: { label: 'Add Exchange', onClick: 'openKeyManagement' },
  INFO: { icon: <Info sx={{ fontSize: '1.5rem' }} /> },
  HELP: { label: 'Help' },
  DOCUMENTATION: {
    label: 'Documentation',
    path: 'https://docs.tread.fi/',
    openTab: true,
  },
  RELEASE_NOTES: {
    label: 'Release Notes',
    path: 'https://luminous-ganache-c828dc.netlify.app/',
    openTab: true,
  },
  FEATURE_REQUEST: {
    label: 'Feature Request',
    path: 'https://www.tread.fi/feature-request',
    openTab: true,
  },
  TOS: {
    label: 'Terms of Service',
    path: 'https://foul-wavelength-9af.notion.site/Terms-of-Service-7eeb5222e8c845c2b411601ccc729f99',
    openTab: true,
  },
  PRIVACY_POLICY: {
    label: 'Privacy Policy',
    path: 'https://foul-wavelength-9af.notion.site/Privacy-Policy-29f3010cd06141929ddbd6bfc2ab98a7',
    openTab: true,
  },
  DISCORD: {
    icon: <img alt='Discord' src={LOGOS.discord} style={{ width: '1.5rem' }} />,
    path: 'https://discord.com/invite/AFUQJRNjna',
    openTab: true,
  },
  TELEGRAM: {
    icon: <img alt='Telegram' src={LOGOS.telegram} style={{ width: '1.5rem' }} />,
    path: 'https://t.me/+_DptCuarEKM0YWVl',
    openTab: true,
  },
  PROFILE: { icon: <AccountCircleRounded sx={{ fontSize: '1.5rem' }} /> },
  SETTINGS: { label: 'Settings' },
  SETTINGS_ACCOUNT: { label: 'Account', path: '/settings?tab=account' },
  SETTINGS_SECURITY: { label: 'Security', path: '/settings?tab=security' },
  SETTINGS_SETTINGS: { label: 'Settings', path: '/settings?tab=settings' },
  ADMIN: { label: 'Admin Panel', path: '/admin_panel' },
});

function NavBar({ version }) {
  const [open, setOpen] = useState(false);
  const { isMobile } = useViewport();

  const toggleDrawer = (_open) => {
    setOpen(_open);
  };

  const closeDrawer = () => toggleDrawer(false);

  const theme = useTheme();
  const location = useLocation();

  const { isRetail, isDev, user, noAccountsFlag, onboarding, markOnboarding, maintenanceModeEnabled } =
    useUserMetadata();
  const { openLoginModal, openSignupModal } = useAuthModal();
  const { openModal: openKeyManagementModal } = useKeyManagementModal();

  const isAuthenticated = user && user.is_authenticated;

  const showNewUserKeyTooltip = noAccountsFlag;

  const handleLogout = async () => {
    if (isAuthenticated) {
      try {
        await logout();
      } catch (error) {
        return;
      }
    }

    localStorage.setItem('user', JSON.stringify({}));
    window.location.reload();
  };

  const maintenanceIndicator = maintenanceModeEnabled ? (
    <Tooltip
      arrow
      placement='bottom'
      title='Preparing for maintenance. New order starts and resumes are blocked, and running orders are paused automatically.'
    >
      <Stack
        alignItems='center'
        aria-label='Maintenance mode active'
        direction='row'
        spacing={1}
        sx={{
          background: alpha(theme.palette.warning.main, 0.12),
          backdropFilter: 'blur(6px)',
          border: `1px solid ${alpha(theme.palette.warning.main, 0.28)}`,
          borderRadius: '9999px',
          color: theme.palette.warning.main,
          height: 30,
          marginRight: isMobile ? 1 : 2,
          paddingX: isMobile ? 0.875 : 2,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.18)}`,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 6px 16px ${alpha(theme.palette.warning.main, 0.24)}`,
          },
        }}
      >
        <WarningAmberRounded fontSize='small' sx={{ opacity: 0.9 }} />
        {!isMobile && (
          <Typography fontWeight={600} letterSpacing={1} sx={{ textTransform: 'uppercase' }}>
            Maintenance
          </Typography>
        )}
      </Stack>
    </Tooltip>
  ) : null;

  return (
    <AppBar
      position='sticky'
      sx={{
        backgroundColor: theme.palette.background.app,
        height: '60px',
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar
        sx={{
          backgroundColor: 'inherit',
          height: '60px',
        }}
      >
        <IconButton
          disableFocusRipple
          disableRipple
          color='inherit'
          component={Link}
          edge='start'
          sx={{ marginRight: '2rem' }}
          to='/'
        >
          <img alt='Tread Logo' id='nav-bar-tread-logo' src={LOGOS.logo} style={{ height: 30 }} />
        </IconButton>

        {isMobile ? (
          <>
            {maintenanceIndicator}
            <Box sx={{ flexGrow: 1 }} /> {/* Acts as spacer  */}
            <IconButton onClick={() => toggleDrawer(true)}>
              <MenuIcon sx={{ fontSize: '1.5rem' }} />
            </IconButton>
            <SwipeableDrawer
              anchor='right'
              elevation={0}
              open={open}
              sx={{
                zIndex: 9999,
                '& .MuiDrawer-paper': {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  zIndex: 9999,
                },
              }}
              onClose={closeDrawer}
            >
              <List sx={{ width: 240 }}>
                <MobileNavBarItem itemProps={NAV_BAR_LINKS.TRADE}>
                  <MobileNavBarItem isSubItem itemProps={NAV_BAR_LINKS.MAIN} onClick={closeDrawer} />
                  <MobileNavBarItem
                    isSubItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.MULTI}
                    onClick={closeDrawer}
                  />
                  <MobileNavBarItem
                    isSubItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.SWAP}
                    onClick={closeDrawer}
                  />
                  <MobileNavBarItem
                    isSubItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.OPTIONS}
                    onClick={closeDrawer}
                  />
                  <MobileNavBarItem
                    isSubItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.CHAINED}
                    onClick={closeDrawer}
                  />
                </MobileNavBarItem>
                <MobileNavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.ORDERS} onClick={closeDrawer} />
                <MobileNavBarItem
                  disabled={!isAuthenticated}
                  itemProps={NAV_BAR_LINKS.ANALYTICS}
                  onClick={closeDrawer}
                />
                <MobileNavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.EXPLORE} onClick={closeDrawer} />
                {(isRetail || isDev) && (
                  <MobileNavBarItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.POINTS}
                    onClick={closeDrawer}
                  />
                )}
                {(isRetail || isDev) && (
                  <MobileNavBarItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.REFERRAL}
                    onClick={closeDrawer}
                  />
                )}
                {isDev && (
                  <MobileNavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.YIELD} onClick={closeDrawer} />
                )}
                {/* {isDev && (
                  <MobileNavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.VAULT} onClick={closeDrawer} />
                )} */}
                {/* {isDicyEnabled && (
                  <MobileNavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.DICY} onClick={closeDrawer} />
                )} */}
                <MobileNavBarItem
                  disabled={!isAuthenticated}
                  itemProps={NAV_BAR_LINKS.PORTFOLIO}
                  onClick={closeDrawer}
                />
                <MobileNavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.BOTS} onClick={closeDrawer}>
                  <MobileNavBarItem
                    isSubItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.VOLUME_BOT}
                    onClick={closeDrawer}
                  />
                  <MobileNavBarItem
                    isSubItem
                    disabled={!isAuthenticated}
                    itemProps={NAV_BAR_LINKS.DELTA_NEUTRAL_BOT}
                    onClick={closeDrawer}
                  />
                </MobileNavBarItem>

                <Divider />

                <MobileNavBarItem disabled itemProps={NAV_BAR_LINKS.API_KEYS_MOBILE} size={1} onClick={null} />
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }} variant='caption'>
                    Not supported on mobile
                  </Typography>
                </Box>
                <MobileNavBarItem itemProps={NAV_BAR_LINKS.HELP} size={1}>
                  <MobileNavBarItem isSubItem itemProps={NAV_BAR_LINKS.DOCUMENTATION} size={1} onClick={closeDrawer} />
                  <MobileNavBarItem isSubItem itemProps={NAV_BAR_LINKS.RELEASE_NOTES} size={1} onClick={closeDrawer} />
                  <MobileNavBarItem
                    isSubItem
                    itemProps={NAV_BAR_LINKS.FEATURE_REQUEST}
                    size={1}
                    onClick={closeDrawer}
                  />
                  <MobileNavBarItem isSubItem itemProps={NAV_BAR_LINKS.TOS} size={1} onClick={closeDrawer} />
                  <MobileNavBarItem isSubItem itemProps={NAV_BAR_LINKS.PRIVACY_POLICY} size={1} onClick={closeDrawer} />
                </MobileNavBarItem>
                {isAuthenticated && (
                  <MobileNavBarItem itemProps={NAV_BAR_LINKS.SETTINGS} size={1}>
                    <MobileNavBarItem
                      isSubItem
                      itemProps={NAV_BAR_LINKS.SETTINGS_ACCOUNT}
                      size={1}
                      onClick={closeDrawer}
                    />
                    <MobileNavBarItem
                      isSubItem
                      itemProps={NAV_BAR_LINKS.SETTINGS_SECURITY}
                      size={1}
                      onClick={closeDrawer}
                    />
                    <MobileNavBarItem
                      isSubItem
                      itemProps={NAV_BAR_LINKS.SETTINGS_SETTINGS}
                      size={1}
                      onClick={closeDrawer}
                    />
                  </MobileNavBarItem>
                )}
              </List>

              <Box sx={{ px: 2 }}>
                {isAuthenticated ? (
                  <Button
                    fullWidth
                    data-nav='true'
                    sx={{ borderColor: 'text.disabled' }}
                    variant='outlined'
                    onClick={handleLogout}
                  >
                    <Typography color='text'>Logout</Typography>
                  </Button>
                ) : (
                  <Stack direction='column' spacing={2}>
                    <Button
                      color='primary'
                      data-nav='true'
                      size='small'
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                        '& .MuiTypography-root': {
                          color: 'inherit',
                        },
                      }}
                      variant='contained'
                      onClick={() => {
                        openLoginModal();
                      }}
                    >
                      <Typography variant='button1'>Login</Typography>
                    </Button>
                    {isRetail && (
                      <Button
                        data-nav='true'
                        size='small'
                        sx={{
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.text.offBlack,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          },
                        }}
                        variant='contained'
                        onClick={() => {
                          openSignupModal();
                        }}
                      >
                        <Typography>Sign up</Typography>
                      </Button>
                    )}
                  </Stack>
                )}
              </Box>
            </SwipeableDrawer>
          </>
        ) : (
          <>
            <NavBarItem
              active={[
                NAV_BAR_LINKS.MAIN.path,
                NAV_BAR_LINKS.MULTI.path,
                NAV_BAR_LINKS.SWAP.path,
                NAV_BAR_LINKS.OPTIONS.path,
                NAV_BAR_LINKS.CHAINED.path,
              ].includes(location.pathname)}
              itemProps={NAV_BAR_LINKS.TRADE}
            >
              <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.MAIN} />
              <NavBarItem isSubItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.MULTI} />
              <NavBarItem isSubItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.SWAP} />
              <NavBarItem isSubItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.OPTIONS} />
              <NavBarItem isSubItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.CHAINED} />
            </NavBarItem>
            <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.ORDERS} />
            <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.ANALYTICS} />
            <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.EXPLORE} />
            {(isRetail || isDev) && <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.POINTS} />}
            {(isRetail || isDev) && <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.REFERRAL} />}
            {isDev && <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.YIELD} />}
            {/* {isDev && <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.VAULT} />} */}
            {/* {isDicyEnabled && <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.DICY} />} */}
            <NavBarItem
              disabled={!isAuthenticated}
              itemProps={{
                ...NAV_BAR_LINKS.BOTS,
                label: (
                  <>
                    {NAV_BAR_LINKS.BOTS.label}
                    <Typography
                      component='span'
                      sx={{
                        color: 'error.main',
                        fontSize: '0.65em',
                        fontWeight: 700,
                        marginLeft: '4px',
                        display: 'inline-block',
                        lineHeight: 1,
                        transform: 'translateY(-0.45em)',
                        letterSpacing: 0.5,
                      }}
                    >
                      NEW
                    </Typography>
                  </>
                ),
              }}
            >
              <NavBarItem isSubItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.VOLUME_BOT} />
              <NavBarItem isSubItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.DELTA_NEUTRAL_BOT} />
            </NavBarItem>
            <NavBarItem disabled={!isAuthenticated} itemProps={NAV_BAR_LINKS.PORTFOLIO} />
            <Box sx={{ flexGrow: 1 }} /> {/* Acts as spacer  */}
            {maintenanceIndicator}
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: theme.palette.text.subtitle,
                marginLeft: '0.5rem',
                paddingRight: '0.85rem',
                opacity: '0.6',
              }}
            >
              v{version}
            </Typography>
            <TutorialHighlight
              open={showNewUserKeyTooltip && !onboarding[ONBOARDING_KEY_MANAGEMENT_NAV_BAR]}
              placement='bottom'
              text='Add keys or connect your wallet to start trading'
              onClose={() => markOnboarding({ [ONBOARDING_KEY_MANAGEMENT_NAV_BAR]: true })}
            >
              <NavBarItem
                disabled={!isAuthenticated || isMobile}
                itemProps={NAV_BAR_LINKS.API_KEYS}
                onClick={isMobile ? null : openKeyManagementModal}
              />
            </TutorialHighlight>
            <NavBarItem itemProps={NAV_BAR_LINKS.INFO}>
              <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.DOCUMENTATION} />
              <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.RELEASE_NOTES} />
              <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.FEATURE_REQUEST} />
              <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.TOS} />
              <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.PRIVACY_POLICY} />
            </NavBarItem>
            <NavBarItem itemProps={NAV_BAR_LINKS.DISCORD} />
            <NavBarItem itemProps={NAV_BAR_LINKS.TELEGRAM} />
            {isAuthenticated && (
              <NavBarItem active={location.pathname === '/settings'} itemProps={NAV_BAR_LINKS.PROFILE}>
                <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.SETTINGS_ACCOUNT} />
                <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.SETTINGS_SECURITY} />
                <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.SETTINGS_SETTINGS} />
                {(user.is_superuser || user.is_staff) && <NavBarItem isSubItem itemProps={NAV_BAR_LINKS.ADMIN} />}
              </NavBarItem>
            )}
            {isAuthenticated ? (
              <IconButton color='inherit' data-nav='true' onClick={handleLogout}>
                <LogoutOutlined sx={{ fontSize: '1.5rem' }} />
              </IconButton>
            ) : (
              <Stack
                direction='row'
                spacing={2}
                sx={{
                  marginLeft: '0.5rem',
                }}
              >
                <Button
                  color='primary'
                  data-nav='true'
                  size='small'
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                    '& .MuiTypography-root': {
                      color: 'inherit',
                    },
                  }}
                  variant='contained'
                  onClick={() => {
                    openLoginModal();
                  }}
                >
                  <Typography variant='button'>Login</Typography>
                </Button>
                {isRetail && (
                  <Button
                    data-nav='true'
                    size='small'
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.text.offBlack,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}
                    variant='contained'
                    onClick={() => {
                      openSignupModal();
                    }}
                  >
                    <Typography>Sign up</Typography>
                  </Button>
                )}
              </Stack>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
