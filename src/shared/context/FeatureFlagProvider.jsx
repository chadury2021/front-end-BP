import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getEnabledFeatures } from '@/apiServices';

const FeatureFlagContext = createContext();

export function FeatureFlagProvider({ children }) {
  const [enabledFeatures, setEnabledFeatures] = useState([]);

  useEffect(() => {
    const fetchEnabledFeatures = async () => {
      try {
        const response = await getEnabledFeatures();
        setEnabledFeatures(response.features || []);
      } catch (error) {
        console.warn('Failed to fetch enabled features:', error);
        // Set empty array as fallback for logged out users
        setEnabledFeatures([]);
      }
    };

    fetchEnabledFeatures();
  }, []);

  const isFeatureEnabled = (feature) => {
    return enabledFeatures?.includes(feature) ?? false;
  };

  const value = useMemo(() => ({ isFeatureEnabled }), [isFeatureEnabled]);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export const useFeatureFlag = () => useContext(FeatureFlagContext);
