import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures that every page starts at the very top (scroll 0,0)
 * whenever navigation occurs in the React Router SPA.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Reset window scroll position immediately
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    // Also reset body and document element
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // Also check if any main scrollable container exists
    const mainContainers = document.querySelectorAll('main, .scroll-container, #root');
    mainContainers.forEach((el) => {
      if (el && 'scrollTop' in el) {
        (el as HTMLElement).scrollTop = 0;
      }
    });
  }, [pathname, search]);

  return null;
}
