import React, { useEffect } from "react";
import { Link } from 'react-router-dom';

import useWindowSize from "../../hooks/WindowSize";

import SolarTower from "./GreatDesert/SolarTower";

import '../../styles/Media.css';
import '../../styles/Sidebar.css';
import '../../styles/Collectibles.css';

const GreatDesertCollectibles = () => {
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
        <li className="nav-item"><Link to="/collectibles/wasteland">Wasteland</Link></li>
        <li className="nav-item"><Link to="/collectibles/altess-levoire">Altess Levoire</Link></li>
        <li className="nav-item"><Link to="/collectibles/matrix-11">Matrix 11</Link></li>
        <li className="nav-item"><Link to="/collectibles/great-desert" onClick={scrollToTop}>Great Desert</Link>
          <ul>
            <li className="nav-item"><a className="nav-link" href="#solar-tower">Solar Tower</a></li>
            <li className="nav-item"><a className="nav-link" href="#collapsed-overpass">Collapsed Overpass</a></li>
            <li className="nav-item"><a className="nav-link" href="#buried-ruins">Buried Ruins</a></li>
            <li className="nav-item"><a className="nav-link" href="#central-great-desert">Central Great Desert</a></li>
            <li className="nav-item"><a className="nav-link" href="#northern-great-desert">Northern Great Desert</a></li>
            <li className="nav-item"><a className="nav-link" href="#oasis">Oasis</a></li>
          </ul>
        </li>
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
          <h1 className="mt-3 mb-0">Stellar Blade - Great Desert Collectibles</h1>
          {isMobile && TOC}
          <SolarTower />
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5><Link to="/collectibles/matrix-11" className='text-decoration-none'>Matrix 11 Collectibles</Link></h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5><Link to="/collectibles/abyss-levoire" className='text-decoration-none'>Abyss Levoire Collectibles</Link></h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GreatDesertCollectibles;