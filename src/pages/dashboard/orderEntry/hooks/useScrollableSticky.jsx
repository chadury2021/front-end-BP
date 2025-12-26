import { IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import React, { useState, useRef, useEffect } from 'react';

export const useScrollableSticky = (dataLoaded, sizeChange, cardRef, scrollableRef, stickyRef) => {
  const [showScrollIcon, setShowScrollIcon] = useState(false);
  const [maxHeight, setMaxHeight] = useState('auto');

  // Function to calculate the max height of the scrollable area
  const calculateMaxHeight = () => {
    if (!cardRef.current || !stickyRef.current) return;
    const cardHeight = cardRef.current.clientHeight;
    const stickyHeight = stickyRef.current.clientHeight;
    const newMaxHeight = cardHeight - stickyHeight;
    setMaxHeight(newMaxHeight);
    // eslint-disable-next-line consistent-return
    return newMaxHeight;
  };

  const updateScrollIconVisibility = (newMaxHeight) => {
    requestAnimationFrame(() => {
      if (!scrollableRef.current) return;
      const { scrollHeight, clientHeight } = scrollableRef.current;
      setShowScrollIcon(scrollHeight > newMaxHeight);
    });
  };

  // Check if the user has scrolled "close enough" to the bottom
  const checkScroll = () => {
    if (!scrollableRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
    setShowScrollIcon(scrollTop + clientHeight < scrollHeight - 5);
  };

  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        const newMaxHeight = calculateMaxHeight();
        updateScrollIconVisibility(newMaxHeight);
      }, 100); // Delay to wait for the component to fully render
    };

    handleResize(); // Initial call to set up dimensions and visibility

    if (!cardRef.current || !scrollableRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(cardRef.current);

    window.addEventListener('resize', handleResize);
    scrollableRef.current.addEventListener('scroll', checkScroll);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (scrollableRef.current) {
        scrollableRef.current.removeEventListener('scroll', checkScroll);
      }
    };
  }, [dataLoaded, sizeChange, scrollableRef]);

  const scrollIconButton = () => {
    return (
      showScrollIcon &&
      sizeChange && (
        <IconButton
          sx={{
            position: 'absolute',
            bottom: `${280}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'action.active',
            zIndex: 99,
          }}
          onClick={() => {
            scrollableRef.current.scrollBy({ top: 200, behavior: 'smooth' });
          }}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: '2rem' }} />
        </IconButton>
      )
    );
  };

  return { showScrollIcon, maxHeight, scrollIconButton, checkScroll };
};
