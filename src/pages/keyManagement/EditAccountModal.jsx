import { Box, Button, CircularProgress, Fade, FormControl, IconButton, InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography , Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from 'react';
import { renameAccount } from '@/apiServices';
import { marketOptionDisplayValue } from './utils';

const filterCredentialMarketOptions = (options) => {
  if (!options) return [];
  return options.filter((option) => option !== 'default');
};

export function EditAccountModal({
  open,
  setOpen,
  accountData,
  formData,
  loadAccounts,
  showAlert,
}) {
  const [name, setName] = useState('');
  const [selectedMarketOptions, setSelectedMarketOptions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 3,
  };

  const buttonStyle = {
    width: 100,
    height: 40,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 3,
  };

  const closeButtonStyle = {
    position: 'absolute',
    right: 8,
    top: 8,
  };

  // Initialize form when modal opens or account data changes
  useEffect(() => {
    if (open && accountData) {
      setName(accountData.accountName || '');

      // Initialize market options from existing credential options
      if (accountData.credentialOptions) {
        setSelectedMarketOptions(accountData.credentialOptions);
      }
    }
  }, [open, accountData]);

  // Initialize market options when exchange data is available
  useEffect(() => {
    if (accountData?.exchangeName && formData.credential_market_options) {
      const exchangeOptions = formData.credential_market_options[accountData.exchangeName];
      if (exchangeOptions && !accountData.credentialOptions.default) {
        const initialOptions = Object.fromEntries(
          filterCredentialMarketOptions(exchangeOptions).map((option) =>
            option === 'options' ? [option, false] : [option, true]
          )
        );
        setSelectedMarketOptions(prev => ({ ...initialOptions, ...prev }));
      }
    }
  }, [accountData?.exchangeName, formData]);

  const onCloseModal = () => {
    setOpen(false);
    setName('');
    setSelectedMarketOptions({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await renameAccount({
        account_id: accountData.id,
        new_name: name.trim(),
      });

      showAlert({
        severity: 'success',
        message: 'Account updated successfully!',
      });

      loadAccounts();
      onCloseModal();
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Could not update account: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMarketOptions = () => {
    if (!accountData?.exchangeName || !formData.credential_market_options) return null;

    const exchangeOptions = formData.credential_market_options[accountData.exchangeName];
    if (!exchangeOptions) return null;

    const filteredOptions = filterCredentialMarketOptions(exchangeOptions);
    if (filteredOptions.length === 0) return null;

    return (
      <FormControl fullWidth>
        <InputLabel id="market-options-label">Market Options</InputLabel>
        <Select
          multiple
          label="Market Options"
          labelId="market-options-label"
          renderValue={(selected) =>
            selected.map(option => marketOptionDisplayValue(option)).join(', ')
          }
          value={Object.entries(selectedMarketOptions)
            .filter(([key, value]) => value && key !== 'default')
            .map(([key]) => key)}
          onChange={(e) => {
            const selectedValues = e.target.value;
            const newOptions = {};

            filteredOptions.forEach(option => {
              newOptions[option] = selectedValues.includes(option);
            });

            setSelectedMarketOptions(newOptions);
          }}
        >
          {filteredOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {marketOptionDisplayValue(option)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  if (!accountData) return null;

  return (
    <Modal
      closeAfterTransition
      open={open}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
      slots={{ backdrop: Backdrop }}
      onClose={onCloseModal}
    >
      <Fade in={open}>
        <Box display="flex" flexDirection="column" justifyContent="center" sx={modalStyle}>
          <IconButton aria-label="close" sx={closeButtonStyle} onClick={onCloseModal}>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ marginBottom: 4 }} variant="h6">
            Edit Account
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack flexDirection="column" spacing={3}>
              {/* Exchange - Read Only */}
              <FormControl>
                <InputLabel id="exchange-label">Exchange</InputLabel>
                <Select
                  disabled
                  label="Exchange"
                  labelId="exchange-label"
                  value={accountData.exchangeName}
                >
                  <MenuItem value={accountData.exchangeName}>
                    {accountData.exchangeName}
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Account Name */}
              <TextField
                fullWidth
                required
                autoComplete="off"
                label="Account Name"
                placeholder="Account Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* Market Options (if applicable) */}
              {renderMarketOptions()}

              <Box display="flex">
                <Button
                  color="primary"
                  disabled={isSubmitting || !name.trim()}
                  sx={buttonStyle}
                  type="submit"
                  variant="contained"
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Update'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Fade>
    </Modal>
  );
}