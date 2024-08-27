import React, { useEffect } from "react";
import { Link } from 'react-router-dom';

import useWindowSize from "../../hooks/WindowSize";

import SilentStreet from './Eidos7/SilentStreet';
import ParkingTower from './Eidos7/ParkingTower';
import AbandonedStation from './Eidos7/AbandonedStation';
import FloodedCommercialSector from './Eidos7/FloodedCommercialSector';
import MemoryTower from './Eidos7/MemoryTower';
import ConstructionZone from './Eidos7/ConstructionZone';
import CityUnderground from './Eidos7/CityUnderground';
import Crater from './Eidos7/Crater';
import Eidos7Continued from './Eidos7/Eidos7Continued';

import '../../styles/Media.css';
import '../../styles/Sidebar.css';
import '../../styles/Collectibles.css';

const Eidos7Collectibles = () => {
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
        <li className="nav-item"><Link to="/collectibles/eidos-7" onClick={scrollToTop}>Eidos 7</Link>
          <ul>
            <li className="nav-item"><a className="nav-link" href="#silent-street">Silent Street</a></li>
            <li className="nav-item"><a className="nav-link" href="#parking-tower">Parking Tower</a></li>
            <li className="nav-item"><a className="nav-link" href="#abandoned-station">Abandoned Station</a></li>
            <li className="nav-item"><a className="nav-link" href="#flooded-commercial-sector">Flooded Commercial Sector</a></li>
            <li className="nav-item"><a className="nav-link" href="#memory-tower">Memory Tower</a></li>
            <li className="nav-item"><a className="nav-link" href="#construction-zone">Construction Zone</a></li>
            <li className="nav-item"><a className="nav-link" href="#city-underground">City Underground</a></li>
            <li className="nav-item"><a className="nav-link" href="#crater">Crater</a></li>
            <li className="nav-item"><a className="nav-link" href="#eidos-7-continued">Eidos 7 (Continued)</a></li>
          </ul>
        </li>
        <li className="nav-item"><Link to="/collectibles/xion">Xion</Link></li>
        <li className="nav-item"><Link to="/collectibles/wasteland">Wasteland</Link></li>
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
          <h1 className="mt-3 mb-0">Eidos 7 Collectibles</h1>
          {isMobile && TOC}
          <SilentStreet />
          <ParkingTower />
          <AbandonedStation />
          <FloodedCommercialSector />
          <MemoryTower />
          <ConstructionZone />
          <CityUnderground />
          <Crater />
          <Eidos7Continued />
          <div className='text-end pb-5 pe-2'>
            <p className='m-0 fw-bold'>Next guide »</p>
            <h5>
              <Link to="/collectibles/xion" className='text-decoration-none'>Xion Collectibles</Link>
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Eidos7Collectibles;
