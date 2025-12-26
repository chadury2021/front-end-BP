import React from 'react';
import { Box, Container, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { ContentCopyRounded, Error } from '@mui/icons-material';

// TODO: Figure out how to reset hasError state after navigating to a different route
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error_message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error_message: error.message };
  }

  async copyErrorToClipboard(e) {
    const { error_message } = this.state;
    try {
      await navigator.clipboard.writeText(error_message);
    } catch (err) {
      // nothing
    }
  }

  render() {
    const { hasError, error_message } = this.state;
    if (hasError) {
      return (
        <Container sx={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
          <Stack alignItems='center' direction='column' marginTop='20%' spacing={2}>
            <Error color='disabled' sx={{ fontSize: '80px' }} />
            <Typography textAlign='center' variant='h6'>
              We&apos;re sorry, but an unexpected error has occurred.
              <br />
              Please try refreshing the page or contact support if the problem persists:
              <br />
              Email support@tread.fi
            </Typography>
            <Stack direction='column' sx={{ paddingTop: '40px' }}>
              <Box
                sx={{
                  p: 4,
                  backgroundColor: 'grey.dark',
                  borderRadius: '4px',
                  position: 'relative',
                }}
              >
                <Tooltip title='Copy error message to clipboard'>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      right: '0px',
                      top: '0px',
                    }}
                    onClick={() => this.copyErrorToClipboard()}
                  >
                    <ContentCopyRounded />
                  </IconButton>
                </Tooltip>
                <Typography variant='body1'>{error_message}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      );
    }

    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;
