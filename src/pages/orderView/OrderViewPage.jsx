/* eslint-disable no-param-reassign */
import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrderEntryFormData, ORDER_SEARCH_URL } from '@/apiServices';
import ChipStatusFilter from '@/shared/orderTable/ChipStatusFilter';
import { SharedOrderTable } from '@/shared/orderTable/SharedOrderTable';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';

import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useOrderSearch } from '@/shared/hooks/useOrderSearch';
import { OrderSearch } from './OrderSearch';
import * as FormAtoms from '../dashboard/orderEntry/hooks/useFormReducer';

function OrderViewPage() {
  const [orders, setOrders] = useState([]);
  const { showAlert } = useContext(ErrorContext);

  const [totalPages, setTotalPages] = useState(null);
  const [tokenPairs, setTokenPairs] = useState([]);

  const { setInitialLoadValue, setSelectedPair, setSelectedAccounts } = useOrderForm();

  const { user, isDev } = useUserMetadata();
  const navigate = useNavigate();

  const handleSearchComplete = (response) => {
    setOrders(response.orders || []);
    setTotalPages(response.num_pages || 1);
  };

  const { searchParams, updateSearchParams, orderSearchFormData, loading, handleSearch } = useOrderSearch(
    ORDER_SEARCH_URL,
    handleSearchComplete,
    15
  );

  const getInitialData = async () => {
    let data;
    try {
      data = await fetchOrderEntryFormData();
    } catch (e) {
      showAlert({
        severity: 'error',
        message: 'Failed to fetch initial data',
      });
      return;
    }

    const pairs = data.pairs.map((p) => {
      return {
        base: p.base,
        exchanges: p.exchanges,
        id: p.name,
        is_contract: p.is_contract,
        is_inverse: p.is_inverse,
        label: p.name,
        market_type: p.market_type,
        quote: p.quote,
      };
    });

    const accounts = {};
    data.accounts.forEach((acc) => {
      const scopedAccName = acc.user === data.user_id ? acc.name : `${acc.username}/${acc.name}`;
      const displayName = `${acc.exchange} - ${scopedAccName}`;
      accounts[scopedAccName] = {
        displayName,
        id: acc.id,
        name: scopedAccName,
        exchangeName: acc.exchange,
      };
    });

    const indexedStrategies = data.strategies.reduce((obj, item) => {
      obj[item.id] = item;
      return obj;
    }, {});

    const indexedSuperStrategies = data.super_strategies.reduce((obj, item) => {
      obj[item.id] = item;
      return obj;
    }, {});

    setTokenPairs(pairs);
    setInitialLoadValue({
      tokenPairs: pairs,
      accounts,
      exchanges: data.exchanges,
      strategies: indexedSuperStrategies,
      trajectories: indexedStrategies,
      superStrategies: indexedSuperStrategies,
      strategyParams: data.strategy_params,
      orderTemplates: data.order_templates,
    });
  };

  useEffect(() => {
    getInitialData();
  }, []);

  const setPageNumber = (page) => {
    updateSearchParams({ pageNumber: page + 1 });
  };

  const onClickTypeChipCallback = () => {
    setPageNumber(0);
  };

  const setStatusHighlightCallback = useCallback((status) => {
    updateSearchParams({ status });
  });

  const setTypeFilterCallback = useCallback((type) => {
    updateSearchParams({ type });
  });

  const handleOrderPairClick = (pair, accounts) => {
    setSelectedPair(pair);
    setSelectedAccounts(accounts);
    navigate('/');
  };

  return (
    <Stack spacing={1} sx={{ height: '100%' }}>
      <OrderSearch
        formData={orderSearchFormData}
        searchParams={searchParams}
        onSearchParamsChange={updateSearchParams}
      />
      <Card style={{ height: 'calc(100% - 80px)' }}>
        <CardContent>
          <ChipStatusFilter
            paginationView
            disabled={loading}
            isDev={isDev}
            isSuperUser={user && user.is_superuser}
            searchParams={searchParams}
            setStatusHighlight={setStatusHighlightCallback}
            setTypeFilter={setTypeFilterCallback}
            statusHighlight={searchParams.status}
            typeFilter={searchParams.type}
            onClickTypeChipCallback={onClickTypeChipCallback}
          />
          <Box sx={{ mb: 2 }} />
          <Box style={{ height: 'calc(100% - 40px)' }}>
            <SharedOrderTable
              FormAtoms={FormAtoms}
              loading={loading}
              orderData={orders}
              orderRefresh={handleSearch}
              page={searchParams.pageNumber - 1}
              setPage={setPageNumber}
              tokenPairs={tokenPairs}
              totalPages={totalPages}
              onPairClick={handleOrderPairClick}
            />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default OrderViewPage;
