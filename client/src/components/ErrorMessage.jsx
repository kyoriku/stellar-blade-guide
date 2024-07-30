import React from "react";

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return <p className="error-message text-danger">{message}</p>;
};

export default ErrorMessage;
