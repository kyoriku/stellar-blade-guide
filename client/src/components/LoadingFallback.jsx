import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const LoadingFallback = ({ isSlowLoading }) => {
  return (
    <div className="text-center my-5">
      <LoadingSpinner />
      {isSlowLoading && (
        <p className="text-muted mt-3">
          This is taking longer than expected. Please hold on or try refreshing the page.
        </p>
      )}
    </div>
  );
};

export default LoadingFallback;
