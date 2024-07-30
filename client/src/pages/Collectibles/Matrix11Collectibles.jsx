import React, { useEffect } from "react";
import { Link } from 'react-router-dom';

import useWindowSize from "../../hooks/WindowSize";

import ClosedOffPlatform from "./Matrix11/ClosedOffPlatform";
import Landfill from "./Matrix11/Landfill";
// import CollapsedRailBridge from "./Matrix11/CollapsedRailBridge";
// import UndergroundSewer from "./Matrix11/UndergroundSewer";
// import RottenLabyrinth from "./Matrix11/RottenLabyrinth";
// import TemporaryArmoury from "./Matrix11/TemporaryArmoury";
// import TrainGraveyard from "./Matrix11/TrainGraveyard";

import '../../styles/Media.css';
import '../../styles/Sidebar.css';
import '../../styles/Collectibles.css';

const Matrix11Collectibles = () => {
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
        <li className="nav-item"><Link to="/collectibles/matrix-11" onClick={scrollToTop}>Matrix 11</Link>
          <ul>
            <li className="nav-item"><a className="nav-link" href="#closed-off-platform">Closed Off Platform</a></li>
            <li className="nav-item"><a className="nav-link" href="#landfill">Landfill</a></li>
            <li className="nav-item"><a className="nav-link" href="#collapsed-rail-bridge">Collapsed Rail Bridge</a></li>
            <li className="nav-item"><a className="nav-link" href="#underground-sewer">Underground Sewer</a></li>
            <li className="nav-item"><a className="nav-link" href="#rotten-labyrinth">Rotten Labyrinth</a></li>
            <li className="nav-item"><a className="nav-link" href="#temporary-armoury">Temporary Armoury</a></li>
            <li className="nav-item"><a className="nav-link" href="#train-graveyard">Train Graveyard</a></li>
          </ul>
        </li>
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
          <h1 className="mt-3 mb-0">Stellar Blade - Matrix 11 Collectibles</h1>
          {isMobile && TOC}
          <ClosedOffPlatform />
          <Landfill />
          {/* <CollapsedRailBridge /> */}
          {/* <UndergroundSewer /> */}
          {/* <RottenLabyrinth /> */}
          {/* <TemporaryArmoury /> */}
          {/* <TrainGraveyard /> */}
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5><Link to="/collectibles/altess-levoire" className='text-decoration-none'>Altess Levoire Collectibles</Link></h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5><Link to="/collectibles/great-desert" className='text-decoration-none'>Great Desert Collectibles</Link></h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Matrix11Collectibles;
