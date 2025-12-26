import { useTheme } from '@emotion/react';
import { Box, Button, CircularProgress, Divider, Stack } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useAtom } from 'jotai';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { LAST_SELECTED_STRATEGY, LAST_SELECTED_TRAJECTORY } from '@/constants';
import {
  fetchCachedAccountBalances,
  getAccountExchangeSettings,
  getContractInfo,
  getUserFavouritePairs,
} from '../../apiServices';
import PreTradeAnalyticsComponent from '../../shared/PreTradeAnalyticsComponent';
import { ErrorContext } from '../../shared/context/ErrorProvider';
import AccountDropdown from '../../shared/fields/AccountDropdown';
import LimitPriceField from '../../shared/fields/LimitPriceField';
import StrategyDropdown from '../../shared/fields/StrategyDropdown';
import { isEmpty } from '../../util';
import { AccountBalanceProvider } from '../dashboard/orderEntry/AccountBalanceContext';
import AlgoOrderFields from '../dashboard/orderEntry/AlgoOrderFields';
import { BuySellButtons } from '../dashboard/orderEntry/BuySellButtons';
import PairSelector from '../dashboard/orderEntry/PairSelector';
import { PositionSideButtons } from '../dashboard/orderEntry/PositionSideButtons';
import { QtyInputField } from '../dashboard/orderEntry/QtyInputField';
import SimpleOrderFields from '../dashboard/orderEntry/SimpleOrderFields';
import { useBaseForm } from '../dashboard/orderEntry/hooks/useBaseForm';
import { useScrollableSticky } from '../dashboard/orderEntry/hooks/useScrollableSticky';
import { useSubmitForm } from '../dashboard/orderEntry/hooks/useSubmitForm';
import { DashboardAccordianComponent, getStrategyObjectSafe } from '../dashboard/orderEntry/util';
import OrderTemplateModal from '../dashboard/orderEntry/OrderTemplateModal';

