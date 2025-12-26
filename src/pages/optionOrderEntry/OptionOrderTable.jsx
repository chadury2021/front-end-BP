import Box from '@mui/material/Box';
import React, { useContext, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { SharedOrderTable } from '@/shared/orderTable/SharedOrderTable';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import ChipStatusFilter from '@/shared/orderTable/ChipStatusFilter';
import { getOptionOrders } from '@/apiServices';

function OptionOrderTable({ FormAtoms }) {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [statusHighlight, setStatusHighlight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState([]);

  const { showAlert } = useContext(ErrorContext);

  const getDashboardOrders = async (reload = false) => {
    const params = {
      status: statusHighlight,
      type: typeFilter,
    };

    try {
      // don't show loading mask for interval reload
      if (!reload) {
        setLoading(true);
      }

      const data = await getOptionOrders(params);
      setOrders(data.orders);

      if (!reload) {
        setLoading(false);
      }
    } catch (error) {
      showAlert({
        severity: 'error',
        message: error.message,
      });
    }
  };

  useEffect(() => {
    getDashboardOrders();
    const intervalId = setInterval(() => {
      getDashboardOrders(true);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [statusHighlight, typeFilter]);

  return (
    <>
      <ChipStatusFilter
        dashboardView
        optionsView
        isSuperUser={false} // keep superuser functionality on dashboard and order table view
        loadOrders={getDashboardOrders}
        setStatusHighlight={setStatusHighlight}
        setTypeFilter={setTypeFilter}
        statusHighlight={statusHighlight}
        typeFilter={typeFilter}
      />
      <Box sx={{ mb: 3 }} />
      <div style={{ height: '100%', overflow: 'auto' }}>
        {loading ? (
          <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
            <ScaleLoader color={theme.palette.common.pureWhite} />
          </Box>
        ) : (
          <SharedOrderTable dashboardView FormAtoms={FormAtoms} orderData={orders} orderRefresh={getDashboardOrders} />
        )}
      </div>
    </>
  );
}

export default OptionOrderTable;
