import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If no hash, immediately scroll to the very top of the window
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
      return;
    }

    // If there is a hash (e.g. #showtimes or #now-showing), scroll with navbar offset
    const targetId = hash.slice(1);

    const scrollToElement = () => {
      const element = document.getElementById(targetId);
      if (element) {
        const navOffset = 85; // sticky navbar height
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = Math.max(0, elementPosition - navOffset);
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        return true;
      }
      return false;
    };

    // Try immediately
    if (!scrollToElement()) {
      // Retry after async data load / DOM update
      const timer = setTimeout(scrollToElement, 200);
      const secondTimer = setTimeout(scrollToElement, 500);
      return () => {
        clearTimeout(timer);
        clearTimeout(secondTimer);
      };
    }
  }, [pathname, hash]);

  return null;
};
