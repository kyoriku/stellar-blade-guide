import React from "react";
import { Skeleton } from "@mui/material";

const SkeletonLoader = () => (
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

export default SkeletonLoader;
