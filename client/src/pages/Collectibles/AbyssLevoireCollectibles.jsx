import React, { useEffect } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import useWindowSize from "../../hooks/WindowSize";
import EmergencyExit from "./AbyssLevoire/EmergencyExit";
import ClosedLobby from "./AbyssLevoire/ClosedLobby";
import CapsuleClusterRoom from "./AbyssLevoire/CapsuleClusterRoom";
import UndergroundPassage from "./AbyssLevoire/UndergroundPassage";
import LaboratoryRuins from "./AbyssLevoire/LaboratoryRuins";

const AbyssLevoireCollectibles = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocLinks = [
    { mainLink: "/collectibles/eidos-7", title: "Eidos 7" },
    { mainLink: "/collectibles/xion", title: "Xion" },
    { mainLink: "/collectibles/wasteland", title: "Wasteland" },
    { mainLink: "/collectibles/altess-levoire", title: "Altess Levoire" },
    { mainLink: "/collectibles/matrix-11", title: "Matrix 11" },
    { mainLink: "/collectibles/great-desert", title: "Great Desert" },
    {
      mainLink: "/collectibles/abyss-levoire",
      title: "Abyss Levoire",
      subLinks: [
        { href: "#emergency-exit", title: "Emergency Exit" },
        { href: "#closed-lobby", title: "Closed Lobby" },
        { href: "#capsule-cluster-room", title: "Capsule Cluster Room" },
        { href: "#underground-passage", title: "Underground Passage" },
        { href: "#laboratory-ruins", title: "Laboratory Ruins" },
      ]
    },
    { mainLink: "/collectibles/eidos-9", title: "Eidos 9" },
    { mainLink: "/collectibles/spire-4", title: "Spire 4" },
  ];

  return (
    <div className="container bg-white">
      <div className="row">
        {!isMobile && (
          <div className="col-lg-3 border-start bg-white">
            <TableOfContents links={tocLinks} isMobile={isMobile} />
          </div>
        )}
        <div className={`col-lg-9 px-4 border-start border-end ${!isMobile ? '' : ''}`}>
          <h1 className="mt-3 mb-0">Abyss Levoire Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <EmergencyExit />
          <ClosedLobby />
          <CapsuleClusterRoom />
          <UndergroundPassage />
          <LaboratoryRuins />
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5><Link to="/collectibles/great-desert" className='text-decoration-none'>Great Desert Collectibles</Link></h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5><Link to="/collectibles/eidos-9" className='text-decoration-none'>Eidos 9 Collectibles</Link></h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AbyssLevoireCollectibles;
