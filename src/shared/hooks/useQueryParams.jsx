import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function getQueryObject(searchParams) {
  const params = new URLSearchParams(searchParams);
  return Object.fromEntries(params);
}

function useQueryParams() {
  const location = useLocation();
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState(getQueryObject(location.search));

  useEffect(() => {
    setQueryParams(getQueryObject(location.search));
  }, [location.search]);

  const setQueryParam = (keyOrParams, value) => {
    const params = new URLSearchParams(location.search);

    // Handle object of parameters
    if (typeof keyOrParams === 'object' && keyOrParams !== null) {
      Object.entries(keyOrParams).forEach(([key, val]) => {
        if (!val || val.length === 0) {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      });
    }
    // Handle single key-value pair
    else if (!value || value.length === 0) {
      params.delete(keyOrParams);
    } else {
      params.set(keyOrParams, value);
    }

    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  return [queryParams, setQueryParam];
}

export default useQueryParams;
