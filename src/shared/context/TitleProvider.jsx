import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const TitleContext = createContext();

function getTitle(title) {
  return title ? `${title} - tread.fi` : 'tread.fi - Algorithmic Trading';
}

export function TitleProvider({ children }) {
  const [title, setTitle] = useState();
  const location = useLocation();
  const value = useMemo(() => ({ title, setTitle }), [title]);

  useEffect(() => {
    // Force update every second, even when tab is not focused
    const interval = setInterval(() => {
      document.title = getTitle(title);
    }, 1000);

    return () => clearInterval(interval);
  }, [title]);

  useEffect(() => {
    setTitle(null);
  }, [location]);

  return (
    <TitleContext.Provider value={value}>
      <Helmet>
        <title>{getTitle(title)}</title>
      </Helmet>
      {children}
    </TitleContext.Provider>
  );
}

export const useTitle = () => useContext(TitleContext);
