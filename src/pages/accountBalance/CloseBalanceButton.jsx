import React, { useState, useEffect, useContext } from 'react';
import { Stack, TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useNavigate } from 'react-router-dom';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { CASH_ASSETS } from '@/constants';
import { closeBalances } from '../../apiServices';
import { msAndKs, smartRound } from '../../util';

const noArrowStyle = {
  '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  'input[type=number]': {
    MozAppearance: 'textfield',
  },
};

const getFilteredAssets = (assets, maxQuantity) => {
  return assets.filter((asset) => {
    const absNotional = Math.abs(Number(asset.notional));
    return absNotional > 10 && !CASH_ASSETS.includes(asset.symbol) && (!maxQuantity || absNotional <= maxQuantity);
  });
};

export default function CloseBalanceButton({ selectedAccount, selectedBalance }) {
  const [maxQuantity, setMaxQuantity] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [displayedValue, setDisplayedValue] = useState(0);
  const [positionCount, setPositionCount] = useState(0);
  const { showAlert } = useContext(ErrorContext);

  const navigate = useNavigate();

  useEffect(() => {
    let calculatedValue = 0;
    let count = 0;

    if (Object.keys(selectedBalance).length === 0) {
      return;
    }

    const filteredAssets = getFilteredAssets(selectedBalance.assets, maxQuantity);
    calculatedValue = filteredAssets.reduce((sum, asset) => sum + Math.abs(asset.notional), 0);
    count = filteredAssets.length;

    setDisplayedValue(msAndKs(Number(smartRound(calculatedValue, 2))));
    setPositionCount(count);
  }, [maxQuantity, selectedBalance]);

  const onClickHandler = async () => {
    setLoading(true);
    try {
      const response = await closeBalances(
        Number(maxQuantity),
        selectedAccount.accountId === 'All Accounts' ? null : [selectedAccount.accountName]
      );
      if (typeof response === 'string') {
        showAlert({ severity: 'success', message: response.orders });
      } else {
        showAlert({
          severity: 'success',
          message: 'Orders have been successfully placed',
        });
      }
      navigate('/');
    } catch (error) {
      showAlert({ severity: 'error', message: error.message });
    }
    setLoading(false);
  };

  return (
    <Stack direction='row' justifyContent='end' spacing={2} sx={{ paddingTop: '4px' }}>
      <LoadingButton
        color='error'
        disabled={!maxQuantity}
        loading={loading}
        sx={{
          minWidth: '124px',
          whiteSpace: 'nowrap',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'var(--text-primary)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          },
          '&:disabled': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-disabled)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
        variant='outlined'
        onClick={onClickHandler}
      >
        {`Clean ${positionCount} Positions: $${displayedValue}`}
      </LoadingButton>
      <TextField
        disabled={loading}
        label='Max Quantity'
        size='small'
        sx={{
          ...noArrowStyle,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': {
              border: '1px solid rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused': {
              border: '1px solid rgba(255, 255, 255, 0.4)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'var(--text-secondary)',
          },
          '& .MuiInputBase-input': {
            color: 'var(--text-primary)',
          },
        }}
        type='number'
        value={maxQuantity}
        variant='outlined'
        onChange={(e) => setMaxQuantity(e.target.value)}
      />
    </Stack>
  );
}
