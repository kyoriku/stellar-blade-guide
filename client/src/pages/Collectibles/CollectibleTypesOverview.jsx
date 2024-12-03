import React, { useEffect } from "react";
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import TableOfContents from '../../components/TableOfContents'
import useWindowSize from "../../hooks/useWindowSize";
import CollectiblesByType from "./Types/CollectiblesByType";
import BetaCores from "./Types/BetaCores";
import BodyCores from "./Types/BodyCores";
import Camps from "./Types/Camps";
import Cans from "./Types/Cans";
import Documents from "./Types/Documents";
import DroneAppearance from "./Types/DroneAppearances";
import CommentSection from "../../components/CommentSection";

const CollectibleTypes = () => {
  const size = useWindowSize();
  const isMobile = size.width <= 768;
  const { type } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const tocLinks = [
    { mainLink: "/collectibles/beta-cores", title: "Beta Cores" },
    { mainLink: "/collectibles/body-cores", title: "Body Cores" },
    { mainLink: "/collectibles/camps", title: "Camps" },
    { mainLink: "/collectibles/cans", title: "Cans" },
    { mainLink: "/collectibles/documents", title: "Documents" },
    { mainLink: "/collectibles/drone-appearances", title: "Drone Appearances" },
    { mainLink: "/collectibles/earrings", title: "Earrings" },
    { mainLink: "/collectibles/exospines", title: "Exospines" },
    { mainLink: "/collectibles/nano-suits", title: "Nano Suits" },
    { mainLink: "/collectibles/memorysticks", title: "Memorysticks" },
    { mainLink: "/collectibles/passcodes", title: "Passcodes" }
  ];

  const renderContent = () => {
    switch (type) {
      case 'beta-cores':
        return <BetaCores />;
      case 'body-cores':
        return <BodyCores />;
      case 'camps':
        return <Camps />;
      case 'cans':
        return <Cans />;
      case 'documents':
        return <Documents />;
      case 'drone-appearances':
        return <DroneAppearance />;
      default:
        return <CollectiblesByType />;
    }
  };

  const renderNavigation = () => {
    const currentIndex = tocLinks.findIndex(link => 
      link.mainLink.includes(type)
    );

    if (currentIndex === -1) return null;

    const prevGuide = currentIndex > 0 ? tocLinks[currentIndex - 1] : null;
    const nextGuide = currentIndex < tocLinks.length - 1 ? tocLinks[currentIndex + 1] : null;

    return (
      <div className='d-flex justify-content-between pb-5'>
        <div className='text-start ps-2'>
          {prevGuide && (
            <>
              <p className='m-0 fw-bold'>
                <ArrowLeftCircle className="inline-block mr-1 align-text-bottom me-1" size={20} />
                Previous guide
              </p>
              <h5><Link to={prevGuide.mainLink} className='text-decoration-none'>{prevGuide.title}</Link></h5>
            </>
          )}
        </div>
        <div className='text-end pe-2'>
          {nextGuide && (
            <>
              <p className='m-0 fw-bold'>
                Next guide
                <ArrowRightCircle className="inline-block ml-1 align-text-bottom ms-1" size={20} />
              </p>
              <h5><Link to={nextGuide.mainLink} className='text-decoration-none'>{nextGuide.title}</Link></h5>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container bg-white">
      <div className="row">
        {!isMobile && (
          <div className="col-lg-3 border-start bg-white">
            <TableOfContents links={tocLinks} isMobile={isMobile} />
          </div>
        )}
        <div className={`col-lg-9 px-4 border-start border-end ${!isMobile ? '' : ''}`}>
          <h1 className="mt-3 mb-0">Collectibles by Type</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          {renderContent()}
          {renderNavigation()}
          <CommentSection pageId={type} />
        </div>
      </div>
    </div>
  );
}

export default CollectibleTypes;