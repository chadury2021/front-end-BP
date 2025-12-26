import { useCallback, useState, useMemo } from 'react';
import { formatEther } from 'ethers';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LOGOS from '@images/logos';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Box,
  OutlinedInput,
  Stack,
  Chip,
  Avatar,
  FormControl,
  Typography,
  Tooltip,
  SvgIcon,
  TextField,
  Skeleton,
  Select,
  MenuItem,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { useToast } from '@/shared/context/ToastProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import {
  useHyperliquidDeposit,
  useHyperliquidWithdraw,
  useHyperliquidTransfer,
} from '@/hooks/useHyperliquidDepositWithdraw';
import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import { TokenIcon } from '@/shared/components/Icons';
import WalletConnectionField from '@/pages/accountBalance/portfolio/WalletConnectionField';
import WALLET_ICONS from '@images/wallet_icons';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { insertEllipsis } from '@/util';
import WalletSelector from '@/shared/components/WalletSelector';

const truncateAddress = (address) => {
  return insertEllipsis(address, 6, 4);
};

function DepositToken({ token, selected, selectDepositToken }) {
  return (
    <Tooltip title={`${token.id.toUpperCase()} on ${token.chainName}`}>
      <Stack
        clickable
        alignItems='center'
        color={selected ? 'primary' : 'text.secondary'}
        direction='column'
        spacing={1}
        sx={{
          borderRadius: 2.5,
          p: 2.5,
          width: '40px',
          bgcolor: selected ? 'success.main' : 'background.base',
          '&:hover': {
            bgcolor: 'success.main',
          },
          cursor: 'pointer',
        }}
        onClick={() => selectDepositToken(token)}
      >
        <TokenIcon
          chainId={token.id === 'usdc' ? Number(token.chainId) : null}
          style={{ height: '25px', width: '25px' }}
          tokenName={token.id}
        />
        <Typography variant='body2'>{token.id.toUpperCase()}</Typography>
      </Stack>
    </Tooltip>
  );
}

