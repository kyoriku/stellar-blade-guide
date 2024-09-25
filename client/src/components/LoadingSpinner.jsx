import React from "react";
import "../styles/LoadingSpinner.css";

const LoadingSpinner = () => {
  return (
    <div className="spinner">
      <div className="lds-dual-ring"></div>
    </div>
  );
};

export default LoadingSpinner;
