import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import defaultStrategySettings from '../../pages/dashboard/defaultStrategySettings';
import { AggressiveTakerStrategyView } from './SuperStrategyComponents/AggressiveTakerStrategyView';
import { ImpactMinimizationStrategyView } from './SuperStrategyComponents/ImpactMinimizationStrategyView';
import { TWAPStrategyView } from './SuperStrategyComponents/TWAPStrategyView';
import { TargetParticipationRateStrategyView } from './SuperStrategyComponents/TargetParticipationRateStrategyView';
import { TargetTimeView } from './SuperStrategyComponents/TargetTimeView';
import { MarketMakerView } from './SuperStrategyComponents/MarketMakerView';
import { AggressiveMakerStrategyView } from './SuperStrategyComponents/AggressiveMakerStrategyView';

function useStrategyContainer({
  baseAssetQty,
  calculateDuration,
  handleStrategyParamChange,
  isCalculatingDuration,
  isPovLoading,
  povTarget,
  selectedDuration,
  selectedStrategy,
  selectedStrategyParams,
  setPovTarget,
  setSelectedDuration,
  setSelectedStrategyParams,
  sliderProps,
  strategies,
  strategyParams,
  targetTime,
  setTargetTime,
  FormAtoms,
}) {
  const { setPassiveness, setDiscretion, setAlphaTilt } = sliderProps;
  const [maxOtcPercentage, setMaxOtcPercentage] = useAtom(FormAtoms.maxOtcPercentageAtom);

  const applyPresets = (selectedStrategyProp) => {
    const selectedStrategyDetails = strategies[selectedStrategyProp];
    if (!selectedStrategyProp || !selectedStrategyDetails || !strategies[selectedStrategyProp].is_super_strategy) {
      return;
    }

    const { presets } = selectedStrategyDetails;

    const values = {
      passiveness: presets.passiveness || defaultStrategySettings.passiveness,
      discretion: presets.discretion || defaultStrategySettings.discretion,
      alphaTilt: presets.alphaTilt || defaultStrategySettings.alphaTilt,
      duration: presets.duration || defaultStrategySettings.duration,
      povTarget: presets.povTarget || defaultStrategySettings.povTarget,
      otcPercentage: presets.otcPercentage || defaultStrategySettings.otcPercentage,
      passive_only: presets.passiveOnly || defaultStrategySettings.passive_only,
      reduce_only: presets.reduceOnly || defaultStrategySettings.reduce_only,
      ool_pause: presets.ool_pause || defaultStrategySettings.ool_pause,
      dicy: presets.dicy || defaultStrategySettings.dicy,
      active_limit: presets.activeLimit || defaultStrategySettings.activeLimit,
      strict_duration: presets.strict_duration || defaultStrategySettings.strict_duration,
    };

    setPassiveness(values.passiveness);
    setDiscretion(values.discretion);
    setAlphaTilt(values.alphaTilt);
    setSelectedDuration(values.duration);
    setPovTarget(values.povTarget);
    setMaxOtcPercentage(values.otcPercentage || defaultStrategySettings.otcPercentage);
    setSelectedStrategyParams({
      ...selectedStrategyParams,
      passive_only: values.passive_only,
      reduce_only: values.reduce_only,
      ool_pause: values.ool_pause,
      dicy: values.dicy,
      active_limit: values.active_limit,
      strict_duration: values.strict_duration,
    });
  };

  const renderStrategyDetails = () => {
    if (!selectedStrategy || !strategies[selectedStrategy].is_super_strategy) {
      return null;
    }
    const strategy = strategies[selectedStrategy];
    if (!strategy) return null;
    switch (strategy.name) {
      case 'Impact Minimization':
        return (
          <ImpactMinimizationStrategyView
            duration={selectedDuration}
            FormAtoms={FormAtoms}
            isCalculatingDuration={isCalculatingDuration}
            povTarget={povTarget}
            setSelectedDuration={setSelectedDuration}
            sliderProps={sliderProps}
          />
        );
      case 'Time Constant (TWAP)':
        return (
          <TWAPStrategyView
            duration={selectedDuration}
            FormAtoms={FormAtoms}
            isCalculatingDuration={isCalculatingDuration}
            povTarget={povTarget}
            setSelectedDuration={setSelectedDuration}
            sliderProps={sliderProps}
          />
        );
      case 'Target Participation Rate':
        return (
          <TargetParticipationRateStrategyView
            baseAssetQty={baseAssetQty}
            calculateDuration={calculateDuration}
            duration={selectedDuration}
            FormAtoms={FormAtoms}
            isCalculatingDuration={isCalculatingDuration}
            isPovLoading={isPovLoading}
            povTarget={povTarget}
            setPovTarget={setPovTarget}
            setSelectedDuration={setSelectedDuration}
            sliderProps={sliderProps}
          />
        );
      case 'Aggressive Maker':
        return (
          <AggressiveMakerStrategyView
            baseAssetQty={baseAssetQty}
            calculateDuration={calculateDuration}
            duration={selectedDuration}
            FormAtoms={FormAtoms}
            isCalculatingDuration={isCalculatingDuration}
            isPovLoading={isPovLoading}
            povTarget={povTarget}
            setPovTarget={setPovTarget}
            setSelectedDuration={setSelectedDuration}
          />
        );
      case 'Aggressive Taker':
        return (
          <AggressiveTakerStrategyView
            baseAssetQty={baseAssetQty}
            calculateDuration={calculateDuration}
            duration={selectedDuration}
            FormAtoms={FormAtoms}
            isPovLoading={isPovLoading}
            povTarget={povTarget}
            setPovTarget={setPovTarget}
            setSelectedDuration={setSelectedDuration}
            sliderProps={sliderProps}
          />
        );
      case 'Target Time':
        return (
          <TargetTimeView
            isCalculatingDuration={isCalculatingDuration}
            povTarget={povTarget}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            setTargetTime={setTargetTime}
            targetTime={targetTime}
          />
        );
      case 'Market Maker':
        return (
          <MarketMakerView
            baseAssetQty={baseAssetQty}
            calculateDuration={calculateDuration}
            duration={selectedDuration}
            FormAtoms={FormAtoms}
            isCalculatingDuration={isCalculatingDuration}
            isPovLoading={isPovLoading}
            povTarget={povTarget}
            setPovTarget={setPovTarget}
            setSelectedDuration={setSelectedDuration}
            sliderProps={sliderProps}
          />
        );
      default:
        return <div>No specific component found for this strategy.</div>;
    }
  };

  return {
    RenderStrategyContainer: (
      <div>{strategies && strategies[selectedStrategy] && <div>{renderStrategyDetails()}</div>}</div>
    ),
    applyPresets,
  };
}

export default useStrategyContainer;
