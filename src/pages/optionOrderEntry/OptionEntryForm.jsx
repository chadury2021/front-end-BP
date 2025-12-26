import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useAtom } from 'jotai';
import { useContext, useEffect, useRef, useState } from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { fetchCachedAccountBalances, fetchOptionOrderEntryFormData } from '../../apiServices';
import { ErrorContext } from '../../shared/context/ErrorProvider';
import AccountDropdown from '../../shared/fields/AccountDropdown';
import LimitPriceField from '../../shared/fields/LimitPriceField';
import { NumericFormatCustom } from '../../shared/fields/NumberFieldFormat';
import StrategyDropdown from '../../shared/fields/StrategyDropdown';
import { ignoreScrollEvent, numberWithCommas } from '../../util';
import AlgoOrderFields from '../dashboard/orderEntry/AlgoOrderFields';
import { useBaseForm } from '../dashboard/orderEntry/hooks/useBaseForm';
import { useSubmitForm } from '../dashboard/orderEntry/hooks/useSubmitForm';
import { OrderConfirmationModal } from '../dashboard/orderEntry/OrderConfirmationModal';
import { DashboardAccordianComponent, getStrategyObjectSafe } from '../dashboard/orderEntry/util';
import OptionPicker from './OptionPicker';

const noArrowStyle = {
  '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  'input[type=number]': {
    MozAppearance: 'textfield',
  },
};

const StyledSellToggleButton = styled(ToggleButton)(({ theme }) => {
  return {
    '&.Mui-selected': {
      backgroundColor: theme.palette.charts.red,
      color: theme.palette.text.primary,
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.charts.redTransparent,
    },
    color: theme.palette.text.disabled,
    fontSize: '0.95rem',
  };
});

const StyledBuyToggleButton = styled(ToggleButton)(({ theme }) => {
  return {
    '&.Mui-selected': {
      backgroundColor: theme.palette.charts.green,
      color: theme.palette.text.offBlack,
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.charts.greenTransparent,
    },
    color: theme.palette.text.disabled,
    fontSize: '0.95rem',
  };
});

