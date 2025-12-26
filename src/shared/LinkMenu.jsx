import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function NavBarItem({
  itemProps,
  children,
  disabled = false,
  isSubItem = false,
  onClick = null,
  active = null,
}) {
  const theme = useTheme();
  const location = useLocation();

  const selected = active || location.pathname === itemProps.path;

  if (children) {
    return (
      <NavBarParentItem active={selected} disabled={disabled} itemProps={itemProps}>
        {children}
      </NavBarParentItem>
    );
  }

  const { label, icon, path, openTab } = itemProps;

  let ClickComponent;
  if (isSubItem) {
    ClickComponent = MenuItem;
  } else if (icon) {
    ClickComponent = IconButton;
  } else {
    ClickComponent = Button;
  }

  const { onClick: itemOnClick } = itemProps;

  // Determine if this is a click handler or a navigation path
  const hasClickHandler = itemOnClick && typeof itemOnClick === 'string';
  const hasPath = path && !hasClickHandler;

  const action = hasPath
    ? { to: path, target: openTab ? '_blank' : '', onClick }
    : { onClick: onClick || (hasClickHandler ? () => {} : undefined) };

  const textColor = () => {
    if (disabled) return theme.palette.text.disabled;
    if (selected) return theme.palette.primary.main;
    return theme.palette.text.primary;
  };

  const iconColor = () => {
    if (disabled) return theme.palette.text.disabled;
    if (selected) return theme.palette.primary.main;
    return theme.palette.text.primary;
  };

  return (
    <Box
      sx={{
        '& svg': {
          color: iconColor(),
        },
        '& .MuiButton-root': {
          color: textColor(),
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
        '& .MuiIconButton-root': {
          color: iconColor(),
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
        '& .MuiMenuItem-root': {
          color: textColor(),
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
      }}
    >
      <ClickComponent component={hasPath ? Link : 'button'} data-nav='true' disabled={disabled} {...action}>
        {label && <Typography sx={{ color: textColor(), fontWeight: 400 }}>{label}</Typography>}
        {icon}
      </ClickComponent>
    </Box>
  );
}

function NavBarParentItem({ active, itemProps, children, disabled = false }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const subItems = children.length > 1 ? children : [children];

  const { dropdownIndicator, label: itemLabel } = itemProps;
  const indicatorLabel = dropdownIndicator ? (
    <Box
      component='span'
      sx={{
        alignItems: 'center',
        display: 'inline-flex',
        gap: 0.5,
      }}
    >
      {itemLabel}
      {anchorEl ? (
        <KeyboardArrowUpRounded sx={{ fontSize: '1.25rem' }} />
      ) : (
        <KeyboardArrowDownRounded sx={{ fontSize: '1.25rem' }} />
      )}
    </Box>
  ) : (
    itemLabel
  );

  const triggerItemProps = {
    ...itemProps,
    label: indicatorLabel,
  };

  return (
    <>
      <NavBarItem active={active} disabled={disabled} itemProps={triggerItemProps} onClick={handleClick} />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        PaperProps={{
          sx: {
            backgroundColor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
            backdropFilter: 'blur(15px)',
            border: 'none',
            borderRadius: 0,
            boxShadow: 'none',
            '& .MuiMenuItem-root': {
              backgroundColor: 'transparent',
              color: theme.palette.text.primary,
              '&:hover': {
                backgroundColor: `${theme.palette.action.hover}40`, // 25% opacity - more subtle hover
              },
            },
          },
        }}
        onClose={handleClose}
      >
        {subItems.map((item) => {
          if (!item) return null;
          const key =
            item.props?.itemProps?.path || item.props?.itemProps?.label || Math.random().toString(36).substr(2, 9);
          return React.cloneElement(item, { key, onClick: handleClose });
        })}
      </Menu>
    </>
  );
}

const SIZE_TO_TEXT = {
  2: 'h6',
  1: 'subtitle1',
  0: 'subtitle2',
};

export function MobileNavBarItem({
  itemProps,
  children,
  disabled = false,
  size = 2,
  isSubItem = false,
  onClick = null,
  endIcon = null,
}) {
  if (children) {
    return (
      <MobileNavBarParentItem itemProps={itemProps} size={size}>
        {children}
      </MobileNavBarParentItem>
    );
  }

  const { label, path, openTab } = itemProps;
  const textVariant = isSubItem ? SIZE_TO_TEXT[Math.max(0, size - 1)] : SIZE_TO_TEXT[size];

  const action = { to: path, target: openTab ? '_blank' : '', onClick };
  return (
    <ListItemButton component={Link} disabled={disabled} sx={{ pl: isSubItem ? 4 : 2 }} {...action}>
      <ListItemText primary={<Typography variant={textVariant}>{label}</Typography>} />
      {endIcon}
    </ListItemButton>
  );
}

function MobileNavBarParentItem({ itemProps, size, children }) {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen((prev) => !prev);
  };

  return (
    <>
      <MobileNavBarItem
        endIcon={open ? <ExpandLess /> : <ExpandMore />}
        itemProps={itemProps}
        size={size}
        onClick={handleClick}
      />
      <Collapse in={open} timeout='auto'>
        <List disablePadding>{children}</List>
      </Collapse>
    </>
  );
}
