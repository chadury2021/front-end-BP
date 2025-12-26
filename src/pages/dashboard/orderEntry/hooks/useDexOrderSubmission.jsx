import { useState, useContext } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { submitOrder } from '@/apiServices';
import { useSound } from '@/hooks/useSound';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { createExitConditions } from '@/util/exitConditionUtils';
import { useFeatureFlag } from '@/shared/context/FeatureFlagProvider';

function useDexOrderSubmission({ quickSubmitEnabled = false } = {}) {
  const { showAlert } = useContext(ErrorContext);
  const { playOrderSuccess } = useSound();
  const { isFeatureEnabled } = useFeatureFlag();

  const {
    takeProfitPrice,
    stopLossPrice,
    takeProfitUrgency,
    stopLossUrgency,
    takeProfitPercentage,
    stopLossPercentage,
  } = useOrderForm();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  const handleSubmit = async (dexFormData) => {
    if (!dexFormData) {
      showAlert({
        severity: 'error',
        message: 'Invalid order data',
      });
      return null;
    }

    const { sellToken, buyToken, sellQty, urgency, quote, config, selectedAccounts } = dexFormData;

    // Validate required fields
    if (!sellToken || !buyToken || !sellQty || !selectedAccounts?.length) {
      showAlert({
        severity: 'error',
        message: 'Please fill in all required fields',
      });
      return null;
    }

    if (!config) {
      showAlert({
        severity: 'error',
        message: 'Please wait for order configuration to load',
      });
      return null;
    }

    setIsSubmitted(true);

    try {
      // Prepare order data for submission
      const orderData = {
        // DEX-specific fields
        market_type: 'dex',
        from_token: sellToken.id,
        to_token: buyToken.id,
        sell_token_amount: sellQty,

        // Standard order fields
        accounts: selectedAccounts,
        side: 'buy', // DEX swaps are always sell->buy
        pair: `${buyToken.id}-${sellToken.id}`,

        // Auto order configuration
        auto_order_metadata: {
          urgency,
        },
        strategy_params: {
          slippage: config.slippage / 100,
        },
        duration: config.duration,
        strategy: config.strategy,

        // Quote information
        quote_data: quote,
      };

      // Exit conditions - only add if DEX exit conditions are enabled
      if (isFeatureEnabled('dex_exit_conditions')) {
        const exitConditions = createExitConditions({
          takeProfitPrice,
          takeProfitUrgency,
          takeProfitPercentage,
          stopLossPrice,
          stopLossUrgency,
          stopLossPercentage,
        });
        if (exitConditions) {
          orderData.exit_conditions = exitConditions;
        }
      }

      const response = await submitOrder(orderData);

      // Play success sound
      playOrderSuccess();

      // Show success notification for all DEX order submissions
      showAlert({
        severity: 'success',
        message: 'Successfully submitted DEX order',
      });

      // Close modal and reset form
      setOpenModal(false);
      setModalData(null);

      return response.id;
    } catch (error) {
      showAlert({
        severity: 'error',
        message: error.message || 'Failed to submit DEX order',
      });
    } finally {
      setIsSubmitted(false);
    }
    return null;
  };

  const openConfirmationModal = (dexFormData) => {
    const { sellState, buyState, urgency, quote, config, quoteLoading, isAutoOrderFormLoading, selectedAccounts } =
      dexFormData;

    // Prepare exit conditions data for confirmation modal - only if DEX exit conditions are enabled
    const exitConditions = isFeatureEnabled('dex_exit_conditions')
      ? createExitConditions({
          takeProfitPrice,
          takeProfitUrgency,
          takeProfitPercentage,
          stopLossPrice,
          stopLossUrgency,
          stopLossPercentage,
        })
      : null;

    const confirmationData = {
      sellToken: sellState.token,
      buyToken: buyState.token,
      sellQty: sellState.qty,
      buyQty: buyState.qty,
      buyPrice: buyState.price,
      sellPrice: sellState.price,
      urgency,
      quote,
      autoOrderConfig: config, // Changed from config to autoOrderConfig
      quoteLoading,
      autoLoading: isAutoOrderFormLoading,
      selectedAccounts,
      exitConditions,
    };

    setModalData(confirmationData);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setModalData(null);
  };

  const quickSubmit = async (dexFormData) => {
    if (quickSubmitEnabled) {
      try {
        // Transform the data to match what handleSubmit expects
        const { sellState, buyState, urgency, quote, config, selectedAccounts } = dexFormData;

        const transformedData = {
          sellToken: sellState.token,
          buyToken: buyState.token,
          sellQty: sellState.qty,
          buyQty: buyState.qty,
          buyPrice: buyState.price,
          sellPrice: sellState.price,
          urgency,
          quote,
          config,
          selectedAccounts,
        };

        const orderId = await handleSubmit(transformedData);
        if (orderId) {
          // Success notification and sound are now handled in handleSubmit
          // No need to duplicate them here
        }
      } catch (error) {
        // Error handling is already done in handleSubmit
      }
    }
  };

  const confirmationModalProps = {
    data: modalData,
    handleConfirm: () => {
      // Transform modalData back to the format that handleSubmit expects
      if (!modalData) return null;

      const transformedData = {
        sellToken: modalData.sellToken,
        buyToken: modalData.buyToken,
        sellQty: modalData.sellQty,
        buyQty: modalData.buyQty,
        buyPrice: modalData.buyPrice,
        sellPrice: modalData.sellPrice,
        urgency: modalData.urgency,
        quote: modalData.quote,
        config: modalData.autoOrderConfig, // Transform autoOrderConfig back to config
        selectedAccounts: modalData.selectedAccounts,
      };

      return handleSubmit(transformedData);
    },
    open: openModal,
    setOpen: setOpenModal,
    isSubmitted,
  };

  return {
    isSubmitted,
    openModal,
    modalData,
    handleSubmit,
    openConfirmationModal,
    closeModal,
    quickSubmit,
    confirmationModalProps,
  };
}

export default useDexOrderSubmission;
