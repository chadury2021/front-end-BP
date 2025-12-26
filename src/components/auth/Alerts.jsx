import { Alert, Stack, Typography } from '@mui/material';

function ErrorAlert({ errors, extraProps = {} }) {
  return (
    errors.length > 0 && (
      <Alert
        severity='error'
        sx={{
          mb: 2,
          boxSizing: 'content-box',
          backgroundColor: 'transparent',
          border: '1px solid #f6465d',
          borderRadius: 1,
          alignItems: 'center',
        }}
        {...extraProps}
      >
        <Stack direction='column' spacing={1}>
          {errors.map((error) => (
            <Typography color='error.main' key={error} variant='body2'>
              {error}
            </Typography>
          ))}
        </Stack>
      </Alert>
    )
  );
}

function SuccessAlert({ messages, extraProps = {} }) {
  return (
    messages.length > 0 && (
      <Alert
        severity='success'
        sx={{
          mb: 2,
          boxSizing: 'content-box',
          backgroundColor: 'transparent',
          border: '1px solid #0ecb81',
          borderRadius: 1,
          alignItems: 'center',
        }}
        {...extraProps}
      >
        <Stack direction='column' spacing={1}>
          {messages.map((message) => (
            <Typography color='success.main' key={message} variant='body2'>
              {message}
            </Typography>
          ))}
        </Stack>
      </Alert>
    )
  );
}

export { ErrorAlert, SuccessAlert };
