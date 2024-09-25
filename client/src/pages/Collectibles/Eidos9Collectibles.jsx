import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";

const FallenOverpass = lazy(() => import('./Eidos9/FallenOverpass'));
const SubmergedCity = lazy(() => import('./Eidos9/SubmergedCity'));
const Atelier = lazy(() => import('./Eidos9/Atelier'));

const Eidos9Collectibles = () => {
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
    { mainLink: "/collectibles/great-desert", title: "Great Desert" },
    { mainLink: "/collectibles/abyss-levoire", title: "Abyss Levoire" },
    {
      mainLink: "/collectibles/eidos-9",
      title: "Eidos 9",
      subLinks: [
        { href: "#fallen-overpass", title: "Fallen Overpass" },
        { href: "#submerged-city", title: "Submerged City" },
        { href: "#atelier", title: "Atelier" },
      ]
    },
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
          <h1 className="mt-3 mb-0">Eidos 9 Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            <FallenOverpass />
            <SubmergedCity />
            <Atelier />
          </Suspense>
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5><Link to="/collectibles/abyss-levoire" className='text-decoration-none'>Abyss Levoire Collectibles</Link></h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5><Link to="/collectibles/spire-4" className='text-decoration-none'>Spire 4 Collectibles</Link></h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Eidos9Collectibles;
