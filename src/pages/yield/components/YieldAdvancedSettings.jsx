import React, { useCallback } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { ConditionValidateField, StrategyParamSelect } from '@/shared/fields/StrategyParamSelect';
import { AlphaTiltSlider, DiscretionSlider, ExposureToleranceSlider, PassivenessSlider } from '@/shared/fields/Sliders';
import DurationField from '@/pages/dashboard/orderEntry/AlgoOrderFieldsComponents/DurationField';
import MaxClipSizeField from '@/pages/dashboard/orderEntry/AlgoOrderFieldsComponents/MaxClipSizeField';
import BorderedStack from '@/pages/dashboard/orderEntry/AlgoOrderFieldsComponents/BorderedStack';
import DynamicLimitSpread from '@/pages/multiOrder/fields/DynamicLimitSpread';

function YieldAdvancedSettings({
  FormAtoms,
  showAlert,
  selectedDuration,
  setSelectedDuration,
  setTimeStart,
  passiveness,
  setPassiveness,
  discretion,
  setDiscretion,
  exposureTolerance,
  setExposureTolerance,
  alphaTilt,
  setAlphaTilt,
  maxClipSize,
  setMaxClipSize,
  selectedStrategyParams,
  setSelectedStrategyParams,
  strategyParams,
  selectedStrategyName,
  selectedAccountExchangeNames,
  orderCondition,
  setOrderCondition,
  isOrderConditionValidated,
  setIsOrderConditionValidated,
  limitPriceSpread,
  setLimitPriceSpread,
  dynamicLimitFormatAtom,
  dynamicLimitFormState,
  isDynamicLimitCollapsed,
  setIsDynamicLimitCollapsed,
  onResetDefaults,
}) {
  const handleStrategyParamChange = useCallback(
    (event) => {
      const { name, checked } = event.target;
      setSelectedStrategyParams((prev) => ({
        ...(prev || {}),
        [name]: checked,
      }));
    },
    [setSelectedStrategyParams]
  );

  return (
    <Stack spacing={3}>
      <DurationField
        FormAtoms={FormAtoms}
        isCalculatingDuration={false}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        setTimeStart={setTimeStart}
        useMarketData={false}
      />

      <BorderedStack spacing={2} title={<TreadTooltip variant='strategy_parameters' />}>
        <ExposureToleranceSlider exposureTolerance={exposureTolerance} setExposureTolerance={setExposureTolerance} />
        <PassivenessSlider passiveness={passiveness} setPassiveness={setPassiveness} />
        <DiscretionSlider discretion={discretion} setDiscretion={setDiscretion} />
        <AlphaTiltSlider alphaTilt={alphaTilt} setAlphaTilt={setAlphaTilt} />
        <MaxClipSizeField maxClipSize={maxClipSize} setMaxClipSize={setMaxClipSize} style={{ marginTop: '16px' }} />
        <Stack alignItems='flex-end' direction='row' justifyContent='space-between'>
          <StrategyParamSelect
            excludeSpotLeverage
            isMulti
            handleStrategyParamChange={handleStrategyParamChange}
            selectedAccountExchangeNames={selectedAccountExchangeNames}
            selectedStrategyName={selectedStrategyName}
            selectedStrategyParams={selectedStrategyParams}
            showHeading={false}
            strategyParams={strategyParams}
          />
          <Button sx={{ textAlign: 'right', cursor: 'pointer' }} onClick={onResetDefaults}>
            <Typography color='primary'>Reset Default</Typography>
          </Button>
        </Stack>
      </BorderedStack>

      <ConditionValidateField
        isOrderConditionValidated={isOrderConditionValidated}
        orderCondition={orderCondition}
        rows={2}
        setIsOrderConditionValidated={setIsOrderConditionValidated}
        setOrderCondition={setOrderCondition}
        showAlert={showAlert}
      />

      <DynamicLimitSpread
        formatAtom={dynamicLimitFormatAtom}
        formState={dynamicLimitFormState}
        isCollapsed={isDynamicLimitCollapsed}
        limitPriceSpread={limitPriceSpread}
        setIsCollapsed={setIsDynamicLimitCollapsed}
        setLimitPriceSpread={setLimitPriceSpread}
      />
    </Stack>
  );
}

export default YieldAdvancedSettings;
