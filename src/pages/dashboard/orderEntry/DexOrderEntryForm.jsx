import React, { useState, useCallback } from 'react';
import { Stack, Button, Box, Tooltip, CircularProgress } from '@mui/material';
import ExitConditionsFields from '@/pages/dashboard/orderEntry/ExitConditionsFields';
import WarningIcon from '@mui/icons-material/Warning';
import AccountDropdown from '@/shared/fields/AccountDropdown';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { formatGasFee, checkGasSufficiency } from '@/util/gasFeeUtils';
import { useFeatureFlag } from '@/shared/context/FeatureFlagProvider';
import { NATIVE_TOKENS } from '@/shared/dexUtils';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { QUICK_SUBMIT_ENABLED } from '@/constants';
import { DexSwapQtyInputField } from './SwapQtyInputField';
import useDexOrderEntryForm from './hooks/useDexOrderEntryForm';
import useDexOrderSubmission from './hooks/useDexOrderSubmission';
import { useBaseForm } from './hooks/useBaseForm';
import { DashboardAccordianComponent } from './util';
import OrderUrgencyPicker from './OrderUrgencyPicker';
import { DexOrderConfirmationModal } from './DexOrderConfirmationModal';
import { SimpleOrderExecutionModal } from './SimpleOrderExecutionModal';
import WalletInfoPanel from './WalletInfoPanel';
import DexOrderEntryStats from './DexOrderEntryStats';

function DexConfigInput({
  config,
  setConfig,
  urgency,
  handleUrgencyChange,
  autoOrderUrgencies,
  enableUrgency,
  isAutoOrderFormLoading,
}) {
  return (
    <Stack direction='column' spacing={2}>
      <OrderUrgencyPicker
        disabled={!enableUrgency}
        loading={isAutoOrderFormLoading}
        setUrgency={handleUrgencyChange}
        urgencies={autoOrderUrgencies}
        urgency={urgency}
      />
    </Stack>
  );
}