function DepositTokenSelector({ tokens, depositToken, selectDepositToken }) {
  const nonHyperunitTokens = tokens.filter((token) => !token.isHyperunit);
  const hyperunitTokens = tokens.filter((token) => token.isHyperunit);

  return (
    <Stack direction='row' justifyContent='space-evenly' spacing={2.5}>
      <Stack alignItems='center' direction='column' spacing={2.5}>
        <Typography color='primary.main' variant='body2'>
          Hyperliquid
        </Typography>
        <Stack alignItems='center' direction='row' justifyContent='center' spacing={2.5}>
          {nonHyperunitTokens.map((token) => (
            <DepositToken
              key={token.id}
              selectDepositToken={selectDepositToken}
              selected={depositToken?.id === token.id}
              token={token}
            />
          ))}
        </Stack>
      </Stack>
      <Divider flexItem orientation='vertical' variant='middle' />
      <Stack alignItems='center' direction='column' spacing={2.5}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Typography color='primary.main' variant='body2'>
            Unit Protocol
          </Typography>
          <Tooltip title='Service provided by Unit Protocol. See: https://app.hyperunit.xyz for more information'>
            <HelpOutlineIcon fontSize='small' sx={{ color: 'primary.main', height: '15px', width: '15px' }} />
          </Tooltip>
        </Stack>
        <Stack alignItems='center' direction='row' justifyContent='center' spacing={2.5}>
          {hyperunitTokens.map((token) => (
            <DepositToken
              key={token.id}
              selectDepositToken={selectDepositToken}
              selected={depositToken?.id === token.id}
              token={token}
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

const arrowPulse = keyframes`
  0% { opacity: 0; transform: translateX(-4px); }
  50% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(4px); }
`;

function ChevronRight(props) {
  return (
    <SvgIcon fontSize='small' viewBox='0 0 24 24' {...props}>
      <path d='M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z' />
    </SvgIcon>
  );
}

function DepositFlowArrow() {
  return (
    <Stack alignItems='center' direction='row' spacing={-3}>
      {[0, 1, 2].map((i) => (
        <ChevronRight
          key={i}
          sx={{
            color: 'primary.main',
            opacity: 0,
            animation: `${arrowPulse} 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.15))',
          }}
        />
      ))}
    </Stack>
  );
}

function DepositFlow({
  connectedAddress,
  connectedWallet,
  depositToken,
  depositAddress,
  depositAddressVerified,
  hyperliquidAddress,
}) {
  if (!connectedWallet) {
    return null;
  }

  const getWalletIcon = (wallet) => {
    // If wallet has its own icon (from our enhanced detection)
    if (wallet.icon) {
      return wallet.icon;
    }

    // Fallback to our static icons
    return WALLET_ICONS[wallet.id];
  };

  return (
    <Stack direction='row' justifyContent='center' spacing={2}>
      <Tooltip arrow placement='bottom' title={`${connectedWallet.name} wallet: ${connectedAddress}`}>
        <Box
          alt='wallet logo'
          component='img'
          src={getWalletIcon(connectedWallet)}
          sx={{ height: 25, width: 25, bgcolor: 'background.app', p: 3, borderRadius: 2.5 }}
        />
      </Tooltip>

      <DepositFlowArrow />

      {depositToken?.isHyperunit && (
        <>
          <Tooltip
            arrow
            placement='bottom'
            title={
              depositAddressVerified?.success
                ? `Deposit address (${depositAddress}) provided by Unit Protocol guardian verified.`
                : `Failed to verify deposit address (${depositAddress}) provided by Unit Protocol`
            }
          >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Box
                alt='Logo'
                component='img'
                src={LOGOS.hyperunit}
                sx={{
                  height: 25,
                  width: 25,
                  bgcolor: 'background.app',
                  p: 3,
                  borderRadius: 2.5,
                  border: '2px solid',
                  borderColor: depositAddressVerified?.success ? 'success.main' : 'error.main',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  height: 18,
                  width: 18,
                  borderRadius: '50%',
                  bgcolor: depositAddressVerified?.success ? 'success.main' : 'error.main',
                  border: '2px solid',
                  borderColor: 'background.app',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {depositAddressVerified?.success ? (
                  <CheckIcon sx={{ fontSize: 12 }} />
                ) : (
                  <CloseIcon sx={{ fontSize: 12 }} />
                )}
              </Box>
            </Box>
          </Tooltip>
          <DepositFlowArrow />
        </>
      )}

      <Tooltip arrow placement='bottom' title={`Hyperliquid account: ${hyperliquidAddress}`}>
        <Box
          alt='Logo'
          component='img'
          src={LOGOS.hyperliquid}
          sx={{ height: 25, width: 25, bgcolor: 'background.app', p: 3, borderRadius: 2.5 }}
        />
      </Tooltip>
    </Stack>
  );
}

function DepositEntry({
  depositToken,
  depositAddress,
  depositAddressVerified,
  connectedAddress,
  balance,
  depositCallback,
  errorMessage,
  isDepositing,
  hyperunitFees,
}) {
  const [amount, setAmount] = useState(null);

  const unableToSubmitMessage = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }

    if (depositToken?.isHyperunit && !depositAddressVerified?.success) {
      return `Failed to verify deposit address [${depositAddress}] provided by Unit Protocol`;
    }

    if (amount < depositToken?.minAmount) {
      return `Minimum deposit is ${depositToken?.minAmount} ${depositToken?.id.toUpperCase()}`;
    }

    if (balance && amount > balance) {
      return `Insufficient balance. Available balance is ${balance} ${depositToken?.id.toUpperCase()}`;
    }

    return null;
  }, [depositAddressVerified, depositToken, amount, balance, errorMessage]);

  if (!depositToken) {
    return (
      <Button disabled fullWidth variant='contained'>
        Select a token to deposit
      </Button>
    );
  }

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  return (
    <Stack direction='column' spacing={2}>
      {errorMessage && (
        <Typography color='warning.main' textAlign='center' variant='body1'>
          {errorMessage}
        </Typography>
      )}

      {connectedAddress && (
        <FormControl fullWidth>
          <NumericFormatCustom
            customInput={OutlinedInput}
            endAdornment={
              <InputAdornment position='end'>
                <Button
                  variant='text'
                  onClick={() => {
                    setAmount(balance);
                  }}
                >
                  Max: {balance}
                </Button>
              </InputAdornment>
            }
            placeholder={`Amount (min. ${depositToken?.minAmount} ${depositToken?.id.toUpperCase()})`}
            value={amount}
            onChange={handleAmountChange}
          />
        </FormControl>
      )}

      {depositToken?.isHyperunit && <HyperunitFees fees={hyperunitFees} token={depositToken} />}

      <Tooltip title={unableToSubmitMessage}>
        <span>
          <Button
            fullWidth
            disabled={unableToSubmitMessage || isDepositing}
            variant='contained'
            onClick={() => depositCallback(amount)}
          >
            {isDepositing ? <CircularProgress size={16} /> : 'Deposit'}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

function WithdrawEntry({
  balance,
  connectedAddress,
  withdrawToken,
  errorMessage,
  isWithdrawing,
  withdrawCallback,
  hyperunitFees,
}) {
  const [amount, setAmount] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState(null);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const unableToSubmitMessage = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }

    if (withdrawToken?.minAmount && amount < withdrawToken?.minAmount) {
      return `Minimum withdraw is ${withdrawToken?.minAmount} ${withdrawToken?.id.toUpperCase()}`;
    }

    if (balance && amount > balance) {
      return `Insufficient balance. Available balance is ${balance} ${withdrawToken?.id.toUpperCase()}`;
    }

    return null;
  }, [withdrawToken, amount, balance, errorMessage]);

  if (!withdrawToken) {
    return (
      <Button disabled fullWidth variant='contained'>
        Select a token to withdraw
      </Button>
    );
  }

  return (
    <Stack direction='column' spacing={2}>
      {errorMessage && (
        <Typography color='warning.main' textAlign='center' variant='body1'>
          {errorMessage}
        </Typography>
      )}

      {withdrawToken && (
        <FormControl fullWidth>
          <NumericFormatCustom
            customInput={OutlinedInput}
            endAdornment={
              <InputAdornment position='end'>
                <Button
                  variant='text'
                  onClick={() => {
                    setAmount(balance);
                  }}
                >
                  Max: {balance}
                </Button>
              </InputAdornment>
            }
            placeholder={`Amount (min. ${withdrawToken?.minAmount} ${withdrawToken?.id.toUpperCase()})`}
            value={amount}
            onChange={handleAmountChange}
          />
        </FormControl>
      )}

      {withdrawToken?.isHyperunit && (
        <TextField
          fullWidth
          placeholder='Destination address'
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
        />
      )}

      {withdrawToken?.isHyperunit && <HyperunitFees fees={hyperunitFees} isDeposit={false} token={withdrawToken} />}

      <Tooltip title={unableToSubmitMessage}>
        <span>
          <Button
            fullWidth
            disabled={!connectedAddress || unableToSubmitMessage || isWithdrawing}
            variant='contained'
            onClick={() => withdrawCallback(amount, destinationAddress)}
          >
            {isWithdrawing ? <CircularProgress size={16} /> : 'Withdraw'}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

function HyperunitFees({ fees, token, isDeposit = true }) {
  const etaKey = isDeposit ? 'depositEta' : 'withdrawalEta';
  const feeKey = isDeposit ? 'depositFee' : 'withdrawalFee';
  const fee = fees?.[token.srcChain]?.[feeKey];
  const eta = fees?.[token.srcChain]?.[etaKey];

  const formatGasFee = (f, chain) => {
    if (chain === 'ethereum') {
      return formatEther(f);
    }

    if (chain === 'solana') {
      return f / LAMPORTS_PER_SOL;
    }
    return f;
  };

  const formattedFee = fee ? formatGasFee(fee, token.srcChain) : null;

  return (
    <Stack direction='column' spacing={1}>
      <Stack direction='row' justifyContent='space-between'>
        <Typography color='common.gray300' variant='body1'>
          Est. network cost
        </Typography>
        {formattedFee ? (
          <Typography color='common.gray300' variant='body1'>
            ~{formattedFee} {token.id.toUpperCase()}
          </Typography>
        ) : (
          <Skeleton variant='rounded' width={100} />
        )}
      </Stack>
      <Stack direction='row' justifyContent='space-between'>
        <Typography color='common.gray300' variant='body1'>
          Est. time
        </Typography>
        {eta ? (
          <Typography color='common.gray300' variant='body1'>
            ~{eta}
          </Typography>
        ) : (
          <Skeleton variant='rounded' width={100} />
        )}
      </Stack>
    </Stack>
  );
}

function HyperliquidDepositModal({ address, open, onClose }) {
  const { showToastMessage, showToastWithLink } = useToast();
  const { isMainnet } = useUserMetadata();

  const [isDepositing, setIsDepositing] = useState(false);

  const {
    balance,
    connectedAddress,
    connectedWallet,
    deposit,
    supportedTokens,
    depositToken,
    depositAddress,
    depositAddressVerified,
    selectDepositToken,
    errorMessage,
    hyperunitFees,
  } = useHyperliquidDeposit(address, isMainnet);

  const depositCallback = useCallback(
    async (amt) => {
      setIsDepositing(true);

      try {
        const result = await deposit(String(amt));
        showToastWithLink({
          message: `${depositToken.id.toUpperCase()} deposited successfully`,
          linkUrl: result.scanUrl,
          type: 'success',
          anchor: 'bottom-center',
        });
        onClose();
      } catch (error) {
        showToastMessage({
          message: `Unable to deposit ${depositToken.id.toUpperCase()}: ${error.message}`,
          type: 'error',
          anchor: 'bottom-center',
        });
      } finally {
        setIsDepositing(false);
      }
    },
    [deposit, depositToken]
  );

  return (
    <Dialog fullWidth maxWidth='xs' open={open} onClose={onClose}>
      <DialogTitle>
        <Stack alignItems='center' direction='row' justifyContent='space-between'>
          <Typography variant='h6'>Deposit to Hyperliquid</Typography>
          <IconButton size='small' onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack direction='column' spacing={3}>
          <Stack alignItems='center' direction='column' spacing={1}>
            <Typography sx={{ color: 'common.gray300' }} variant='subtitle2'>
              Hyperliquid Wallet
            </Typography>
            <Typography
              sx={{
                color: 'exchangeColors.Hyperliquid',
                fontFamily: 'monospace',
                bgcolor: 'background.app',
                py: 1,
                px: 3,
                borderRadius: 1,
              }}
              variant='body1'
            >
              {address}
            </Typography>
          </Stack>

          <Divider />

          <DepositTokenSelector
            depositToken={depositToken}
            selectDepositToken={selectDepositToken}
            tokens={supportedTokens}
          />

          {depositToken && (
            <>
              <Divider />
              <WalletConnectionField title='' walletType={depositToken?.chainType} />
              <DepositFlow
                connectedAddress={connectedAddress}
                connectedWallet={connectedWallet}
                depositAddress={depositAddress}
                depositAddressVerified={depositAddressVerified}
                depositToken={depositToken}
                hyperliquidAddress={address}
              />
            </>
          )}

          <Divider />

          <DepositEntry
            balance={balance}
            connectedAddress={connectedAddress}
            depositAddress={depositAddress}
            depositAddressVerified={depositAddressVerified}
            depositCallback={depositCallback}
            depositToken={depositToken}
            errorMessage={errorMessage}
            hyperunitFees={hyperunitFees}
            isDepositing={isDepositing}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function HyperliquidWithdrawModal({ address, open, onClose }) {
  const { isMainnet } = useUserMetadata();
  const { showToastMessage } = useToast();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const {
    supportedTokens,
    withdrawToken,
    selectWithdrawToken,
    connectedWallet,
    connectedAddress,
    disconnectWallet,
    withdrawBalance,
    withdraw,
    hyperunitFees,
  } = useHyperliquidWithdraw(address, isMainnet);

  const handleWalletConnect = (walletData) => {
    if (walletData) {
      setShowWalletSelector(false);
    } else {
      showToastMessage({
        message: 'Failed to connect relevant wallet. Please try again.',
        type: 'error',
        anchor: 'bottom-center',
      });
    }
  };

  const withdrawCallback = useCallback(
    async (amt, destinationAddress) => {
      setIsWithdrawing(true);

      try {
        await withdraw(String(amt), destinationAddress);
        showToastMessage({
          message: `${withdrawToken.id.toUpperCase()} withdrawn`,
          type: 'success',
          anchor: 'bottom-center',
        });
        onClose();
      } catch (error) {
        showToastMessage({
          message: `Unable to withdraw ${withdrawToken.id.toUpperCase()}: ${error.message}`,
          type: 'error',
          anchor: 'bottom-center',
        });
      } finally {
        setIsWithdrawing(false);
      }
    },
    [withdraw, withdrawToken]
  );

  if (showWalletSelector) {
    return (
      <Dialog fullWidth maxWidth='sm' open={open} onClose={() => setShowWalletSelector(false)}>
        <DialogTitle>
          Connect Wallet
          <Typography color='text.secondary' sx={{ mt: 1 }} variant='body2'>
            Please connect your wallet with address: {address}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <WalletSelector walletType='evm' onConnect={handleWalletConnect} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={onClose}>
      <DialogTitle>
        <Stack alignItems='center' direction='row' justifyContent='space-between'>
          <Typography variant='h6'>Withdraw from Hyperliquid</Typography>
          {connectedWallet ? (
            <Chip
              avatar={<Avatar src={connectedWallet?.icon || WALLET_ICONS[connectedWallet?.id]} />}
              deleteIcon={<LinkOffIcon sx={{ color: 'error.main' }} />}
              label={truncateAddress(connectedAddress)}
              onDelete={disconnectWallet}
            />
          ) : (
            <Button
              variant='outlined'
              onClick={() => {
                setShowWalletSelector(true);
              }}
            >
              Connect Wallet
            </Button>
          )}
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack direction='column' spacing={3}>
          <Stack alignItems='center' direction='column' spacing={1}>
            <Typography sx={{ color: 'common.gray300' }} variant='subtitle2'>
              Hyperliquid Wallet
            </Typography>
            <Typography
              sx={{
                color: 'exchangeColors.Hyperliquid',
                fontFamily: 'monospace',
                bgcolor: 'background.app',
                py: 1,
                px: 3,
                borderRadius: 1,
              }}
              variant='body1'
            >
              {address}
            </Typography>
          </Stack>

          <Divider />

          <DepositTokenSelector
            depositToken={withdrawToken}
            selectDepositToken={selectWithdrawToken}
            tokens={supportedTokens}
          />

          <Divider />

          <WithdrawEntry
            balance={withdrawBalance}
            connectedAddress={connectedAddress}
            hyperunitFees={hyperunitFees}
            isWithdrawing={isWithdrawing}
            withdrawCallback={withdrawCallback}
            withdrawToken={withdrawToken}
            // errorMessage={errorMessage}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function TransferBalanceSelector({ sourceDex, setSourceDex, destinationDex, setDestinationDex, supportedBalances }) {
  const handleSourceDexChange = useCallback(
    (e) => {
      const { value } = e.target;
      if (value === destinationDex) {
        setDestinationDex(sourceDex);
      }
      setSourceDex(value);
    },
    [sourceDex, destinationDex]
  );

  const handleDestinationDexChange = useCallback(
    (e) => {
      const { value } = e.target;
      if (value === sourceDex) {
        setSourceDex(destinationDex);
      }
      setDestinationDex(value);
    },
    [setDestinationDex]
  );

  return (
    <Stack alignItems='center' direction='row' justifyContent='center' spacing={2}>
      <Select value={sourceDex} onChange={handleSourceDexChange}>
        {supportedBalances.map((balance) => (
          <MenuItem key={balance.id} value={balance.id}>
            {balance.name}
          </MenuItem>
        ))}
      </Select>

      <SwapHorizIcon />

      <Select value={destinationDex} onChange={handleDestinationDexChange}>
        {supportedBalances.map((balance) => (
          <MenuItem key={balance.id} value={balance.id}>
            {balance.name}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );
}

function HyperliquidTransferModal({ address, open, onClose }) {
  const { isMainnet } = useUserMetadata();
  const { showToastMessage } = useToast();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [copied, setCopied] = useState(false);
  const {
    connectedWallet,
    connectedAddress,
    disconnectWallet,
    supportedBalances,
    sourceDex,
    setSourceDex,
    destinationDex,
    setDestinationDex,
    sourceBalance,
    amount,
    setAmount,
    transfer,
  } = useHyperliquidTransfer(address, isMainnet);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      showToastMessage({
        message: 'Address copied to clipboard',
        type: 'success',
        anchor: 'bottom-center',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToastMessage({
        message: 'Failed to copy address',
        type: 'error',
        anchor: 'bottom-center',
      });
    }
  };

  const handleWalletConnect = (walletData) => {
    if (walletData) {
      setShowWalletSelector(false);
    } else {
      showToastMessage({
        message: 'Failed to connect relevant wallet. Please try again.',
        type: 'error',
        anchor: 'bottom-center',
      });
    }
  };

  const transferCallback = useCallback(async () => {
    setIsTransferring(true);

    try {
      await transfer();
      showToastMessage({
        message: 'Transfer successful!',
        type: 'success',
        anchor: 'bottom-center',
      });
      onClose();
    } catch (error) {
      showToastMessage({
        message: `Unable to transfer: ${error.message}`,
        type: 'error',
        anchor: 'bottom-center',
      });
    } finally {
      setIsTransferring(false);
    }
  }, [transfer]);

  if (showWalletSelector) {
    return (
      <Dialog fullWidth maxWidth='sm' open={open} onClose={() => setShowWalletSelector(false)}>
        <DialogTitle>
          Connect Wallet
          <Typography color='text.secondary' sx={{ mt: 1 }} variant='body2'>
            Please connect your wallet with address: {address}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <WalletSelector walletType='evm' onConnect={handleWalletConnect} />
        </DialogContent>
      </Dialog>
    );
  }

  const handleButtonClick = () => {
    if (connectedWallet) {
      transferCallback();
    } else {
      setShowWalletSelector(true);
    }
  };

  const buttonText = connectedWallet ? 'Transfer' : 'Connect & Transfer';

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction='column' spacing={1}>
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography variant='h6'>Hyperliquid Transfer</Typography>
            {connectedWallet ? (
              <Chip
                avatar={<Avatar src={connectedWallet?.icon || WALLET_ICONS[connectedWallet?.id]} />}
                deleteIcon={<LinkOffIcon sx={{ color: 'error.main' }} />}
                label={truncateAddress(connectedAddress)}
                onDelete={disconnectWallet}
              />
            ) : (
              <Button
                variant='outlined'
                onClick={() => {
                  setShowWalletSelector(true);
                }}
              >
                Connect Wallet
              </Button>
            )}
          </Stack>
          <Typography color='text.secondary' variant='body1'>
            Transfer USDC between Perps and Spot balances
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack direction='column' spacing={6}>
          <Divider />

          <Stack alignItems='center' direction='column' spacing={2}>
            <Typography sx={{ color: 'common.gray300' }} variant='subtitle2'>
              Hyperliquid Wallet
            </Typography>
            <Stack
              alignItems='center'
              direction='row'
              spacing={1}
              sx={{
                color: 'exchangeColors.Hyperliquid',
                fontFamily: 'monospace',
                bgcolor: 'background.default',
                py: 1,
                px: 3,
                borderRadius: 1,
              }}
            >
              <Typography variant='body1'>{address}</Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy address'}>
                <IconButton
                  size='small'
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                  onClick={handleCopyAddress}
                >
                  {copied ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack direction='column' spacing={3}>
            <Stack alignItems='center' direction='row' spacing={2}>
              <TextField
                InputProps={{
                  inputComponent: NumericFormatCustom,
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Button
                        variant='text'
                        onClick={() => {
                          setAmount(sourceBalance);
                        }}
                      >
                        Max: {sourceBalance || '0.00'}
                      </Button>
                    </InputAdornment>
                  ),
                }}
                label='Amount'
                sx={{ flex: 1 }}
                value={amount}
                variant='outlined'
                onChange={handleAmountChange}
              />

              <TransferBalanceSelector
                destinationDex={destinationDex}
                setDestinationDex={setDestinationDex}
                setSourceDex={setSourceDex}
                sourceDex={sourceDex}
                supportedBalances={supportedBalances}
              />
            </Stack>

            <Button
              fullWidth
              disabled={connectedWallet ? !amount || amount > sourceBalance || isTransferring : false}
              variant='contained'
              onClick={handleButtonClick}
            >
              {isTransferring ? <CircularProgress size={16} /> : buttonText}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export { HyperliquidDepositModal, HyperliquidWithdrawModal, HyperliquidTransferModal };
