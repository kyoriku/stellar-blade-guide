import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * A Link component that prefetches lazy-loaded components on hover
 * 
 * @param {Object} props - Component props
 * @param {string} props.to - Target URL
 * @param {Function[]} props.prefetch - Array of import functions to prefetch
 * @param {React.ReactNode} props.children - Link content
 * @param {Object} props.rest - Additional props to pass to Link
 */
const PrefetchLink = ({ to, prefetch = [], children, ...rest }) => {
  const [hasPrefetched, setHasPrefetched] = useState(false);

  const handlePrefetch = () => {
    if (!hasPrefetched && prefetch.length > 0) {
      // Start loading all the provided imports
      prefetch.forEach(importFn => {
        importFn()
          .then(() => {
            console.log(`Prefetched component for ${to}`);
          })
          .catch(err => {
            console.error(`Error prefetching for ${to}:`, err);
          });
      });
      
      setHasPrefetched(true);
    }
  };

  return (
    <Link 
      to={to} 
      onMouseEnter={handlePrefetch} 
      onFocus={handlePrefetch}
      {...rest}
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;