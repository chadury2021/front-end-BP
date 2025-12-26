/* eslint-disable no-await-in-loop */
import { useEffect } from 'react';

// make sure the loadData function always returns a boolean
// to determine whether to continue polling or not
const usePolling = (loadData, interval = 2000, ...deps) => {
  useEffect(() => {
    let isMounted = true;
    let success = true;

    const pollData = async () => {
      while (isMounted && success) {
        success = await loadData();
        await new Promise((resolve) => {
          setTimeout(resolve, interval);
        }); // Wait for the specified interval
      }
    };

    pollData();

    return () => {
      isMounted = false; // Stop polling when the component unmounts or shouldPoll changes
    };
  }, deps);
};

export default usePolling;
