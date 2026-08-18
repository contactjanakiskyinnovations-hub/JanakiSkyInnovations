import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const scrollPositions = useRef({});

  // Enable manual scroll restoration so browser doesn't conflict
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Track scroll position for current route key
  useEffect(() => {
    const routeKey = location.key || (location.pathname + location.search);

    const handleScroll = () => {
      scrollPositions.current[routeKey] = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key, location.pathname, location.search]);

  // Restore scroll position on POP (back/forward), scroll to top on PUSH/REPLACE
  useEffect(() => {
    const routeKey = location.key || (location.pathname + location.search);

    if (navType === 'POP') {
      const savedPosition = scrollPositions.current[routeKey] ?? 0;
      // Delay slightly to allow DOM/images to lay out
      const timer = setTimeout(() => {
        window.scrollTo({ top: savedPosition, behavior: 'instant' });
      }, 50);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.key, location.pathname, location.search, navType]);

  return null;
};

export default ScrollToTop;

