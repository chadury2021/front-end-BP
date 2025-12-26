import { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { fetchOrderDetailData } from '@/apiServices';

function useOrderData(orderId) {
  const { showAlert } = useContext(ErrorContext);
  const [orderData, setOrderData] = useState({ order_summary: {}, benchmark: {} });
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const fetchOrderData = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await fetchOrderDetailData(id);
      setOrderData(data);
      return data;
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch order details: ${e.message}`,
      });
    } finally {
      setLoading(false);
    }

    return null;
  }, []);

  useEffect(() => {
    const pollApi = async () => {
      const data = await fetchOrderData(orderId);
      if (!data?.order_ended) {
        timeoutRef.current = setTimeout(pollApi, 3000);
      }
    };

    pollApi();

    return () => clearTimeout(timeoutRef.current);
  }, [orderId]);

  return { orderData, loading };
}

export { useOrderData };
