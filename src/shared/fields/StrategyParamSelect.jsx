import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTheme } from '@mui/system';
import { TreadTooltip, TreadTooltipVariant } from '@/shared/components/LabelTooltip';
import { ApiError, validateOrderCondition } from '../../apiServices';
import {
  PassivenessSlider,
  DiscretionSlider,
  ExposureToleranceSlider,
  AlphaTiltSlider,
  MaxOtcPercentageSlider,
} from './Sliders';

// Exchanges that support spot leverage param
const SPOT_LEVERAGE_SUPPORTED_EXCHANGES = ['Bybit', 'BinancePM', 'Gate'];

const snakeToTitleCase = (str) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function StrategyParamSelect({
  strategyParams,
  handleStrategyParamChange,
  selectedStrategyParams,
  selectedAccountExchangeNames = [],
  showHeading = true,
  isSimple = false,
  isMulti = false,
  selectedStrategyName,
  excludeSpotLeverage = false,
  // Slider props
  passiveness,
  setPassiveness,
  discretion,
  setDiscretion,
  alphaTilt,
  setAlphaTilt,
  maxOtcPercentage,
  setMaxOtcPercentage,
  exposureTolerance,
  setExposureTolerance,
}) {
  const simpleAllowList = ['reduce_only', 'spot_leverage', 'passive_only'];

  const filterParam = (param) => {
    // only show relevant params for simple orders
    if (isSimple && !simpleAllowList.includes(param)) {
      return false;
    }

    // OKX reduce_only not supported
    if (param === 'reduce_only' && selectedAccountExchangeNames.includes('OKX')) {
      return false;
    }

    // spot_leverage is supported on a subset of exchanges (OKX spot leverage is configured via margin mode)
    if (param === 'spot_leverage') {
      // Exclude spot leverage if explicitly requested (e.g., for yield page)
      if (excludeSpotLeverage) {
        return false;
      }
      const hasSupportedExchange = selectedAccountExchangeNames.some((ex) =>
        SPOT_LEVERAGE_SUPPORTED_EXCHANGES.includes(ex)
      );
      if (!hasSupportedExchange) {
        return false;
      }
    }

    // Disable passive_only for irrelevant trajectories
    if (param === 'passive_only' && (selectedStrategyName === 'Market' || selectedStrategyName === 'Iceberg')) {
      return false;
    }

    // max_clip_size field is displayed separately
    if (param === 'max_clip_size') {
      return false;
    }

    if (param === 'ool_pause' && !isMulti) {
      return false;
    }

    if (param === 'soft_pause' && !isMulti) {
      return false;
    }

    if (param === 'slippage') {
      return false;
    }

    if (param === 'entry') {
      return false;
    }

    // cleanup_on_cancel should not be displayed in advanced settings
    if (param === 'cleanup_on_cancel') {
      return false;
    }

    return true;
  };

  // Separate numeric parameters that should use sliders
  const numericParams = ['passiveness', 'discretion', 'alpha_tilt', 'max_otc_percentage', 'exposure_tolerance'];

  const booleanParams = strategyParams.filter(filterParam).filter((param) => !numericParams.includes(param));

  return (
    <>
      <Box display={showHeading ? 'block' : 'none'}>
        <TreadTooltip labelTextVariant='subtitle2' variant='strategy_parameters' />
      </Box>

      {/* Sliders for numeric parameters */}
      {passiveness !== undefined && setPassiveness && (
        <PassivenessSlider passiveness={passiveness} setPassiveness={setPassiveness} sx={{ mb: 2 }} />
      )}

      {discretion !== undefined && setDiscretion && (
        <DiscretionSlider discretion={discretion} setDiscretion={setDiscretion} sx={{ mb: 2 }} />
      )}

      {alphaTilt !== undefined && setAlphaTilt && (
        <AlphaTiltSlider alphaTilt={alphaTilt} setAlphaTilt={setAlphaTilt} sx={{ mb: 2 }} />
      )}

      {maxOtcPercentage !== undefined && setMaxOtcPercentage && (
        <MaxOtcPercentageSlider
          maxOtcPercentage={maxOtcPercentage}
          setMaxOtcPercentage={setMaxOtcPercentage}
          sx={{ mb: 2 }}
        />
      )}

      {exposureTolerance !== undefined && setExposureTolerance && (
        <ExposureToleranceSlider
          exposureTolerance={exposureTolerance}
          setExposureTolerance={setExposureTolerance}
          sx={{ mb: 2 }}
        />
      )}

      {booleanParams.length > 0 ? (
        <FormGroup>
          {booleanParams.map((param) => {
            let label;

            if (param in TreadTooltipVariant) {
              label = <TreadTooltip placement='right' variant={param} />;
            } else {
              label = snakeToTitleCase(param);
            }

            return (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedStrategyParams ? !!selectedStrategyParams[param] : false}
                    name={param}
                    size='small'
                    sx={{
                      fontSize: '0.7rem',
                      '&.MuiCheckbox-root': {
                        p: '5px',
                        ml: '4px',
                      },
                    }}
                    onChange={handleStrategyParamChange}
                  />
                }
                key={param}
                label={label}
              />
            );
          })}
        </FormGroup>
      ) : (
        <Typography color='common.grey500' sx={{ alignSelf: 'center' }}>
          No relevant parameters
        </Typography>
      )}
    </>
  );
}

