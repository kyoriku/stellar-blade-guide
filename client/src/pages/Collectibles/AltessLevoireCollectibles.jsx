import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";

const ResearchLabEntrance = lazy(() => import("./AltessLevoire/ResearchLabEntrance"));
const PurificationScanner = lazy(() => import("./AltessLevoire/PurificationScanner"));
const SecurityCenter = lazy(() => import("./AltessLevoire/SecurityCenter"));
const SectorA07 = lazy(() => import("./AltessLevoire/SectorA07"));
const SpecimenPreservationLab = lazy(() => import("./AltessLevoire/SpecimenPreservationLab"));
const TopSecretResearchComplex = lazy(() => import("./AltessLevoire/TopSecretResearchComplex"));
const DetoriatedLobby = lazy(() => import("./AltessLevoire/DeterioratedLobby"));
const AirVent = lazy(() => import("./AltessLevoire/AirVent"));

const AltessLevoireCollectibles = () => {
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
    {
      mainLink: "/collectibles/altess-levoire",
      title: "Altess Levoire",
      subLinks: [
        { href: "#research-lab-entrance", title: "Research Lab Entrance" },
        { href: "#purification-scanner", title: "Purification Scanner" },
        { href: "#security-center", title: "Security Center" },
        { href: "#sector-a07", title: "Sector A07" },
        { href: "#specimen-preservation-lab", title: "Specimen Preservation Lab" },
        { href: "#top-secret-research-complex", title: "Top Secret Research Complex" },
        { href: "#deteriorated-lobby", title: "Deteriorated Lobby" },
        { href: "#air-vent", title: "Air Vent" },
      ]
    },
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
          <h1 className="mt-3 mb-0">Altess Levoire Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            <ResearchLabEntrance />
            <PurificationScanner />
            <SecurityCenter />
            <SectorA07 />
            <SpecimenPreservationLab />
            <TopSecretResearchComplex />
            <DetoriatedLobby />
            <AirVent />
          </Suspense>
          <div className='d-flex justify-content-between pb-5'>
            <div className='text-start ps-2'>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5><Link to="/collectibles/wasteland" className='text-decoration-none'>Wasteland Collectibles</Link></h5>
            </div>
            <div className='text-end pe-2'>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5><Link to="/collectibles/matrix-11" className='text-decoration-none'>Matrix 11 Collectibles</Link></h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AltessLevoireCollectibles;
