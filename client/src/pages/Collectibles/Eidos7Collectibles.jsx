import React, { useEffect } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
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
import '../../styles/Collectibles.css';

const Eidos7Collectibles = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocLinks = [
    {
      mainLink: "/collectibles/eidos-7",
      title: "Eidos 7",
      subLinks: [
        { href: "#silent-street", title: "Silent Street" },
        { href: "#parking-tower", title: "Parking Tower" },
        { href: "#abandoned-station", title: "Abandoned Station" },
        { href: "#flooded-commercial-sector", title: "Flooded Commercial Sector" },
        { href: "#memory-tower", title: "Memory Tower" },
        { href: "#construction-zone", title: "Construction Zone" },
        { href: "#city-underground", title: "City Underground" },
        { href: "#crater", title: "Crater" },
        { href: "#eidos-7-continued", title: "Eidos 7 Continued" },
      ]
    },
    { mainLink: "/collectibles/xion", title: "Xion" },
    { mainLink: "/collectibles/wasteland", title: "Wasteland" },
    { mainLink: "/collectibles/altess-levoire", title: "Altess Levoire" },
    { mainLink: "/collectibles/matrix-11", title: "Matrix 11" },
    { mainLink: "/collectibles/great-desert", title: "Great Desert" },
    { mainLink: "/collectibles/abyss-levoire", title: "Abyss Levoire" },
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
          <h1 className="mt-3 mb-0">Eidos 7 Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
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
