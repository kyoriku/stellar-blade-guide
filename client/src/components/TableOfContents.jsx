import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/TableOfContents.css';

const TableOfContents = ({ links, isMobile }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0 });
  };

  return (
    <nav id="toc" className={`sticky-top ${!isMobile ? '' : ''}`}>
      <h4>Contents</h4>
      <ul className="nav flex-column sidebar">
        {links.map((linkGroup, index) => (
          <li className="nav-item" key={index}>
            <Link to={linkGroup.mainLink} onClick={scrollToTop}>{linkGroup.title}</Link>
            {linkGroup.subLinks && (
              <ul>
                {linkGroup.subLinks.map((subLink, subIndex) => (
                  <li className="nav-item" key={subIndex}>
                    <a className="nav-link" href={subLink.href}>{subLink.title}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