function ChainedOrderEntryForm({ addNewRow, FormAtoms, isAuthenticated }) {
  const [selectedStrategy, setSelectedStrategy] = useAtom(FormAtoms.selectedStrategyAtom);
  const [trajectory, setTrajectory] = useAtom(FormAtoms.trajectoryAtom);
  const [selectedStrategyParams, setSelectedStrategyParams] = useAtom(FormAtoms.selectedStrategyParamsAtom);
  const [selectedDuration, setSelectedDuration] = useAtom(FormAtoms.selectedDurationAtom);
  const [updatePairLeverage, setUpdatePairLeverage] = useAtom(FormAtoms.updatePairLeverageAtom);
  const [limitPrice, setLimitPrice] = useAtom(FormAtoms.limitPriceAtom);
  const [isReverseLimitPrice, setIsReverseLimitPrice] = useAtom(FormAtoms.isReverseLimitPriceAtom);
  const [stopPrice, setStopPrice] = useAtom(FormAtoms.stopPriceAtom);
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
  const [orderTemplateAction, setOrderTemplateAction] = useAtom(FormAtoms.orderTemplateActionAtom);
  const [isTemplateOpen, setIsTemplateOpen] = useAtom(FormAtoms.isTemplateOpenAtom);
  const [initialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);
  const [targetTime, setTargetTime] = useAtom(FormAtoms.targetTimeAtom);
  const [exchangeSettingsByAccount, setExchangeSettingsByAccount] = useState(null);
  const [posSide, setPosSide] = useAtom(FormAtoms.posSideAtom);
  const [contractInfoByAccountId, setContractInfoByAccountId] = useState({});
  const [isOOLEnabled, setIsOOLEnabled] = useAtom(FormAtoms.isOOLEnabledAtom);

  const [balances, setBalances] = useState({});
  const [favouritePairs, setFavouritePairs] = useState({});

  const { accounts, exchanges, strategies, trajectories, strategyParams, tokenPairs } = initialLoadValue;

  const isDataLoaded = Object.keys(initialLoadValue).length > 0;

  const { showAlert } = useContext(ErrorContext);

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

  const { maxHeight } = useScrollableSticky(isDataLoaded, isAdvancedSettingsOpen, cardRef, scrollableRef, stickyRef);

  const { handleCoreFields, quoteBaseStates, handleBaseQuoteFields, percentageSliderInfo } = useBaseForm({});

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
    selectedSide,
    convertedQty,
    setQtyLoading,
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

  const { isSubmitted } = useSubmitForm({});

  const selectedAccountExchangeNames =
    selectedAccounts.length > 0
      ? selectedAccounts
          .filter((acc) => accounts[acc]) // Filter out archived/invalid accounts
          .map((acc) => accounts[acc].exchangeName)
      : [];

  // Temporary fix to disable OOLEnabled for chained orders
  useEffect(() => {
    setIsOOLEnabled(false);
  }, [isOOLEnabled]);

  useEffect(() => {
    const getAccountBalances = async () => {
      let data;

      try {
        data = await fetchCachedAccountBalances();
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Unable to load account balances: ${e.message}`,
        });
        return;
      }
      const entryBalances = {};

      data.balances.forEach((balance) => {
        entryBalances[balance.account_id] = balance;
      });

      setBalances(entryBalances);
    };

    const loadFavouritePairs = async () => {
      let pairs;

      try {
        const result = await getUserFavouritePairs();
        pairs = result.pairs;
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Unable to load favourite pairs: ${e.message}`,
        });
        return;
      }

      setFavouritePairs(
        pairs.reduce((acc, pair) => {
          return { ...acc, [pair]: true };
        }, {})
      );
    };

    getAccountBalances();
    loadFavouritePairs();
  }, []);

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
    const persistedTrajectory = sessionStorage.getItem(LAST_SELECTED_TRAJECTORY);

    // Fall back to default Impact Minimization if no valid persisted strategy
    if (!strategyToSet) {
      const defaultStrategy = strategiesList.find((element) => element.name.includes('Impact Minimization'));
      strategyToSet = defaultStrategy ? defaultStrategy.id : strategiesList[0].id;
    }

    setTrajectory(persistedTrajectory || vwapTrajectory.id);
    setSelectedStrategy(strategyToSet);
  }, [initialLoadValue]);

  // Save selected strategy to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedStrategy) {
      sessionStorage.setItem(LAST_SELECTED_STRATEGY, selectedStrategy);
      sessionStorage.setItem(LAST_SELECTED_TRAJECTORY, trajectory);
    }
  }, [selectedStrategy]);

  const posModeEnabledExchanges = ['OKX', 'Bybit'];
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

    if (isPosModeEnabledExchange && isPosModeEnabledMarketType) {
      const accountIds = selectedAccounts.map((acc) => accounts[acc].id);
      loadAccountExchangeSettings(accountIds);
      loadContractInfo(selectedPair.id, accountIds);
    }
  }, [selectedAccounts, selectedPair]);

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

  const isReadyToPickQty = selectedAccounts.length > 0 && selectedPair && Object.keys(selectedPair).length > 0;

  const isCustomSuperStrategy = selectedStrategy === 'Custom';

  const isReadyToSubmit =
    selectedAccounts.length > 0 &&
    selectedPair &&
    (!!baseQty || !!quoteQty) &&
    (!orderCondition || isOrderConditionValidated);

  const isAlgoStrategy =
    (strategies &&
      selectedStrategy &&
      strategies[selectedStrategy] &&
      (!!strategies[selectedStrategy].schedule || strategies[selectedStrategy].is_super_strategy)) ||
    isCustomSuperStrategy;

  const pairLevelPosModeExchanges = ['Bybit'];

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
        posMode = exchangeSettings && exchangeSettings.pos_mode;
      }
      return posMode === 'long_short_mode';
    });

  const isFutureOrPerp = selectedPair && (selectedPair.market_type === 'perp' || selectedPair.market_type === 'future');

  useEffect(() => {
    if (isHedgeMode) {
      setPosSide('long');
    } else {
      setPosSide(null);
    }
  }, [isHedgeMode]);

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
    e.preventDefault();
    if (isEmpty(selectedAccounts) || !selectedPair || (!quoteQty && !baseQty)) {
      showAlert({
        severity: 'error',
        message: 'Cannot add order, Accounts, Pair, or Quantity is required',
      });
      return;
    }
    addNewRow();
  };

  return (
    <Box
      ref={cardRef}
      sx={{
        height: '100%',
        filter: isAuthenticated ? 'none' : 'blur(2px)',
        pointerEvents: isAuthenticated ? 'auto' : 'none',
        opacity: isAuthenticated ? 1 : 0.8,
      }}
    >
      <form style={{ height: '100%', position: 'relative' }} onSubmit={onFormSubmit}>
        <div style={{ height: '100%', position: 'relative' }}>
          <Grid
            container
            ref={scrollableRef}
            spacing={2}
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
                multiOrder
                multiple
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

            <Grid xs={12}>
              <Box
                alignItems='center'
                display='flex'
                height='50.25px'
                justifyContent='center'
                sx={{
                  cursor: 'pointer',
                  border: `1px solid ${theme.palette.text.disabled}`,
                  borderRadius: '4px',
                }}
                width='100%'
              >
                <PairSelector
                  ChainedOrders
                  accounts={accounts}
                  balances={balances}
                  favourites={favouritePairs}
                  pairs={tokenPairs}
                  selectedAccounts={selectedAccounts}
                  selectedPairName={selectedPair?.id}
                  setFavourites={setFavouritePairs}
                  setSelectedPair={handleSelectedPair}
                  showAlert={showAlert}
                />
              </Box>
            </Grid>

            <AccountBalanceProvider>
              <Grid xs={6}>
                <QtyInputField
                  isBase
                  contractQty={baseContractQty}
                  convertedQtyLoading={convertedQtyLoading}
                  handleQtyOnChange={handleBaseQtyOnChange}
                  isBuySide={isBuySide}
                  isReadyToPickQty={isReadyToPickQty}
                  oppositeQtyExists={!!quoteQty}
                  percentage={basePercentage}
                  qty={baseQty}
                  qtyPlaceholder={baseQtyPlaceholder}
                  selectedPair={selectedPair}
                  setBaseQty={setBaseQty}
                  setPercentage={setBasePercentage}
                  setQtyLoading={setQtyLoading}
                  setQuoteQty={setQuoteQty}
                  totalBaseAsset={totalBaseAsset}
                  totalQuoteAsset={totalQuoteAsset}
                  onPercentageChangeCommit={onBasePercentageChangeCommit}
                />
              </Grid>
              <Grid xs={6}>
                <QtyInputField
                  convertedQtyLoading={convertedQtyLoading}
                  handleQtyOnChange={handleQuoteQtyOnChange}
                  isBase={false}
                  isBuySide={isBuySide}
                  isReadyToPickQty={isReadyToPickQty}
                  oppositeQtyExists={!!baseQty}
                  percentage={quotePercentage}
                  qty={quoteQty}
                  qtyPlaceholder={quoteQtyPlaceholder}
                  selectedPair={selectedPair}
                  setBaseQty={setBaseQty}
                  setPercentage={setQuotePercentage}
                  setQtyLoading={setQtyLoading}
                  setQuoteQty={setQuoteQty}
                  totalBaseAsset={totalBaseAsset}
                  totalQuoteAsset={totalQuoteAsset}
                  onPercentageChangeCommit={onQuotePercentageChangeCommit}
                />
              </Grid>
            </AccountBalanceProvider>
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
            {(isAlgoStrategy ||
              (trajectories && trajectories[selectedStrategy] && trajectories[selectedStrategy].name === 'Limit')) && (
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
                  tokenPairs={tokenPairs}
                />
              </Grid>
            )}
            {!isAlgoStrategy && (
              <Grid item='true' xs={12}>
                <SimpleOrderFields
                  FormAtoms={FormAtoms}
                  selectedAccountExchangeNames={selectedAccountExchangeNames}
                  selectedDuration={selectedDuration}
                  selectedStrategy={selectedStrategy}
                  selectedStrategyName={selectedStrategyName}
                  selectedStrategyParams={selectedStrategyParams}
                  setSelectedDuration={setSelectedDuration}
                  setSelectedStrategyParams={setSelectedStrategyParams}
                  setStopPrice={setStopPrice}
                  setUpdatePairLeverage={setUpdatePairLeverage}
                  sliderProps={sliderProps}
                  stopPrice={stopPrice}
                  strategies={strategies}
                  strategyParams={strategyParams}
                  trajectories={trajectories}
                  updatePairLeverage={updatePairLeverage}
                />
              </Grid>
            )}
            <Grid xs={12}>{RenderStrategyContainer}</Grid>
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
          {/* necessary for styling form */}
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
            <Divider />
            <PreTradeAnalyticsComponent
              data={preTradeEstimationData}
              dataError={preTradeDataError}
              loading={preTradeDataLoading}
            />
            <Divider />
            <Stack direction='row' spacing={2}>
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
            </Stack>
            {!isSubmitted ? (
              <Button
                fullWidth
                color={isBuySide ? 'success' : 'error'}
                disabled={!isReadyToSubmit}
                size='large'
                type='submit'
                variant='contained'
              >
                Add {isBuySide ? 'Buy' : 'Sell'} Order
              </Button>
            ) : (
              <Button disabled fullWidth size='large' variant='contained'>
                <CircularProgress size={20} />
              </Button>
            )}
          </Stack>
        </div>
      </form>
      <OrderTemplateModal open={isTemplateOpen} setOpen={setIsTemplateOpen} type={orderTemplateAction} />
    </Box>
  );
}

export default ChainedOrderEntryForm;
