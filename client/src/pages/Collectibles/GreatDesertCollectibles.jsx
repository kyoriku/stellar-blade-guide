import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";

const SolarTower = lazy(() => import("./GreatDesert/SolarTower"));
const CollapsedOverpass = lazy(() => import("./GreatDesert/CollapsedOverpass"));
const BuriedRuins = lazy(() => import("./GreatDesert/BuriedRuins"));
const CentralGreatDesert = lazy(() => import("./GreatDesert/CentralGreatDesert"));
const NorthernGreatDesert = lazy(() => import("./GreatDesert/NorthernGreatDesert"));
const Oasis = lazy(() => import("./GreatDesert/Oasis"));

const GreatDesertCollectibles = () => {
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
    { mainLink: "/collectibles/matrix-11", title: "Matrix 11" },
    {
      mainLink: "/collectibles/great-desert",
      title: "Great Desert",
      subLinks: [
        { href: "#solar-tower", title: "Solar Tower" },
        { href: "#collapsed-overpass", title: "Collapsed Overpass" },
        { href: "#buried-ruins", title: "Buried Ruins" },
        { href: "#central-great-desert", title: "Central Great Desert" },
        { href: "#northern-great-desert", title: "Northern Great Desert" },
        { href: "#oasis", title: "Oasis" },
      ]
    },
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
          <h1 className="mt-3 mb-0">Great Desert Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            <SolarTower />
            <CollapsedOverpass />
            <BuriedRuins />
            <CentralGreatDesert />
            <NorthernGreatDesert />
            <Oasis />
          </Suspense>
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
