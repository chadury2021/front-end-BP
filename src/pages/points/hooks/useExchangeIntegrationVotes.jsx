import { useContext, useEffect, useState, useRef } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ApiError, getExchangeIntegrationVotes } from '@/apiServices';

function useExchangeIntegrationVotes() {
  const { showAlert } = useContext(ErrorContext);
  const [votesData, setVotesData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersVote, setUsersVote] = useState(null);
  const intervalRef = useRef(null);
  const showAlertRef = useRef(showAlert);
  const fetchDataRef = useRef(null);

  // Keep showAlert ref in sync to avoid including it in effect dependencies
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  useEffect(() => {
    const fetchData = async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await getExchangeIntegrationVotes();
        const integrations = response.exchange_integrations || [];
        setUsersVote(response?.users_vote);
        // Store raw data for admin form
        setRawData(integrations);

        // Transform API response to match component expectations
        const transformedData = integrations.map((integration) => {
          const rawOthers = integration.others;
          let othersTitle = null;
          if (rawOthers && typeof rawOthers === 'object' && rawOthers.title) {
            othersTitle = String(rawOthers.title);
          }

          return {
            id: String(integration.id),
            // Title comes from integration.description (admin form "Title *" field)
            title: integration.description || `Exchange ${integration.id}`,
            // Description comes from others.title (admin form "Description" field)
            description: othersTitle || '',
            votes: parseFloat(integration.total_votes || '0'),
            logo: integration.logo_url || null,
            integration_bonus: integration.integration_bonus,
            fee_rebates: integration.fee_rebates,
            others: integration.others,
            exchangeIntegrationId: integration.id,
          };
        });

        setVotesData(transformedData);
      } catch (e) {
        const errorMessage = e instanceof ApiError ? e.message : 'Failed to fetch exchange integration votes';
        setError(errorMessage);
        if (showLoading) {
          showAlertRef.current({
            severity: 'error',
            message: errorMessage,
          });
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Store fetchData function in ref for manual refresh
    fetchDataRef.current = fetchData;

    // Initial load
    fetchData(true);

    // Set up polling: refresh data every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchData(false); // Background refresh, don't show loading
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Manual refresh function
  const refresh = () => {
    if (fetchDataRef.current) {
      fetchDataRef.current(true);
    }
  };

  return { votesData, rawData, loading, error, refresh, usersVote };
}

export default useExchangeIntegrationVotes;
