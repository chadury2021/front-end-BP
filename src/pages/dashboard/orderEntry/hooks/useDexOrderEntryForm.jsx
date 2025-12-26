import { useCallback, useContext, useEffect, useState } from 'react';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { getDexQuote, getDexPrice, getDexAutoOrderConfig } from '@/apiServices';
import { debounce } from 'lodash';
import { getSupportedChains } from '@/shared/dexUtils';
import { useDexTokenManager } from '@/shared/context/DexTokenManagerProvider';

function useDexOrderEntryForm({ isAdvanced = false }) {
  const { selectedPair, initialLoadValue, selectedAccounts, balances, setSelectedPair } = useOrderForm();
  const { accounts } = initialLoadValue;
  const { showAlert } = useContext(ErrorContext);
  const [buyState, setBuyState] = useState({
    token: '',
    balance: null,
    qty: '',
    qtyPlaceholder: '',
    price: null,
    isPairSelected: false,
  });
  const [sellState, setSellState] = useState({
    token: '',
    balance: null,
    qty: '',
    qtyPlaceholder: '',
    price: null,
    isPairSelected: false,
  });

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [urgency, setUrgency] = useState('MEDIUM');
  const [selectedChain, setSelectedChain] = useState(null);

  // Auto order config state
  const [isAutoOrderFormLoading, setIsAutoOrderFormLoading] = useState(false);
  const [autoOrderConfig, setAutoOrderConfig] = useState(null);

  const selectedAccount = accounts[selectedAccounts?.[0]];

  const { loadToken } = useDexTokenManager();
  // Fetch price for a token
  const fetchTokenPrice = async (token) => {
    if (!token || !token.id || token?.market_type !== 'dex') return null;

    try {
      const priceData = await getDexPrice(token.id);
      return priceData?.price?.price;
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch price for ${token.symbol}: ${error.message}`,
      });
      return null;
    }
  };

  // Fetch prices for both tokens when they change
  useEffect(() => {
    const fetchPrices = async () => {
      const [buyPrice, sellPrice] = await Promise.all([
        buyState.token ? fetchTokenPrice(buyState.token) : null,
        sellState.token ? fetchTokenPrice(sellState.token) : null,
      ]);

      setBuyState((prev) => ({ ...prev, price: buyPrice }));
      setSellState((prev) => ({ ...prev, price: sellPrice }));
    };

    fetchPrices();
  }, [buyState.token, sellState.token]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (buyState.token && sellState.token && sellState.qty && selectedAccount) {
        setQuoteLoading(true);
        try {
          setQuoteLoading(true);
          const quoteData = await getDexQuote(sellState.token.id, buyState.token.id, sellState.qty, selectedAccount.id);
          setQuote(quoteData.quote);

          setBuyState({ ...buyState, qty: quoteData.quote.toTokenAmount });
        } catch (error) {
          showAlert({
            severity: 'error',
            message: error.message,
          });
        } finally {
          setQuoteLoading(false);
        }
      }
    };
    fetchQuote();
  }, [buyState.token, sellState.token, sellState.qty, selectedAccount]);

  useEffect(() => {
    if (selectedPair) {
      if (sellState.isPairSelected) {
        setSellState({ ...sellState, token: selectedPair, price: null, isPairSelected: isAdvanced, balance: 0 });
      } else {
        setBuyState({ ...buyState, token: selectedPair, price: null, isPairSelected: isAdvanced, balance: 0 });
      }
      setSelectedChain(selectedPair.chain_id);
    }
  }, [selectedPair]);

  useEffect(() => {
    if (balances[selectedAccount?.id]) {
      const balance = balances[selectedAccount.id];
      const sellTokenBalance = balance.assets.find((asset) => asset.symbol === sellState.token?.id);
      const buyTokenBalance = balance.assets.find((asset) => asset.symbol === buyState.token?.id);
      setBuyState({ ...buyState, balance: buyTokenBalance?.amount || 0 });
      setSellState({ ...sellState, balance: sellTokenBalance?.amount || 0 });
    }
  }, [balances, selectedAccount, sellState.token, buyState.token]);

  // Reset auto order config
  const resetConfig = () => {
    setAutoOrderConfig(null);
  };

  // Set auto order config
  const setConfig = (config) => {
    setAutoOrderConfig({ ...config, slippage: config.slippage * 100 });
  };

  // Debounced fetch for DEX auto order config
  const debouncedFetchDexAutoOrderConfig = useCallback(
    debounce(async () => {
      if (!sellState.token || !buyState.token || !sellState.qty || !urgency) {
        return;
      }

      try {
        const response = await getDexAutoOrderConfig(urgency, sellState.token.id, buyState.token.id, sellState.qty);
        setConfig(response.config);
      } catch (error) {
        showAlert({
          severity: 'error',
          message: `Failed to fetch DEX auto order config: ${error.message}`,
        });
      } finally {
        setIsAutoOrderFormLoading(false);
      }
    }, 1500),
    [urgency, sellState.token, buyState.token, sellState.qty]
  );

  // Enable urgency when we have all required fields
  const enableUrgency = !!sellState.token && !!buyState.token && !!sellState.qty && !!selectedAccount;

  // Fetch auto order config when urgency changes
  useEffect(() => {
    resetConfig();

    if (enableUrgency && urgency) {
      setIsAutoOrderFormLoading(true);
      debouncedFetchDexAutoOrderConfig();
    }

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedFetchDexAutoOrderConfig.cancel();
    };
  }, [enableUrgency, urgency, sellState.token, buyState.token, sellState.qty]);

  const handleBuyQtyChange = (qty) => {
    setBuyState({ ...buyState, qty });
  };

  const handleSellQtyChange = (qty) => {
    setSellState({ ...sellState, qty });
  };

  const handleSwap = useCallback(
    (e) => {
      const tempState = buyState;
      setBuyState({ ...sellState, qty: '' });
      setSellState({ ...tempState });

      // Update the dashboard's selected pair when tokens are swapped
      // Use the sell token (which becomes the buy token after swap) as the selected pair
      if (sellState.token && sellState.token.market_type === 'dex') {
        setSelectedPair(sellState.token);
      }
    },
    [buyState, sellState, setSelectedPair]
  );

  const handleTokenChange = useCallback(
    (token, isBuy) => {
      const currentState = isBuy ? buyState : sellState;
      const otherState = isBuy ? sellState : buyState;
      const setCurrentState = isBuy ? setBuyState : setSellState;
      const setOtherState = isBuy ? setSellState : setBuyState;

      // If the token to be changed is the same as the other token, swap them
      if (otherState.token && token.id === otherState.token.id) {
        handleSwap();
        return;
      }

      // If the token to be changed is different chain than the other token, clear the other token
      if (otherState.token && !otherState.isPairSelected && token.chain_id !== otherState.token.chain_id) {
        setOtherState({ ...otherState, token: '', price: null, balance: 0, qty: '', isPairSelected: false });
      }

      setCurrentState({ ...currentState, token, price: null, balance: 0 });
      setSelectedChain(token.chain_id);

      // Update the dashboard's selected pair only when the buy token is selected
      if (token && token.market_type === 'dex' && isBuy) {
        setSelectedPair(token);
      }
    },
    [buyState, sellState, handleSwap, setSelectedPair]
  );

  const handleBuyTokenChange = (token) => {
    handleTokenChange(token, true);
  };

  const handleSellTokenChange = (token) => {
    handleTokenChange(token, false);
  };

  const handleUrgencyChange = (urg) => {
    setUrgency(urg);
  };

  const resolveToken = async (token) => {
    if (token?.market_type === 'dex') {
      if (!selectedAccount) {
        return token;
      }

      if (selectedAccount && getSupportedChains(selectedAccount?.walletType).includes(token?.chain_id)) {
        return token;
      }
    }

    let defaultTokenId = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee:1';
    if (selectedAccount && selectedAccount.walletType === 'solana') {
      defaultTokenId = '11111111111111111111111111111111:501';
    }

    return loadToken(defaultTokenId);
  };

  // Fix selected pair if not dex
  useEffect(() => {
    const resolveTokenAsync = async () => {
      const newPair = await resolveToken(selectedPair);
      if (newPair && selectedPair.id !== newPair.id) {
        setSelectedPair(newPair);
      }
    };
    resolveTokenAsync();
  }, [selectedAccount]);

  return {
    accounts,
    buyState,
    sellState,
    urgency,
    quote,
    quoteLoading,
    handleUrgencyChange,
    handleBuyQtyChange,
    handleSellQtyChange,
    handleSwap,
    handleBuyTokenChange,
    handleSellTokenChange,
    selectedAccounts,
    selectedChain,
    // Auto order config fields
    enableUrgency,
    isAutoOrderFormLoading,
    autoOrderConfig,
  };
}

export default useDexOrderEntryForm;
