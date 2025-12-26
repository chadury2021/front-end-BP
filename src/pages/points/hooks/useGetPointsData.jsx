import moment from 'moment';

import { useContext, useEffect, useRef, useState } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ApiError, getPointsData } from '@/apiServices';

function pointsDataCacheKey(dateRange, activityPage) {
  if (!dateRange || !dateRange.key) {
    return `undefined#${activityPage}`;
  }
  return `${dateRange.key}#${activityPage}`;
}

function useGetPointsData(dateRange, activityPage) {
  const { showAlert } = useContext(ErrorContext);
  const [pointsData, setPointsData] = useState({});
  const [pointsDataCache, setPointsDataCache] = useState({});
  const [pointsDataLoading, setPointsDataLoading] = useState(true);
  const intervalRef = useRef(null);
  const cacheRef = useRef({});
  const showAlertRef = useRef(showAlert);

  // Keep cache ref in sync with state for access without dependency
  useEffect(() => {
    cacheRef.current = pointsDataCache;
  }, [pointsDataCache]);

  // Keep showAlert ref in sync to avoid including it in effect dependencies
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  useEffect(() => {
    // Don't run if dateRange is not properly defined
    if (!dateRange) {
      setPointsData({});
      setPointsDataLoading(false);
      return () => {
        // No cleanup needed
      };
    }

    const cacheKey = pointsDataCacheKey(dateRange, activityPage);

    const fetchData = async (showLoading = false) => {
      // Set loading to true only when explicitly requested (initial load or page change)
      if (showLoading) {
        setPointsDataLoading(true);
      }
      
      try {
        const endTime = moment.utc();
        const startTime = moment.utc().subtract(dateRange.days || 30, 'days');
        const result = await getPointsData({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          activityPage: activityPage + 1,
        });
        setPointsDataCache((prev) => ({ ...prev, [cacheKey]: result }));
        setPointsData(result);
      } catch (e) {
        if (e instanceof ApiError) {
          showAlertRef.current({
            severity: 'error',
            message: `Failed to fetch points data: ${e.message}`,
          });
        }
      } finally {
        if (showLoading) {
          setPointsDataLoading(false);
        }
      }
    };

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Initial load: use cache if available, otherwise fetch
    // Use cacheRef to access latest cache without including it in dependencies
    if (cacheRef.current[cacheKey]) {
      setPointsData(cacheRef.current[cacheKey]);
      setPointsDataLoading(false);
    } else {
      fetchData(true);
    }

    // Set up polling: refresh data every 15 seconds
    intervalRef.current = setInterval(() => {
      fetchData(false); // Background refresh, don't show loading
    }, 15000);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dateRange, activityPage]);

  return { pointsData, pointsDataLoading };
}

export default useGetPointsData;