function ConditionValidateField({
  orderCondition,
  setOrderCondition,
  isOrderConditionValidated,
  setIsOrderConditionValidated,
  showAlert,
  rows = 1,
}) {
  const [orderConditionLoading, setOrderConditionLoading] = useState(false);
  const validateOrderConditionOnClick = async () => {
    setOrderConditionLoading(true);

    const minLoadingTimeMillis = 1000;
    const validationPromise = validateOrderCondition(orderCondition).catch((error) => {
      if (error instanceof ApiError) {
        showAlert({
          message: `Invalid Order Condition: ${error.message}`,
          severity: 'error',
        });
      } else {
        showAlert({
          message: `Failed to run validation: ${error.message}`,
          severity: 'error',
        });
      }
      return -1;
    });
    const timerPromise = new Promise((resolve) => {
      setTimeout(resolve, minLoadingTimeMillis);
    });

    await Promise.all([validationPromise, timerPromise]);

    setOrderConditionLoading(false);

    const result = await validationPromise;
    if (result === -1) {
      return;
    }

    setIsOrderConditionValidated(true);
    showAlert({ message: 'Order condition validated!', severity: 'success' });
  };

  return (
    <FormControl fullWidth>
      <OutlinedInput
        fullWidth
        multiline
        endAdornment={
          <ConditionValidateButton
            isOrderConditionValidated={isOrderConditionValidated}
            orderCondition={orderCondition}
            orderConditionLoading={orderConditionLoading}
            validateOrderConditionOnClick={validateOrderConditionOnClick}
          />
        }
        minRows={rows}
        placeholder='Order Condition'
        size='small'
        sx={{
          '& .MuiFormHelperText-root': {
            color: 'var(--text-secondary)',
          },
        }}
        value={orderCondition}
        onChange={(e) => {
          setOrderCondition(e.target.value);
          setIsOrderConditionValidated(false);
        }}
      />
      <FormHelperText style={{ marginLeft: '0px' }}>
        <Link color='inherit' href='https://tread-labs.gitbook.io/api-docs/conditional-order' underline='hover'>
          <Typography variant='body2'>Condition must be validated before submitting</Typography>
        </Link>
      </FormHelperText>
    </FormControl>
  );
}

function ConditionValidateButton({
  orderCondition,
  validateOrderConditionOnClick,
  orderConditionLoading,
  isOrderConditionValidated,
}) {
  const theme = useTheme();
  const successColor = theme.palette.success.main;

  const renderComponent = () => {
    if (isOrderConditionValidated) {
      return <CheckCircleOutline className='animated-check' sx={{ color: successColor, fontSize: 35 }} />;
    }
    if (orderConditionLoading) {
      return (
        <Button disabled fullWidth variant='contained'>
          <CircularProgress color='inherit' size={20} />
        </Button>
      );
    }
    return (
      <Button
        fullWidth
        color='secondary'
        disabled={!orderCondition}
        variant='contained'
        onClick={validateOrderConditionOnClick}
      >
        Validate
      </Button>
    );
  };

  return <div>{renderComponent()}</div>;
}

export { ConditionValidateButton, ConditionValidateField, StrategyParamSelect };
