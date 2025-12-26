import { useContext, useEffect, useRef, useState } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ApiError, getLeaderboard } from '@/apiServices';

function leaderboardDataCacheKey(page, search, timeframe) {
  return `${page}#${search || ''}#${timeframe || '30d'}`;
}

function useGetLeaderboardData(page = 0, search = '', timeframe = '30d', rowsPerPage = 20) {
  const { showAlert } = useContext(ErrorContext);
  const [leaderboardData, setLeaderboardData] = useState({});
  const [leaderboardDataCache, setLeaderboardDataCache] = useState({});
  const [leaderboardDataLoading, setLeaderboardDataLoading] = useState(true);
  const intervalRef = useRef(null);
  const cacheRef = useRef({});
  const showAlertRef = useRef(showAlert);

  // Keep cache ref in sync with state for access without dependency
  useEffect(() => {
    cacheRef.current = leaderboardDataCache;
  }, [leaderboardDataCache]);

  // Keep showAlert ref in sync to avoid including it in effect dependencies
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  useEffect(() => {
    const cacheKey = leaderboardDataCacheKey(page, search, timeframe);

    const fetchData = async (showLoading = false) => {
      // Set loading to true only when explicitly requested (initial load or page change)
      if (showLoading) {
        setLeaderboardDataLoading(true);
      }

      try {
        // Call the new get_leaderboard endpoint
        const apiResponse = await getLeaderboard();

        // Map API response to component-expected format
        const result = {
          my_rank:
            apiResponse.user_rank !== null && apiResponse.user_rank !== undefined
              ? apiResponse.user_rank + 1 // Convert 0-indexed to 1-indexed
              : null,
          my_trader_id: apiResponse.user_totals?.username || null,
          my_volume: apiResponse.user_totals?.total_volume || null,
          my_boosted_volume: apiResponse.user_totals?.total_adjusted_volume || null,
          leaderboard_rows: (apiResponse.leaderboard || []).map((entry, index) => ({
            rank: index + 1,
            trader_id: entry.username || null,
            volume: entry.total_volume || null,
            boosted_volume: entry.total_adjusted_volume || null,
            adjusted_volume: entry.total_adjusted_volume || null, // For backward compatibility
          })),
        };

        setLeaderboardDataCache((prev) => ({ ...prev, [cacheKey]: result }));
        setLeaderboardData(result);
      } catch (e) {
        if (e instanceof ApiError) {
          showAlertRef.current({
            severity: 'error',
            message: `Failed to fetch leaderboard data: ${e.message}`,
          });
        }
      } finally {
        if (showLoading) {
          setLeaderboardDataLoading(false);
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
      setLeaderboardData(cacheRef.current[cacheKey]);
      setLeaderboardDataLoading(false);
    } else {
      fetchData(true);
    }

    // Set up polling: refresh data every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchData(false); // Background refresh, don't show loading
    }, 30000);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [page, search, timeframe, rowsPerPage]);

  return { leaderboardData, leaderboardDataLoading };
}

export default useGetLeaderboardData;
