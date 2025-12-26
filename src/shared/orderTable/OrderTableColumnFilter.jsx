import React, { useState } from 'react';
import { Button, IconButton, Stack, MenuItem, ListItemText, Checkbox, Popover, Paper, Divider } from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

export function OrderTableColumnFilterButton({ columns, visibleColumns, setVisibleColumns, dashboardView = true }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const defaultColumns = columns.reduce((acc, col) => ({ ...acc, [col.id]: col.showDefault }), {});
  const visibleColumnCount = columns.reduce((count, val) => count + (visibleColumns[val.id] ? 1 : 0), 0);

  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };
  const handleShowFilterMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseFilterMenu = () => {
    setAnchorEl(null);
  };
  const handleSelectAllColumns = () => {
    const newValue = visibleColumnCount !== columns.length;
    setVisibleColumns(columns.reduce((acc, col) => ({ ...acc, [col.id]: newValue }), {}));
  };
  const handleResetColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  const origins = dashboardView
    ? {
        anchorOrigin: {
          vertical: 'center',
          horizontal: 'right',
        },
        transformOrigin: {
          vertical: 'center',
          horizontal: 'left',
        },
      }
    : {
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'center',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      };

  return (
    <>
      <IconButton onClick={handleShowFilterMenu}>
        <ViewColumnIcon />
      </IconButton>
      <Popover
        {...origins}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        sx={{
          minWidth: 300,
          height: '350px',
        }}
        onClose={handleCloseFilterMenu}
      >
        <Paper>
          <Stack direction='row' justifyContent='space-between'>
            <MenuItem sx={{ p: 1 }} onClick={handleSelectAllColumns}>
              <Checkbox
                checked={visibleColumnCount === columns.length}
                indeterminate={visibleColumnCount > 0 && visibleColumnCount < columns.length}
              />
              <ListItemText primary='Select All' />
            </MenuItem>
            <Button onClick={handleResetColumns}>Reset</Button>
          </Stack>
          <Divider />

          {columns.map((option) => (
            <MenuItem key={option.id} sx={{ p: 1 }} onClick={() => handleColumnToggle(option.id)}>
              <Checkbox checked={visibleColumns[option.id]} />
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
        </Paper>
      </Popover>
    </>
  );
}
