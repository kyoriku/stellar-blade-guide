import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";

const ClosedOffPlatform = lazy(() => import("./Matrix11/ClosedOffPlatform"));
const Landfill = lazy(() => import("./Matrix11/Landfill"));
const CollapsedRailBridge = lazy(() => import("./Matrix11/CollapsedRailBridge"));
const UndergroundSewer = lazy(() => import("./Matrix11/UndergroundSewer"));
const RottenLabyrinth = lazy(() => import("./Matrix11/RottenLabyrinth"));
const TemporaryArmoury = lazy(() => import("./Matrix11/TemporaryArmoury"));
const TrainGraveyard = lazy(() => import("./Matrix11/TrainGraveyard"));

const Matrix11Collectibles = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;
  const [isSlowLoading, setIsSlowLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const timeout = setTimeout(() => {
      setIsSlowLoading(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const tocLinks = [
    { mainLink: "/collectibles/eidos-7", title: "Eidos 7" },
    { mainLink: "/collectibles/xion", title: "Xion" },
    { mainLink: "/collectibles/wasteland", title: "Wasteland" },
    { mainLink: "/collectibles/altess-levoire", title: "Altess Levoire" },
    {
      mainLink: "/collectibles/matrix-11",
      title: "Matrix 11",
      subLinks: [
        { href: "#closed-off-platform", title: "Closed Off Platform" },
        { href: "#landfill", title: "Landfill" },
        { href: "#collapsed-rail-bridge", title: "Collapsed Rail Bridge" },
        { href: "#underground-sewer", title: "Underground Sewer" },
        { href: "#rotten-labyrinth", title: "Rotten Labyrinth" },
        { href: "#temporary-armoury", title: "Temporary Armoury" },
        { href: "#train-graveyard", title: "Train Graveyard" },
      ]
    },
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
          <h1 className="mt-3 mb-0">Matrix 11 Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            <ClosedOffPlatform />
            <Landfill />
            <CollapsedRailBridge />
            <UndergroundSewer />
            <RottenLabyrinth />
            <TemporaryArmoury />
            <TrainGraveyard />
          </Suspense>
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
