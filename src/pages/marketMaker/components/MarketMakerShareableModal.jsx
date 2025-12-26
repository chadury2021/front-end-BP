import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';
import MarketMakerShareableCard from './MarketMakerShareableCard';

/**
 * Converts a data URL string (e.g., from html2canvas) into a Blob object.
 * @param {string} dataUrl The data URL to convert.
 * @returns {Promise<Blob>} A promise that resolves with the Blob.
 */
async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return blob;
}

function MarketMakerShareableModal({ open, onClose, mmBotData, showAlert }) {
  const theme = useTheme();
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const shareableCardRef = useRef(null);

  // Generate image when modal opens
  useEffect(() => {
    // Only generate if modal is open, data available, ref attached, and no image exists yet
    if (open && mmBotData && shareableCardRef?.current && !imageDataUrl && !isGenerating) {
      setIsGenerating(true);
      const generate = async () => {
        try {
          // Small delay to ensure card is fully rendered
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });

          const canvas = await html2canvas(shareableCardRef.current, {
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: null,
          });
          const dataUrl = canvas.toDataURL('image/png');
          setImageDataUrl(dataUrl);
        } catch (err) {
          showAlert({
            severity: 'error',
            message: 'Error generating shareable image. Please try again.',
          });
          onClose();
        } finally {
          setIsGenerating(false);
        }
      };

      generate();
    }

    // If modal closes while generating, ensure flag is reset
    if (!open && isGenerating) {
      setIsGenerating(false);
    }
    return undefined;
  }, [open, mmBotData, shareableCardRef, imageDataUrl, isGenerating, showAlert, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setImageDataUrl(null);
      setIsGenerating(false);
      setIsCopyingImage(false);
    }
  }, [open]);

  const handleCopyImage = async () => {
    if (!imageDataUrl) {
      showAlert({
        severity: 'error',
        message: 'No image data available to copy.',
      });
      return;
    }

    const canUseImageClipboard =
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      'ClipboardItem' in window &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === 'function';

    // Fallback: if the browser / environment doesn't support image clipboard,
    // download the image instead so the user can share it manually.
    if (!canUseImageClipboard) {
      const link = document.createElement('a');
      link.download = 'mmbot-share.png';
      link.href = imageDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert({
        severity: 'info',
        message: 'Your browser does not support copying images to the clipboard. We downloaded the image instead.',
      });
      return;
    }

    setIsCopyingImage(true);
    try {
      const blob = await dataUrlToBlob(imageDataUrl);
      if (!blob.type.startsWith('image/')) {
        showAlert({
          severity: 'error',
          message: 'Invalid image format for copying.',
        });
        setIsCopyingImage(false);
        return;
      }

      // At this point ClipboardItem is guaranteed to exist due to canUseImageClipboard.
      await navigator.clipboard.write([
        new window.ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      showAlert({
        severity: 'success',
        message: 'Image copied to clipboard!',
      });
    } catch (err) {
      showAlert({
        severity: 'error',
        message: 'Failed to copy image to clipboard.',
      });
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleDownload = () => {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    link.download = 'mmbot-share.png';
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert({
      severity: 'success',
      message: 'Image downloaded successfully!',
    });
  };

  const handleClose = () => {
    setImageDataUrl(null);
    setIsGenerating(false);
    onClose();
  };

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={handleClose}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          backgroundColor: theme.palette.ui?.cardBackground || theme.palette.background.paper,
          p: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant='h6'>Share Market Maker Bot</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent
          dividers
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            backgroundColor: 'background.paper',
            width: '100%',
            maxWidth: '100%',
            minHeight: '300px',
          }}
        >
          {/* Render the component off-screen initially for html2canvas */}
          <Box sx={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
            {mmBotData && <MarketMakerShareableCard mmBotData={mmBotData} ref={shareableCardRef} />}
          </Box>

          {/* Display loading or the generated image */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              minHeight: '300px',
            }}
          >
            {isGenerating || !imageDataUrl ? (
              <CircularProgress />
            ) : (
              <img
                alt='Market Maker Bot Share'
                src={imageDataUrl}
                style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, width: '100%' }}>
          <Button
            disabled={isCopyingImage || !imageDataUrl}
            startIcon={<ContentCopyIcon />}
            variant='outlined'
            onClick={handleCopyImage}
          >
            {isCopyingImage ? 'Copying...' : 'Copy Image'}
          </Button>
          <Button disabled={!imageDataUrl} startIcon={<DownloadIcon />} variant='outlined' onClick={handleDownload}>
            Download
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

MarketMakerShareableModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mmBotData: PropTypes.shape({
    volume: PropTypes.number,
    netFees: PropTypes.number,
    mmPnL: PropTypes.number,
    exchange: PropTypes.string,
    pair: PropTypes.string,
    duration: PropTypes.number,
    referralCode: PropTypes.string,
  }),
  showAlert: PropTypes.func.isRequired,
};

MarketMakerShareableModal.defaultProps = {
  mmBotData: null,
};

export default MarketMakerShareableModal;
