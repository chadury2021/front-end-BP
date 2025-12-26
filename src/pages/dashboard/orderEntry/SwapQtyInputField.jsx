import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Paper, Stack, Typography, TextField, Button, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import WalletIcon from '@mui/icons-material/Wallet';
import { TokenIcon } from '@/shared/components/Icons';
import { formatQty } from '@/util';
import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import TokenSelector from './TokenSelector';

const MotionPaper = motion.create(Paper);

function SwapButton({ onClick, disabled = false }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'absolute',
        left: '50%',
        top: 'calc(50% - 16px)', // 16px matches the spacing 1 for the Stack it's in
        transform: 'translate(-50%, -50%)',
        width: '30px',
        height: '30px',
        backgroundColor: 'background.paper',

        p: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '10px',
        cursor: 'pointer',
      }}
      onClick={!disabled ? onClick : undefined}
    >
      <Box
        sx={{
          borderRadius: '10px',
          border: `1px solid ${theme.palette.ui.inputBorder}`,
          px: 2,
          py: 1.5,
          width: '14px',
          height: '18px',
          backgroundColor: theme.palette.ui.inputBackground,
          '&:hover': {
            backgroundColor: theme.palette.grey[700],
          },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <SwapVertIcon sx={{ color: disabled ? 'action.disabled' : '' }} />
      </Box>
    </Box>
  );
}

function QtyPresetInput({ balance, setQtyValue }) {
  const presets = {
    '25%': 0.25,
    '50%': 0.5,
    Max: 0.999,
  };

  return (
    <Stack alignItems='center' direction='row' spacing={1}>
      {Object.entries(presets).map(([label, value]) => (
        <Chip
          clickable
          key={label}
          label={<Typography variant='small2'>{label}</Typography>}
          size='small'
          sx={{ height: '100%' }}
          variant='outlined'
          onClick={() => setQtyValue(balance * value)}
        />
      ))}
    </Stack>
  );
}

function QtyCard({
  asset,
  assetName,
  balance,
  disabled = false,
  focused,
  isBase,
  isBuySide,
  isDex = false,
  isLoading = false,
  isPairSelected = false,
  onChange,
  onFocus,
  token,
  onSelectToken,
  price,
  qty,
  qtyPlaceholder,
  rate = null,
  selectedChain,
  sellTokenName = null,
  showRate = false,
  tokenSelectable = true,
}) {
  const theme = useTheme();
  const [qtyValue, setQtyValue] = useState('');
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false);
  const timeoutRef = useRef(null);
  const inputRef = useRef();

  useEffect(() => {
    setQtyValue(qty);
  }, [qty]);

  useEffect(() => {
    if (focused && !tokenSelectorOpen) {
      inputRef.current?.focus();
    }
  }, [focused, disabled, tokenSelectorOpen]);

  const handleFocus = useCallback(() => {
    if (!disabled && !tokenSelectorOpen) {
      inputRef.current?.focus();
      if (onFocus) {
        onFocus();
      }
    }
  }, [disabled, onFocus, tokenSelectorOpen]);

  const handleChange = (e) => {
    const { value } = e.target;
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setQtyValue(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      onChange(value);
    }, 1000);
  };

  // Format the display value for better readability while keeping original for calculations
  const numericQty = typeof qty === 'string' ? parseFloat(qty) : qty;
  const usdValue = price && numericQty ? price * numericQty : 0;
  const displayValue = disabled && numericQty && typeof numericQty === 'number' ? formatQty(numericQty) : qtyValue;
  const placeholder = qtyPlaceholder && !isLoading && !focused ? formatQty(qtyPlaceholder) : '0.00';

  // Format rate display - for the buy card, show the rate from sell token to buy token
  const rateString =
    rate && isBuySide ? `1 ${sellTokenName || 'Token'} ≈ ${formatQty(rate)} ${assetName || asset}` : '';

  return (
    <MotionPaper
      layout
      elevation={focused ? 2 : 1}
      sx={{
        border: '1px solid transparent',
        borderColor: focused ? theme.palette.ui.border : 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        bgcolor: focused ? undefined : theme.palette.background.paper,
      }}
      transition={{
        layout: { duration: 0.2, ease: 'easeInOut' },
      }}
      onClick={handleFocus}
    >
      <Stack direction='column' spacing={1} sx={{ p: 3 }}>
        <Stack direction='row' justifyContent='space-between'>
          <Typography variant='small1'>{isBuySide ? 'Buy' : 'Sell'}</Typography>
          {asset && balance !== null && (
            <Stack alignItems='center' direction='row' spacing={1}>
              <WalletIcon sx={{ height: '16px', width: '16px', color: 'text.secondary' }} />
              <Typography variant='small2'>
                {formatQty(balance)} {assetName || asset}
              </Typography>
            </Stack>
          )}
        </Stack>
        <Stack alignItems='center' direction='row' justifyContent='space-between' spacing={2}>
          <TextField
            autoComplete='off'
            disabled={disabled}
            InputProps={{
              disableUnderline: true,
              inputComponent: NumericFormatCustom,
              inputProps: {
                inputMode: 'decimal',
              },
              sx: {
                input: {
                  textAlign: 'left',
                  fontSize: '1.5rem',
                  lineHeight: '1.875rem',
                  fontWeight: 400,
                },
              },
            }}
            inputRef={inputRef}
            placeholder={placeholder}
            value={displayValue}
            variant='standard'
            onChange={handleChange}
          />

          {tokenSelectable && !isPairSelected ? (
            <TokenSelector
              fullSelectedToken={token}
              isBase={isBase}
              isBuySide={isBuySide}
              isDexOnly={isDex}
              selectedChain={isDex ? selectedChain : null}
              selectedToken={asset}
              onOpenChange={setTokenSelectorOpen}
              onSelectToken={onSelectToken}
            />
          ) : (
            <Stack alignItems='center' direction='row' spacing={1}>
              <TokenIcon style={{ height: '24px', width: '24px' }} tokenName={asset} />
              <Typography variant='subtitle1'>{assetName || asset}</Typography>
            </Stack>
          )}
        </Stack>
        <Stack direction='row' justifyContent='space-between' sx={{ height: '15px' }}>
          <Typography variant='small2'>{usdValue > 0 ? formatQty(usdValue, true) : ''}</Typography>
          {showRate && rateString ? (
            <Typography color='text.secondary' variant='small2'>
              {rateString}
            </Typography>
          ) : (
            !disabled && balance > 0 && <QtyPresetInput balance={balance} setQtyValue={setQtyValue} />
          )}
        </Stack>
      </Stack>
    </MotionPaper>
  );
}

