import { ErrorContext } from '@/shared/context/ErrorProvider';
import { matchesTraderId } from '@/shared/cryptoUtil';
import { ARWEAVE_BASE_URL } from '@/apiServices';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
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
import html2canvas from 'html2canvas';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo } from 'react';
import { siDiscord, siX } from 'simple-icons/icons';
import ShareableImageComponent from './ShareableImageComponent';
import ShareableProofComponent from './ShareableProofComponent';
import ShareableOrderComponent from './ShareableOrderComponent';
import { dataUrlToBlob } from './util/imageUtils';

// Helper component to render simple-icons SVG
function SimpleIcon({ icon, size = 20, color = 'currentColor' }) {
  return (
    <svg fill={color} height={size} role='img' viewBox='0 0 24 24' width={size} xmlns='http://www.w3.org/2000/svg'>
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}

SimpleIcon.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.shape({
    title: PropTypes.string,
    path: PropTypes.string.isRequired,
  }).isRequired,
  size: PropTypes.number,
};

// Add defaultProps for optional props
SimpleIcon.defaultProps = {
  color: 'currentColor',
  size: 20,
};

function ShareableImageModal({
  open,
  onClose,
  shareData,
  accounts,
  imageDataUrl,
  isGenerating,
  setIsGenerating,
  setImageDataUrl,
  showAlert,
  sx,
  containerSx,
  headerTitle,
  shareableRef,
}) {
  const theme = useTheme();
  const { showAlert: showAlertContext } = React.useContext(ErrorContext);
  const [isCopyingImage, setIsCopyingImage] = React.useState(false);
  const [isSharingToArweave, setIsSharingToArweave] = React.useState(false);
  const [arweaveUrl, setArweaveUrl] = React.useState(null);

  // Reset Arweave URL when modal opens with a new order
  useEffect(() => {
    if (open && shareData?.shareType === 'order') {
      setArweaveUrl(shareData.arweave_tx_url || null);
    }
  }, [open, shareData]);

  // Find the traderId from shareData
  const traderId = shareData?.traderId;
  // Find the account name matching the traderId
  const accountName = useMemo(() => {
    // Corrected condition: check if accounts or traderId are missing
    if (!accounts || !traderId) return 'N/A';
    const matchingAccount = accounts.find(
      (account) => account.hashed_api_key && matchesTraderId(account.hashed_api_key, traderId)
    );
    return matchingAccount ? matchingAccount.name : 'N/A';
  }, [accounts, traderId]);

  // Find the exchange name for the icon
  const accountExchange = useMemo(() => {
    // Corrected condition: check if accounts or traderId are missing
    if (!accounts || !traderId) return null;
    const matchingAccount = accounts.find(
      (account) => account.hashed_api_key && matchesTraderId(account.hashed_api_key, traderId)
    );
    return matchingAccount ? matchingAccount.exchange : null;
  }, [accounts, traderId]);

  useEffect(() => {
    // Only generate if modal is open, generation requested, data available, ref attached, and no image exists yet
    if (open && isGenerating && shareData && shareableRef?.current && !imageDataUrl) {
      const generate = async () => {
        // console.log('[ModalEffect] Starting generation in modal...');
        try {
          const canvas = await html2canvas(shareableRef.current, {
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: null, // Or match component background if needed
          });
          const dataUrl = canvas.toDataURL('image/png');
          // console.log('[ModalEffect] Generation success, setting URL.');
          setImageDataUrl(dataUrl); // Set the generated image URL
        } catch (err) {
          // console.error('[ModalEffect] Error generating shareable image:', err);
          showAlertContext({ severity: 'error', message: 'Error generating shareable image. Please try again.' });
          onClose(); // Close modal on error
        } finally {
          // console.log('[ModalEffect] Resetting generation flag.');
          setIsGenerating(false); // Generation attempt finished
        }
      };

      // Delay slightly to ensure rendering complete
      const timerId = setTimeout(generate, 100);
      return () => {
        clearTimeout(timerId);
        return undefined;
      };
    }

    // If modal closes while generating, ensure flag is reset
    if (!open && isGenerating) {
      setIsGenerating(false);
    }
    return undefined;
  }, [
    open,
    isGenerating,
    shareData,
    shareableRef,
    imageDataUrl,
    setIsGenerating,
    setImageDataUrl,
    showAlertContext,
    onClose,
  ]);

  const handleCopyImage = async () => {
    if (!imageDataUrl) {
      showAlertContext({ severity: 'error', message: 'No image data available to copy.' });
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
      link.download = shareData?.shareType === 'proof' ? 'tread-proof.png' : 'tread-position.png';
      link.href = imageDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlertContext({
        severity: 'info',
        message: 'Your browser does not support copying images to the clipboard. We downloaded the image instead.',
      });
      return;
    }

    setIsCopyingImage(true);
    try {
      const blob = await dataUrlToBlob(imageDataUrl);
      if (!blob.type.startsWith('image/')) {
        showAlertContext({ severity: 'error', message: 'Invalid image format for copying.' });
        setIsCopyingImage(false);
        return;
      }
      await navigator.clipboard.write([
        new window.ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      showAlertContext({ severity: 'success', message: 'Image copied to clipboard!' });
    } catch (err) {
      showAlertContext({ severity: 'error', message: 'Failed to copy image to clipboard.' });
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleShareToArweave = async () => {
    if (!shareData?.id) {
      showAlertContext({ severity: 'error', message: 'No order ID available for sharing' });
      return;
    }

    setIsSharingToArweave(true);
    try {
      const response = await fetch(`/internal/analytics/order/${shareData.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken':
            document.cookie
              .split('; ')
              .find((row) => row.startsWith('csrftoken='))
              ?.split('=')[1] || '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share to Arweave');
      }

      const data = await response.json();
      if (data.arweave_tx_id) {
        const arweaveAppUrl = `${ARWEAVE_BASE_URL}${data.arweave_tx_id}`;
        // Create a new object with the updated Arweave URL
        const updatedShareData = {
          ...shareData,
          arweave_tx_url: arweaveAppUrl,
        };
        // Update the Arweave URL state
        setArweaveUrl(arweaveAppUrl);
        // Clear the existing image and trigger regeneration
        setImageDataUrl('');
        setIsGenerating(true);
      } else {
        throw new Error('Failed to get Arweave URL');
      }
    } catch (error) {
      showAlertContext({ severity: 'error', message: error.message || 'Failed to share to Arweave' });
    } finally {
      setIsSharingToArweave(false);
    }
  };

  const handleViewArweaveProof = () => {
    if (arweaveUrl) {
      window.open(arweaveUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    // Use a more descriptive filename based on type
    const filename = shareData?.shareType === 'proof' ? 'tread-proof.png' : 'tread-position.png';
    link.download = filename;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Conditionally render the correct component based on shareType
  const renderShareableComponent = (inputArweaveUrl) => {
    if (!shareData) return null;

    switch (shareData.shareType) {
      case 'position':
        return <ShareableImageComponent positionData={shareData} ref={shareableRef} />;
      case 'proof':
        if (!shareData) {
          showAlert('error', 'No proof data available');
          return null;
        }
        return (
          <ShareableProofComponent
            accountExchange={accountExchange}
            accountName={accountName}
            proofData={shareData}
            ref={shareableRef}
          />
        );
      case 'order':
        if (!shareData) {
          showAlert('error', 'No order data available');
          return null;
        }
        return (
          <ShareableOrderComponent
            orderData={{
              ...shareData,
              arweave_tx_url: inputArweaveUrl,
            }}
            ref={shareableRef}
          />
        );
      default:
        // console.warn('Unknown shareType:', shareData.shareType);
        return <Typography color='error'>Invalid share data type.</Typography>;
    }
  };

  return (
    <Dialog fullWidth maxWidth='sm' open={open} sx={sx} onClose={onClose}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          backgroundColor: theme.palette.ui.cardBackground,
          p: 3,
          ...containerSx,
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
          <Typography variant='h6'>{headerTitle || 'Share'}</Typography>
          <IconButton onClick={onClose}>
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
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            maxWidth: '100%',
            minHeight: '300px',
            ...containerSx,
          }}
        >
          {/* Render the component off-screen initially for html2canvas */}
          <Box sx={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
            {renderShareableComponent(arweaveUrl)}
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
              <img alt='' src={imageDataUrl} style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, width: '100%' }}>
          {shareData?.shareType === 'order' && (
            <Button
              disabled={isSharingToArweave}
              sx={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                '&:hover': {
                  backgroundColor: '#F5F5F5',
                },
              }}
              variant='contained'
              onClick={arweaveUrl ? handleViewArweaveProof : handleShareToArweave}
            >
              {(() => {
                if (isSharingToArweave) {
                  return (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, pr: '5px', color: 'text.primary' }} />
                      Posting...
                    </>
                  );
                }
                return arweaveUrl ? 'View on Arweave' : 'Post On-Chain Proof';
              })()}
            </Button>
          )}
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

ShareableImageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  shareData: PropTypes.shape({
    traderId: PropTypes.string,
    shareType: PropTypes.string,
    referralLink: PropTypes.string,
  }).isRequired,
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      hashed_api_key: PropTypes.string,
      name: PropTypes.string,
      exchange: PropTypes.string,
    })
  ).isRequired,
  shareableRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  imageDataUrl: PropTypes.string.isRequired,
  isGenerating: PropTypes.bool.isRequired,
  setIsGenerating: PropTypes.func.isRequired,
  setImageDataUrl: PropTypes.func.isRequired,
  showAlert: PropTypes.func.isRequired,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array]), // Allow object or array for sx
  containerSx: PropTypes.oneOfType([PropTypes.object, PropTypes.array]), // Allow object or array for containerSx
  headerTitle: PropTypes.string,
};

ShareableImageModal.defaultProps = {
  sx: {},
  containerSx: {},
  headerTitle: 'Share',
};

export default ShareableImageModal;
