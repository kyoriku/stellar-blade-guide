import React, { useEffect } from "react";
import { Link } from 'react-router-dom';

import useWindowSize from "../../hooks/WindowSize";

// import Xion from "./Xion/Xion";
// import XionContinued from "./Xion/XionContinued";

import {
  Xion,
  XionContinued
} from "./CollectiblesPages";

import '../../styles/Media.css';
import '../../styles/Sidebar.css';

const XionCollectibles = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;

  useEffect(() => {
    window.scrollTo(0, 0);
  }
    , []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
    });
  };

  const TOC = (
    <nav id="toc" className={`sticky-top ${!isMobile ? '' : ''}`}>
      <h4>Contents</h4>
      <ul className="nav flex-column sidebar">
        <li className="nav-item"><Link to="/collectibles/eidos-7">Eidos 7</Link></li>
        <li className="nav-item"><Link to="/collectibles/xion" onClick={scrollToTop}>Xion</Link>
          <ul>
            <li className="nav-item"><a className="nav-link" href="#xion">Xion Collectibles</a></li>
            <li className="nav-item"><a className="nav-link" href="#xion-continued">Xion Collectibles (Continued)</a></li>
          </ul>
        </li>
        <li className="nav-item"><Link to="/collectibles/wasteland">Wasteland</Link></li>
        <li className="nav-item"><Link to="/collectibles/altess-levoire" >Altess Levoire</Link></li>
        <li className="nav-item"><Link to="/collectibles/matrix-11">Matrix 11</Link></li>
        <li className="nav-item"><Link to="/collectibles/great-desert">Great Desert</Link></li>
        <li className="nav-item"><Link to="/collectibles/abyss-levoire">Abyss Levoire</Link></li>
        <li className="nav-item"><Link to="/collectibles/eidos-9">Eidos 9</Link></li>
        <li className="nav-item"><Link to="/collectibles/spire-4">Spire 4</Link></li>
      </ul>
    </nav>
  );

  return (
    <div className="container bg-white">
      <div className="row">
        {!isMobile && (
          <div className="col-lg-3 border-start bg-white">
            {TOC}
          </div>
        )}
        <div className={`col-lg-9 px-4 border-start border-end ${!isMobile ? '' : ''}`}>
          <h1 className="mt-3 mb-0">Stellar Blade - Xion Collectibles</h1>
          {isMobile && TOC}
          <Xion />
          <XionContinued />
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5>
                <Link to="/collectibles/eidos-7" className='text-decoration-none'>Eidos 7 Collectibles</Link>
              </h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5>
                <Link to="/collectibles/wasteland" className='text-decoration-none'>Wasteland Collectibles</Link>
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default XionCollectibles;
