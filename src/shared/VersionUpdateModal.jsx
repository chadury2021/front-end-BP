import React from 'react';
import {
  Modal,
  Typography,
  Box,
  Button,
  Stack,
  Backdrop,
  useTheme,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import CloseIcon from '@mui/icons-material/Close';
import useViewport from './hooks/useViewport';
import { versionContentData } from './versionContent';

function ModalContainer({ open, onClose, children }) {
  const theme = useTheme();

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40.00rem',
    backgroundColor: `${theme.palette.common.pureBlack}99`, // 60% opacity
    backdropFilter: 'blur(16px)',
    borderRadius: '8px',
    overflow: 'hidden',
    maxHeight: '90vh',
    minHeight: '500px',
    height: 'auto',
    boxSizing: 'border-box',
    border: 'none',
    boxShadow: `0 8px 32px ${theme.palette.common.pureBlack}80`, // 50% opacity
    outline: 'none',
    fontFamily: theme.typography.fontFamilyConfig?.numbers || theme.typography.fontFamily || 'inherit',
    color: theme.palette.common.pureWhite,
  };

  return (
    <Modal
      BackdropComponent={Backdrop}
      BackdropProps={{
        sx: {
          backgroundColor: 'transparent',
          backdropFilter: 'none',
        },
      }}
      open={open}
      onClose={onClose}
    >
      <Box sx={modalStyle}>{children}</Box>
    </Modal>
  );
}

function MobileModalContainer({ open, onClose, children }) {
  return (
    <SwipeableDrawer anchor='top' elevation={0} ModalProps={{ keepMounted: false }} open={open} onClose={onClose}>
      {children}
    </SwipeableDrawer>
  );
}

function VersionContent({ version }) {
  const theme = useTheme();

  const containerStyle = {
    padding: '20px',
    background: 'transparent',
  };

  const titleStyle = {
    fontSize: '1.5rem',
    margin: '0 0 16px 0',
    fontWeight: 600,
    color: theme.palette.common.pureWhite,
    textAlign: 'center',
  };

  const versionInfoStyle = {
    textAlign: 'center',
    marginBottom: '24px',
    opacity: 0.7,
  };

  const versionInfoTextStyle = {
    margin: '4px 0',
    fontSize: '0.8rem',
    color: theme.palette.grey[400],
  };

  const listItemStyle = {
    padding: '12px 0',
    margin: '4px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    '&:last-child': {
      borderBottom: 'none',
    },
  };

  const nestedListItemStyle = {
    padding: '4px 0',
    margin: '2px 0',
    fontSize: '0.85rem',
    opacity: 0.8,
    borderBottom: 'none',
  };

  const strongStyle = {
    color: theme.palette.common.pureWhite,
    fontWeight: 600,
  };

  const imageStyle = {
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    display: 'block',
    margin: '12px auto',
    borderRadius: '4px',
  };

  return (
    <Box sx={containerStyle}>
      <Typography sx={titleStyle}>{version}</Typography>

      <Box sx={versionInfoStyle}>
        <Typography sx={versionInfoTextStyle}>
          <em>{versionContentData.date}</em>
        </Typography>
        <Typography sx={versionInfoTextStyle}>
          Market Access version: {versionContentData.marketAccessVersion}
        </Typography>
      </Box>

      <List sx={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {versionContentData.features.map((feature, featureIndex) => (
          <ListItem key={feature.title} sx={listItemStyle}>
            <ListItemText
              primary={<Typography sx={strongStyle}>{feature.title}</Typography>}
              secondary={
                <List sx={{ margin: '10px 0 0 20px', paddingLeft: 0 }}>
                  {feature.items.map((item, itemIndex) => (
                    <ListItem key={item.title || item.description} sx={nestedListItemStyle}>
                      <ListItemText
                        primary={
                          <Box>
                            {item.title && <Typography sx={strongStyle}>{item.title}</Typography>}
                            {item.description && (
                              <Typography
                                sx={{
                                  margin: '8px 0',
                                  opacity: 0.8,
                                  lineHeight: 1.4,
                                  fontSize: '0.9rem',
                                  color: theme.palette.grey[300],
                                }}
                              >
                                {item.description}
                              </Typography>
                            )}
                            {item.image && (
                              <Box alt={item.image.alt} component='img' src={item.image.src} sx={imageStyle} />
                            )}
                            {item.subItems && (
                              <List sx={{ margin: '10px 0 0 20px', paddingLeft: 0 }}>
                                {item.subItems.map((subItem, subIndex) => (
                                  <ListItem key={subItem.title} sx={nestedListItemStyle}>
                                    <ListItemText
                                      primary={
                                        <Typography
                                          sx={{
                                            margin: '8px 0',
                                            opacity: 0.8,
                                            lineHeight: 1.4,
                                            fontSize: '0.9rem',
                                            color: theme.palette.grey[300],
                                          }}
                                        >
                                          <strong>{subItem.title}</strong> {subItem.description}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

function VersionUpdateModal({ open, onClose, version, versionContent, onReadMore }) {
  const { isMobile } = useViewport();
  const theme = useTheme();

  const buttonStyle = {
    fontSize: '0.9rem',
    color: theme.palette.brand?.[400] || theme.palette.primary.main,
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
    '&:hover': {
      color: theme.palette.brand?.[300] || theme.palette.primary.light,
    },
    '&:focus': {
      outline: 'none',
    },
  };

  const Wrapper = isMobile ? MobileModalContainer : ModalContainer;

  return (
    <Wrapper open={open} onClose={onClose}>
      <Box sx={{ p: 0, height: '100%', backgroundColor: 'transparent' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              p: 3,
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: 'transparent',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography gutterBottom sx={{ margin: 0 }} variant='h6'>
              Release Notes
            </Typography>
            <IconButton
              aria-label='close'
              sx={{
                color: 'var(--text-primary)',
              }}
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'transparent' }}>
            <VersionContent version={version} />
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 3,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'transparent',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Box
              component='button'
              sx={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                outline: 'none',
                '&:hover': {
                  ...buttonStyle['&:hover'],
                  backgroundColor: 'transparent',
                },
                '&:focus': {
                  ...buttonStyle['&:focus'],
                  backgroundColor: 'transparent',
                },
                '&:active': {
                  backgroundColor: 'transparent',
                },
              }}
              onClick={onClose}
            >
              Close
            </Box>
            <Button size='small' variant='contained' onClick={onReadMore}>
              <Typography color='inherit' variant='body1Strong'>
                Read More
              </Typography>
            </Button>
          </Box>
        </Box>
      </Box>
    </Wrapper>
  );
}

export default VersionUpdateModal;