function OptionEntryForm({ FormAtoms }) {
  const [selectedAccounts, setSelectedAccounts] = useAtom(FormAtoms.selectedAccountsAtom);
  const [selectedPair, setSelectedPair] = useAtom(FormAtoms.selectedPairAtom);
  const [balances, setBalances] = useAtom(FormAtoms.balancesAtom);
  const [selectedStrategy, setSelectedStrategy] = useAtom(FormAtoms.selectedStrategyAtom);
  const [trajectory, setTrajectory] = useAtom(FormAtoms.trajectoryAtom);
  const [selectedStrategyParams, setSelectedStrategyParams] = useAtom(FormAtoms.selectedStrategyParamsAtom);
  const [selectedDuration, setSelectedDuration] = useAtom(FormAtoms.selectedDurationAtom);
  const [updatePairLeverage, setUpdatePairLeverage] = useAtom(FormAtoms.updatePairLeverageAtom);
  const [limitPrice, setLimitPrice] = useAtom(FormAtoms.limitPriceAtom);
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
  const [initialLoadValue, setInitialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);

  const { accounts, exchanges, strategies, trajectories, superStrategies, strategyParams, tokenPairs } =
    initialLoadValue;

  // Target Time Super Strat states
  const [targetTime, setTargetTime] = useAtom(FormAtoms.targetTimeAtom);

  const { showAlert } = useContext(ErrorContext);

  const theme = useTheme();
  const [initialLoad, setInitialLoad] = useState(false);
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

  const { handleCoreFields, quoteBaseStates, handleBaseQuoteFields } = useBaseForm({ options: true });

  const { handleSelectedSide, handleSelectedPair } = handleCoreFields;

  const {
    baseQty,
    quoteQty,
    quoteQtyPlaceholder,
    baseContractQty,
    convertedQtyLoading,
    selectedSide,
    convertedQty,
    setSelectedSide,
  } = quoteBaseStates;

  const { handleBaseQtyOnChange, handleQuoteQtyOnChange, fetchTradePrediction } = handleBaseQuoteFields;

  const { submitCheck, isSubmitted, confirmationModalProps } = useSubmitForm({
    optionSubmit: true,
  });

  const isBuySide = selectedSide === 'buy';

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

    setSelectedStrategyParams({
      ...selectedStrategyParams,
      passive_only: true,
    });

    const loadInitialData = async () => {
      setLoading(true);
      let data;
      try {
        data = await fetchOptionOrderEntryFormData();
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Unable to load accounts: ${e.message}`,
        });
        return;
      }
      getAccountBalances();

      const initialAccounts = {};
      data.accounts.forEach((acc) => {
        // Only allow Binance, OKX, and Deribit accounts for options trading
        const supportedExchanges = ['Binance', 'OKX', 'Deribit'];
        if (!supportedExchanges.includes(acc.exchange)) {
          return;
        }

        const scopedAccName = acc.user === data.user_id ? acc.name : `${acc.username}/${acc.name}`;
        const displayName = `${acc.exchange} - ${scopedAccName}`;
        initialAccounts[scopedAccName] = {
          displayName,
          id: acc.id,
          name: scopedAccName,
          exchangeName: acc.exchange,
          walletProvider: acc.wallet_provider,
          walletType: acc.wallet_type,
        };
      });

      const indexedStrategies = [...data.strategies].reduce((obj, item) => {
        // eslint-disable-next-line no-param-reassign
        obj[item.id] = item;
        return obj;
      }, {});

      // Filter Option enabled strategies only
      const indexedSuperStrategies = data.super_strategies
        .filter((item) => {
          return item.name === 'Aggressive Maker' || item.name === 'Market Maker';
        })
        .reduce((obj, item) => {
          // eslint-disable-next-line no-param-reassign
          obj[item.id] = item;
          return obj;
        }, {});

      const getVWAPTrajectory = data.strategies.find((element) => element.name === 'VWAP');
      setTrajectory(getVWAPTrajectory.id);

      setSelectedStrategy(Object.values(indexedSuperStrategies)[0].id);

      setInitialLoadValue({
        accounts: initialAccounts,
        exchanges: data.exchanges,
        options: data.option_map,
        flat_options: data.options_flat_map,
        trajectories: indexedStrategies,
        strategyParams: data.strategy_params,
        strategies: indexedSuperStrategies,
        superStrategies: indexedSuperStrategies,
      });

      setLoading(false);
      setInitialLoad(true);
    };
    loadInitialData();
  }, []);

  const selectedAccountExchangeNames =
    selectedAccounts.length > 0 && selectedAccounts[0] !== ''
      ? selectedAccounts.map((acc) => accounts[acc].exchangeName)
      : [];

  useEffect(() => {
    if (selectedPair) {
      const selectedPairExchanges = new Set(selectedPair.exchanges);
      const selectedAccountExchanges = new Set(selectedAccountExchangeNames);
      // clear accounts if selected pair is not available on any selected account
      if (selectedPairExchanges.intersection(selectedAccountExchanges).size === 0) {
        setSelectedAccounts([]);
      }
    }
  }, [selectedPair]);

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
    selectedPairName: selectedPair ? selectedPair.name : null,
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

  const isAlgoStrategy = true;

  const isReadyToPickQty = !!(selectedAccounts.length > 0 && selectedPair && Object.keys(selectedPair).length > 0);

  const isReadyToSubmit =
    selectedAccounts.length > 0 &&
    selectedPair &&
    (!!baseQty || !!quoteQty) &&
    (!orderCondition || isOrderConditionValidated);

  const renderBaseEndAdornment = () => {
    if (convertedQtyLoading && quoteQty) {
      return (
        <InputAdornment position='end'>
          <CircularProgress size={20} sx={{ color: theme.palette.info.main }} />
        </InputAdornment>
      );
    }

    if (baseContractQty) {
      return (
        <InputAdornment position='end'>
          <Stack alignItems='left' direction='column'>
            <Typography color='grey.main' variant='body2'>
              {Number(baseContractQty).toFixed(0)}
            </Typography>
            <Typography color='grey.main' variant='body2'>
              Contracts
            </Typography>
          </Stack>
        </InputAdornment>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Box alignItems='center' display='flex' justifyContent='center' minHeight='100vh'>
        <ScaleLoader color={theme.palette.common.pureWhite} />
      </Box>
    );
  }

  return (
    <Box ref={cardRef} sx={{ height: '100%' }}>
      <form style={{ height: '100%' }} onSubmit={(e) => submitCheck(e)}>
        <div style={{ height: '100%', position: 'relative' }}>
          <Grid
            container
            ref={scrollableRef}
            spacing={2}
            sx={{
              marginBottom: '1rem',
              scrollbarGutter: 'stable',
              marginRight: '-1rem',
            }}
          >
            <Grid xs={12}>
              <AccountDropdown
                accounts={accounts}
                extraStyling={{
                  height: '50.25px',
                }}
                handleSelectedAccountsChange={(e) => {
                  setSelectedAccounts([e.target.value]);
                }}
                handleSelectedAccountsDelete={() => {
                  setSelectedAccounts([]);
                }}
                selectedAccounts={selectedAccounts}
              />
            </Grid>
            <Grid xs={6}>
              <OptionPicker FormAtoms={FormAtoms} />
            </Grid>
            <Grid xs={6}>
              <ToggleButtonGroup
                exclusive
                fullWidth
                aria-label='text side'
                style={{ height: '100%' }}
                value={selectedSide}
                onChange={(e, newpair) => handleSelectedSide(e, newpair, selectedSide, selectedPair)}
              >
                <StyledBuyToggleButton aria-label='buy' value='buy'>
                  <Typography color={isBuySide ? 'text.offBlack' : 'text.offWhite'} variant='body1'>
                    Buy
                  </Typography>
                </StyledBuyToggleButton>
                <StyledSellToggleButton aria-label='sell' value='sell'>
                  <Typography color={!isBuySide ? 'text.offBlack' : 'text.offWhite'} variant='body1'>
                    Sell
                  </Typography>
                </StyledSellToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid xs={6}>
              <Tooltip
                disableFocusListener={isReadyToPickQty}
                disableHoverListener={isReadyToPickQty}
                title='Account(s) and trading pair must be selected'
              >
                <Box>
                  <TextField
                    fullWidth
                    autoComplete='off'
                    disabled={!isReadyToPickQty}
                    InputProps={{
                      step: 'any',
                      endAdornment: renderBaseEndAdornment(),
                      inputComponent: NumericFormatCustom,
                    }}
                    placeholder='Contracts'
                    sx={noArrowStyle}
                    value={baseQty}
                    onChange={(event) => {
                      handleBaseQtyOnChange(event.target.value);
                    }}
                    onWheel={ignoreScrollEvent}
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid xs={6}>
              <Tooltip
                disableFocusListener={isReadyToPickQty}
                disableHoverListener={isReadyToPickQty}
                title='Account(s) and trading pair must be selected'
              >
                <Box>
                  <TextField
                    disabled
                    fullWidth
                    autoComplete='off'
                    InputProps={{
                      step: 'any',
                      endAdornment: convertedQtyLoading && baseQty && (
                        <InputAdornment position='end'>
                          <CircularProgress size={20} sx={{ color: theme.palette.info.main }} />
                        </InputAdornment>
                      ),
                      inputComponent: NumericFormatCustom,
                    }}
                    placeholder={numberWithCommas(quoteQtyPlaceholder)}
                    sx={noArrowStyle}
                    value={quoteQty}
                    onChange={(event) => handleQuoteQtyOnChange(event.target.value)}
                    onWheel={ignoreScrollEvent}
                  />
                </Box>
              </Tooltip>
            </Grid>
            <Grid xs={12}>
              <StrategyDropdown
                applyPresets={applyPresets}
                setTrajectory={setTrajectory}
                setValue={setSelectedStrategy}
                strategies={strategies}
                superStrategies={superStrategies}
                trajectories={trajectories}
                value={selectedStrategy}
              />
            </Grid>
            <Grid xs={12}>
              <LimitPriceField
                simple
                exchanges={exchanges}
                FormAtoms={FormAtoms}
                isBuySide={isBuySide}
                limitPrice={limitPrice}
                selectedAccountExchangeNames={selectedAccountExchangeNames}
                selectedPairName={selectedPair ? selectedPair.name : null}
                setLimitPrice={setLimitPrice}
                showAlert={showAlert}
                tokenPairs={tokenPairs || []}
              />
            </Grid>
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
            <Stack
              paddingY='8px'
              ref={stickyRef}
              spacing={2}
              sx={{
                padding: '8px',
                position: 'sticky',
                width: '100%',
                bottom: 0,
                zIndex: 2,
                backgroundColor: theme.components.MuiCard.styleOverrides.root.backgroundColor,
              }}
            >
              {!isSubmitted ? (
                <Button
                  fullWidth
                  color={isBuySide ? 'success' : 'error'}
                  disabled={!isReadyToSubmit}
                  size='large'
                  type='submit'
                  variant='contained'
                >
                  Submit {isBuySide ? 'Buy' : 'Sell'} Order
                </Button>
              ) : (
                <Button disabled fullWidth size='large' variant='contained'>
                  <CircularProgress size={20} />
                </Button>
              )}
            </Stack>
          </Grid>
        </div>
      </form>
      <OrderConfirmationModal props={confirmationModalProps} />
    </Box>
  );
}

export default OptionEntryForm;
