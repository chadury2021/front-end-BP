import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { getMaxLeverageTable } from '../apiServices';

const MaxLeverageContext = createContext({
  data: {},
  loading: true,
  error: null,
  getMaxLeverage: (pair, exchange) => null,
});

export function MaxLeverageProvider({ children }) {
  const [data, setData] = useState({});
  const [binanceLookup, setBinanceLookup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMaxLeverageTable();
        if (!isMounted) return;
        setData(res?.max_leverages || {});
        setBinanceLookup(res?.binance_lookup || {});
      } catch (e) {
        if (!isMounted) return;
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getMaxLeverage = useMemo(() => {
    return (pair, exchange) => {
      if (!pair) return null;
      const byPair = data?.[pair];
      if (!byPair) return null;
      return byPair?.[exchange];
    };
  }, [data]);

  const value = useMemo(
    () => ({ data, binanceLookup, loading, error, getMaxLeverage }),
    [data, binanceLookup, loading, error, getMaxLeverage]
  );

  return <MaxLeverageContext.Provider value={value}>{children}</MaxLeverageContext.Provider>;
}

export const useMaxLeverage = () => useContext(MaxLeverageContext);
