import { useCallback, useContext, useEffect, useState } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { fetchPlacements } from '@/apiServices';

function usePlacementMessages(orderId) {
  const [placementMessages, setPlacementMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useContext(ErrorContext);

  const fetchPlacementMessages = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      // Fetch all placements including failed ones
      const response = await fetchPlacements({
        orderId,
        pageSize: 100, // Get more placements to ensure we capture all failures
        pageNumber: 1,
      });

      if (response.placements) {
        // Filter for failed placements and convert to message format
        const failedPlacements = response.placements.filter(
          (placement) => placement.status === 'FAILED' && placement.failure_reason
        );

        const messages = failedPlacements.map((placement) => ({
          id: `placement_${placement.id}`,
          order: orderId,
          message_type: 'ERROR',
          message: `Placement ${placement.id} failed: ${placement.failure_reason}`,
          created_at: placement.created_at,
          sender: 'Placement',
        }));

        setPlacementMessages(messages);
      }
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch placement messages: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [orderId, showAlert]);

  useEffect(() => {
    fetchPlacementMessages();
  }, [fetchPlacementMessages]);

  return {
    placementMessages,
    isLoading,
    refetch: fetchPlacementMessages,
  };
}

export default usePlacementMessages;