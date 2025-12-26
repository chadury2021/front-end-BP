import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useTheme } from '@emotion/react';
import { useAtom } from 'jotai';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import FormControl from '@mui/material/FormControl';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { StyledTableCell } from '@/shared/orderTable/util';
import { removeFalsyAndEmptyKeys, titleCase, smartRound } from '@/util';
import { getOrderTemplates, createOrderTemplate, deleteOrderTemplates } from '@/apiServices';
import { useBaseForm } from './hooks/useBaseForm';

const modalStyle = (theme) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: theme.palette.common.pureBlack,
  border: `1px solid ${theme.palette.grey[800]}`,
  borderRadius: '12px',
  overflow: 'hidden',
  maxHeight: '90vh',
  height: 'auto',
  width: '90%',
  maxWidth: '400px',
  boxSizing: 'border-box',
  boxShadow: `0 8px 32px ${theme.palette.common.pureBlack}`,
  outline: 'none',
  transition: 'all 0.2s ease-in-out',
});

const closeButtonStyle = {
  position: 'absolute',
  right: 8,
  top: 8,
  zIndex: 1,
};

export default function OrderTemplateModal({ type, open, setOpen }) {
  const theme = useTheme();
  const { showAlert } = useContext(ErrorContext);
  // use order form context to read current values
  const {
    selectedAccounts,
    setSelectedAccounts,
    selectedPair,
    setSelectedPair,
    selectedSide,
    setSelectedSide,
    baseQty,
    quoteQty,
    selectedStrategy,
    setSelectedStrategy,
    trajectory,
    setTrajectory,
    selectedDuration,
    setSelectedDuration,
    limitPrice,
    setLimitPrice,
    orderCondition,
    setOrderCondition,
    povLimit,
    setPovLimit,
    povTarget,
    setPovTarget,
    selectedStrategyParams,
    setSelectedStrategyParams,
    updatePairLeverage,
    setUpdatePairLeverage,
    alphaTilt, // TODO: implement this
    setAlphaTilt,
    discretion,
    setDiscretion,
    passiveness,
    setPassiveness,
    notes,
    setNotes,
    stopPrice,
    setStopPrice,
    targetTime,
    setTargetTime,
    initialLoadValue,
    setIsOOLEnabled,
    setMaxClipSize,
    FormAtoms,
  } = useOrderForm();

  const { superStrategies, strategies, trajectories } = initialLoadValue;

  const { handleBaseQuoteFields } = useBaseForm();
  const { handleBaseQtyOnChange, handleQuoteQtyOnChange } = handleBaseQuoteFields;
  const [orderTemplates, setOrderTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [orderSaveName, setOrderSaveName] = useState('');
  const [orderFormState, setOrderFormState] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get limit price state atoms to determine if price was manually set
  const [limitPriceQuickSetting, setLimitPriceQuickSetting] = useAtom(FormAtoms.limitPriceQuickSettingAtom);
  const [limitPriceFromOrderBook, setLimitPriceFromOrderBook] = useAtom(FormAtoms.limitPriceFromOrderBookAtom);

  useEffect(() => {
    const run = async () => {
      if (!open || type !== 'manage') return;
      try {
        setLoading?.(true);
        const data = await getOrderTemplates();
        setOrderTemplates(data || []);
        setSelectedTemplate((data && data[0]) || null);
      } catch (e) {
        showAlert?.({ severity: 'error', message: `Unable to load templates: ${e.message}` });
      } finally {
        setLoading?.(false);
      }
    };
    run();
  }, [open]);

  const getDisplayNames = {
    accounts: 'Accounts',
    pair: 'Pair',
    side: 'Side',
    base_asset_qty: 'Base Quantity',
    quote_asset_qty: 'Quote Quantity',
    super_strategy: 'Strategy',
    strategy: 'Trajectory',
    duration: 'Duration',
    order_condition: 'Order Condition',
    limit_price: 'Limit Price',
    strategy_params: 'Strategy Params',
    engine_passiveness: 'Engine Passiveness',
    schedule_discretion: 'Schedule Discretion',
    alpha_tilt: 'Alpha Tilt',
    pov_limit: 'POV Limit',
    pov_target: 'POV Target',
    notes: 'Notes',
    stop_price: 'Stop Price',
    target_time: 'Target Time',
  };

  const getValues = (setter = false) => {
    return {
      accounts: setter ? setSelectedAccounts : selectedAccounts,
      pair: setter ? setSelectedPair : selectedPair,
      side: setter ? setSelectedSide : selectedSide,
      base_asset_qty: setter ? handleBaseQtyOnChange : baseQty,
      quote_asset_qty: setter ? handleQuoteQtyOnChange : quoteQty,
      super_strategy: setter ? setSelectedStrategy : selectedStrategy,
      strategy: setter ? setTrajectory : trajectory,
      duration: setter ? setSelectedDuration : !povTarget ? selectedDuration : undefined, // eslint-disable-line no-nested-ternary
      // Save quick setting option instead of actual limit price when a quick setting is selected
      limit_price: setter ? setLimitPrice : limitPriceQuickSetting || limitPrice,
      order_condition: setter ? setOrderCondition : orderCondition,
      pov_limit: setter ? setPovLimit : povLimit,
      pov_target: setter ? setPovTarget : povTarget,
      strategy_params: setter ? setSelectedStrategyParams : selectedStrategyParams,
      update_pair_leverage: setter ? setUpdatePairLeverage : updatePairLeverage,
      engine_passiveness: setter ? setPassiveness : passiveness,
      schedule_discretion: setter ? setDiscretion : discretion,
      alpha_tilt: setter ? setAlphaTilt : alphaTilt,
      notes: setter ? setNotes : notes,
      stop_price: setter ? setStopPrice : stopPrice,
      target_time: setter ? setTargetTime : targetTime,
    };
  };

  const getStrategyName = (value) => {
    if (superStrategies && superStrategies[value] && superStrategies[value].name) {
      return superStrategies[value].name;
    }
    if (strategies && strategies[value] && strategies[value].name) {
      return strategies[value].name;
    }
    return '';
  };

  const getTrajectoryName = (value) => {
    if (trajectories && trajectories[value] && trajectories[value].name) {
      return trajectories[value].name;
    }
    return '';
  };

  const formatTemplateValue = (key, value) => {
    switch (key) {
      case 'accounts':
        return value.join(', ');
      case 'pair':
        return value?.symbol;
      case 'side':
        return value; // Return raw value for chip rendering
      case 'pov_limit':
      case 'pov_target':
        return `${smartRound(value)}%`;
      case 'strategy_params':
        return JSON.stringify(value);
      case 'super_strategy':
        return getStrategyName(value);
      case 'strategy':
        return getTrajectoryName(value);
      default:
        return value;
    }
  };

  const getDisplayValues = () => {
    if (!selectedTemplate?.values) return [];

    return Object.entries(selectedTemplate.values)
      .map(([key, value]) => {
        const displayKey = key === 'limit_price_options' ? 'limit_price' : key;
        const displayName = getDisplayNames[displayKey];
        if (!displayName) return null;
        const formattedValue = formatTemplateValue(key, value);
        return formattedValue ? [displayName, formattedValue] : null;
      })
      .filter(Boolean);
  };

  const displayValues = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.values) return [];
    return getDisplayValues();
  }, [selectedTemplate]);

  useEffect(() => {
    setOrderFormState(displayValues);
  }, [displayValues]);

  const loadOrderTemplate = async (template) => {
    if (!template?.values || Object.keys(template.values).length < 1) {
      return;
    }
    setOpen(false);
    setLoading?.(true);
    try {
      // Reset form fields before loading template to prevent persistence of old values
      setLimitPrice('');
      setLimitPriceQuickSetting(null);
      setLimitPriceFromOrderBook(false);
      setTargetTime(undefined);
      setOrderCondition('');
      setStopPrice('');

      const getValuesWithSetters = getValues(true);
      const getValuesKeys = Object.keys(getValues());

      // Validate accounts before loading template
      const validAccounts = [];
      const invalidAccounts = [];

      if (template.values.accounts && Array.isArray(template.values.accounts)) {
        template.values.accounts.forEach((accountId) => {
          if (initialLoadValue.accounts[accountId]) {
            validAccounts.push(accountId);
          } else {
            invalidAccounts.push(accountId);
          }
        });
      }

      // Show warning if some accounts are invalid/archived (but not if ALL are archived)
      if (invalidAccounts.length > 0 && validAccounts.length > 0) {
        showAlert?.({
          severity: 'warning',
          message: `Some accounts in this template are no longer available (${invalidAccounts.length} archived account${invalidAccounts.length > 1 ? 's' : ''}). Only valid accounts will be loaded.`,
        });
      }

      Object.keys(template.values).forEach((templateKey) => {
        const templateValue = template.values[templateKey];
        const foundValue = getValuesKeys.find((key) => key === templateKey);
        if (!foundValue) return;
        switch (templateKey) {
          case 'side':
          case 'pair':
            getValuesWithSetters[foundValue](templateValue);
            break;
          case 'accounts':
            // Only load valid accounts, skip archived ones
            if (validAccounts.length > 0) {
              getValuesWithSetters[foundValue](validAccounts);
            } else if (invalidAccounts.length > 0) {
              // If all accounts are invalid, explicitly clear the accounts field
              // This prevents the form from having invalid account references
              // and ensures stale account selections are cleared
              getValuesWithSetters[foundValue]([]);
            }
            break;
          case 'limit_price': {
            // Check if the saved value is a quick setting option (Mid, Bid, Ask, 1%)
            const quickSettingOptions = ['Mid', 'Bid', 'Ask', '1%'];
            if (quickSettingOptions.includes(templateValue)) {
              // Set the quick setting option instead of the actual price
              setLimitPriceQuickSetting(templateValue);
            } else {
              // Set the actual limit price value
              getValuesWithSetters[foundValue](templateValue);
            }
            break;
          }
          case 'strategy_params':
            getValuesWithSetters[foundValue](templateValue);
            if (templateValue?.ool_pause) {
              setIsOOLEnabled?.(true);
            }
            if (templateValue?.max_clip_size) {
              setMaxClipSize?.(templateValue.max_clip_size);
            }
            break;
          case 'quote_asset_qty':
          case 'base_asset_qty':
            getValuesWithSetters[foundValue](Number(templateValue));
            break;
          case 'target_time':
            // Only set target_time if it's a valid DateTime object
            if (
              templateValue &&
              templateValue !== null &&
              templateValue !== undefined &&
              typeof templateValue.setZone === 'function'
            ) {
              getValuesWithSetters[foundValue](templateValue);
            }
            break;
          default:
            getValuesWithSetters[foundValue](templateValue);
        }
      });

      // Show appropriate success message based on account validation
      if (invalidAccounts.length > 0 && validAccounts.length > 0) {
        showAlert?.({
          severity: 'success',
          message: `Template loaded successfully with ${validAccounts.length} valid account${validAccounts.length > 1 ? 's' : ''} (${invalidAccounts.length} archived account${invalidAccounts.length > 1 ? 's' : ''} skipped)`,
        });
      } else if (invalidAccounts.length > 0 && validAccounts.length === 0) {
        showAlert?.({
          severity: 'warning',
          message: 'Template loaded but all accounts were archived. Please select valid accounts before proceeding.',
        });
      } else {
        showAlert?.({ severity: 'success', message: 'Template loaded successfully' });
      }
    } catch (error) {
      showAlert?.({ severity: 'error', message: 'Failed to load template' });
    } finally {
      setLoading?.(false);
    }
  };

  const saveOrderTemplate = (templateName) => {
    if (templateName === '') return;
    const allValues = getValues();

    // Filter out target_time if strategy is not Target Time
    const isTargetTimeStrategy =
      superStrategies && superStrategies[selectedStrategy] && superStrategies[selectedStrategy].name === 'Target Time';
    if (!isTargetTimeStrategy && allValues.target_time) {
      delete allValues.target_time;
    }

    // Filter out limit_price if it's not explicitly set by user
    // Consider limit_price as not explicitly set if:
    // 1. It's empty, null, or undefined
    // 2. It was set from order book (but keep quick settings)
    // 3. It was auto-populated for simple limit strategies
    const quickSettingOptions = ['Mid', 'Bid', 'Ask', '1%'];
    const isQuickSetting = quickSettingOptions.includes(allValues.limit_price);
    const isLimitPriceManuallySet =
      allValues.limit_price &&
      allValues.limit_price !== '' &&
      (isQuickSetting || (!limitPriceFromOrderBook && !limitPriceQuickSetting));

    if (!isLimitPriceManuallySet) {
      delete allValues.limit_price;
    }

    const newValues = removeFalsyAndEmptyKeys(allValues);
    try {
      const body = { name: templateName, values: newValues };
      createOrderTemplate(body);
      showAlert?.({ severity: 'success', message: 'Template saved successfully' });
    } catch (err) {
      showAlert?.({ severity: 'error', message: `Unable to create template: ${err.message}` });
    }
    setOpen(false);
  };

  const deleteOrderTemplateHandler = (template) => {
    if (!template || !template.id) {
      showAlert?.({ severity: 'error', message: 'No template selected for deletion' });
      return;
    }
    try {
      deleteOrderTemplates([template.id]);
      showAlert?.({ severity: 'success', message: 'Template deleted successfully' });
    } catch (err) {
      showAlert?.({ severity: 'error', message: `Unable to delete template: ${err.message}` });
    }
    setOpen(false);
  };

  const handleClose = () => setOpen(false);

  const renderTemplateTable = (title, fieldNames) => {
    const filteredData = orderFormState.filter(([fieldName]) => fieldNames.includes(fieldName));

    if (filteredData.length === 0) return null;

    return (
      <Box
        sx={{
          backgroundColor: theme.palette.common.pureBlack,
          borderRadius: theme.spacing(1),
          mb: theme.spacing(2),
          p: theme.spacing(2),
        }}
      >
        <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }} variant='subtitle2'>
          {title}
        </Typography>
        <Table aria-label={`${title.toLowerCase()} table`} size='small'>
          <TableBody>
            {filteredData.map(([fieldName, value]) => (
              <TableRow
                key={fieldName}
                sx={{
                  backgroundColor: theme.palette.common.pureBlack,
                  '&:hover': { backgroundColor: theme.palette.grey[900] },
                }}
              >
                <StyledTableCell
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: theme.typography.body1.fontSize,
                    fontWeight: 500,
                    py: 2,
                    width: '40%',
                    borderRight: `1px solid ${theme.palette.grey[800]}`,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.body2.fontSize,
                      py: 1.5,
                    },
                  }}
                >
                  {fieldName}
                </StyledTableCell>
                <StyledTableCell
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: theme.typography.body1.fontSize,
                    py: 2,
                    wordBreak: 'break-word',
                    width: '60%',
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.body2.fontSize,
                      py: 1.5,
                    },
                  }}
                >
                  {fieldName === 'Side' ? (
                    <Chip
                      label={titleCase(value)}
                      size='small'
                      sx={{
                        backgroundColor: value === 'buy' ? '#1a4d3a' : '#4d1a1a', // Dark teal for buy, dark red for sell
                        color: value === 'buy' ? '#00ff88' : '#ff4444', // Bright green for buy, bright red for sell
                        fontWeight: 600,
                        border: `1px solid ${value === 'buy' ? '#00ff88' : '#ff4444'}`, // Bright border matching text
                        borderRadius: '8px', // More rounded, pill-like shape
                        fontFamily: 'monospace', // Monospace font for technical look
                        '&:hover': {
                          backgroundColor: value === 'buy' ? '#1a4d3a' : '#4d1a1a',
                          opacity: 0.8,
                        },
                      }}
                    />
                  ) : (
                    value
                  )}
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  const renderManageTemplate = () => {
    if (loading) {
      return (
        <>
          <Skeleton height={40} sx={{ mb: 3 }} variant='rounded' />
          <Stack direction='row' justifyContent='center' spacing={2} sx={{ mb: 3 }}>
            <Skeleton height={36} variant='rounded' width={80} />
            <Skeleton height={36} variant='rounded' width={80} />
            <Skeleton height={36} variant='rounded' width={80} />
          </Stack>
          <Skeleton height={200} variant='rounded' />
        </>
      );
    }

    return (
      <>
        <FormControl fullWidth size='small' sx={{ mt: 2 }}>
          <InputLabel id='template-label'>Select Template</InputLabel>
          <Select
            label='Select Template'
            labelId='template-label'
            value={selectedTemplate || ''}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {orderTemplates.map((template) => (
              <MenuItem key={template.id} value={template}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {orderFormState.length > 0 && (
          <>
            <Divider sx={{ my: theme.spacing(2) }} />
            {renderTemplateTable('Order Basics', ['Accounts', 'Pair', 'Side', 'Base Quantity', 'Quote Quantity'])}
            {renderTemplateTable('Execution Parameters', [
              'Strategy',
              'Trajectory',
              'Duration',
              'Order Condition',
              'Limit Price',
            ])}
            {renderTemplateTable('Engine Control', [
              'Strategy Params',
              'Engine Passiveness',
              'Schedule Discretion',
              'Alpha Tilt',
              'POV Limit',
              'POV Target',
            ])}
            {renderTemplateTable('Additional Settings', ['Notes', 'Stop Price', 'Target Time'])}
          </>
        )}
        <Divider sx={{ my: 2 }} />
        <Stack
          direction='row'
          justifyContent='center'
          spacing={2}
          sx={{
            mt: 2,
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'column',
            },
          }}
        >
          <Button
            color='error'
            disabled={!selectedTemplate}
            size='small'
            sx={{
              minWidth: 80,
              [theme.breakpoints.down('sm')]: {
                flex: 1,
                minWidth: 'auto',
              },
            }}
            variant='outlined'
            onClick={() => deleteOrderTemplateHandler(selectedTemplate)}
          >
            Delete
          </Button>
          <Button
            disabled={!selectedTemplate}
            size='small'
            sx={{
              minWidth: 80,
              [theme.breakpoints.down('sm')]: {
                flex: 1,
                minWidth: 'auto',
              },
            }}
            variant='contained'
            onClick={async (e) => {
              e.preventDefault();
              await loadOrderTemplate(selectedTemplate);
            }}
          >
            Load
          </Button>
        </Stack>
      </>
    );
  };

  const renderCreateTemplate = () => {
    return (
      <>
        <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
          <TextField
            label='Template Name'
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'transparent',
                borderRadius: 1,
                '& fieldset': {
                  borderColor: theme.palette.grey[800],
                  borderWidth: 1,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.grey[800],
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.grey[800],
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: theme.palette.text.secondary,
                },
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.text.primary,
                padding: '12px 14px',
              },
            }}
            value={orderSaveName}
            onChange={(e) => setOrderSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveOrderTemplate(e.target.value);
              }
            }}
          />
        </FormControl>
        <Stack
          direction='row'
          justifyContent='center'
          sx={{
            mt: 1,
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'column',
            },
          }}
        >
          <Button
            color='primary'
            size='small'
            sx={{ minWidth: '80px' }}
            variant='contained'
            onClick={() => saveOrderTemplate(orderSaveName)}
          >
            <Typography color='primary.contrastText' variant='body1'>
              Save
            </Typography>
          </Button>
        </Stack>
      </>
    );
  };

  return (
    <Modal
      closeAfterTransition
      aria-describedby='transition-modal-description'
      aria-labelledby='transition-modal-title'
      keepMounted={false}
      open={open}
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
      onClose={handleClose}
    >
      <Fade in={open} timeout={300}>
        <Box sx={modalStyle(theme)}>
          <Box
            sx={{
              px: 3,
              py: 2,
              pt: 3,
              pb: 3,
              borderBottom: 1,
              borderColor: theme.palette.grey[800],
              position: 'relative',
              backgroundColor: 'transparent',
            }}
          >
            <Typography
              sx={{
                color: theme.palette.text.primary,
              }}
              variant='subtitle1'
            >
              {type === 'manage' ? 'Order Templates' : 'Save Template'}
            </Typography>
            <IconButton
              aria-label='close'
              size='small'
              sx={{
                ...closeButtonStyle,
                color: theme.palette.text.primary,
              }}
              onClick={handleClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              px: 3,
              py: 2,
              pb: 3,
              backgroundColor: 'transparent',
              [theme.breakpoints.down('sm')]: {
                px: 2,
                py: 2,
                pb: 3,
              },
            }}
          >
            {type === 'manage' ? renderManageTemplate() : renderCreateTemplate()}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
