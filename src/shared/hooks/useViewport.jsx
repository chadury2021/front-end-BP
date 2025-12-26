import { useState, useEffect } from 'react';

export const Viewport = Object.freeze({
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
});

const useViewport = () => {
  const getViewport = () => {
    const width = window.innerWidth;
    if (width < 768) return Viewport.MOBILE;
    if (width < 1440) return Viewport.TABLET;
    return Viewport.DESKTOP;
  };

  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewport());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewport === Viewport.MOBILE;
  const isTablet = viewport === Viewport.TABLET;
  const isDesktop = viewport === Viewport.DESKTOP;

  return { viewport, isMobile, isTablet, isDesktop };
};

export default useViewport;
