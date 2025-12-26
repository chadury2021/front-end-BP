import { useEffect, useState, useCallback, useContext } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { getAutoOrderConfig } from '@/apiServices';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import defaultStrategySettings from '@/pages/dashboard/defaultStrategySettings';
import { debounce } from 'lodash';

function useAutoOrderEntryForm({ trajectories, accounts }) {
  const { showAlert } = useContext(ErrorContext);

  const {
    // Base fields
    selectedPair,
    selectedAccounts,
    selectedSide,
    baseQty,
    convertedQty,

    // Auto order fields
    urgency,
    setUrgency,
    selectedDuration,
    setSelectedDuration,
    passiveness,
    setPassiveness,
    alphaTilt,
    setAlphaTilt,
    trajectory,
    setTrajectory,
    setSelectedStrategy,
    limitPrice,
    setLimitPrice,

    // Pre trade data
    preTradeEstimationData,
    preTradeDataError,
    preTradeDataLoading,
  } = useOrderForm();

  // Auto order state
  const [isAutoOrderFormLoading, setIsAutoOrderFormLoading] = useState(false);
  const [autoOrderConfig, setAutoOrderConfig] = useState(null);
  const [autoOrderExplanation, setAutoOrderExplanation] = useState(null);

  const resetConfig = () => {
    setAutoOrderConfig(null);
    setSelectedDuration(0);
    setPassiveness(defaultStrategySettings.passiveness);
    setAlphaTilt(defaultStrategySettings.alphaTilt);
    setTrajectory('');
    setSelectedStrategy('');
    setAutoOrderExplanation([]);
    setLimitPrice('');
  };

  const setConfig = (config) => {
    setAutoOrderConfig(config);
    Object.entries(config || {}).forEach(([key, value]) => {
      if (key === 'engine_passiveness') setPassiveness(value);
      else if (key === 'alpha_tilt') setAlphaTilt(value);
      else if (key === 'strategy') {
        const trajectory_id = Object.values(trajectories).find((t) => t.name === value).id;
        setTrajectory(trajectory_id);
      } else if (key === 'duration') setSelectedDuration(value);
      else if (key === 'explanation') setAutoOrderExplanation(value);
      else if (key === 'limit_price') setLimitPrice(value);
    });
  };

  const debouncedFetchAutoOrderConfig = useCallback(
    debounce(async () => {
      try {
        const response = await getAutoOrderConfig(
          urgency,
          selectedAccounts.map((a) => accounts[a].exchangeName),
          selectedPair.id,
          baseQty || convertedQty,
          selectedSide
        );
        setConfig(response.config);
      } catch (error) {
        showAlert({
          severity: 'error',
          message: `Failed to fetch auto order config: ${error.message}`,
        });
      } finally {
        setIsAutoOrderFormLoading(false);
      }
    }, 1500),
    [urgency, selectedAccounts, selectedPair, baseQty, convertedQty, selectedSide]
  );

  const enableUrgency =
    !!selectedPair && selectedAccounts.length > 0 && !!selectedSide && (!!baseQty || !!convertedQty);

  useEffect(() => {
    resetConfig();

    if (enableUrgency && urgency) {
      setIsAutoOrderFormLoading(true);
      debouncedFetchAutoOrderConfig();
    }

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedFetchAutoOrderConfig.cancel();
    };
  }, [enableUrgency, urgency, selectedPair, selectedAccounts, baseQty, convertedQty, selectedSide]);

  const configFields = {
    passiveness,
    setPassiveness,
    alphaTilt,
    setAlphaTilt,
    trajectory,
    setTrajectory,
    selectedDuration,
    setSelectedDuration,
    limitPrice,
  };

  return {
    urgency,
    setUrgency,
    enableUrgency,
    isAutoOrderFormLoading,
    autoOrderConfig,
    configFields,
    autoOrderExplanation,
    preTradeEstimationData,
    preTradeDataError,
    preTradeDataLoading,
  };
}

export default useAutoOrderEntryForm;
