import React, { useEffect } from "react";
import { Link } from 'react-router-dom';

import useWindowSize from "../../hooks/WindowSize";

import ResearchLabEntrance from "./AltessLevoire/ResearchLabEntrance";
import PurificationScanner from "./AltessLevoire/PurificationScanner";
import SecurityCenter from "./AltessLevoire/SecurityCenter";
import SectorA07 from "./AltessLevoire/SectorA07";
import SpecimenPreservationLab from "./AltessLevoire/SpecimenPreservationLab";
import TopSecretResearchComplex from "./AltessLevoire/TopSecretResearchComplex";
import DetoriatedLobby from "./AltessLevoire/DeterioratedLobby";
import AirVent from "./AltessLevoire/AirVent";

import '../../styles/Media.css';
import '../../styles/Sidebar.css';

const AltessLevoireCollectibles = () => {
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
        <li className="nav-item"><Link to="/collectibles/altess-levoire" onClick={scrollToTop}>Altess Levoire</Link>
          <ul>
            <li className="nav-item"><a className="nav-link" href="#research-lab-entrance">Research Lab Entrance</a></li>
            <li className="nav-item"><a className="nav-link" href="#purification-scanner">Purification Scanner</a></li>
            <li className="nav-item"><a className="nav-link" href="#security-center">Security Center</a></li>
            <li className="nav-item"><a className="nav-link" href="#sector-a07">Sector A07</a></li>
            <li className="nav-item"><a className="nav-link" href="#specimen-preservation-lab">Specimen Preservation Lab</a></li>
            <li className="nav-item"><a className="nav-link" href="#top-secret-research-complex">Top Secret Research Complex</a></li>
            <li className="nav-item"><a className="nav-link" href="#deteriorated-lobby">Deteriorated Lobby</a></li>
            <li className="nav-item"><a className="nav-link" href="#air-vent">Air Vent</a></li>
          </ul>
        </li>
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
          <h1 className="mt-3 mb-0">Altess Levoire Collectibles</h1>
          {isMobile && TOC}
          <ResearchLabEntrance />
          <PurificationScanner />
          <SecurityCenter />
          <SectorA07 />
          <SpecimenPreservationLab />
          <TopSecretResearchComplex />
          <DetoriatedLobby />
          <AirVent />
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5><Link to="/collectibles/wasteland" className='text-decoration-none'>Wasteland Collectibles</Link></h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5><Link to="/collectibles/matrix-11" className='text-decoration-none'>Matrix 11 Collectibles</Link></h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AltessLevoireCollectibles;
