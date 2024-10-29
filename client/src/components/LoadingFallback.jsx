import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const LoadingFallback = ({ isSlowLoading }) => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <LoadingSpinner />
        {isSlowLoading && (
          <p className="text-muted mt-3">
            This is taking longer than expected. Please hold on or try refreshing the page.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingFallback;
