import { useCallback, useContext, useEffect, useState } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { fetchPlacements } from '@/apiServices';
import { PLACEMENT_STATUS } from '@/shared/orderConstants';

function usePlacementsData(orderId, orderActive, onlyActive = false, initPageSize = 10) {
  const [placementsDataLoading, setPlacementsDataLoading] = useState(true);
  const [placementsData, setPlacementsData] = useState([]);
  const [totalPlacements, setTotalPlacements] = useState(null);
  const [currentPageNumber, setCurrentPageNumber] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(initPageSize);
  const { showAlert } = useContext(ErrorContext);

  const fetchPlacementsData = useCallback(
    async (pageNumber, pageSize) => {
      const params = {
        orderId,
        pageSize,
        pageNumber: pageNumber + 1, // MUI and backend offset by 1
      };
      if (onlyActive) {
        params.statuses = [PLACEMENT_STATUS.ACTIVE];
      }
      try {
        const response = await fetchPlacements(params);
        if (response.placements) {
          setPlacementsData(response.placements.filter((p) => !p.failure_reason.includes('MIN QTY')));
        }
        setTotalPlacements(response.count);
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Failed to fetch order details: ${e.message}`,
        });
      } finally {
        setPlacementsDataLoading(false);
      }
    },
    [orderId, onlyActive]
  );

  useEffect(() => {
    fetchPlacementsData(currentPageNumber, currentPageSize);
  }, [currentPageNumber, currentPageSize, onlyActive]);

  useEffect(() => {
    let isMounted = true;

    const startPolling = async () => {
      while (isMounted && orderActive) {
        // eslint-disable-next-line no-await-in-loop
        await fetchPlacementsData(currentPageNumber, currentPageSize);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
    };

    startPolling();

    return () => {
      isMounted = false;
    };
  }, [currentPageNumber, currentPageSize, orderActive, onlyActive]);

  return {
    placementsDataLoading,
    placementsData,
    totalPlacements,
    currentPageNumber,
    setCurrentPageNumber,
    currentPageSize,
    setCurrentPageSize,
  };
}

export default usePlacementsData;
