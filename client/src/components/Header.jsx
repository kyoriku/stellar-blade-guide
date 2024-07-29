import React from "react";

const Header = ({ id, title }) => (
  <>
    <hr id={id}></hr>
    <h3>{title}</h3>
    <hr className="w-75"></hr>
  </>
);

export default Header;