function DexOrderEntryForm({ isAdvanced = false }) {
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [config, setConfig] = useState({ slippage: 0.5, duration: 300, strategy: 'Market' });
  // Quick submit state
  const [quickSubmitEnabled, setQuickSubmitEnabled] = useState(() => {
    const stored = sessionStorage.getItem(QUICK_SUBMIT_ENABLED);
    if (stored === null) return false; // Not in storage, default to false
    try {
      return JSON.parse(stored);
    } catch (error) {
      // If stored value is invalid JSON, return false
      return false;
    }
  });

  const handleQuickSubmitToggle = () => {
    const newValue = !quickSubmitEnabled;
    setQuickSubmitEnabled(newValue);
    sessionStorage.setItem(QUICK_SUBMIT_ENABLED, JSON.stringify(newValue));
  };

  const { handleCoreFields, autoOrderUrgencies } = useBaseForm();
  const { handleSelectedAccountsChange } = handleCoreFields;
  const { user } = useUserMetadata();
  const { isFeatureEnabled } = useFeatureFlag();
  const dexExitConditionsEnabled = isFeatureEnabled('dex_exit_conditions');
  const [isExitConditionsOpen, setIsExitConditionsOpen] = useState(false);

  const {
    buyState,
    sellState,
    urgency,
    handleBuyQtyChange,
    handleSellQtyChange,
    handleBuyTokenChange,
    handleSellTokenChange,
    handleSwap,
    handleUrgencyChange,
    selectedAccounts,
    accounts,
    quote,
    selectedChain,
    // Auto order config fields
    enableUrgency,
    isAutoOrderFormLoading,
    autoOrderConfig,
    quoteLoading,
  } = useDexOrderEntryForm({ isAdvanced });

  // Get balances from the order form context
  const { balances, FormAtoms } = useOrderForm();

  const { confirmationModalProps, openConfirmationModal, quickSubmit, isSubmitted } = useDexOrderSubmission({
    quickSubmitEnabled,
  });
  const handleConfirmCallback = useCallback(async () => {
    const orderId = await confirmationModalProps.handleConfirm();
    setActiveOrderId(orderId);
  }, [confirmationModalProps]);

  const handleCloseExecution = useCallback(() => {
    setActiveOrderId(null);
  }, []);

  // handleSubmit is defined after all derived validations to satisfy lint rules

  const canSubmit = enableUrgency && autoOrderConfig && !isAutoOrderFormLoading;

  const gasFeeInfo = formatGasFee(quote?.estimateGasFee, selectedChain);

  // Calculate total available gas balance across selected accounts
  const totalAvailableGas = selectedAccounts.reduce((total, accountName) => {
    const account = accounts[accountName];
    const balance = balances[account?.id];

    if (balance && balance.assets && selectedChain) {
      const nativeToken = balance.assets.find((asset) => {
        const nativeTokenAddress = NATIVE_TOKENS[selectedChain];
        if (!asset.symbol || !nativeTokenAddress) return false;

        const isNative =
          asset.symbol.toLowerCase() === nativeTokenAddress.toLowerCase() ||
          asset.symbol.toLowerCase() === `${nativeTokenAddress.toLowerCase()}:${selectedChain}`;

        return isNative;
      });

      return total + (nativeToken?.amount || 0);
    }
    return total;
  }, 0);

  const disableAll = !user?.is_authenticated;

  // Check if gas is insufficient
  const gasSufficiency = checkGasSufficiency(quote?.estimateGasFee, totalAvailableGas, selectedChain);

  // Check if max slippage is too low compared to estimated slippage
  const estimatedSlippage = quote?.priceImpactPercentage ? parseFloat(quote.priceImpactPercentage) : null;
  const isMaxSlippageTooLow = () => {
    if (!autoOrderConfig?.slippage || !estimatedSlippage) return false;
    // Use absolute value for comparison since max slippage is always positive
    return autoOrderConfig.slippage < Math.abs(estimatedSlippage);
  };

  // Check if sell quantity exceeds available balance for the selected account
  const isSellQtyOverBalance = () => {
    const qtyNum = parseFloat(sellState?.qty);
    const balanceNum = parseFloat(sellState?.balance ?? 0);
    if (!sellState?.qty || Number.isNaN(qtyNum) || Number.isNaN(balanceNum)) return false;
    return qtyNum > balanceNum;
  };

  // Get tooltip title for submit button
  const getSubmitButtonTooltip = () => {
    if (gasSufficiency.isInsufficient) return 'Insufficient gas';
    if (isMaxSlippageTooLow())
      return 'Max slippage is too low compared to estimated slippage. Consider increasing slippage tolerance.';
    if (isSellQtyOverBalance()) return `Insufficient ${sellState?.token?.label || 'asset'} balance`;
    return '';
  };

  // Determine if submit button should be disabled and what color to use
  const isSubmitDisabled = !canSubmit || disableAll || gasSufficiency.isInsufficient || isSellQtyOverBalance();
  const hasValidationError = gasSufficiency.isInsufficient || isSellQtyOverBalance();
  const buttonColor = hasValidationError ? 'error' : 'success';

  const handleSubmit = () => {
    // Prevent submission when validations fail
    if (gasSufficiency.isInsufficient || isMaxSlippageTooLow() || isSellQtyOverBalance()) return;
    const dexFormData = {
      sellState,
      buyState,
      urgency,
      quote,
      config: isAdvanced ? config : autoOrderConfig,
      selectedAccounts,
      quoteLoading,
      isAutoOrderFormLoading,
    };

    // If quick submit is enabled, submit directly
    if (quickSubmitEnabled) {
      quickSubmit(dexFormData);
    } else {
      openConfirmationModal(dexFormData);
    }
  };

  return (
    <>
      <Box sx={{ position: 'relative', height: '100%' }}>
        <div style={{ height: '100%', position: 'relative' }}>
          <Stack
            direction='column'
            spacing={4}
            sx={{
              height: 'calc(100% - 360px)', // Leave space for sticky bottom section - extra scroll depth for Stop Loss
              overflow: 'auto',
              marginBottom: '1rem',
              scrollbarGutter: 'stable',
            }}
          >
            <Box sx={{ pt: 1.5 }}>
              <AccountDropdown
                isDex
                multiple
                simpleChip
                accounts={accounts}
                extraStyling={{ height: '50px' }}
                handleSelectedAccountsChange={(e) => handleSelectedAccountsChange(e.target.value)}
                handleSelectedAccountsDelete={(value) => handleSelectedAccountsChange(value)}
                selectedAccounts={selectedAccounts}
              />
            </Box>

            <DexSwapQtyInputField
              buyState={buyState}
              disabled={disableAll}
              rate={quote?.fromTokenAmount && quote?.toTokenAmount ? quote.toTokenAmount / quote.fromTokenAmount : null}
              selectedChain={selectedChain}
              sellState={sellState}
              onBuyQtyChange={handleBuyQtyChange}
              onBuyTokenChange={handleBuyTokenChange}
              onSellQtyChange={handleSellQtyChange}
              onSellTokenChange={handleSellTokenChange}
              onSwap={handleSwap}
            />

            {isAdvanced ? (
              <DexConfigInput
                autoOrderUrgencies={autoOrderUrgencies}
                config={config}
                enableUrgency={enableUrgency}
                handleUrgencyChange={handleUrgencyChange}
                isAutoOrderFormLoading={isAutoOrderFormLoading}
                setConfig={setConfig}
                urgency={urgency}
              />
            ) : (
              <OrderUrgencyPicker
                disabled={!enableUrgency}
                loading={isAutoOrderFormLoading}
                setUrgency={handleUrgencyChange}
                urgencies={autoOrderUrgencies}
                urgency={urgency}
              />
            )}

            {isAdvanced && dexExitConditionsEnabled && (
              <DashboardAccordianComponent
                isAlgo
                isOpen={isExitConditionsOpen}
                setIsOpen={setIsExitConditionsOpen}
                title='Exit Conditions'
              >
                <ExitConditionsFields FormAtoms={FormAtoms} />
              </DashboardAccordianComponent>
            )}
          </Stack>

          {/* needed for styling */}
          <div style={{ height: '100%', position: 'relative' }} />

          <Stack
            minHeight='320px'
            paddingY='8px'
            spacing={2}
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
              backgroundColor: (theme) => theme.palette.background.container,
            }}
          >
            <DexOrderEntryStats
              accounts={accounts}
              autoLoading={isAutoOrderFormLoading}
              balances={balances}
              buyState={buyState}
              gasFeeInfo={gasFeeInfo}
              isAdvanced={isAdvanced}
              quote={quote}
              quoteLoading={quoteLoading}
              selectedAccounts={selectedAccounts}
              selectedChain={selectedChain}
              sellState={sellState}
              slippage={autoOrderConfig?.slippage}
            />

            <WalletInfoPanel
              accounts={accounts}
              balances={balances}
              quoteLoading={quoteLoading}
              selectedAccounts={selectedAccounts}
              selectedChain={selectedChain}
            />

            <Stack alignItems='center' direction='row' spacing={2}>
              <Tooltip placement='top' title={getSubmitButtonTooltip()}>
                <span style={{ display: 'block', width: '100%' }}>
                  <Button
                    fullWidth
                    color={buttonColor}
                    disabled={isSubmitDisabled || isSubmitted}
                    size='large'
                    startIcon={hasValidationError ? <WarningIcon /> : null}
                    variant='contained'
                    onClick={handleSubmit}
                  >
                    {isSubmitted ? <CircularProgress size={20} /> : 'Submit Order'}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  quickSubmitEnabled
                    ? 'Current Setting - Submit order without confirmation. Toggle to enable confirmation to show confirmations before submitting orders'
                    : 'Current Setting - Show order confirmation before submitting orders. Toggle to enable quick submit to submit orders without confirmation'
                }
              >
                <Button
                  color={quickSubmitEnabled ? 'error' : 'success'}
                  size='small'
                  sx={{
                    minWidth: '120px',
                    fontSize: '0.75rem',
                    height: '30px',
                  }}
                  variant='outlined'
                  onClick={handleQuickSubmitToggle}
                >
                  {quickSubmitEnabled ? 'Quick Submit' : 'Confirmation'}
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        </div>
      </Box>

      <DexOrderConfirmationModal
        data={confirmationModalProps.data}
        handleConfirm={handleConfirmCallback}
        isSubmitted={confirmationModalProps.isSubmitted}
        open={confirmationModalProps.open}
        setOpen={confirmationModalProps.setOpen}
      />
      {!isAdvanced && activeOrderId && (
        <SimpleOrderExecutionModal handleClose={handleCloseExecution} orderId={activeOrderId} />
      )}
    </>
  );
}

export default DexOrderEntryForm;
