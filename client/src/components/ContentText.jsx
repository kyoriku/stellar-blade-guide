import React from "react";

const ContentText = ({ title, text }) => {
  if (Array.isArray(text)) {
    return (
      <div>
        <strong>{title}</strong>
        <ul>
          {text.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  } else {
    return (
      <p>
        <strong>{title}</strong>
        <span> &#8211; </span>
        {text}
      </p>
    );
  }
};

export default ContentText;
