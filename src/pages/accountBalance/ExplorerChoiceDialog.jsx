import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Typography,
} from '@mui/material';
import CHAIN_ICONS from '@images/chain_icons';

function ExplorerChoiceDialog({
  open,
  selectedAddressType,
  onClose,
  onExplorerChoice
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>View Wallet Address on Explorer</DialogTitle>
      <DialogContent>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => onExplorerChoice('1')}>
              <ListItemIcon>
                <img
                  alt='Ethereum'
                  src={CHAIN_ICONS['1']}
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
              </ListItemIcon>
              <ListItemText primary='Etherscan' secondary='Ethereum Mainnet' />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => onExplorerChoice('8453')}>
              <ListItemIcon>
                <img
                  alt='Base'
                  src={CHAIN_ICONS['8453']}
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
              </ListItemIcon>
              <ListItemText primary='Basescan' secondary='Base Network' />
            </ListItemButton>
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExplorerChoiceDialog;