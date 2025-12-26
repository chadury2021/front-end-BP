import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Unstable_Grid2';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import OptionEntryForm from './OptionEntryForm';
import OptionPriceChart from './OptionPriceChart';
import OptionOrderTable from './OptionOrderTable';

export default function OptionOrderPage() {
  const { FormAtoms } = useOrderForm();
  return (
    <Grid container alignItems='stretch' spacing={1} style={{ height: '100%' }}>
      <Grid style={{ height: '60%' }} xs={12}>
        <Card style={{ width: '100%', height: '100%' }}>
          <OptionPriceChart FormAtoms={FormAtoms} />
        </Card>
      </Grid>
      <Grid style={{ height: '40%' }} xs={4}>
        <Card style={{ width: '100%', height: '100%', overflow: 'auto' }}>
          <CardContent>
            <OptionEntryForm FormAtoms={FormAtoms} />
          </CardContent>
        </Card>
      </Grid>
      <Grid style={{ height: '40%' }} xs={8}>
        <Card style={{ width: '100%', height: '100%' }}>
          <CardContent>
            <OptionOrderTable FormAtoms={FormAtoms} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
