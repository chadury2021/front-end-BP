import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';
import AlgoNumberField from '../../pages/dashboard/orderEntry/AlgoOrderFieldsComponents/AlgoNumberField';

function PovTargetField({ baseAssetQty, calculateDuration, isPovLoading, povTarget, setPovTarget }) {
  useEffect(() => {
    const handler = setTimeout(() => {
      calculateDuration(povTarget);
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [povTarget]);

  return (
    <AlgoNumberField
      disabled={!baseAssetQty || isPovLoading}
      InputProps={{
        step: 'any',
        endAdornment: <Typography color='grey.main'>%</Typography>,
      }}
      label='Participation Rate Target'
      size='small'
      value={povTarget}
      onChange={(e) => setPovTarget(e.target.value)}
    />
  );
}

function PovLimitField({ baseAssetQty, isPovLoading, povLimit, setPovLimit }) {
  return (
    <AlgoNumberField
      disabled={!baseAssetQty || isPovLoading}
      InputProps={{
        step: 'any',
        endAdornment: <Typography color='grey.main'>%</Typography>,
      }}
      label='Participation Rate Limit'
      size='small'
      value={povLimit}
      onChange={(e) => setPovLimit(e.target.value)}
    />
  );
}

export { PovTargetField, PovLimitField };
