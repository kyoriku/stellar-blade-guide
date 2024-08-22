import React, { useEffect } from "react";
import { Link } from 'react-router-dom';
import useWindowSize from "../../hooks/WindowSize";
import OrcaSpaceComplex from "./Spire4/OrcaSpaceComplex";
import Hypertube from "./Spire4/Hypertube";
import SpaceLogisticsComplex from "./Spire4/SpaceLogisticsComplex";
// import RaphaelSpaceCentre from "./Spire4/RaphaelSpaceCentre";
// import CargoLift121 from "./Spire4/CargoLift121";
// import MaintenanceSector from "./Spire4/MaintenanceSector";
// import TowerOuterWall from "./Spire4/TowerOuterWall";
// import PassengerLift161 from "./Spire4/PassengerLift161";
// import PrestigeLounge from "./Spire4/PrestigeLounge";
// import VermillionGarden from "./Spire4/VermillionGarden";
// import HighOrbitStation from "./Spire4/HighOrbitStation";
// import Nest from "./Spire4/Nest";
import '../../styles/Media.css';
import '../../styles/Sidebar.css';
import '../../styles/Collectibles.css';

const Spire4Collectibles = () => {
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
        <li className="nav-item"><Link to="/collectibles/great-desert">Great Desert</Link></li>
        <li className="nav-item"><Link to="/collectibles/abyss-levoire">Abyss Levoire</Link></li>
        <li className="nav-item"><Link to="/collectibles/eidos-9">Eidos 9</Link></li>
        <li className="nav-item"><Link to="/collectibles/spire-4" onClick={scrollToTop}>Spire 4</Link>
          <ul>
            <li className="nav-item"><a className="nav-link" href="#orca-space-complex">Orca Space Complex</a></li>
            <li className="nav-item"><a className="nav-link" href="#hypertube">Hypertube</a></li>
            <li className="nav-item"><a className="nav-link" href="#space-logistics-complex">Space Logistics Complex</a></li>
            <li className="nav-item"><a className="nav-link" href="#raphael-space-centre">Raphael Space Centre</a></li>
            <li className="nav-item"><a className="nav-link" href="#cargo-lift-121">Cargo Lift 121</a></li>
            <li className="nav-item"><a className="nav-link" href="#maintenance-sector">Maintenance Sector</a></li>
            <li className="nav-item"><a className="nav-link" href="#tower-outer-wall">Tower Outer Wall</a></li>
            <li className="nav-item"><a className="nav-link" href="#passenger-lift-161">Passenger Lift 161</a></li>
            <li className="nav-item"><a className="nav-link" href="#prestige-lounge">Prestige Lounge</a></li>
            <li className="nav-item"><a className="nav-link" href="#vermillion-garden">Vermillion Garden</a></li>
            <li className="nav-item"><a className="nav-link" href="#high-orbit-station">High Orbit Station</a></li>
            <li className="nav-item"><a className="nav-link" href="#nest">Nest</a></li>
          </ul>
        </li>
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
          <h1 className="mt-3 mb-0">Spire 4 Collectibles</h1>
          {isMobile && TOC}
          <OrcaSpaceComplex />
          <Hypertube />
          <SpaceLogisticsComplex />
          {/* <RaphaelSpaceCentre /> */}
          {/* <CargoLift121 /> */}
          {/* <MaintenanceSector /> */}
          {/* <TowerOuterWall /> */}
          {/* <PassengerLift161 /> */}
          {/* <PrestigeLounge /> */}
          {/* <VermillionGarden /> */}
          {/* <HighOrbitStation /> */}
          {/* <Nest /> */}
          <div className='text-start ps-2'>
            <p className='m-0 fw-bold'>« Previous guide</p>
            <h5><Link to="/collectibles/eidos-9" className='text-decoration-none'>Eidos 9 Collectibles</Link></h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Spire4Collectibles;