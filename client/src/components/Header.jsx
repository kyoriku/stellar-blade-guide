import React from "react";

const Header = ({ id, title, subtitle }) => (
  <>
    <hr id={id}></hr>
    <h3>{title}</h3>
    {subtitle && <p><i>{subtitle}</i></p>}
    <hr className="w-75"></hr>
  </>
);

export default Header;
