import React, { useEffect } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import useWindowSize from "../../hooks/useWindowSize";
import CollectiblesByType from "./Types/CollectiblesByType";

const Collectibles = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocLinks = [
    {},
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
          <CollectiblesByType />
          {/* <div className='text-end pb-5 pe-2'>
            <p className='m-0 fw-bold'>Next guide »</p>
            <h5>
              <Link to="/collectibles/xion" className='text-decoration-none'>Xion Collectibles</Link>
            </h5>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default Collectibles;
