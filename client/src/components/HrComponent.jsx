import React from "react";

const HrComponent = ({ index, isLoading, length }) => {
  if (isLoading) {
    return index < length - 1 ? <hr /> : null;
  }
  return index < length - 1 ? <hr /> : null;
};

export default HrComponent;

// import React from "react";
// import "../styles/Home.css";

// const HrComponent = ({ index, isLoading, length }) => {
//   if (isLoading) {
//     return index < length - 1 ? <hr className="my-4" /> : null;
//   }
//   return index < length - 1 ? <hr className="hr-margin"/> : null;
// };

// export default HrComponent;
