import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents'
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";

const OrcaSpaceComplex = lazy(() => import("./Spire4/OrcaSpaceComplex"));
const Hypertube = lazy(() => import("./Spire4/Hypertube"));
const SpaceLogisticsComplex = lazy(() => import("./Spire4/SpaceLogisticsComplex"));
const RaphaelSpaceCentre = lazy(() => import("./Spire4/RaphaelSpaceCentre"));
const CargoLift121 = lazy(() => import("./Spire4/CargoLift121"));
const MaintenanceSector = lazy(() => import("./Spire4/MaintenanceSector"));
const TowerOuterWall = lazy(() => import("./Spire4/TowerOuterWall"));
const PassengerLift161 = lazy(() => import("./Spire4/PassengerLift161"));
const PrestigeLounge = lazy(() => import("./Spire4/PrestigeLounge"));
const VermillionGarden = lazy(() => import("./Spire4/VermillionGarden"));
const HighOrbitStation = lazy(() => import("./Spire4/HighOrbitStation"));
const Nest = lazy(() => import("./Spire4/Nest"));

const Spire4Collectibles = () => {
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
    { mainLink: "/collectibles/eidos-9", title: "Eidos 9" },
    {
      mainLink: "/collectibles/spire-4",
      title: "Spire 4",
      subLinks: [
        { href: "#orca-space-complex", title: "Orca Space Complex" },
        { href: "#hypertube", title: "Hypertube" },
        { href: "#space-logistics-complex", title: "Space Logistics Complex" },
        { href: "#raphael-space-centre", title: "Raphael Space Centre" },
        { href: "#cargo-lift-121", title: "Cargo Lift 121" },
        { href: "#maintenance-sector", title: "Maintenance Sector" },
        { href: "#tower-outer-wall", title: "Tower Outer Wall" },
        { href: "#passenger-lift-161", title: "Passenger Lift 161" },
        { href: "#prestige-lounge", title: "Prestige Lounge" },
        { href: "#vermillion-garden", title: "Vermillion Garden" },
        { href: "#high-orbit-station", title: "High Orbit Station" },
        { href: "#nest", title: "Nest" },
      ]
    },
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
          <h1 className="mt-3 mb-0">Spire 4 Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            <OrcaSpaceComplex />
            <Hypertube />
            <SpaceLogisticsComplex />
            <RaphaelSpaceCentre />
            <CargoLift121 />
            <MaintenanceSector />
            <TowerOuterWall />
            <PassengerLift161 />
            <PrestigeLounge />
            <VermillionGarden />
            <HighOrbitStation />
            <Nest />
          </Suspense>
          <div className='text-start pb-5 ps-2'>
            <p className='m-0 fw-bold'>« Previous guide</p>
            <h5><Link to="/collectibles/eidos-9" className='text-decoration-none'>Eidos 9 Collectibles</Link></h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Spire4Collectibles;
