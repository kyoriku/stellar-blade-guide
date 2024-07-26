import React from "react";

const ContentText = ({ title, text }) => (
  <p>
    <strong>{title}</strong>
    <span> &#8211; </span>
    {text}
  </p>
);

export default ContentText;
