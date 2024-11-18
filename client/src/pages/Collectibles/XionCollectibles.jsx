import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents';
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";

const Xion = lazy(() => import("./Xion/Xion"));
const XionContinued = lazy(() => import("./Xion/XionContinued"));
const CommentSection = lazy(() => import('../../components/CommentSection'));

const XionCollectibles = () => {
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
    {
      mainLink: "/collectibles/xion",
      title: "Xion",
      subLinks: [
        { href: "#xion", title: "Xion" },
        { href: "#xion-continued", title: "Xion (Continued)" },
      ],
    },
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
          <h1 className="mt-3 mb-0">Xion Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            <Xion />
            <XionContinued />
            <div className='d-flex justify-content-between pb-5'>
              <div className='text-start ps-2'>
                <p className='m-0 fw-bold'>« Previous guide</p>
                <h5>
                  <Link to="/collectibles/eidos-7" className='text-decoration-none'>
                    Eidos 7 Collectibles
                  </Link>
                </h5>
              </div>
              <div className='text-end pe-2'>
                <p className='m-0 fw-bold'>Next guide »</p>
                <h5>
                  <Link to="/collectibles/wasteland" className='text-decoration-none'>
                    Wasteland Collectibles
                  </Link>
                </h5>
              </div>
            </div>
            <CommentSection pageId="xion" />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default XionCollectibles;
