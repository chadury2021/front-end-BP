import React, { createContext, useState, useContext, useMemo, useCallback, useRef } from 'react';
import { Paper, Snackbar, Typography, Stack, Box, IconButton, Tooltip, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';

const ToastContext = createContext();

const DEFAULT_EXPIRES_IN = 5000;

// Utility function to shorten transaction hash
const shortenTxHash = (message) => {
  const txHashRegex = /(0x[a-fA-F0-9]{64})/g;
  return message.replace(txHashRegex, (match) => `${match.slice(0, 6)}...${match.slice(-4)}`);
};

function getSeverityColor(type) {
  if (type === 'success') return 'success.main';
  if (type === 'error') return 'error.main';
  if (type === 'warning') return 'warning.main';
  return 'info.main';
}

function ToastIcon({ type }) {
  let Icon = InfoOutlinedIcon;
  if (type === 'warning') Icon = WarningAmberOutlinedIcon;
  if (type === 'error') Icon = CancelOutlinedIcon;
  if (type === 'success') Icon = CheckCircleOutlinedIcon;

  return <Icon sx={{ color: getSeverityColor(type), fontSize: 24 }} />;
}

export function ToastProvider({ children }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState({
    content: '',
    type: 'info',
    expiresIn: DEFAULT_EXPIRES_IN,
    vertical: 'top',
    horizontal: 'right',
    rawMessage: '',
  });

  const [progress, setProgress] = useState(100);
  const [copySuccess, setCopySuccess] = useState(false);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const startProgressAnimation = useCallback((durationMs) => {
    const duration = durationMs || DEFAULT_EXPIRES_IN;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(100);
    startTimeRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const remainingRatio = Math.max(0, 1 - elapsed / duration);
      setProgress(Math.round(remainingRatio * 100));
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopySuccess(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const handleClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setProgress(100);
    setCopySuccess(false);
    setOpen(false);
  }, []);

  const showToast = useCallback(
    ({ content, type = 'info', expiresIn = DEFAULT_EXPIRES_IN, anchor = 'top-right', rawMessage = '' }) => {
      const [vertical, horizontal] = anchor.split('-');
      setToast({ content, type, expiresIn, vertical, horizontal, rawMessage });
      setOpen(true);
      startProgressAnimation(expiresIn);
    },
    []
  );

  const showToastMessage = useCallback(
    ({ message, type = 'info', expiresIn = DEFAULT_EXPIRES_IN, anchor = 'top-right', txUrl = '' }) => {
      const displayMessage = txUrl ? shortenTxHash(message) : message;
      const content = (
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography color='text.primary' variant='body1'>
              {displayMessage}
            </Typography>
            {txUrl && (
              <Tooltip title='View transaction'>
                <IconButton
                  aria-label='View transaction'
                  size='small'
                  sx={{ p: 0.5 }}
                  onClick={() => window.open(txUrl, '_blank', 'noopener,noreferrer')}
                >
                  <OpenInNewOutlinedIcon sx={{ fontSize: 14, color: 'text.primary' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      );
      const rawMessage = typeof message === 'string' ? message : '';
      showToast({ content, type, expiresIn, anchor, rawMessage });
    },
    [showToast]
  );

  const showToastWithLink = useCallback(
    ({ message, linkUrl, type = 'info', expiresIn = DEFAULT_EXPIRES_IN, anchor = 'top-right' }) => {
      const content = (
        <Box sx={{ flex: 1 }}>
          <Typography color='text.primary' variant='body1'>
            {message}
          </Typography>
          {linkUrl && (
            <Stack alignItems='center' direction='row' spacing={1} sx={{ mt: 1 }}>
              <Link
                color='primary'
                href={linkUrl}
                sx={{ textDecoration: 'underline', fontSize: '0.875rem' }}
                target='_blank'
                onClick={(e) => {
                  e.preventDefault();
                  window.open(linkUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                View transaction
              </Link>
              <Tooltip title={copySuccess ? 'Copied!' : 'Copy URL'}>
                <IconButton
                  aria-label='Copy URL'
                  color={copySuccess ? 'success' : 'default'}
                  size='small'
                  sx={{ p: 0.5 }}
                  onClick={() => copyToClipboard(linkUrl)}
                >
                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
      );
      const rawMessage = typeof message === 'string' ? message : '';
      showToast({ content, type, expiresIn, anchor, rawMessage });
    },
    [showToast, copyToClipboard, copySuccess]
  );

  const memomizedToastStates = useMemo(
    () => ({ showToast, showToastMessage, showToastWithLink }),
    [showToast, showToastMessage, showToastWithLink]
  );

  return (
    <ToastContext.Provider value={memomizedToastStates}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: toast.vertical, horizontal: toast.horizontal }}
        autoHideDuration={toast.expiresIn}
        open={open}
        onClose={handleClose}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: 'background.default',
            backdropFilter: 'blur(10px)',
            borderRadius: 1,
            boxShadow: (themeParam) => `0 0 0 2px ${themeParam.palette.grey.transparent} inset`,
            maxWidth: 560,
            minWidth: 380,
            px: 3,
            py: 2,
          }}
        >
          <Stack alignItems='center' direction='row' spacing={2}>
            <Box sx={{ alignItems: 'center', display: 'flex' }}>
              <ToastIcon type={toast.type} />
            </Box>

            <Box sx={{ flex: 1, color: 'text.primary' }}>{toast.content}</Box>

            {toast.rawMessage && (
              <Tooltip title={copySuccess ? 'Copied!' : 'Copy message'}>
                <IconButton
                  aria-label='Copy message'
                  color={copySuccess ? 'success' : 'default'}
                  edge='end'
                  size='small'
                  onClick={() => copyToClipboard(toast.rawMessage)}
                >
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <IconButton aria-label='Close' edge='end' size='small' onClick={() => handleClose()}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Box sx={{ mt: 0, display: 'none' }}>
            <Box sx={{ height: 3, width: '100%', borderRadius: 999, overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${progress}%`,
                  transition: 'width 100ms linear',
                  backgroundColor: getSeverityColor(toast.type),
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
