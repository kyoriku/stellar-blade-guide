import React from "react";

const HrComponent = ({ index, isLoading, length }) => {
  if (isLoading) {
    return index < length - 1 ? <hr /> : null;
  }
  return index < length - 1 ? <hr /> : null;
};

export default HrComponent;
