import ErrorIcon from '@mui/icons-material/Error';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { Box, FormControl, IconButton, Stack, Tooltip } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useTheme } from '@mui/system';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AccountDropdown from '@/shared/fields/AccountDropdown';
import resolveExchangeName from '@/shared/utils/resolveExchangeName';
import { getContractInfo, getPairPrice } from '../../apiServices';
import { TokenIcon } from '../../shared/components/Icons';
import BalancePreview from '../../shared/fields/BalancePreview';
import { NumericFormatCustom } from '../../shared/fields/NumberFieldFormat';
import { ignoreScrollEvent } from '../../util';
import PairSelector from '../dashboard/orderEntry/PairSelector';
import { PositionSideButtons } from '../dashboard/orderEntry/PositionSideButtons';

function OrderFormItem({
  accounts,
  balances,
  dispatch,
  favouritePairs,
  index,
  orderItemState,
  setFavouritePairs,
  showAlert,
  tokenPairs,
  exchangeSettingsByAccount,
}) {
  const theme = useTheme();

  const [selectedPairPrice, setSelectedPairPrice] = useState({
    pair: '',
    price: 0,
  });
  const [contractInfoByAccountId, setContractInfoByAccountId] = useState({});
  const latestPairIdRef = useRef(orderItemState.pair?.id);
  useEffect(() => {
    latestPairIdRef.current = orderItemState.pair?.id;
  }, [orderItemState.pair?.id]);

  const exchangePairExists = useMemo(() => {
    // only false if both account and pair are set
    const { pair: selectedPair, accounts: selectedAccounts } = orderItemState;
    if (!selectedPair?.id || !selectedAccounts?.[0]?.exchangeName) {
      return true;
    }

    const pairId = selectedPair.id;
    const resolvedExchangeName = resolveExchangeName(selectedAccounts[0].exchangeName);
    const pairExists = tokenPairs.some(
      (tokenPair) => tokenPair.id === pairId && tokenPair.exchanges.includes(resolvedExchangeName)
    );
    return pairExists;
  }, [orderItemState.pair?.id, orderItemState.accounts, tokenPairs]);

  const loadContractInfo = async (pair, accountIds) => {
    try {
      const result = await getContractInfo(pair, accountIds);
      setContractInfoByAccountId(result);
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not load contract info: ${e.message}`,
      });
    }
  };

  const fetchPairPrice = async () => {
    if (!orderItemState.pair || orderItemState.accounts.length === 0) {
      return null;
    }

    const selectedPairName = orderItemState.pair.id;
    try {
      const result = await getPairPrice(selectedPairName, orderItemState.accounts[0].exchangeName);
      const pairPrice = result[selectedPairName];
      setSelectedPairPrice({ pair: selectedPairName, price: pairPrice });

      // Update the pair data with the new price
      dispatch({
        type: 'UPDATE_ROW',
        payload: {
          rowIndex: index,
          accounts: orderItemState.accounts,
          pair: { ...orderItemState.pair, price: pairPrice },
          side: orderItemState.side,
          qty: orderItemState.qty,
          isBaseAsset: orderItemState.isBaseAsset,
          posSide: orderItemState.posSide,
        },
      });

      return pairPrice;
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not fetch price for ${selectedPairName}: ${e.message}`,
      });
      return null;
    }
  };

  useEffect(() => {
    if (orderItemState.pair.id && orderItemState.accounts.length > 0) {
      fetchPairPrice();
    }
  }, [orderItemState.accounts]);

  useEffect(() => {
    if (orderItemState.pair.id && orderItemState.pair.is_contract) {
      loadContractInfo(
        orderItemState.pair.id,
        orderItemState.accounts.map((acc) => acc.id)
      );
    }
  }, [orderItemState.pair]);

  const calculateAssetBalance = (symbol) => {
    let totalAmount = 0;
    orderItemState.accounts.forEach((a) => {
      if (!balances[a.id]) {
        return;
      }

      balances[a.id].assets.forEach((asset) => {
        if (asset.symbol === symbol) {
          const balance = Number(asset.amount);
          const borrowed = Number(asset.borrowed || 0);
          totalAmount += balance - borrowed;
        }
      });
    });
    return totalAmount;
  };

  const calculateQuoteAssetBalance = (pairPrice) => {
    if (!pairPrice) {
      return null;
    }

    if (!orderItemState.pair) {
      return null;
    }

    if (!orderItemState.pair?.is_inverse) {
      return calculateAssetBalance(orderItemState.pair.quote);
    }

    return calculateAssetBalance(orderItemState.pair.base) * pairPrice;
  };

  const totalBaseBalance = () => {
    if (!orderItemState.pair) {
      return null;
    }
    const baseAsset = orderItemState.pair.is_contract ? orderItemState.pair.id : orderItemState.pair.base;
    return Math.abs(calculateAssetBalance(baseAsset));
  };

  const handleAccountDelete = (selectedValues) => {
    const selectedAccountNames = Array.isArray(selectedValues) ? selectedValues : [selectedValues];
    const selectedAccounts = selectedAccountNames.map((name) => accounts[name]);
    const updatedAccounts = orderItemState.accounts.filter((acc) => !selectedAccounts.includes(acc));
    dispatch({
      type: 'UPDATE_ROW',
      payload: {
        rowIndex: index,
        accounts: updatedAccounts,
        pair: orderItemState.pair,
        side: orderItemState.side,
        qty: orderItemState.qty,
        isBaseAsset: orderItemState.isBaseAsset,
        posSide: orderItemState.posSide,
      },
    });
  };

  const handleAccountChange = (selectedValues) => {
    const selectedAccountNames = Array.isArray(selectedValues) ? selectedValues : [selectedValues];
    const selectedAccounts = selectedAccountNames.map((name) => accounts[name]);
    dispatch({
      type: 'UPDATE_ROW',
      payload: {
        rowIndex: index,
        accounts: selectedAccounts,
        pair: orderItemState.pair,
        side: orderItemState.side,
        qty: orderItemState.qty,
        isBaseAsset: orderItemState.isBaseAsset,
        posSide: orderItemState.posSide,
      },
    });
  };

  const handlePairChange = async (value) => {
    if (!value) {
      dispatch({
        type: 'UPDATE_ROW',
        payload: {
          rowIndex: index,
          accounts: orderItemState.accounts,
          pair: null,
          side: orderItemState.side,
          qty: orderItemState.qty,
          isBaseAsset: orderItemState.isBaseAsset,
          posSide: orderItemState.posSide,
        },
      });
      return;
    }

    // Immediately update UI with selection; defer price fetch
    dispatch({
      type: 'UPDATE_ROW',
      payload: {
        rowIndex: index,
        accounts: orderItemState.accounts,
        pair: { ...value, price: null },
        side: orderItemState.side,
        qty: orderItemState.qty,
        isBaseAsset: orderItemState.isBaseAsset,
        posSide: orderItemState.posSide,
      },
    });

    const expectedPairId = value.id;
    const expectedExchange = orderItemState.accounts[0]?.exchangeName;
    if (expectedPairId && expectedExchange) {
      try {
        const result = await getPairPrice(expectedPairId, expectedExchange);
        const fetchedPrice = result[expectedPairId];
        setSelectedPairPrice({ pair: expectedPairId, price: fetchedPrice });

        // Only apply if selection hasn't changed
        if (latestPairIdRef.current === expectedPairId) {
          dispatch({
            type: 'UPDATE_ROW',
            payload: {
              rowIndex: index,
              accounts: orderItemState.accounts,
              pair: { ...value, price: fetchedPrice },
              side: orderItemState.side,
              qty: orderItemState.qty,
              isBaseAsset: orderItemState.isBaseAsset,
              posSide: orderItemState.posSide,
            },
          });
        }
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Could not fetch price for ${expectedPairId}: ${e.message}`,
        });
      }
    }
  };

  const handleQtyChange = (event) => {
    dispatch({
      type: 'UPDATE_ROW',
      payload: {
        rowIndex: index,
        accounts: orderItemState.accounts,
        pair: orderItemState.pair,
        side: orderItemState.side,
        qty: event.target.value,
        isBaseAsset: orderItemState.isBaseAsset,
        posSide: orderItemState.posSide,
      },
    });
  };

  const handlePosSideChange = (value) => {
    dispatch({
      type: 'UPDATE_ROW',
      payload: {
        rowIndex: index,
        accounts: orderItemState.accounts,
        pair: orderItemState.pair,
        side: orderItemState.side,
        qty: orderItemState.qty,
        isBaseAsset: orderItemState.isBaseAsset,
        posSide: value,
      },
    });
  };

  const handleDeleteOnClick = () => {
    dispatch({
      type: 'REMOVE_ROW',
      payload: {
        rowIndex: index,
        side: orderItemState.side,
      },
    });
  };

  const isPairNameValidForDeconstruct =
    orderItemState.pair && orderItemState.pair.id.match(/([a-zA-Z0-9]+)(:\w+)?-([a-zA-Z0-9]+)/);
  const conditionalAssetName =
    orderItemState.pair && (orderItemState.isBaseAsset ? orderItemState.pair.base : orderItemState.pair.quote);
  const asset = !orderItemState.pair || !isPairNameValidForDeconstruct ? '' : conditionalAssetName;

  const swapAssetTooltipMessage = orderItemState.isBaseAsset
    ? `Swap asset to ${orderItemState.pair?.quote}`
    : `Swap asset to ${orderItemState.pair?.base}`;
  const swapAssetTooltip = !orderItemState.pair ? '' : swapAssetTooltipMessage;

  const swapAssetOnClick = () => {
    dispatch({
      type: 'UPDATE_ROW',
      payload: {
        rowIndex: index,
        accounts: orderItemState.accounts,
        pair: orderItemState.pair,
        side: orderItemState.side,
        qty: '',
        isBaseAsset: !orderItemState.isBaseAsset,
      },
    });
  };

  const noArrowStyle = {
    '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    'input[type=number]': {
      MozAppearance: 'textfield',
    },
  };

  const isPairSelected = orderItemState.pair.id !== '';

  const isReadyToPickQty = orderItemState.accounts && orderItemState.accounts.length > 0 && isPairSelected;

  const pairLevelPosModeExchanges = ['Bybit'];

  const isHedgeMode =
    Object.keys(exchangeSettingsByAccount).length > 0 &&
    orderItemState.accounts.length > 0 &&
    orderItemState.accounts.some((acc) => {
      const exchangeSettings = exchangeSettingsByAccount[acc.id];

      let posMode = null;
      if (pairLevelPosModeExchanges.includes(acc.exchangeName)) {
        const contractInfo = contractInfoByAccountId && contractInfoByAccountId[acc.id];
        posMode = contractInfo && contractInfo.pos_mode;
      } else {
        posMode = exchangeSettings && exchangeSettings.pos_mode;
      }

      return posMode === 'long_short_mode';
    });

  const posSideEnabled = isHedgeMode && orderItemState.pair.id && orderItemState.pair.is_contract;

  useEffect(() => {
    if (posSideEnabled) {
      handlePosSideChange('long');
    } else {
      handlePosSideChange('');
    }
  }, [posSideEnabled]);

  return (
    <Stack alignItems='center' direction='row' spacing={1} sx={{ width: '100%' }}>
      <Grid container spacing={1} sx={{ flexGrow: 1 }}>
        <Grid item md={posSideEnabled ? 3 : 4} xs={6}>
          <AccountDropdown
            multiOrder
            accounts={accounts}
            extraStyling={{ maxHeight: '50.25px' }}
            handleSelectedAccountsChange={(e) => handleAccountChange(e.target.value)}
            handleSelectedAccountsDelete={handleAccountDelete}
            selectedAccounts={orderItemState.accounts.map((acc) => acc.name)}
          />
        </Grid>
        <Grid item md={posSideEnabled ? 3 : 4} xs={6}>
          <Box
            alignItems='center'
            display='flex'
            height='40.25px'
            justifyContent='center'
            padding='4px'
            sx={{
              cursor: 'pointer',
              border: `1px solid ${theme.palette.text.disabled}`,
              borderRadius: '4px',
            }}
          >
            {!exchangePairExists && (
              <Tooltip title='This pair is not available on the selected exchange'>
                <ErrorIcon
                  sx={{
                    ml: 1,
                    color: theme.palette.warning.main,
                    fontSize: 'medium',
                  }}
                />
              </Tooltip>
            )}
            <PairSelector
              multiOrder
              accounts={accounts}
              balances={balances}
              favourites={favouritePairs}
              pairs={tokenPairs}
              renderPairOption={(pair) => (
                <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                  <Box pr={0.5}>
                    <TokenIcon style={{ width: 16, height: 16 }} tokenName={pair.base} />
                  </Box>
                  <Box pr={0.5}>
                    <TokenIcon style={{ width: 16, height: 16 }} tokenName={pair.quote} />
                  </Box>
                  {pair.label}
                </Box>
              )}
              renderSelectedPair={(pair) => (
                <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                  <Box pr={0.5}>
                    <TokenIcon style={{ width: 16, height: 16 }} tokenName={pair.base} />
                  </Box>
                  <Box pr={0.5}>
                    <TokenIcon style={{ width: 16, height: 16 }} tokenName={pair.quote} />
                  </Box>
                  {pair.label}
                </Box>
              )}
              selectedAccounts={orderItemState.accounts.map((acc) => acc.name)}
              selectedPairName={orderItemState.pair.id}
              setFavourites={setFavouritePairs}
              setSelectedPair={handlePairChange}
              showAlert={showAlert}
            />
          </Box>
        </Grid>
        <Grid item md={4} xs={posSideEnabled ? 8 : 12}>
          <FormControl
            fullWidth
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
            variant='outlined'
          >
            <Box width='100%'>
              <OutlinedInput
                fullWidth
                disabled={!isPairSelected}
                endAdornment={
                  <>
                    <Typography
                      sx={{ display: isPairSelected ? 'inline' : 'none', fontSize: '0.8rem' }}
                      variant='body2'
                    >
                      {asset}
                    </Typography>
                    <Tooltip title={swapAssetTooltip}>
                      <span>
                        <IconButton disabled={!isPairSelected} onClick={swapAssetOnClick}>
                          <SwapHoriz />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                }
                inputComponent={NumericFormatCustom}
                inputProps={{
                  step: 'any',
                }}
                placeholder='Quantity'
                style={{ paddingRight: 0 }}
                sx={noArrowStyle}
                value={orderItemState.qty}
                onChange={handleQtyChange}
                onWheel={ignoreScrollEvent}
              />
              <Box sx={{ mt: 1 }}>
                <BalancePreview
                  balances={balances}
                  isBase={orderItemState.isBaseAsset}
                  isReadyToPickQty={isReadyToPickQty}
                  selectedPair={isPairSelected ? orderItemState.pair : null}
                  totalBaseAsset={totalBaseBalance}
                  totalQuoteAsset={() => {
                    return calculateQuoteAssetBalance(selectedPairPrice.price);
                  }}
                />
              </Box>
            </Box>
          </FormControl>
        </Grid>
        {posSideEnabled && (
          <Grid item md={2} xs={4}>
            <Box height='50.25px'>
              <PositionSideButtons posSide={orderItemState.posSide} setPosSide={handlePosSideChange} />
            </Box>
          </Grid>
        )}
      </Grid>
      <IconButton style={{ marginBottom: '14px' }} onClick={handleDeleteOnClick}>
        <RemoveCircleOutline sx={{ fontSize: 25, color: theme.palette.error.main }} />
      </IconButton>
    </Stack>
  );
}

export default OrderFormItem;
