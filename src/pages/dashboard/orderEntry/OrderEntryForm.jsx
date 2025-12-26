import { useTheme } from '@emotion/react';
import { Box, Button, CircularProgress, Divider, Stack, Tooltip } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useAtom } from 'jotai';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { Loader } from '@/shared/Loader';
import PreTradeAnalyticsComponent from '@/shared/PreTradeAnalyticsComponent';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import AccountDropdown from '@/shared/fields/AccountDropdown';
import LimitPriceField from '@/shared/fields/LimitPriceField';
import StrategyDropdown from '@/shared/fields/StrategyDropdown';
import { MaxLeverageProvider } from '@/context/MaxLeverageContext';
import { isEmpty } from '@/util';
import defaultStrategySettings from '@/pages/dashboard/defaultStrategySettings';
import { getTokenInfo } from '@/shared/dexUtils';
import { getDefaultPairByExchange } from '@/shared/formUtil';
import { QUICK_SUBMIT_ENABLED, LAST_SELECTED_STRATEGY, LAST_SELECTED_TRAJECTORY } from '@/constants';
import LeverageField from '@/shared/components/LeverageField';
import { getAccountExchangeSettings, getContractInfo } from '../../../apiServices';
import AlgoOrderFields from './AlgoOrderFields';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { ChainedOrderConfirmationModal } from './ChainedOrderConfirmationModal';
import { QtyInputField } from './QtyInputField';
import SimpleOrderFields from './SimpleOrderFields';
import { useBaseForm } from './hooks/useBaseForm';
import { useScrollableSticky } from './hooks/useScrollableSticky';
import { useSubmitForm } from './hooks/useSubmitForm';
import { DashboardAccordianComponent, getStrategyObjectSafe, TRAJECTORIES_WITH_LIMIT_PRICE } from './util';
import { BuySellButtons } from './BuySellButtons';
import { PositionSideButtons } from './PositionSideButtons';
import ExitConditionsFields from './ExitConditionsFields';
import ScaleOrdersFields from './ScaleOrdersFields';
import OrderTemplateModal from './OrderTemplateModal';
import MarketStrategyPanel from './MarketStrategyPanel';
import { useCsvOrderUpload } from './hooks/useCsvOrderUpload';
import { CsvOrderConfirmationModal } from './CsvOrderConfirmationModal';

