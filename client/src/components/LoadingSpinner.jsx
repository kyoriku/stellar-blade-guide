import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div>
      {/* <hr></hr> */}
      <div className='background d-flex justify-content-center'>
        <div className='spinner'></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
