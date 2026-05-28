import { useEffect, useRef } from 'react';

export function useSafeAnimationFrame(callback) {
  const rafRef = useRef(null);
  const cbRef = useRef(callback);
  
  useEffect(() => { 
    cbRef.current = callback; 
  }, [callback]);
  
  useEffect(() => {
    const loop = () => {
      cbRef.current();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}
