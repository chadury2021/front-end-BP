import { useState, useCallback } from 'react';
import { walletAuth, getNonce } from '@/apiServices';
import { CHAIN_TYPES } from '@/shared/dexUtils';
import { useToast } from '@/shared/context/ToastProvider';

async function generateNonce() {
  const response = await getNonce();
  return response.nonce;
}

export function useWalletAuth() {
  const [errorMessage, setErrorMessage] = useState('');
  const { showToastMessage } = useToast();

  // Sign message with Ethereum wallet
  const signWithEthereum = async (wallet) => {
    const nonce = await generateNonce();
    const message = `Sign in to Tread with nonce: ${nonce}`;

    const signature = await wallet.provider.request({
      method: 'personal_sign',
      params: [message, wallet.address],
    });
    return { signature, message, nonce };
  };

  // Sign message with Solana wallet
  const signWithSolana = async (wallet) => {
    // Create a stable message with nonce
    const nonce = await generateNonce();
    const message = `Sign in to Tread with nonce: ${nonce}`;

    // Encode message
    const encodedMessage = new TextEncoder().encode(message);

    // Request signature from Phantom wallet
    const { signature } = await wallet.provider.signMessage(encodedMessage, 'utf8');

    // Convert signature to hex string without using Buffer
    const signatureHex = Array.from(signature)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      signature: signatureHex,
      message,
      nonce,
    };
  };

  // Connect and sign in with user-selected chain
  const signInWithWallet = useCallback(async (wallet) => {
    if (!wallet) {
      setErrorMessage('Please select a wallet');
      return false;
    }

    try {
      let signatureData;

      if (wallet.chainType === CHAIN_TYPES.ETHEREUM) {
        signatureData = await signWithEthereum(wallet);
      } else if (wallet.chainType === CHAIN_TYPES.SOLANA) {
        signatureData = await signWithSolana(wallet);
      } else {
        throw new Error('Unsupported chain type');
      }

      // Get referral code from localStorage
      const referralCode = localStorage.getItem('referralCode') || null;

      const result = await walletAuth(
        wallet.address,
        signatureData.signature,
        signatureData.nonce,
        wallet.chainType,
        referralCode
      );

      // Clear referral code from localStorage after successful authentication if user was created
      if (result.user_created && referralCode) {
        localStorage.removeItem('referralCode');
      }

      return true;
    } catch (error) {
      if (!window.ethereum && !window.phantom) {
        setErrorMessage('No wallet detected. Please install MetaMask or Phantom.');
      } else if (error.message.includes('user rejected action')) {
        showToastMessage({ message: 'Signature request declined.', type: 'error', anchor: 'bottom-center' });
      } else {
        showToastMessage({
          message: error.message || 'Failed to authenticate with wallet',
          type: 'error',
          anchor: 'bottom-center',
        });
      }

      return false;
    }
  }, []);

  return {
    signInWithWallet,
    walletAuthError: errorMessage,
  };
}
