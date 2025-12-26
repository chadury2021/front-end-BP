import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { amendOrder, convertQty, fetchCachedAccountBalances } from '../apiServices';
import AlgoNumberField from '../pages/dashboard/orderEntry/AlgoOrderFieldsComponents/AlgoNumberField';
import { ignoreScrollEvent, noArrowStyle, numberWithCommas, removeFalsyAndEmptyKeys, smartRound } from '../util';
import { NumericFormatCustom } from './fields/NumberFieldFormat';
import { PercentageSlider } from './fields/Sliders';
import LimitPriceField from './fields/LimitPriceField';
import * as FormAtoms from '../pages/dashboard/orderEntry/hooks/useFormReducer';
import { useUserMetadata } from './context/UserMetadataProvider';

export function AmendOrderDialog({
  orderAccounts,
  amendDialogOpen,
  orderId,
  pair,
  pov_target,
  setAmendDialogOpen,
  showAlert,
  side,
  exchangeNames,
  OrderSummaryData,
}) {
  const { user } = useUserMetadata();

  const { market_type, base_asset, quote_asset, is_reverse_limit_price, is_target_base, target_order_qty } =
    OrderSummaryData;

  const initialBaseQty = is_target_base ? target_order_qty : null;
  const initialQuoteQty = !is_target_base ? target_order_qty : null;

  const initialMaxClipSize = OrderSummaryData?.strategy_params?.max_clip_size || '';

  const [changes, setChanges] = useState({
    base_asset_qty: initialBaseQty,
    quote_asset_qty: initialQuoteQty,
    duration: !OrderSummaryData.pov_target ? OrderSummaryData.duration : null,
    pov_target: OrderSummaryData.pov_target && OrderSummaryData.pov_target * 100,
    limit_price: OrderSummaryData.limit_price && OrderSummaryData.limit_price,
    max_clip_size: initialMaxClipSize,
  });
  const [isAmendProcessing, setIsAmendProcessing] = useState(false);
  const [convertedQtyLoading, setConvertedQtyLoading] = useState(false);
  const [convertedQty, setConvertedQty] = useState('');
  const [assetBalances, setAssetBalances] = useState({});

  const isLoading = Object.keys(assetBalances).length === 0;
  const isPovOrder = !!pov_target;
  const isBuy = side.toLowerCase() === 'buy';

  const handleAmendOrder = async () => {
    setIsAmendProcessing(true);
    if (changes.pov_target) {
      // convert from percentage to ratio
      changes.pov_target = parseFloat(changes.pov_target) / 100;
    }

    const changePayload = removeFalsyAndEmptyKeys(changes);

    if (initialBaseQty) {
      if (changes.base_asset_qty === initialBaseQty) {
        delete changePayload.base_asset_qty;
      }
    }
    if (initialQuoteQty) {
      if (changes.quote_asset_qty === initialQuoteQty) {
        delete changePayload.quote_asset_qty;
      }
    }
    if (changes.duration === OrderSummaryData.duration) {
      delete changePayload.duration;
    }

    if (
      changes.max_clip_size !== undefined &&
      changes.max_clip_size !== null &&
      String(changes.max_clip_size) === String(initialMaxClipSize)
    ) {
      delete changePayload.max_clip_size;
    }

    if (Object.keys(changePayload).length === 0) {
      showAlert({ severity: 'info', message: 'No changes detected' });
      setIsAmendProcessing(false);
      return;
    }

    let success = false;
    try {
      await amendOrder(orderId, changePayload);
      success = true;
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Failed to amend order: ${e.message}`,
      });
    } finally {
      setIsAmendProcessing(false);
      setChanges({});
      setAmendDialogOpen(false);
      if (success) {
        window.location.reload();
      }
    }
  };

  const calculateAssetBalance = (symbol, balances) => {
    let totalAmount = 0;

    orderAccounts.forEach((account_name) => {
      if (!balances[account_name]) {
        return;
      }

      balances[account_name].assets.forEach((asset) => {
        if (asset.symbol === symbol) {
          const balance = Number(asset.amount);
          const borrowed = Number(asset.borrowed || 0);
          totalAmount += balance - borrowed;
        }
      });
    });

    return totalAmount;
  };

  useEffect(() => {
    if (!amendDialogOpen) {
      return;
    }
    // TODO: refactor to use AccountBalanceProvider
    // Needs to be able to reference accounts by ID instead of by name
    // -> needs backend to pass account_ids instead of scoped names
    const getAccountBalances = async () => {
      let data;
      try {
        data = await fetchCachedAccountBalances();
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Unable to load accounts: ${e.message}`,
        });
        return;
      }

      const entryBalances = {};

      data.balances.forEach((balance) => {
        const scopedAccountName =
          user.username === balance.username ? balance.account_name : `${balance.username}/${balance.account_name}`;

        entryBalances[scopedAccountName] = balance;
      });

      const baseAssetName = market_type !== 'spot' ? pair : base_asset;

      setAssetBalances({
        base: calculateAssetBalance(baseAssetName, entryBalances),
        quote: calculateAssetBalance(quote_asset, entryBalances),
      });
    };

    getAccountBalances();
  }, [amendDialogOpen]);

  const convertQtyWrapper = async (qty, isBase) => {
    setConvertedQtyLoading(true);
    try {
      const result = await convertQty(orderAccounts, pair, qty, isBase);
      setConvertedQty(isBase ? result.quote_asset_qty : result.base_asset_qty);
    } catch (e) {
      showAlert({ severity: 'error', message: `${e.message}` });
    }

    setConvertedQtyLoading(false);
  };

  useEffect(() => {
    if (!amendDialogOpen) {
      return () => {};
    }
    const handler = setTimeout(async () => {
      if (changes.base_asset_qty) {
        convertQtyWrapper(changes.base_asset_qty, true);
      }

      if (changes.quote_asset_qty) {
        convertQtyWrapper(changes.quote_asset_qty, false);
      }
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [changes.base_asset_qty, changes.quote_asset_qty, amendDialogOpen]);

  const balancesLoaded = Object.keys(assetBalances).length > 0;

  const handleBaseChange = (e) => {
    setConvertedQty('');
    setChanges({
      ...changes,
      quote_asset_qty: '',
      base_asset_qty: e.target.value,
    });
  };

  const handleQuoteChange = (e) => {
    setConvertedQty('');
    setChanges({
      ...changes,
      base_asset_qty: '',
      quote_asset_qty: e.target.value,
    });
  };

  const setBasePercentage = (percentage) => {
    const newVal = smartRound((percentage / 100) * assetBalances.base);
    setChanges({ ...changes, quote_asset_qty: '', base_asset_qty: newVal });
  };

  const setQuotePercentage = (percentage) => {
    const newVal = smartRound((percentage / 100) * assetBalances.quote);
    setChanges({ ...changes, base_asset_qty: '', quote_asset_qty: newVal });
  };

  const baseAssetPlaceHolder = () => {
    if (convertedQty && changes.quote_asset_qty) {
      return Number(convertedQty).toFixed(4);
    }
    return base_asset;
  };

  const quoteAssetPlaceHolder = () => {
    if (convertedQty && changes.base_asset_qty) {
      return Number(convertedQty).toFixed(4);
    }
    return quote_asset;
  };

  const setLimitPrice = (limitPrice) => {
    setChanges({ ...changes, limit_price: limitPrice });
  };

  const loadingBalance = () => {
    return (
      <Stack alignItems='center' direction='row' gap={1}>
        <Typography color='grey.disabled' variant='subtitle2'>
          Balance:
        </Typography>
        <CircularProgress size={14} sx={{ color: 'info.main' }} />
      </Stack>
    );
  };

  const basePercentage = !changes.base_asset_qty || isLoading ? 0 : (changes.base_asset_qty / assetBalances.base) * 100;
  const quotePercentage =
    !changes.quote_asset_qty || isLoading ? 0 : (changes.quote_asset_qty / assetBalances.quote) * 100;

  return (
    <Dialog maxWidth='md' open={amendDialogOpen}>
      <DialogTitle width={500}>
        <Typography variant='h5'>Amend Order</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ width: 500 }}>
        <Stack direction='column' gap={2}>
          <AlgoNumberField
            fullWidth
            autoComplete='off'
            hidden={isPovOrder}
            InputProps={{
              step: 'any',
              inputComponent: NumericFormatCustom,
            }}
            label='Duration (minutes)'
            sx={noArrowStyle}
            value={changes.duration !== null && changes.duration !== undefined ? changes.duration / 60 : ''}
            onChange={(e) => {
              const durationSeconds = Number(e.target.value) * 60;
              setChanges({ ...changes, duration: e.target.value === '' ? null : durationSeconds });
            }}
            onWheel={ignoreScrollEvent}
          />
          <Stack direction='row' gap={1}>
            <Stack direction='column' gap={1} width='50%'>
              <TextField
                fullWidth
                autoComplete='off'
                InputProps={{
                  step: 'any',
                  endAdornment: convertedQtyLoading && changes.quote_asset_qty && (
                    <InputAdornment position='end'>
                      <CircularProgress size={20} sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  ),
                  inputComponent: NumericFormatCustom,
                }}
                placeholder={baseAssetPlaceHolder()}
                sx={{ ...noArrowStyle, paddingBottom: '8px' }}
                value={changes.base_asset_qty}
                onChange={handleBaseChange}
                onWheel={ignoreScrollEvent}
              />
              <PercentageSlider
                ariaLabel='Base Percentage'
                disabled={isLoading || !is_target_base}
                percentage={basePercentage}
                setPercentage={setBasePercentage}
                onChangeCommitted={(e, val) => {}}
              />
              {balancesLoaded ? (
                <Typography variant='subtitle2'>
                  {`Balance: ${numberWithCommas(smartRound(assetBalances.base))} ${base_asset}`}
                </Typography>
              ) : (
                loadingBalance()
              )}
            </Stack>
            <Stack direction='column' gap={1} width='50%'>
              <TextField
                fullWidth
                autoComplete='off'
                InputProps={{
                  step: 'any',
                  endAdornment: convertedQtyLoading && changes.base_asset_qty && (
                    <InputAdornment position='end'>
                      <CircularProgress size={20} sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  ),
                  inputComponent: NumericFormatCustom,
                }}
                placeholder={quoteAssetPlaceHolder()}
                sx={{ ...noArrowStyle, paddingBottom: '8px' }}
                value={changes.quote_asset_qty}
                onChange={handleQuoteChange}
                onWheel={ignoreScrollEvent}
              />
              <PercentageSlider
                ariaLabel='Quote Percentage'
                disabled={isLoading || is_target_base}
                percentage={quotePercentage}
                setPercentage={setQuotePercentage}
                onChangeCommitted={(e, val) => {}}
              />
              {balancesLoaded ? (
                <Typography variant='subtitle2'>
                  {`Balance: ${numberWithCommas(smartRound(assetBalances.quote))} ${quote_asset}`}
                </Typography>
              ) : (
                loadingBalance()
              )}
            </Stack>
          </Stack>
          <AlgoNumberField
            fullWidth
            autoComplete='off'
            hidden={!isPovOrder}
            InputProps={{
              step: 'any',
              inputComponent: NumericFormatCustom,
            }}
            label='Participation Rate Target (%)'
            sx={noArrowStyle}
            value={changes.pov_target}
            onChange={(e) => setChanges({ ...changes, pov_target: e.target.value })}
            onWheel={ignoreScrollEvent}
          />
          <LimitPriceField
            FormAtoms={FormAtoms}
            isBuySide={isBuy}
            isReverseLimitPrice={is_reverse_limit_price}
            limitPrice={changes.limit_price}
            selectedAccountExchangeNames={exchangeNames}
            selectedPairName={pair}
            setLimitPrice={setLimitPrice}
            showAlert={showAlert}
          />
          <AlgoNumberField
            fullWidth
            autoComplete='off'
            InputProps={{
              step: 'any',
              inputComponent: NumericFormatCustom,
            }}
            label='Max Clip Size'
            sx={noArrowStyle}
            value={changes.max_clip_size ?? ''}
            onChange={(e) => setChanges({ ...changes, max_clip_size: e.target.value })}
            onWheel={ignoreScrollEvent}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAmendDialogOpen(false)}>Cancel</Button>
        {!isAmendProcessing ? (
          <Button onClick={handleAmendOrder}>Submit</Button>
        ) : (
          <Button disabled>
            <CircularProgress size={20} />
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
