import React from 'react';
import { CircularProgress, ToggleButtonGroup, styled } from '@mui/material';
import { alpha } from '@mui/material/styles';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme, loading, disabled }) => ({
  position: 'relative',
  '&::after': {
    content: '""',
    display: loading || disabled ? 'block' : 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: alpha(theme.palette.background.paper, 0.5),
    zIndex: 1,
    borderRadius: 'inherit',
  },
}));

const LoadingOverlay = styled('div')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 2,
});

function LoadingToggleButtonGroup({ loading = false, children, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <StyledToggleButtonGroup loading={loading ? 1 : 0} {...props}>
        {children}
      </StyledToggleButtonGroup>
      {loading && (
        <LoadingOverlay>
          <CircularProgress size={24} />
        </LoadingOverlay>
      )}
    </div>
  );
}

export default LoadingToggleButtonGroup;
