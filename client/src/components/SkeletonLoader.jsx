import React from "react";
import { Skeleton } from "@mui/material";
import '../styles/SkeletonLoader.css';

const SkeletonLoader = ({ variant }) => {
  if (variant === 'large') {
    return (
      <div className="skeleton-container">
        <Skeleton
          animation="wave"
          height={443}
          width={796}
          variant="rounded"
          className="skeleton-item"
        />
      </div>
    );
  }

  // Default to two small loaders if variant is not 'large'
  return (
    <div className="skeleton-container">
      <Skeleton
        animation="wave"
        height={217}
        width={388}
        variant="rounded"
        className="skeleton-item"
      />
      <Skeleton
        animation="wave"
        height={217}
        width={388}
        variant="rounded"
        className="skeleton-item"
      />
    </div>
  );
};

export default SkeletonLoader;