export function SwapQtyInputField({
  onSwap,
  isBuySide,
  handleBaseQtyOnChange,
  baseBalance,
  baseQty,
  baseQtyPlaceholder,
  handleQuoteQtyOnChange,
  quoteBalance,
  quoteQty,
  quoteQtyPlaceholder,
  selectedPair,
  setSelectedPair,
  tokenPairs,
  convertedQtyLoading,
  dashboard = false,
  isAuthenticated = false,
}) {
  const [baseToken, setBaseToken] = useState('');
  const [quoteToken, setQuoteToken] = useState('USDT');
  const [focusedSide, setFocusedSide] = useState(isBuySide ? 'quote' : 'base');

  useEffect(() => {
    if (selectedPair) {
      const [baseAsset, quoteAsset] = selectedPair.label.split('-');
      setBaseToken(baseAsset);
      setQuoteToken(quoteAsset);
    }
  }, [selectedPair]);

  const onSelectBaseToken = (token) => {
    const pair = [token, quoteToken].join('-');

    const foundPair = tokenPairs.find((p) => p.id === pair);
    setBaseToken(token);
    setQuoteToken('');
    setSelectedPair(foundPair || '');
  };

  const onSelectQuoteToken = (token) => {
    const pair = [baseToken, token].join('-');
    const foundPair = tokenPairs.find((p) => p.id === pair);
    setQuoteToken(token);
    setBaseToken('');
    setSelectedPair(foundPair || '');
  };

  const cards = isBuySide
    ? [
        { key: 'quote', asset: quoteToken, isBuySide: false },
        { key: 'base', asset: baseToken, isBuySide: true },
      ]
    : [
        { key: 'base', asset: baseToken, isBuySide: false },
        { key: 'quote', asset: quoteToken, isBuySide: true },
      ];

  return (
    <Stack direction='column' spacing={4} sx={{ position: 'relative' }}>
      {cards.map((card) => (
        <QtyCard
          asset={card.asset}
          balance={card.key === 'quote' ? quoteBalance : baseBalance}
          disabled={convertedQtyLoading}
          focused={focusedSide === card.key && isAuthenticated}
          isBase={card.key === 'base'}
          isBuySide={card.isBuySide}
          isLoading={convertedQtyLoading && focusedSide !== card.key}
          key={card.key}
          qty={card.key === 'quote' ? quoteQty : baseQty}
          qtyPlaceholder={card.key === 'quote' ? quoteQtyPlaceholder : baseQtyPlaceholder}
          tokenSelectable={!dashboard}
          onChange={card.key === 'quote' ? handleQuoteQtyOnChange : handleBaseQtyOnChange}
          onFocus={() => setFocusedSide(card.key)}
          onSelectToken={card.key === 'quote' ? onSelectQuoteToken : onSelectBaseToken}
        />
      ))}
      <SwapButton disabled={convertedQtyLoading} onClick={onSwap} />
    </Stack>
  );
}

export function DexSwapQtyInputField({
  onSwap,
  buyState,
  sellState,
  selectedChain,
  convertedQtyLoading,
  onBuyTokenChange,
  onSellTokenChange,
  onBuyQtyChange,
  onSellQtyChange,
  disabled = false,
  rate = null,
}) {
  const [focusedSide, setFocusedSide] = useState('sell');

  return (
    <Stack direction='column' spacing={4} sx={{ position: 'relative' }}>
      <QtyCard
        isDex
        asset={sellState.token.id}
        assetName={sellState.token.label}
        balance={sellState.balance}
        disabled={convertedQtyLoading || disabled}
        focused={focusedSide === 'sell'}
        isPairSelected={sellState.isPairSelected}
        price={sellState.price}
        qty={sellState.qty}
        qtyPlaceholder={sellState.qtyPlaceholder}
        selectedChain={selectedChain}
        token={sellState.token}
        onChange={onSellQtyChange}
        onFocus={() => setFocusedSide('sell')}
        onSelectToken={onSellTokenChange}
      />
      <QtyCard
        disabled
        isBuySide
        isDex
        asset={buyState.token.id}
        assetName={buyState.token.label}
        balance={buyState.balance}
        focused={focusedSide === 'buy'}
        isPairSelected={buyState.isPairSelected}
        price={buyState.price}
        qty={buyState.qty}
        qtyPlaceholder={buyState.qtyPlaceholder}
        rate={rate}
        selectedChain={selectedChain}
        sellTokenName={sellState.token.label}
        token={buyState.token}
        onChange={onBuyQtyChange}
        onFocus={() => setFocusedSide('buy')}
        onSelectToken={onBuyTokenChange}
      />
      <SwapButton disabled={convertedQtyLoading || disabled} onClick={onSwap} />
    </Stack>
  );
}
