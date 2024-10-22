import React from "react";

const Header = ({ id, title, subtitle, icon }) => (
  <>
    <hr id={id}></hr>
    <div className="d-flex align-items-center">
      {icon}
      <h3 className="mb-0 ms-2">{title}</h3>
    </div>
    {subtitle && <p><i>{subtitle}</i></p>}
    <hr className="w-75"></hr>
  </>
);

export default Header;
