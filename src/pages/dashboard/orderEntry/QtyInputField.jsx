import React, { useCallback, useRef } from 'react';
import { Box, CircularProgress, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { debounce } from 'lodash';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import BalancePreview from '../../../shared/fields/BalancePreview';
import { NumericFormatCustom } from '../../../shared/fields/NumberFieldFormat';
import { PercentageSlider } from '../../../shared/fields/Sliders';
import { ignoreScrollEvent, noArrowStyle, numberWithCommas } from '../../../util';
import { useAccountBalanceContext } from './AccountBalanceContext';
import { TokenIcon, DexTokenIcon, ChainIcon } from '../../../shared/components/Icons';

export function QtyInputField({
  accounts,
  contractQty,
  convertedQtyLoading,
  handleQtyOnChange,
  isBase,
  isBuySide,
  isReadyToPickQty,
  onPercentageChangeCommit,
  oppositeQtyExists,
  percentage,
  qty,
  qtyPlaceholder,
  selectedAccounts,
  selectedPair,
  setPercentage,
  totalBaseAsset,
  totalQuoteAsset,
  setQtyLoading,
  setBaseQty,
  setQuoteQty,
  sliderUpdatingRef,
}) {
  const { balances, isBalanceLoading } = useAccountBalanceContext();
  const { setBalances } = useOrderForm();
  const localSliderRef = useRef(false);
  const sliderRef = sliderUpdatingRef || localSliderRef;

  // Get the asset symbol for display
  const getAssetSymbol = () => {
    if (!selectedPair) return '';
    return isBase ? selectedPair.base : selectedPair.quote;
  };

  const renderEndAdornment = () => {
    if (convertedQtyLoading && oppositeQtyExists) {
      return (
        <InputAdornment position='end'>
          <CircularProgress size={20} sx={{ color: 'info.main' }} />
        </InputAdornment>
      );
    }

    const numericContractQty = Number(contractQty);
    if (!Number.isNaN(numericContractQty) && numericContractQty > 0) {
      return (
        <InputAdornment position='end'>
          <Stack alignItems='left' direction='column'>
            <Typography color='grey.main' variant='body2'>
              {numericContractQty.toFixed(0)}
            </Typography>
            <Typography color='grey.main' variant='body2'>
              Contracts
            </Typography>
          </Stack>
        </InputAdornment>
      );
    }

    const assetSymbol = getAssetSymbol();
    const numericQty = typeof qty === 'string' ? parseFloat(qty) : Number(qty);
    if (assetSymbol && !Number.isNaN(numericQty) && numericQty > 0) {
      return (
        <InputAdornment position='end'>
          <Typography
            sx={{
              color: 'text.secondary',
              ml: 1,
              userSelect: 'none',
            }}
            variant='body2'
          >
            {assetSymbol}
          </Typography>
        </InputAdornment>
      );
    }

    return null;
  };

  const debounceHandleQtyOnChange = useCallback(
    debounce((event) => {
      handleQtyOnChange(event.target.value);
    }, 1000),
    []
  );

  const isBalancesLoaded = Object.keys(balances).length > 0;
  const currentBalance = isBase ? Math.abs(totalBaseAsset()) : Math.abs(totalQuoteAsset());
  const hasPositiveBalance = currentBalance > 0;

  // Format display value with asset symbol
  const getDisplayValue = () => {
    if (!qty || !selectedPair) return qty;

    // Return just the numeric value for the input
    return qty;
  };

  // Check if this is a DEX token (has chain_id)
  const isDexToken = selectedPair?.chain_id !== undefined;
  let assetAddress = null;
  if (isDexToken) {
    assetAddress = isBase ? selectedPair.address : selectedPair.quote_address;
  }
  const chainId = isDexToken ? selectedPair.chain_id : null;

  return (
    <Tooltip
      disableFocusListener={isReadyToPickQty}
      disableHoverListener={isReadyToPickQty}
      title='Account(s) and trading pair must be selected'
    >
      <Box>
        <TextField
          fullWidth
          autoComplete='off'
          disabled={!isReadyToPickQty}
          InputProps={{
            step: 'any',
            endAdornment: renderEndAdornment(),
            inputComponent: NumericFormatCustom,
            inputProps: {
              // Ensure numeric keyboard on mobile
              inputMode: 'decimal',
            },
          }}
          placeholder={numberWithCommas(qtyPlaceholder)}
          sx={{
            ...noArrowStyle,
            mb: 0,
          }}
          value={getDisplayValue()}
          onChange={(event) => {
            // Only process if not from slider
            if (!sliderRef.current) {
              setQtyLoading(true);
              // Strip asset symbol from input value before passing to handler
              const cleanValue = event.target.value.replace(/[^\d.]/g, '');
              debounceHandleQtyOnChange({ ...event, target: { ...event.target, value: cleanValue } });
            }
          }}
          onWheel={ignoreScrollEvent}
        />
        <Box sx={{ mt: -1 }}>
          <PercentageSlider
            ariaLabel={isBase ? 'Base Percentage' : 'Quote Percentage'}
            disabled={!isReadyToPickQty || !isBalancesLoaded || !hasPositiveBalance}
            percentage={percentage}
            setPercentage={setPercentage}
            setQtyState={isBase ? setBaseQty : setQuoteQty}
            sliderUpdatingRef={sliderRef}
            totalAsset={currentBalance}
            onChangeCommitted={onPercentageChangeCommit}
          />
        </Box>
        <BalancePreview
          accounts={accounts}
          balances={balances}
          isBalanceLoading={isBalanceLoading}
          isBase={isBase}
          isReadyToPickQty={isReadyToPickQty}
          selectedAccounts={selectedAccounts}
          selectedPair={selectedPair}
          setBalances={setBalances}
          totalBaseAsset={totalBaseAsset}
          totalQuoteAsset={totalQuoteAsset}
        />
      </Box>
    </Tooltip>
  );
}
