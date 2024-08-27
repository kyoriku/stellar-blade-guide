import React, { useEffect } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import useWindowSize from "../../hooks/WindowSize";
import SolarTower from "./GreatDesert/SolarTower";
import CollapsedOverpass from "./GreatDesert/CollapsedOverpass";
import BuriedRuins from "./GreatDesert/BuriedRuins";
import CentralGreatDesert from "./GreatDesert/CentralGreatDesert";
import NorthernGreatDesert from "./GreatDesert/NorthernGreatDesert";
import Oasis from "./GreatDesert/Oasis";

const GreatDesertCollectibles = () => {
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
          <SolarTower />
          <CollapsedOverpass />
          <BuriedRuins />
          <CentralGreatDesert />
          <NorthernGreatDesert />
          <Oasis />
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
