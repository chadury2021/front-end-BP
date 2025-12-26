import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { loadFromOrderEdit, getValues } from '../formUtil';
import { useUserMetadata } from '../context/UserMetadataProvider';
import { useBaseForm } from '../../pages/dashboard/orderEntry/hooks/useBaseForm';
import { buySellToBaseQuote } from './util';

export default function EditTableOrder({ dashboardView = true, loading, setLoading, setOpen, data, isResubmit }) {
  const {
    setSelectedStrategy,
    setTrajectory,
    setSelectedStrategyParams,
    setSelectedDuration,
    setPosSide,
    setUpdatePairLeverage,
    setLimitPrice,
    setStopPrice,
    setPassiveness,
    setDiscretion,
    setAlphaTilt,
    setNotes,
    setOrderCondition,
    setPovTarget,
    setPovLimit,
    setSelectedPair,
    setSelectedAccounts,
    setSelectedSide,
    setTargetTime,
    setMaxOtcPercentage,
    setIsOOLEnabled,
    setMaxClipSize,
    setUrgency,
    initialLoadValue,
    setOrderEntryType,
  } = useOrderForm();

  const navigate = useNavigate();

  const { accounts, strategies, trajectories, tokenPairs, flat_options } = initialLoadValue;

  const optionPairs = flat_options && Object.values(flat_options).flat();
  const isOptionsPage = optionPairs && optionPairs.length > 0;

  const { user } = useUserMetadata();

  const { handleBaseQuoteFields } = useBaseForm({ options: isOptionsPage });

  const { handleBaseQtyOnChange, handleQuoteQtyOnChange } = handleBaseQuoteFields;

  const handleEditOrder = async (row) => {
    let rowData = row;

    if (!isResubmit) {
      rowData = buySellToBaseQuote(row);
    }

    const setters = getValues({
      setSelectedAccounts,
      setSelectedSide,
      setSelectedPair,
      handleBaseChange: handleBaseQtyOnChange,
      handleQuoteChange: handleQuoteQtyOnChange,
      setPosSide,
      setPovLimit,
      setPovTarget,
      setOrderCondition,
      setAlphaTilt,
      setDiscretion,
      setPassiveness,
      setSelectedStrategy,
      setTrajectory,
      setSelectedStrategyParams,
      setSelectedDuration,
      setUpdatePairLeverage,
      setTargetTime,
      setStopPrice,
      setLimitPrice,
      setIsOOLEnabled,
      setNotes,
      setLoading,
      setMaxOtcPercentage,
      setMaxClipSize,
      setUrgency,
    });

    await loadFromOrderEdit(
      rowData,
      () => {},
      setLoading,
      setters,
      isOptionsPage ? optionPairs : tokenPairs, // send options pairs on options page
      strategies,
      trajectories,
      user,
      accounts,
      setOrderEntryType
    ).then(() => {
      setLoading(false);
      setOpen(false);
    });

    if (!dashboardView) {
      navigate('/', { state: { from: 'EditTableOrder' } });
    }
  };
  const buttonStyle = {
    marginTop: 1,
    marginBottom: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  if (loading) {
    return (
      <Button disabled sx={{ ...buttonStyle, width: '200px' }} variant='contained'>
        <CircularProgress size={20} />
      </Button>
    );
  }

  return (
    <Button
      color='primary'
      sx={{ ...buttonStyle, width: '200px' }}
      variant='contained'
      onClick={() => handleEditOrder(data)}
    >
      Edit
    </Button>
  );
}
