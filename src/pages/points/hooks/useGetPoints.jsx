import { useState, useEffect } from 'react';
import { getPointsV2 } from '@/apiServices';
import { useToast } from '@/shared/context/ToastProvider';

function useGetPoints() {
  const [pointsData, setPointsData] = useState({});
  const [loading, setLoading] = useState(true);
  const { showToastMessage } = useToast();

  useEffect(() => {
    const fetchPoints = async () => {
      setLoading(true);
      try {
        const result = await getPointsV2();
        setPointsData(result);
      } catch (error) {
        showToastMessage({ message: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, []);

  return { pointsData, loading };
}

export default useGetPoints;
