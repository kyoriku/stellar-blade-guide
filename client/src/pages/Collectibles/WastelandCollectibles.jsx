import React, { useEffect } from "react";
import { Link } from 'react-router-dom';

import useWindowSize from "../../hooks/WindowSize";

import BarrenLands from "./Wasteland/BarrenLands";
import GreatCanyon from "./Wasteland/GreatCanyon";
import ScrapPlains from "./Wasteland/ScrapPlains";
import OilStorageFacility from "./Wasteland/OilStorageFacility";
import ScrapYard from "./Wasteland/ScrapYard";
import WastelandBasin from "./Wasteland/WastelandBasin";
import ScrapPlainsContinued from "./Wasteland/ScrapPlainsContinued";
import Plant from "./Wasteland/Plant";
import GreatCanyonContinued from "./Wasteland/GreatCanyonContinued";
import ForbiddenArea from "./Wasteland/ForbiddenArea";
import WastelandContinued from "./Wasteland/WastelandContinued";

import '../../styles/Media.css';
import '../../styles/Sidebar.css';

const WastelandCollectibles = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        <li className="nav-item"><Link to="/collectibles/xion">Xion</Link></li>
        <li className="nav-item"><Link to="/collectibles/wasteland" onClick={scrollToTop}>Wasteland</Link>
          <ul>
            <li className="nav-item"><a className="nav-link" href="#barren-lands">Barren Lands</a></li>
            <li className="nav-item"><a className="nav-link" href="#great-canyon">Great Canyon</a></li>
            <li className="nav-item"><a className="nav-link" href="#scrap-plains">Scrap Plains</a></li>
            <li className="nav-item"><a className="nav-link" href="#oil-storage-facility">Oil Storage Facility</a></li>
            <li className="nav-item"><a className="nav-link" href="#scrap-yard">Scrap Yard</a></li>
            <li className="nav-item"><a className="nav-link" href="#wasteland-basin">Wasteland Basin</a></li>
            <li className="nav-item"><a className="nav-link" href="#scrap-plains-continued">Scrap Plains (Continued)</a></li>
            <li className="nav-item"><a className="nav-link" href="#plant">Plant</a></li>
            <li className="nav-item"><a className="nav-link" href="#great-canyon-continued">Great Canyon (Continued)</a></li>
            <li className="nav-item"><a className="nav-link" href="#forbidden-area">Forbidden Area</a></li>
            <li className="nav-item"><a className="nav-link" href="#wasteland-continued">Wasteland (Continued)</a></li>
          </ul>
        </li>
        <li className="nav-item"><Link to="/collectibles/altess-levoire">Altess Levoire</Link></li>
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
          <h1 className="mt-3 mb-0">Stellar Blade - Wasteland Collectibles</h1>
          {isMobile && TOC}
          <BarrenLands />
          <GreatCanyon />
          <ScrapPlains />
          <OilStorageFacility />
          <ScrapYard />
          <WastelandBasin />
          <ScrapPlainsContinued />
          <Plant />
          <GreatCanyonContinued />
          <ForbiddenArea />
          <WastelandContinued />
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5><Link to="/collectibles/xion" className='text-decoration-none'>Xion Collectibles</Link></h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5><Link to="/collectibles/altess-levoire" className='text-decoration-none'>Altess Levoire Collectibles</Link></h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WastelandCollectibles;