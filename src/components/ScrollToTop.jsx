import { useEffect } from 'react';

/**
 * ScrollToTop restores the window scroll position to the top whenever the
 * active tab changes. It receives `currentTab` as a prop and triggers a
 * scroll whenever the value updates.
 */
const ScrollToTop = ({ currentTab }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentTab]);

  return null;
};

export default ScrollToTop;
