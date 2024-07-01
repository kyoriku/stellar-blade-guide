import React, { useEffect, useState } from 'react';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const headingsList = Array.from(document.querySelectorAll('h3'))
      .map(heading => ({
        id: heading.id || heading.innerText.replace(/\s+/g, '-').toLowerCase(),
        text: heading.innerText.split(' ').slice(0, -1).join(' '),
        level: parseInt(heading.tagName.replace('H', ''), 10)
      }));

    setHeadings(headingsList);

    headingsList.forEach(heading => {
      if (!heading.id) {
        heading.element.id = heading.id;
      }
    });
  }, []);

  const renderHeadings = (headings) => {
    return headings.map((heading, index) => (
      <li key={index} className={`nav-item level-${heading.level}`}>
        <a className="nav-link" href={`#${heading.id}`}>{heading.text}</a>
      </li>
    ));
  };

  return (
    <nav id="toc" className="sticky-top border-end">
      <h4>Contents</h4>
      <ul className="nav flex-column sidebar">
        {renderHeadings(headings)}
      </ul>
    </nav>
  );
};

export default Sidebar;
