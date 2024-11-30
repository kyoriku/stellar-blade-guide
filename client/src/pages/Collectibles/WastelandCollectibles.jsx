import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";

const BarrenLands = lazy(() => import("./Wasteland/BarrenLands"));
const GreatCanyon = lazy(() => import("./Wasteland/GreatCanyon"));
const ScrapPlains = lazy(() => import("./Wasteland/ScrapPlains"));
const OilStorageFacility = lazy(() => import("./Wasteland/OilStorageFacility"));
const ScrapYard = lazy(() => import("./Wasteland/ScrapYard"));
const WastelandBasin = lazy(() => import("./Wasteland/WastelandBasin"));
const ScrapPlainsContinued = lazy(() => import("./Wasteland/ScrapPlainsContinued"));
const Plant = lazy(() => import("./Wasteland/Plant"));
const GreatCanyonContinued = lazy(() => import("./Wasteland/GreatCanyonContinued"));
const ForbiddenArea = lazy(() => import("./Wasteland/ForbiddenArea"));
const WastelandContinued = lazy(() => import("./Wasteland/WastelandContinued"));
const CommentSection = lazy(() => import('../../components/CommentSection'));

const WastelandCollectibles = () => {
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
    {
      mainLink: "/collectibles/wasteland",
      title: "Wasteland",
      subLinks: [
        { href: "#barren-lands", title: "Barren Lands" },
        { href: "#great-canyon", title: "Great Canyon" },
        { href: "#scrap-plains", title: "Scrap Plains" },
        { href: "#oil-storage-facility", title: "Oil Storage Facility" },
        { href: "#scrap-yard", title: "Scrap Yard" },
        { href: "#wasteland-basin", title: "Wasteland Basin" },
        { href: "#scrap-plains-continued", title: "Scrap Plains (Continued)" },
        { href: "#plant", title: "Plant" },
        { href: "#great-canyon-continued", title: "Great Canyon (Continued)" },
        { href: "#forbidden-area", title: "Forbidden Area" },
        { href: "#wasteland-continued", title: "Wasteland (Continued)" },
      ]
    },
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
          <h1 className="mt-3 mb-0">Wasteland Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            <BarrenLands />
            <GreatCanyon />
            <ScrapPlains />
            <OilStorageFacility />
            <ScrapYard />
            <WastelandBasin />
            <ScrapPlainsContinued />
            <Plant />
            <GreatCanyonContinued />
            <ForbiddenArea />
            <WastelandContinued />
            <div className='d-flex justify-content-between pb-5'>
              <div className='text-start ps-2'>
                <p className='m-0 fw-bold'>« Previous guide</p>
                <h5><Link to="/collectibles/xion" className='text-decoration-none'>Xion Collectibles</Link></h5>
              </div>
              <div className='text-end pe-2'>
                <p className='m-0 fw-bold'>Next guide »</p>
                <h5><Link to="/collectibles/altess-levoire" className='text-decoration-none'>Altess Levoire Collectibles</Link></h5>
              </div>
            </div>
            <CommentSection pageId="wasteland" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default WastelandCollectibles;
