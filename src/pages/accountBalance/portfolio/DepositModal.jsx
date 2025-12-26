import { getOKXDEXWallets, refreshAccountBalanceCache } from '@/apiServices';
import { ChainIcon } from '@/shared/components/Icons';
import WalletSelector from '@/shared/components/WalletSelector';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import useConnectWallet from '@/shared/context/WalletProvider';
import { CHAIN_CONFIGS, CHAIN_TYPES, NATIVE_TOKENS, buildTokenId } from '@/shared/dexUtils';
import WALLET_ICONS from '@images/wallet_icons';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import QrCodeIcon from '@mui/icons-material/QrCode';
import bs58 from 'bs58';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { makeTransactionHashesClickable } from '../TransactionHashLink';

import TokenSearchDropdown from './TokenSearchDropdown';

const PAGES = {
  OPTIONS: 'options',
  WALLET_SELECTOR: 'wallet_selector',
  DEPOSIT_FORM: 'deposit_form',
  QR_CODE: 'qr_code',
};

function DepositModal({ open, onClose, accountId }) {
  const theme = useTheme();
  const { showAlert } = useContext(ErrorContext);
  const { connectedWallet, chainType, walletProviderName, walletProviderObject, disconnectWallet } = useConnectWallet();
  const [wallets, setWallets] = useState([]);
  const [walletMetadata, setWalletMetadata] = useState({});
  const [processing, setProcessing] = useState(false);

  // Modal state
  const [currentPage, setCurrentPage] = useState(PAGES.OPTIONS);

  // Form state
  const [chainId, setChainId] = useState('');
  const [token, setToken] = useState(null);
  const [amount, setAmount] = useState('');

  // Network switch confirmation state
  const [showNetworkSwitch, setShowNetworkSwitch] = useState(false);
  const [networkSwitchInfo, setNetworkSwitchInfo] = useState({
    currentChain: '',
    targetChain: '',
    expectedChainIdHex: '',
    onConfirm: null,
  });

  const destinationWalletAddress = wallets[0];

  const loadWallets = async () => {
    try {
      const response = await getOKXDEXWallets(accountId);
      setWallets(response.wallets || []);
      setWalletMetadata({ walletType: response.wallet_type, walletProvider: response.wallet_provider });
    } catch (err) {
      showAlert({ message: `Failed to load wallets: ${err.message}`, severity: 'error' });
    }
  };

  useEffect(() => {
    if (open && accountId) {
      loadWallets();
      setCurrentPage(PAGES.OPTIONS);
    }
  }, [open, accountId]);

  useEffect(() => {
    setChainId('');
    setToken(null);
    setAmount('');

    if (chainType === CHAIN_TYPES.SOLANA) {
      setChainId('501');
    }
  }, [connectedWallet]);

  const validateForm = () => {
    if (!chainId) {
      throw new Error('Please select a wallet first');
    }
    if (!destinationWalletAddress) {
      throw new Error('Destination wallet address missing');
    }
    if (!token) {
      throw new Error('Token address missing');
    }
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Please enter a valid amount');
    }

    if (!connectedWallet) {
      throw new Error('No wallet connected. Please connect your wallet first');
    }

    const isSolanaChain = chainId === '501';
    const isEvmChain = ['1', '56', '8453'].includes(chainId);

    if (isSolanaChain && chainType !== CHAIN_TYPES.SOLANA) {
      throw new Error('Solana chain selected but non-Solana wallet connected. Please connect a Solana wallet');
    }

    if (isEvmChain && chainType !== CHAIN_TYPES.ETHEREUM) {
      throw new Error('EVM chain selected but non-EVM wallet connected. Please connect an Ethereum wallet');
    }
  };

  const handleNetworkSwitch = async (expectedChainId) => {
    const chainNames = {
      '0x1': 'Ethereum Mainnet',
      '0x38': 'BSC',
      '0x2105': 'Base',
    };

    const currentChainId = await walletProviderObject.request({ method: 'eth_chainId' });
    const expectedChainIdHex = `0x${parseInt(expectedChainId, 10).toString(16)}`;

    if (currentChainId !== expectedChainIdHex) {
      const currentChain = chainNames[currentChainId] || 'Unknown';
      const targetChain = chainNames[expectedChainIdHex] || 'Unknown';

      // Show confirmation dialog instead of window.confirm
      setNetworkSwitchInfo({
        currentChain,
        targetChain,
        expectedChainIdHex,
        onConfirm: async () => {
          try {
            await walletProviderObject.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: expectedChainIdHex }],
            });

            // Verify switch with a more functional approach
            const verifySwitch = async (attempts = 0) => {
              if (attempts >= 5) {
                return false;
              }

              await new Promise((resolve) => {
                setTimeout(resolve, 1000);
              });
              const newChainId = await walletProviderObject.request({ method: 'eth_chainId' });

              if (newChainId === expectedChainIdHex) {
                return true;
              }

              return verifySwitch(attempts + 1);
            };

            const switchConfirmed = await verifySwitch();
            if (!switchConfirmed) {
              throw new Error('Network switch verification failed');
            }
            return true;
          } catch (switchError) {
            if (switchError.code === 4902) {
              // Add network
              const chainConfigs = {
                '0x1': { name: 'Ethereum Mainnet', rpcUrl: 'https://mainnet.infura.io/v3/your-project-id' },
                '0x38': { name: 'BSC', rpcUrl: 'https://bsc-dataseed.binance.org/' },
                '0x2105': { name: 'Base', rpcUrl: 'https://mainnet.base.org' },
              };

              const targetConfig = chainConfigs[expectedChainIdHex];
              if (targetConfig) {
                const isBSC = expectedChainIdHex === '0x38';
                const nativeCurrency = {
                  name: isBSC ? 'BNB' : 'ETH',
                  symbol: isBSC ? 'BNB' : 'ETH',
                  decimals: 18,
                };

                await walletProviderObject.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: expectedChainIdHex,
                      chainName: targetConfig.name,
                      rpcUrls: [targetConfig.rpcUrl],
                      nativeCurrency,
                    },
                  ],
                });
                return true;
              }
            }
            throw new Error(`Failed to switch network: ${switchError.message}`);
          }
        },
      });
      setShowNetworkSwitch(true);
      return false;
    }
    return true;
  };

  const executeEVMDeposit = async () => {
    const accounts = await walletProviderObject.request({ method: 'eth_requestAccounts' });
    console.log('[executeEVMDeposit] eth_requestAccounts', accounts);
    const fromAddress = accounts[0];

    // Better native token detection
    const isNativeToken =
      token?.address.toLowerCase() === NATIVE_TOKENS[chainId].toLowerCase() ||
      token?.address.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
      token?.address.toLowerCase() === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ||
      token?.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    if (!ethers.isAddress(destinationWalletAddress)) {
      throw new Error('Invalid destination address');
    }
    if (!isNativeToken && !ethers.isAddress(token?.address)) {
      throw new Error('Invalid token address');
    }

    if (isNativeToken) {
      const valueInWei = ethers.parseEther(amount);

      const tx = await walletProviderObject.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: fromAddress,
            to: destinationWalletAddress,
            value: `0x${valueInWei.toString(16)}`,
          },
        ],
      });
      return tx;
    }

    try {
      const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address owner) view returns (uint256)',
      ];

      // Wrap the raw EIP-6963 provider with ethers BrowserProvider
      const provider = new ethers.BrowserProvider(walletProviderObject);
      const tokenContract = new ethers.Contract(token?.address, erc20Abi, provider);

      let decimals;
      try {
        decimals = await tokenContract.decimals();
      } catch (error) {
        // If decimals() fails (e.g., not a valid ERC20 contract), use default
        decimals = CHAIN_CONFIGS[chainId]?.decimals || 18;
      }

      const rawAmount = ethers.parseUnits(amount, decimals);

      let balance;
      try {
        balance = await tokenContract.balanceOf(fromAddress);

        if (BigInt(balance.toString()) < BigInt(rawAmount.toString())) {
          throw new Error('Insufficient token balance');
        }
      } catch (error) {
        throw new Error(error);
      }

      const transferData = tokenContract.interface.encodeFunctionData('transfer', [
        destinationWalletAddress,
        rawAmount,
      ]);

      const tx = await walletProviderObject.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: fromAddress,
            to: token?.address,
            data: transferData,
          },
        ],
      });
      return tx;
    } catch (error) {
      if (error.message.includes('execution reverted')) {
        throw new Error('Transaction failed: Token transfer reverted. Check your balance and try again.');
      }

      throw new Error(`ERC20 transfer failed: ${error.message}`);
    }
  };

  const executeSolanaDeposit = async () => {
    const connection = new Connection(
      'https://solana-mainnet.g.alchemy.com/v2/Y4Uf-x3DQJ5H-DnzmVYn6aLu9-jr-jHi',
      'confirmed'
    );
    const { blockhash } = await connection.getLatestBlockhash();
    const fromPubkey = new PublicKey(connectedWallet);
    const toPubkey = new PublicKey(destinationWalletAddress);

    const isNativeSol = token?.address === NATIVE_TOKENS['501'];

    if (isNativeSol) {
      // Check SOL balance first
      const balance = await connection.getBalance(fromPubkey);
      const requiredAmount = LAMPORTS_PER_SOL * parseFloat(amount);

      if (balance < requiredAmount) {
        throw new Error('Insufficient SOL balance');
      }

      const solTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: requiredAmount,
        })
      );

      solTransaction.recentBlockhash = blockhash;
      solTransaction.feePayer = fromPubkey;

      const { signature } = await walletProviderObject.signAndSendTransaction(solTransaction);
      return bs58.encode(signature);
    }

    // SPL token transfer
    const mintPubkey = new PublicKey(token?.address);
    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);

    // Get token mint info to determine decimals
    let tokenDecimals = 9; // Default to 9 decimals
    try {
      const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
      if (mintInfo.value?.data?.parsed?.info?.decimals !== undefined) {
        tokenDecimals = mintInfo.value.data.parsed.info.decimals;
      }
    } catch (error) {
      console.warn('Could not get token decimals, using default of 9:', error);
    }

    console.log('Token transfer details:', {
      tokenAddress: token?.address,
      tokenDecimals,
      amount,
      fromTokenAccount: fromTokenAccount.toString(),
      toTokenAccount: toTokenAccount.toString(),
    });

    const transaction = new Transaction();

    // Check if sender's ATA exists
    try {
      await getAccount(connection, fromTokenAccount);
    } catch (error) {
      throw new Error(`Sender token account does not exist for ${token?.address}. You may not have this token.`);
    }

    // Check if recipient's ATA exists, create if it doesn't
    let recipientAtaExists = false;
    try {
      await getAccount(connection, toTokenAccount);
      recipientAtaExists = true;
    } catch (error) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, // payer
          toTokenAccount, // ata
          toPubkey, // owner
          mintPubkey, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    try {
      const fromTokenAccountInfo = await getAccount(connection, fromTokenAccount);
      const requiredAmount = BigInt(parseFloat(amount) * 10 ** tokenDecimals);

      if (fromTokenAccountInfo.amount < requiredAmount) {
        throw new Error('Insufficient token balance');
      }

      transaction.add(
        createTransferInstruction(fromTokenAccount, toTokenAccount, fromPubkey, requiredAmount, [], TOKEN_PROGRAM_ID)
      );
    } catch (error) {
      if (error.message.includes('Insufficient token balance')) {
        throw error;
      }
      throw new Error(`Could not verify token balance: ${error.message}`);
    }

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const { signature } = await walletProviderObject.signAndSendTransaction(transaction);
    return signature;
  };

  const handleClose = () => {
    setCurrentPage(PAGES.OPTIONS);
    setChainId('');
    setToken(null);
    setAmount('');
    onClose();
  };

  const handleDeposit = async () => {
    setProcessing(true);

    try {
      validateForm();

      let transactionId;
      if (chainId === '501') {
        transactionId = await executeSolanaDeposit();
      } else {
        transactionId = await executeEVMDeposit();
      }

      const message = `Deposit successful! Transaction Hash: ${transactionId}`;
      const clickableMessage = makeTransactionHashesClickable(message, chainId);
      showAlert({ message: clickableMessage, severity: 'success' });
      disconnectWallet();
      handleClose();
    } catch (err) {
      showAlert({ message: err.message, severity: 'error' });
    } finally {
      setProcessing(false);
    }

    try {
      await refreshAccountBalanceCache(accountId);
    } catch (err) {
      console.warn(`Failed to refresh account balance cache for ${accountId} after deposit: ${err}`);
    }
  };

  const onNetworkChange = (e) => {
    const selectedChainId = e.target.value;
    setChainId(selectedChainId);
    setToken(null);

    if (chainType === 'evm' && selectedChainId !== '501') {
      handleNetworkSwitch(selectedChainId);
    }
  };

  const handleWalletSelected = (result) => {
    setCurrentPage(PAGES.DEPOSIT_FORM);
  };

  const handleBack = () => {
    if (currentPage === PAGES.WALLET_SELECTOR) {
      setCurrentPage(PAGES.OPTIONS);
    } else if (currentPage === PAGES.DEPOSIT_FORM) {
      setCurrentPage(PAGES.WALLET_SELECTOR);
    } else if (currentPage === PAGES.QR_CODE) {
      setCurrentPage(PAGES.OPTIONS);
    }
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/,/g, '');
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(val) || val === '') {
      setAmount(val);
    }
  };

  const renderOptionsPage = () => (
    <Stack spacing={4} sx={{ mt: 1 }}>
      <Button
        fullWidth
        startIcon={<AccountBalanceWalletIcon />}
        sx={{
          py: 3,
          px: 4,
        }}
        variant='outlined'
        onClick={() => setCurrentPage(PAGES.WALLET_SELECTOR)}
      >
        <Box sx={{ textAlign: 'left', width: '100%' }}>
          <Typography sx={{ color: 'var(--text-primary)' }} variant='h6'>
            Deposit from Wallet
          </Typography>
          <Typography sx={{ color: 'var(--text-primary)', opacity: 0.8 }} variant='body2'>
            Deposit funds from any of your wallet extensions
          </Typography>
        </Box>
      </Button>

      <Button
        fullWidth
        startIcon={<QrCodeIcon />}
        sx={{
          py: 3,
          px: 4,
          textTransform: 'none',
          borderColor: 'divider',
        }}
        variant='outlined'
        onClick={() => setCurrentPage(PAGES.QR_CODE)}
      >
        <Box sx={{ textAlign: 'left', width: '100%' }}>
          <Typography variant='h6'>Deposit by QR/Address</Typography>
          <Typography color='text.secondary' variant='body2'>
            Send funds from any wallet or exchange
          </Typography>
        </Box>
      </Button>
    </Stack>
  );

  const renderWalletSelectorPage = () => (
    <Stack spacing={4} sx={{ mt: 1 }}>
      <WalletSelector walletType={walletMetadata.walletType} onConnect={handleWalletSelected} />
    </Stack>
  );

  const submitDisabled = processing || !chainId || !token || !amount || !connectedWallet;

  const renderDepositFormPage = () => {
    const isSolanaWallet = chainType === CHAIN_TYPES.SOLANA;

    return (
      <Stack spacing={6} sx={{ mt: 1 }}>
        <Stack direction='column' spacing={2}>
          <Typography variant='subtitle2'>Funding Wallet Address</Typography>
          <TextField
            fullWidth
            InputProps={{
              readOnly: true,
              startAdornment: (
                <Avatar
                  src={WALLET_ICONS[walletProviderName] || WALLET_ICONS.default}
                  sx={{ width: 20, height: 20, mr: 2 }}
                />
              ),
            }}
            value={connectedWallet}
          />
        </Stack>

        {showNetworkSwitch && (
          <>
            <Alert severity='warning'>
              <Typography gutterBottom variant='h6'>
                Network Switch Required
              </Typography>
              <Typography gutterBottom variant='body2'>
                Your wallet is currently on: <strong>{networkSwitchInfo.currentChain}</strong>
              </Typography>
              <Typography gutterBottom variant='body2'>
                You selected: <strong>{networkSwitchInfo.targetChain}</strong>
              </Typography>
              <Typography variant='body2'>
                Would you like to switch to {networkSwitchInfo.targetChain}? This will prompt your wallet to change
                networks.
              </Typography>
              <Stack direction='row' spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant='outlined'
                  onClick={() => {
                    setShowNetworkSwitch(false);
                    showAlert({
                      message: 'Network switch cancelled. Please switch networks manually in your wallet.',
                      severity: 'warning',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant='contained'
                  onClick={async () => {
                    setShowNetworkSwitch(false);
                    if (networkSwitchInfo.onConfirm) {
                      try {
                        await networkSwitchInfo.onConfirm();
                      } catch (switchError) {
                        showAlert({ message: switchError.message, severity: 'error' });
                      }
                    }
                  }}
                >
                  Switch Network
                </Button>
              </Stack>
            </Alert>
            <Divider />
          </>
        )}

        {/* Conditionally render network selection step only for non-Solana wallets */}
        {!isSolanaWallet && (
          <Stack direction='column' spacing={2}>
            <Typography color='primary.main' variant='subtitle1'>
              Step1
            </Typography>
            <Typography variant='subtitle2'>Select Network</Typography>
            <FormControl fullWidth>
              {!chainId && <InputLabel>Network</InputLabel>}
              <Select label={chainId ? '' : 'Network'} value={chainId} onChange={onNetworkChange}>
                {Object.entries(CHAIN_CONFIGS)
                  .filter(([id, config]) => config.walletType === walletMetadata.walletType)
                  .map(([id, config]) => (
                    <MenuItem key={id} value={id}>
                      <Stack alignItems='center' direction='row' spacing={2}>
                        <ChainIcon chainId={id} style={{ width: 20, height: 20 }} />
                        <Typography>{config.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Stack>
        )}

        <Stack direction='column' spacing={2}>
          <Typography
            color={chainId ? 'primary.main' : 'text.secondary'}
            sx={{ opacity: chainId ? 1 : 0.5 }}
            variant='subtitle1'
          >
            {isSolanaWallet ? 'Step1' : 'Step2'}
          </Typography>
          <Typography color={chainId ? 'text.primary' : 'text.secondary'} variant='subtitle2'>
            Select Token
          </Typography>
          <TokenSearchDropdown
            chainId={chainId}
            chainType={chainType}
            connectedWallet={connectedWallet}
            disabled={!chainId}
            value={token}
            onChange={setToken}
          />
        </Stack>

        <Stack direction='column' spacing={2}>
          <Typography
            color={token ? 'primary.main' : 'text.secondary'}
            sx={{ opacity: token ? 1 : 0.5 }}
            variant='subtitle1'
          >
            {isSolanaWallet ? 'Step2' : 'Step3'}
          </Typography>
          <Typography color={token ? 'text.primary' : 'text.secondary'} variant='subtitle2'>
            Deposit Amount
          </Typography>
          <TextField
            fullWidth
            disabled={!token}
            error={amount && parseFloat(amount) <= 0}
            helperText={amount && parseFloat(amount) <= 0 ? 'Deposit Amount should be greater than 0' : ''}
            InputProps={{
              endAdornment: token ? (
                <InputAdornment position='end'>
                  <Typography color='text.secondary' variant='body1'>
                    {token?.symbol}
                  </Typography>
                </InputAdornment>
              ) : null,
              inputProps: { inputMode: 'decimal' },
            }}
            label={!amount ? 'Deposit Amount' : ''}
            placeholder='Enter amount to deposit'
            sx={{
              backgroundColor: !token ? 'background.paper' : 'background.default',
            }}
            type='text'
            value={amount}
            onChange={handleAmountChange}
          />
        </Stack>

        <Button
          fullWidth
          disabled={submitDisabled}
          startIcon={processing ? <CircularProgress size={16} /> : null}
          sx={{ height: 36 }}
          variant='contained'
          onClick={handleDeposit}
        >
          <Typography color={submitDisabled ? 'text.dark' : 'primary.contrastText'} variant='subtitle1'>
            Confirm in wallet
          </Typography>
        </Button>
      </Stack>
    );
  };

  const renderQRCodePage = () => {
    // Generate QR code for the first available wallet address
    const qrValue = destinationWalletAddress;

    const handleCopyAddress = () => {
      navigator.clipboard.writeText(qrValue);
      showAlert({ message: 'Address copied to clipboard!', severity: 'success' });
    };

    return (
      <Stack spacing={4} sx={{ mt: 1 }}>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            px: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* QR Code */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.white,
              padding: 3,
              borderRadius: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {qrValue ? (
              <QRCode
                bgColor={theme.palette.background.white}
                fgColor={theme.palette.text.primary}
                level='L'
                size={200}
                style={{
                  filter: 'contrast(1.2) brightness(1.1)',
                }}
                value={qrValue}
              />
            ) : (
              <CircularProgress />
            )}
          </Box>

          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography variant='subtitle1'>Your Address</Typography>
              <Typography
                sx={{
                  wordBreak: 'break-all',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                  textAlign: 'left',
                }}
                variant='body1'
              >
                {qrValue}
              </Typography>
            </Box>
            <Button sx={{ ml: 2 }} variant='contained' onClick={handleCopyAddress}>
              Copy
            </Button>
          </Box>
        </Box>

        <Typography color='text.secondary' sx={{ textAlign: 'center' }} variant='body2'>
          Send funds from any wallet or exchange to this address.
          <br />
          Make sure to use the correct network when sending.
        </Typography>
      </Stack>
    );
  };

  const renderContent = () => {
    switch (currentPage) {
      case PAGES.OPTIONS:
        return renderOptionsPage();
      case PAGES.WALLET_SELECTOR:
        return renderWalletSelectorPage();
      case PAGES.DEPOSIT_FORM:
        return renderDepositFormPage();
      case PAGES.QR_CODE:
        return renderQRCodePage();
      default:
        return renderOptionsPage();
    }
  };

  const getTitle = () => {
    switch (currentPage) {
      case PAGES.OPTIONS:
        return 'Deposit';
      case PAGES.WALLET_SELECTOR:
        return 'Select Wallet';
      case PAGES.DEPOSIT_FORM:
        return 'Deposit from Wallet';
      case PAGES.QR_CODE:
        return 'Deposit by QR/Address';
      default:
        return 'Deposit';
    }
  };

  const showBackButton = currentPage !== PAGES.OPTIONS;

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={handleClose}>
      <DialogTitle>
        <Stack alignItems='center' direction='row' justifyContent='space-between'>
          <Stack alignItems='center' direction='row' spacing={1}>
            {showBackButton && (
              <IconButton size='small' onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant='h6'>{getTitle()}</Typography>
          </Stack>
          <IconButton size='small' onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>{renderContent()}</DialogContent>
    </Dialog>
  );
}

export default DepositModal;
