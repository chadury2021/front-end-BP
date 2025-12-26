import { useState, useEffect } from 'react';
import { getCallDynamic, getOrderSearchData } from '@/apiServices';

export const prepareSearchParams = (searchParams) => {
  const queryParams = {
    page_number: searchParams.pageNumber,
    page_size: searchParams.pageSize,
    created_at__gte: searchParams.dateFrom,
    created_at__lt: searchParams.dateTo,
    pair: searchParams.pair || '',
    market_types: searchParams.marketTypes.join(','),
  };

  // Handle account_names
  if (searchParams.account_names) {
    queryParams.account_names = searchParams.account_names;
  }

  // Handle status - convert array to comma-separated string if needed
  if (searchParams.status && Array.isArray(searchParams.status) && searchParams.status.length > 0) {
    queryParams.status = searchParams.status.join(',');
  } else if (searchParams.status && !Array.isArray(searchParams.status)) {
    queryParams.status = searchParams.status;
  }

  // Handle type - convert array to comma-separated string if needed
  if (searchParams.type && Array.isArray(searchParams.type) && searchParams.type.length > 0) {
    queryParams.type = searchParams.type.join(',');
  } else if (searchParams.type && !Array.isArray(searchParams.type)) {
    queryParams.type = searchParams.type;
  }

  // Handle side
  if (searchParams.side) {
    queryParams.side = searchParams.side;
  }

  // Handle strategy params
  if (searchParams.strategy) {
    const [id, , type] = searchParams.strategy;
    if (type === 'Strategy') {
      queryParams.super_strategy = id;
    } else if (type === 'Trajectory') {
      queryParams.trajectory = id;
    }
  }

  // Filter out null, undefined, and empty string values
  const filteredParams = Object.fromEntries(
    Object.entries(queryParams).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    })
  );
  return filteredParams;
};

export const useOrderSearch = (url, onSearchComplete, pageSize = 1000) => {
  const [searchParams, setSearchParams] = useState({
    dateFrom: undefined,
    dateTo: undefined,
    account_names: '',
    pair: null,
    side: '',
    strategy: null,
    marketTypes: [],
    pageNumber: 1,
    pageSize,
    type: ['SINGLE'],
    status: [],
  });

  const [orderSearchFormData, setOrderSearchFormData] = useState({
    accounts: [],
    pairs: [],
    strategies: [],
    market_types: [],
  });

  const [loading, setLoading] = useState(true);

  const updateSearchParams = (newParams) => {
    setSearchParams((prev) => ({ ...prev, ...newParams }));
  };

  const handleSearch = async (firstLoad = true) => {
    setLoading(firstLoad);
    try {
      const sanitizedParams = prepareSearchParams(searchParams);
      const response = await getCallDynamic(url, sanitizedParams);
      onSearchComplete(response);
      return response;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let success = true;

    /* eslint-disable no-await-in-loop */
    const pollData = async () => {
      let firstLoad = true;
      while (isMounted && success) {
        success = await handleSearch(firstLoad);
        firstLoad = false;
        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      }
    };

    pollData();

    return () => {
      // Stop polling when the component unmounts or success changes
      isMounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getOrderSearchData();
        setOrderSearchFormData(data);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  return {
    searchParams,
    updateSearchParams,
    orderSearchFormData,
    loading,
    handleSearch,
  };
};
