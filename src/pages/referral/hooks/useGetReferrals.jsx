import { useContext, useEffect, useState } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ApiError, getUserReferrals } from '@/apiServices';

function useGetReferrals(isAuthed) {
  const { showAlert } = useContext(ErrorContext);
  const [isLoading, setIsLoading] = useState(true);
  const [userReferrals, setUserReferrals] = useState([]);
  const [userEarnings, setUserEarnings] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getUserReferrals();
        setUserReferrals(result.referrals || []);
        setUserEarnings(result.user_earnings || 0);
      } catch (e) {
        if (e instanceof ApiError) {
          showAlert({
            severity: 'error',
            message: `Failed to fetch user referrals data: ${e.message}`,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthed) {
      fetchData();
    }
  }, [isAuthed]);

  return {
    isLoading,
    userReferrals,
    userEarnings,
  };
}

export default useGetReferrals;