function OrderEntryForm() {
  const { FormAtoms } = useOrderForm();
  const {
    fileInputRef: csvFileInputRef,
    handleFileChange: handleCsvFileChange,
    isParsing: isCsvParsing,
    openFilePicker: openCsvFilePicker,
    processFile: processCsvFile,
    schemaTooltip: csvSchemaTooltip,
    isRetail: isCsvUploadDisabledForRetail,
    submitValidatedOrders,
  } = useCsvOrderUpload();

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvValidatedRows, setCsvValidatedRows] = useState(null);
  const [csvSubmitLoading, setCsvSubmitLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useAtom(FormAtoms.selectedStrategyAtom);
  const [trajectory, setTrajectory] = useAtom(FormAtoms.trajectoryAtom);
  const [selectedStrategyParams, setSelectedStrategyParams] = useAtom(FormAtoms.selectedStrategyParamsAtom);
  const [selectedDuration, setSelectedDuration] = useAtom(FormAtoms.selectedDurationAtom);
  const [updatePairLeverage, setUpdatePairLeverage] = useAtom(FormAtoms.updatePairLeverageAtom);
  const [currentLeverage, setCurrentLeverage] = useAtom(FormAtoms.currentLeverageAtom);
  const [limitPrice, setLimitPrice] = useAtom(FormAtoms.limitPriceAtom);
  const [isReverseLimitPrice, setIsReverseLimitPrice] = useAtom(FormAtoms.isReverseLimitPriceAtom);
  const [stopPrice, setStopPrice] = useAtom(FormAtoms.stopPriceAtom);
  const [loading, setLoading] = useAtom(FormAtoms.loadingAtom);
  const [passiveness, setPassiveness] = useAtom(FormAtoms.passivenessAtom);
  const [discretion, setDiscretion] = useAtom(FormAtoms.discretionAtom);
  const [alphaTilt, setAlphaTilt] = useAtom(FormAtoms.alphaTiltAtom);
  const [notes, setNotes] = useAtom(FormAtoms.notesAtom);
  const [orderCondition, setOrderCondition] = useAtom(FormAtoms.orderConditionAtom);
  const [isOrderConditionValidated, setIsOrderConditionValidated] = useAtom(FormAtoms.isOrderConditionValidatedAtom);
  const [preTradeEstimationData] = useAtom(FormAtoms.preTradeEstimationDataAtom);
  const [preTradeDataLoading] = useAtom(FormAtoms.preTradeDataLoadingAtom);
  const [preTradeDataError] = useAtom(FormAtoms.preTradeDataErrorAtom);
  const [povTarget, setPovTarget] = useAtom(FormAtoms.povTargetAtom);
  const [povLimit, setPovLimit] = useAtom(FormAtoms.povLimitAtom);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useAtom(FormAtoms.isAdvancedSettingsOpenAtom);
  const [isExitConditionsOpen, setIsExitConditionsOpen] = useAtom(FormAtoms.isExitConditionsOpenAtom);
  const [orderTemplateAction, setOrderTemplateAction] = useAtom(FormAtoms.orderTemplateActionAtom);
  const [isTemplateOpen, setIsTemplateOpen] = useAtom(FormAtoms.isTemplateOpenAtom);
  const [isScaleOrdersOpen, setIsScaleOrdersOpen] = useAtom(FormAtoms.isScaleOrdersOpenAtom);
  const [initialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);
  const [targetTime, setTargetTime] = useAtom(FormAtoms.targetTimeAtom);
  const [exchangeSettingsByAccount, setExchangeSettingsByAccount] = useState(null);
  const [posSide, setPosSide] = useAtom(FormAtoms.posSideAtom);
  const [contractInfoByAccountId, setContractInfoByAccountId] = useState({});
  const [orderSlices, setOrderSlices] = useAtom(FormAtoms.orderSlicesAtom);
  const [_, setTrajectoryOptions] = useAtom(FormAtoms.trajectoryOptionsAtom);
  const [qtyLoading, setQtyLoading] = useAtom(FormAtoms.qtyLoadingAtom);

  const { accounts, exchanges, strategies, trajectories, strategyParams, tokenPairs } = initialLoadValue;

  const isDataLoaded = Object.keys(initialLoadValue).length > 0;

  const { showAlert } = useContext(ErrorContext);

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

  const theme = useTheme();
  const cardRef = useRef(null);
  const scrollableRef = useRef(null);
  const stickyRef = useRef(null);

  const sliderProps = {
    passiveness,
    discretion,
    alphaTilt,
    setPassiveness,
    setDiscretion,
    setAlphaTilt,
  };

  const { maxHeight } = useScrollableSticky(
    isDataLoaded,
    isAdvancedSettingsOpen || isExitConditionsOpen,
    cardRef,
    scrollableRef,
    stickyRef
  );

  const sliderUpdatingRef = useRef(false);
  const { handleCoreFields, quoteBaseStates, handleBaseQuoteFields, percentageSliderInfo, fetchPairPrice } =
    useBaseForm({ sliderUpdatingRef, currentLeverage });

  const { handleSelectedAccountsChange, handleSelectedSide, handleSelectedPair } = handleCoreFields;

  const {
    baseQty,
    quoteQty,
    baseQtyPlaceholder,
    quoteQtyPlaceholder,
    baseContractQty,
    basePercentage,
    quotePercentage,
    convertedQtyLoading,
    selectedAccounts,
    selectedPair,
    setSelectedPair,
    selectedSide,
    convertedQty,
    setBasePercentage,
    setQuotePercentage,
    setBaseQty,
    setQuoteQty,
  } = quoteBaseStates;

  const {
    handleBaseQtyOnChange,
    handleQuoteQtyOnChange,
    onBasePercentageChangeCommit,
    onQuotePercentageChangeCommit,
    fetchTradePrediction,
  } = handleBaseQuoteFields;

  const isBuySide = selectedSide === 'buy';

  const { totalQuoteAsset, totalBaseAsset } = percentageSliderInfo;

  const {
    submitCheck,
    isSubmitted,
    confirmationModalProps,
    chainedOrderConfirmationModalProps,
    shouldCreateChainedOrder,
    getChainedOrderCount,
  } = useSubmitForm({ quickSubmitEnabled });

  const selectedAccountExchangeNames =
    selectedAccounts.length > 0 ? selectedAccounts.map((acc) => accounts[acc]?.exchangeName) : [];

  useEffect(() => {
    if (!initialLoadValue || isEmpty(initialLoadValue.strategies)) {
      return;
    }
    const trajectoriesList = Object.values(initialLoadValue.trajectories);
    const strategiesList = Object.values(initialLoadValue.strategies);
    const vwapTrajectory = trajectoriesList.find((element) => element.name === 'VWAP');

    // Check for persisted strategy selection
    const persistedStrategy = sessionStorage.getItem(LAST_SELECTED_STRATEGY);
    let strategyToSet = null;

    if (persistedStrategy) {
      // Check if the persisted strategy exists in current strategies or trajectories
      const allStrategies = { ...initialLoadValue.strategies, ...initialLoadValue.trajectories };
      if (persistedStrategy in allStrategies) {
        strategyToSet = persistedStrategy;
      }
    }

    // Fall back to default Impact Minimization if no valid persisted strategy
    if (!strategyToSet) {
      const defaultStrategy = strategiesList.find((element) => element.name.includes('Impact Minimization'));
      strategyToSet = defaultStrategy ? defaultStrategy.id : strategiesList[0].id;
    }

    const persistedTrajectory = sessionStorage.getItem(LAST_SELECTED_TRAJECTORY);

    setTrajectory(persistedTrajectory || vwapTrajectory.id);
    setTrajectoryOptions(initialLoadValue.trajectories);
    setSelectedStrategy(strategyToSet);
  }, [initialLoadValue]);

  // Save selected strategy to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedStrategy) {
      sessionStorage.setItem(LAST_SELECTED_STRATEGY, selectedStrategy);
      sessionStorage.setItem(LAST_SELECTED_TRAJECTORY, trajectory);
    }
  }, [selectedStrategy]);

  const posModeEnabledExchanges = ['OKX', 'Binance', 'Bybit', 'Bitget'];
  useEffect(() => {
    const loadAccountExchangeSettings = async (accountIds) => {
      try {
        const exchangeSettings = await getAccountExchangeSettings(accountIds);
        setExchangeSettingsByAccount(exchangeSettings);
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Could not load account exchange settings: ${e.message}`,
        });
      }
    };

    const loadContractInfo = async (pair, accountIds) => {
      const { tokenAddress, chainId } = getTokenInfo(pair);
      if (tokenAddress || chainId) {
        // skip dex pairs
        return;
      }
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

    const selectedExchanges = selectedAccounts.map((acc) => accounts[acc].exchangeName);
    const isPosModeEnabledExchange =
      selectedExchanges.length > 0 && selectedExchanges.every((exchange) => posModeEnabledExchanges.includes(exchange));

    const isPosModeEnabledMarketType = selectedPair && selectedPair.market_type !== 'spot';

    if (isPosModeEnabledExchange && isPosModeEnabledMarketType && selectedPair) {
      const accountIds = selectedAccounts.map((acc) => accounts[acc].id);
      loadAccountExchangeSettings(accountIds);
      loadContractInfo(selectedPair.id, accountIds);
    }
  }, [selectedAccounts, selectedPair]);

  // On initial load, fix selected pair and accounts if was dex
  useEffect(() => {
    if (selectedPair?.market_type === 'dex') {
      const firstExchange = selectedAccountExchangeNames.length > 0 ? selectedAccountExchangeNames[0] : null;
      const defaultPair = getDefaultPairByExchange(firstExchange, tokenPairs);
      if (defaultPair) {
        setSelectedPair(defaultPair);
      }
    }
  }, []);

  const selectedStrategyObj = getStrategyObjectSafe({ ...strategies, ...trajectories }, selectedStrategy);
  const selectedStrategyName = selectedStrategyObj.name;

  const { AdvancedSettingsRender, RenderStrategyContainer, applyPresets } = AlgoOrderFields({
    baseAssetQty: baseQty || convertedQty,
    exchanges,
    fetchTradePrediction,
    isBuySide,
    isOrderConditionValidated,
    isPovLoading: preTradeDataLoading,
    limitPrice,
    notes,
    orderCondition,
    povLimit,
    povTarget,
    preTradeDataLoading,
    selectedAccountExchangeNames,
    selectedDuration,
    selectedPairName: selectedPair ? selectedPair.id : null,
    selectedStrategy,
    selectedStrategyName,
    selectedStrategyParams,
    setIsOrderConditionValidated,
    setLimitPrice,
    setNotes,
    setOrderCondition,
    setPovLimit,
    setPovTarget,
    setSelectedDuration,
    setSelectedStrategyParams,
    setTrajectory,
    setUpdatePairLeverage,
    showAlert,
    sliderProps,
    strategies,
    strategyParams,
    trajectory,
    trajectories,
    tokenPairs,
    updatePairLeverage,
    targetTime,
    setTargetTime,
    FormAtoms,
  });

  const isLimitSimpleStrategy = TRAJECTORIES_WITH_LIMIT_PRICE.includes(selectedStrategyName);

  const isReadyToPickQty = selectedAccounts.length > 0 && selectedPair && Object.keys(selectedPair).length > 0;

  const isReadyToSubmit =
    !qtyLoading &&
    selectedAccounts.length > 0 &&
    selectedPair &&
    (!!baseQty || !!quoteQty) &&
    (!orderCondition || isOrderConditionValidated) &&
    !(isLimitSimpleStrategy && (limitPrice === '' || Number.isNaN(Number(limitPrice)) || Number(limitPrice) <= 0));

  const isCustomSuperStrategy = selectedStrategy === 'Custom';

  const isAlgoStrategy =
    (strategies &&
      selectedStrategy &&
      strategies[selectedStrategy] &&
      (!!strategies[selectedStrategy].schedule || strategies[selectedStrategy].is_super_strategy)) ||
    isCustomSuperStrategy;

  const isIcebergStrategy = trajectories && trajectories[selectedStrategy]?.name === 'Iceberg';

  const pairLevelPosModeExchanges = ['Bybit'];

  const disambiguatePosMode = (exchangeSettings, exchangeName, is_inverse) => {
    if (exchangeName === 'Binance' && is_inverse) {
      return exchangeSettings.cm_pos_mode;
    }

    return exchangeSettings.pos_mode;
  };

  const isHedgeMode =
    exchangeSettingsByAccount &&
    selectedAccounts.some((accName) => {
      const account = accounts[accName];
      const exchangeSettings = exchangeSettingsByAccount[account.id];

      let posMode = null;
      if (pairLevelPosModeExchanges.includes(account.exchangeName)) {
        const contractInfo = contractInfoByAccountId && contractInfoByAccountId[account.id];
        posMode = contractInfo && contractInfo.pos_mode;
      } else {
        posMode =
          exchangeSettings && disambiguatePosMode(exchangeSettings, account.exchangeName, selectedPair?.is_inverse);
      }
      return posMode === 'long_short_mode';
    });

  const isFutureOrPerp = selectedPair && (selectedPair.market_type === 'perp' || selectedPair.market_type === 'future');

  useEffect(() => {
    // Only set duration for non-super strategies
    // Set duration to 1 day for limit orders
    if (!selectedStrategyObj?.is_super_strategy) {
      const strategyName = selectedStrategyObj?.name;
      setSelectedDuration(['Iceberg', 'Limit'].includes(strategyName) ? 86400 : defaultStrategySettings.duration);

      // Set passive_only to true for simple limit orders
      if (strategyName === 'Limit') {
        setSelectedStrategyParams({
          ...selectedStrategyParams,
          passive_only: true,
        });
      }
    }
  }, [selectedStrategyObj]);

  useEffect(() => {
    if (isHedgeMode) {
      setPosSide('long');
    } else {
      setPosSide(null);
    }
  }, [isHedgeMode]);

  // Auto-populate limit price for simple limit strategies
  useEffect(() => {
    const autoPopulateLimitPrice = async () => {
      if (
        isLimitSimpleStrategy &&
        selectedAccounts.length > 0 &&
        selectedPair &&
        limitPrice === '' &&
        selectedAccountExchangeNames.length > 0
      ) {
        try {
          // Get the first account's exchange for price fetching
          const exchange = selectedAccountExchangeNames[0];
          const pairName = selectedPair.id;

          // Import the getOrderBook function
          const { getOrderBook } = await import('../../../apiServices');
          const result = await getOrderBook(exchange, pairName);

          if (result && result.asks.length > 0 && result.bids.length > 0) {
            const midPrice = (result.asks[0].price + result.bids[0].price) / 2;
            setLimitPrice(midPrice.toString());
          }
        } catch (error) {
          // Silently fail - user can manually enter price
        }
      }
    };

    autoPopulateLimitPrice();
  }, [isLimitSimpleStrategy, selectedAccounts, selectedPair, limitPrice, selectedAccountExchangeNames, setLimitPrice]);

  if (loading) {
    return <Loader />;
  }

  const renderBuySellButtons = () => {
    if (!isHedgeMode || !isFutureOrPerp) {
      return (
        <BuySellButtons
          handleSelectedSide={handleSelectedSide}
          isBuySide={isBuySide}
          isHedgeMode={isHedgeMode}
          selectedPair={selectedPair}
          selectedSide={selectedSide}
        />
      );
    }

    return (
      <Stack direction='column' gap={0} height='100%'>
        <BuySellButtons
          isCompact
          handleSelectedSide={handleSelectedSide}
          isBuySide={isBuySide}
          isHedgeMode={isHedgeMode}
          selectedPair={selectedPair}
          selectedSide={selectedSide}
        />
        <PositionSideButtons isCompact posSide={posSide} setPosSide={setPosSide} />
      </Stack>
    );
  };

  const onFormSubmit = async (e) => {
    fetchPairPrice(); // refresh pair price before submitting
    submitCheck(e);
  };

  return (
    <Box
      ref={cardRef}
      sx={{
        height: '100%',
      }}
    >
      <form style={{ height: '100%', position: 'relative' }} onSubmit={onFormSubmit}>
        <div style={{ height: '100%', position: 'relative' }}>
          <Grid
            container
            ref={scrollableRef}
            spacing={4}
            sx={{
              maxHeight,
              overflow: 'auto',
              marginBottom: '1rem',
              scrollbarGutter: 'stable',
              marginRight: '-1rem',
            }}
          >
            <Grid xs={6}>
              <AccountDropdown
                multiple
                simpleChip
                accounts={accounts}
                extraStyling={{ height: '50.25px' }}
                handleSelectedAccountsChange={(e) => handleSelectedAccountsChange(e.target.value)}
                handleSelectedAccountsDelete={(value) => handleSelectedAccountsChange(value)}
                selectedAccounts={selectedAccounts}
              />
            </Grid>

            <Grid xs={6}>
              <Box height='50.25px'>{renderBuySellButtons()}</Box>
            </Grid>

            <Grid xs={6}>
              <QtyInputField
                isBase
                accounts={accounts}
                contractQty={baseContractQty}
                convertedQtyLoading={convertedQtyLoading}
                handleQtyOnChange={handleBaseQtyOnChange}
                isBuySide={isBuySide}
                isReadyToPickQty={isReadyToPickQty}
                oppositeQtyExists={!!quoteQty}
                percentage={basePercentage}
                qty={baseQty}
                qtyPlaceholder={baseQtyPlaceholder}
                selectedAccounts={selectedAccounts}
                selectedPair={selectedPair}
                setBaseQty={setBaseQty}
                setPercentage={setBasePercentage}
                setQtyLoading={setQtyLoading}
                setQuoteQty={setQuoteQty}
                sliderUpdatingRef={sliderUpdatingRef}
                totalBaseAsset={totalBaseAsset}
                totalQuoteAsset={totalQuoteAsset}
                onPercentageChangeCommit={onBasePercentageChangeCommit}
              />
            </Grid>
            <Grid xs={6}>
              <QtyInputField
                accounts={accounts}
                convertedQtyLoading={convertedQtyLoading}
                handleQtyOnChange={handleQuoteQtyOnChange}
                isBase={false}
                isBuySide={isBuySide}
                isReadyToPickQty={isReadyToPickQty}
                oppositeQtyExists={!!baseQty}
                percentage={quotePercentage}
                qty={quoteQty}
                qtyPlaceholder={quoteQtyPlaceholder}
                selectedAccounts={selectedAccounts}
                selectedPair={selectedPair}
                setBaseQty={setBaseQty}
                setPercentage={setQuotePercentage}
                setQtyLoading={setQtyLoading}
                setQuoteQty={setQuoteQty}
                sliderUpdatingRef={sliderUpdatingRef}
                totalBaseAsset={totalBaseAsset}
                totalQuoteAsset={totalQuoteAsset}
                onPercentageChangeCommit={onQuotePercentageChangeCommit}
              />
            </Grid>
            {selectedPair?.market_type === 'perp' && (
              <Grid item='true' xs={12}>
                <MaxLeverageProvider>
                  <LeverageField />
                </MaxLeverageProvider>
              </Grid>
            )}
            <Grid xs={12}>
              <StrategyDropdown
                includeSimple
                applyPresets={applyPresets}
                setTrajectory={setTrajectory}
                setValue={setSelectedStrategy}
                strategies={strategies}
                trajectories={trajectories}
                value={selectedStrategy}
              />
            </Grid>

            {/* Market Strategy Panel */}
            {selectedStrategyName === 'Market' && (
              <Grid xs={12}>
                <MarketStrategyPanel
                  quickSubmitEnabled={quickSubmitEnabled}
                  onQuickSubmitToggle={handleQuickSubmitToggle}
                />
              </Grid>
            )}
            {(isAlgoStrategy || isLimitSimpleStrategy) && (
              <Grid item='true' xs={12}>
                <LimitPriceField
                  exchanges={exchanges}
                  FormAtoms={FormAtoms}
                  isBuySide={isBuySide}
                  isReverseLimitPrice={isReverseLimitPrice}
                  limitPrice={limitPrice}
                  selectedAccountExchangeNames={selectedAccountExchangeNames}
                  selectedPairName={selectedPair ? selectedPair.id : null}
                  setIsReverseLimitPrice={setIsReverseLimitPrice}
                  setLimitPrice={setLimitPrice}
                  showAlert={showAlert}
                  simple={isLimitSimpleStrategy}
                  tokenPairs={tokenPairs}
                />
              </Grid>
            )}
            {!isAlgoStrategy && (
              <Grid item='true' xs={12}>
                <SimpleOrderFields
                  FormAtoms={FormAtoms}
                  orderSlices={orderSlices}
                  selectedAccountExchangeNames={selectedAccountExchangeNames}
                  selectedDuration={selectedDuration}
                  selectedStrategy={selectedStrategy}
                  selectedStrategyName={selectedStrategyName}
                  selectedStrategyParams={selectedStrategyParams}
                  setOrderSlices={setOrderSlices}
                  setSelectedDuration={setSelectedDuration}
                  setSelectedStrategyParams={setSelectedStrategyParams}
                  setStopPrice={setStopPrice}
                  showSlices={isIcebergStrategy}
                  sliderProps={sliderProps}
                  stopPrice={stopPrice}
                  strategies={strategies}
                  strategyParams={strategyParams}
                />
              </Grid>
            )}
            <Grid xs={12}>{RenderStrategyContainer}</Grid>
            <Grid item='true' xs={12}>
              <DashboardAccordianComponent
                isAlgo
                isOpen={isExitConditionsOpen}
                setIsOpen={setIsExitConditionsOpen}
                title='Exit Conditions'
              >
                <ExitConditionsFields FormAtoms={FormAtoms} />
              </DashboardAccordianComponent>
            </Grid>

            {/* Scale Orders */}
            <Grid item='true' xs={12}>
              <DashboardAccordianComponent
                isAlgo
                isOpen={isScaleOrdersOpen}
                setIsOpen={setIsScaleOrdersOpen}
                title='Scale Orders'
              >
                <ScaleOrdersFields FormAtoms={FormAtoms} />
              </DashboardAccordianComponent>
            </Grid>

            {isAlgoStrategy && (
              <Grid item='true' xs={12}>
                <DashboardAccordianComponent
                  isAlgo={isAlgoStrategy}
                  isOpen={isAdvancedSettingsOpen}
                  setIsOpen={setIsAdvancedSettingsOpen}
                  title='Advanced Settings'
                >
                  {AdvancedSettingsRender}
                </DashboardAccordianComponent>
              </Grid>
            )}
          </Grid>
          {/* needed for styling */}
          <div style={{ height: '100%', position: 'relative' }} />
          <Stack
            minHeight='160px'
            paddingY='8px'
            ref={stickyRef}
            spacing={2}
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
              backgroundColor: theme.components.MuiCard.styleOverrides.root.backgroundColor,
            }}
          >
            <PreTradeAnalyticsComponent
              data={preTradeEstimationData}
              dataError={preTradeDataError}
              loading={preTradeDataLoading}
            />
            <Stack direction='row' spacing={2}>
              <Button
                fullWidth
                variant='outlined'
                onClick={() => {
                  setOrderTemplateAction('save');
                  setIsTemplateOpen(true);
                }}
              >
                Save Templates
              </Button>
              <Button
                fullWidth
                variant='outlined'
                onClick={() => {
                  setOrderTemplateAction('manage');
                  setIsTemplateOpen(true);
                }}
              >
                Load Templates
              </Button>
              {!isCsvUploadDisabledForRetail && (
                <>
                  <input
                    accept='.csv'
                    ref={csvFileInputRef}
                    style={{ display: 'none' }}
                    type='file'
                    onChange={async (event) => {
                      const inputElement = event.target;
                      const files = inputElement?.files;
                      if (!files || files.length === 0) {
                        return;
                      }

                      const file = files[0];
                      if (!file) {
                        return;
                      }

                      const validatedRows = await processCsvFile(file, inputElement);
                      if (validatedRows) {
                        setCsvValidatedRows(validatedRows);
                        setCsvModalOpen(true);
                      }
                    }}
                  />
                  <Tooltip
                    placement='top'
                    title={
                      <Box component='div' sx={{ whiteSpace: 'pre-line' }}>
                        {`${csvSchemaTooltip}\nUpload to automatically submit one order per row.`}
                      </Box>
                    }
                  >
                    <span style={{ width: '100%' }}>
                      <Button fullWidth disabled={isCsvParsing} variant='outlined' onClick={openCsvFilePicker}>
                        {isCsvParsing ? 'Parsing CSV…' : 'Upload CSV'}
                      </Button>
                    </span>
                  </Tooltip>
                </>
              )}
            </Stack>
            <Stack alignItems='center' direction='row' spacing={2}>
              {!isSubmitted ? (
                <Button
                  fullWidth
                  color={isBuySide ? 'success' : 'error'}
                  disabled={!isReadyToSubmit}
                  size='large'
                  sx={isBuySide ? { color: '#000000' } : {}}
                  type='submit'
                  variant='contained'
                >
                  {shouldCreateChainedOrder()
                    ? `Submit ${getChainedOrderCount()} Chained ${isBuySide ? 'Buy' : 'Sell'} Orders`
                    : `Submit ${isBuySide ? 'Buy' : 'Sell'} Order`}
                </Button>
              ) : (
                <Button disabled fullWidth size='large' variant='contained'>
                  <CircularProgress size={20} />
                </Button>
              )}
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
      </form>
      <OrderConfirmationModal isSubmitted={isSubmitted} props={confirmationModalProps} />
      <ChainedOrderConfirmationModal isSubmitted={isSubmitted} props={chainedOrderConfirmationModalProps} />
      <OrderTemplateModal open={isTemplateOpen} setOpen={setIsTemplateOpen} type={orderTemplateAction} />
      <CsvOrderConfirmationModal
        open={csvModalOpen}
        setOpen={setCsvModalOpen}
        submitLoading={csvSubmitLoading}
        validatedRows={csvValidatedRows}
        onSubmit={async (validatedRows) => {
          setCsvSubmitLoading(true);
          try {
            await submitValidatedOrders(validatedRows);
            setCsvModalOpen(false);
            setCsvValidatedRows(null);
          } catch (error) {
            // Error is already handled in submitValidatedOrders
          } finally {
            setCsvSubmitLoading(false);
          }
        }}
      />
    </Box>
  );
}

export default OrderEntryForm;
