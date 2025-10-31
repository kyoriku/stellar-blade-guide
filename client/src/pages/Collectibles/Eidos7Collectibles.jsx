import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents';
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";
import { getCollectiblesByLevelOrType } from "../../utils/API/collectibles";

import SilentStreet from "./Eidos7/SilentStreet";
import ParkingTower from "./Eidos7/ParkingTower";
import AbandonedStation from "./Eidos7/AbandonedStation";
import FloodedCommercialSector from "./Eidos7/FloodedCommercialSector";
import MemoryTower from "./Eidos7/MemoryTower";
import ConstructionZone from "./Eidos7/ConstructionZone";
import CityUnderground from "./Eidos7/CityUnderground";
import Crater from "./Eidos7/Crater";
import Eidos7Continued from "./Eidos7/Eidos7Continued";
// const SilentStreet = lazy(() => import('./Eidos7/SilentStreet'));
// const ParkingTower = lazy(() => import('./Eidos7/ParkingTower'));
// const AbandonedStation = lazy(() => import('./Eidos7/AbandonedStation'));
// const FloodedCommercialSector = lazy(() => import('./Eidos7/FloodedCommercialSector'));
// const MemoryTower = lazy(() => import('./Eidos7/MemoryTower'));
// const ConstructionZone = lazy(() => import('./Eidos7/ConstructionZone'));
// const CityUnderground = lazy(() => import('./Eidos7/CityUnderground'));
// const Crater = lazy(() => import('./Eidos7/Crater'));
// const Eidos7Continued = lazy(() => import('./Eidos7/Eidos7Continued'));
// const CommentSection = lazy(() => import('../../components/CommentSection'));

const Eidos7Collectibles = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;
  const [isSlowLoading, setIsSlowLoading] = useState(false);
    const [content, setContent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Set a timer to show a "still loading" message if it takes longer
    const timeout = setTimeout(() => {
      setIsSlowLoading(true);
    }, 1000); // 5 seconds to trigger slow loading feedback

    return () => clearTimeout(timeout);
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
        { href: "#eidos-7-continued", title: "Eidos 7 (Continued)" },
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
          {/* <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}> */}
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
            {/* <CommentSection pageId="eidos-7" /> */}
          {/* </Suspense> */}
        </div>
      </div>
    </div>
  );
}

export default Eidos7Collectibles;
