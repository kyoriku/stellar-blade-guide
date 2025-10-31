import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link, useParams } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents';
import LoadingFallback from "../../components/LoadingFallback";
import useWindowSize from "../../hooks/useWindowSize";
import EmergencyExit from "./AbyssLevoire/EmergencyExit";
import ResearchLabEntrance from "./AltessLevoire/ResearchLabEntrance";
import PurificationScanner from "./AltessLevoire/PurificationScanner";
import SecurityCenter from "./AltessLevoire/SecurityCenter";
import SectorA07 from "./AltessLevoire/SectorA07";
import SpecimenPreservationLab from "./AltessLevoire/SpecimenPreservationLab";
import TopSecretResearchComplex from "./AltessLevoire/TopSecretResearchComplex";
import DeterioratedLobby from "./AltessLevoire/DeterioratedLobby";
import { AirVent } from "lucide-react";
import ClosedOffPlatform from "./Matrix11/ClosedOffPlatform";
import Landfill from "./Matrix11/Landfill";
import CollapsedRailBridge from "./Matrix11/CollapsedRailBridge";
import UndergroundSewer from "./Matrix11/UndergroundSewer";
import RottenLabyrinth from "./Matrix11/RottenLabyrinth";
import TemporaryArmoury from "./Matrix11/TemporaryArmoury";
import TrainGraveyard from "./Matrix11/TrainGraveyard";
import SolarTower from "./GreatDesert/SolarTower";
import CollapsedOverpass from "./GreatDesert/CollapsedOverpass";
import BuriedRuins from "./GreatDesert/BuriedRuins";
import CentralGreatDesert from "./GreatDesert/CentralGreatDesert";
import NorthernGreatDesert from "./GreatDesert/NorthernGreatDesert";
import Oasis from "./GreatDesert/Oasis";
import FallenOverpass from "./Eidos9/FallenOverpass";
import SubmergedCity from "./Eidos9/SubmergedCity";
import Atelier from "./Eidos9/Atelier";
import OrcaSpaceComplex from "./Spire4/OrcaSpaceComplex";
import Hypertube from "./Spire4/Hypertube";
import SpaceLogisticsComplex from "./Spire4/SpaceLogisticsComplex";
import RaphaelSpaceCentre from "./Spire4/RaphaelSpaceCentre";
import CargoLift121 from "./Spire4/CargoLift121";
import MaintenanceSector from "./Spire4/MaintenanceSector";
import TowerOuterWall from "./Spire4/TowerOuterWall";
import PassengerLift161 from "./Spire4/PassengerLift161";
import PrestigeLounge from "./Spire4/PrestigeLounge";
import VermillionGarden from "./Spire4/VermillionGarden";
import HighOrbitStation from "./Spire4/HighOrbitStation";
import Nest from "./Spire4/Nest";

// Import the CommentSection component
const CommentSection = lazy(() => import('../../components/CommentSection'));

// Define the levels and their components configuration
const LEVELS_CONFIG = {
  "eidos-7": {
    title: "Eidos 7",
    components: {
      SilentStreet: lazy(() => import("./Eidos7/SilentStreet")),
      ParkingTower: lazy(() => import("./Eidos7/ParkingTower")),
      AbandonedStation: lazy(() => import("./Eidos7/AbandonedStation")),
      FloodedCommercialSector: lazy(() => import("./Eidos7/FloodedCommercialSector")),
      MemoryTower: lazy(() => import("./Eidos7/MemoryTower")),
      ConstructionZone: lazy(() => import("./Eidos7/ConstructionZone")),
      CityUnderground: lazy(() => import("./Eidos7/CityUnderground")),
      Crater: lazy(() => import("./Eidos7/Crater")),
      Eidos7Continued: lazy(() => import("./Eidos7/Eidos7Continued")),
    },
    subLinks: [
      { href: "#silent-street", title: "Silent Street" },
      { href: "#parking-tower", title: "Parking Tower" },
      { href: "#abandoned-station", title: "Abandoned Station" },
      { href: "#flooded-commercial-sector", title: "Flooded Commercial Sector" },
      { href: "#memory-tower", title: "Memory Tower" },
      { href: "#construction-zone", title: "Construction Zone" },
      { href: "#city-underground", title: "City Underground" },
      { href: "#crater", title: "Crater" },
      { href: "#eidos-7-continued", title: "Eidos 7 (Continued)" },
    ],
    prev: null,
    next: { path: "/collectibles/level/xion", title: "Xion Collectibles" }
  },
  "xion": {
    title: "Xion",
    components: {
      Xion: lazy(() => import("./Xion/Xion")),
      XionContinued: lazy(() => import("./Xion/XionContinued")),
    },
    subLinks: [
      { href: "#xion", title: "Xion" },
      { href: "#xion-continued", title: "Xion (Continued)" },
    ],
    prev: { path: "/collectibles/level/eidos-7", title: "Eidos 7 Collectibles" },
    next: { path: "/collectibles/level/wasteland", title: "Wasteland Collectibles" }
  },
  "wasteland": {
    title: "Wasteland",
    components: {
      BarrenLands: lazy(() => import("./Wasteland/BarrenLands")),
      GreatCanyon: lazy(() => import("./Wasteland/GreatCanyon")),
      ScrapPlains: lazy(() => import("./Wasteland/ScrapPlains")),
      OilStorageFacility: lazy(() => import("./Wasteland/OilStorageFacility")),
      ScrapYard: lazy(() => import("./Wasteland/ScrapYard")),
      WastelandBasin: lazy(() => import("./Wasteland/WastelandBasin")),
      ScrapPlainsContinued: lazy(() => import("./Wasteland/ScrapPlainsContinued")),
      Plant: lazy(() => import("./Wasteland/Plant")),
      GreatCanyonContinued: lazy(() => import("./Wasteland/GreatCanyonContinued")),
      ForbiddenArea: lazy(() => import("./Wasteland/ForbiddenArea")),
      WastelandContinued: lazy(() => import("./Wasteland/WastelandContinued")),
    },
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
    ],
    prev: { path: "/collectibles/level/xion", title: "Xion Collectibles" },
    next: { path: "/collectibles/level/altess-levoire", title: "Altess Levoire Collectibles" }
  },
  // Add other levels here following the same pattern
  "altess-levoire": {
    title: "Altess Levoire",
    components: {
      ResearchLabEntrance: lazy(() => import("./AltessLevoire/ResearchLabEntrance")),
      PurificationScanner: lazy(() => import("./AltessLevoire/PurificationScanner")),
      SecurityCenter: lazy(() => import("./AltessLevoire/SecurityCenter")),
      SectorA07: lazy(() => import("./AltessLevoire/SectorA07")),
      SpecimenPreservationLab: lazy(() => import("./AltessLevoire/SpecimenPreservationLab")),
      TopSecretResearchComplex: lazy(() => import("./AltessLevoire/TopSecretResearchComplex")),
      DeterioratedLobby: lazy(() => import("./AltessLevoire/DeterioratedLobby")),
      AirVent: lazy(() => import("./AltessLevoire/AirVent")),
    },
    subLinks: [
      { href: "#research-lab-entrance", title: "Research Lab Entrance" },
      { href: "#purification-scanner", title: "Purification Scanner" },
      { href: "#security-center", title: "Security Center" },
      { href: "#sector-a07", title: "Sector A07" },
      { href: "#specimen-preservation-lab", title: "Specimen Preservation Lab" },
      { href: "#top-secret-research-complex", title: "Top Secret Research Complex" },
      { href: "#deteriorated-lobby", title: "Deteriorated Lobby" },
      { href: "#air-vent", title: "Air Vent" },
    ],
    prev: { path: "/collectibles/level/wasteland", title: "Wasteland Collectibles" },
    next: { path: "/collectibles/level/matrix-11", title: "Matrix 11 Collectibles" }
  },
  "matrix-11": {
    title: "Matrix 11",
    components: {
      ClosedOffPlatform: lazy(() => import("./Matrix11/ClosedOffPlatform")),
      Landfill: lazy(() => import("./Matrix11/Landfill")),
      CollapsedRailBridge: lazy(() => import("./Matrix11/CollapsedRailBridge")),
      UndergroundSewer: lazy(() => import("./Matrix11/UndergroundSewer")),
      RottenLabyrinth: lazy(() => import("./Matrix11/RottenLabyrinth")),
      TemporaryArmoury: lazy(() => import("./Matrix11/TemporaryArmoury")),
      TrainGraveyard: lazy(() => import("./Matrix11/TrainGraveyard")),
    },
    subLinks: [
      { href: "#closed-off-platform", title: "Closed Off Platform" },
      { href: "#landfill", title: "Landfill" },
      { href: "#collapsed-rail-bridge", title: "Collapsed Rail Bridge" },
      { href: "#underground-sewer", title: "Underground Sewer" },
      { href: "#rotten-labyrinth", title: "Rotten Labyrinth" },
      { href: "#temporary-armoury", title: "Temporary Armoury" },
      { href: "#train-graveyard", title: "Train Graveyard" },
    ],
    prev: { path: "/collectibles/level/altess-levoire", title: "Altess Levoire Collectibles" },
    next: { path: "/collectibles/level/great-desert", title: "Great Desert Collectibles" }
  },
  "great-desert": {
    title: "Great Desert",
    components: {
      SolarTower: lazy(() => import("./GreatDesert/SolarTower")),
      CollapsedOverpass: lazy(() => import("./GreatDesert/CollapsedOverpass")),
      BuriedRuins: lazy(() => import("./GreatDesert/BuriedRuins")),
      CentralGreatDesert: lazy(() => import("./GreatDesert/CentralGreatDesert")),
      NorthernGreatDesert: lazy(() => import("./GreatDesert/NorthernGreatDesert")),
      Oasis: lazy(() => import("./GreatDesert/Oasis")),
    },
    subLinks: [
      { href: "#solar-tower", title: "Solar Tower" },
      { href: "#collapsed-overpass", title: "Collapsed Overpass" },
      { href: "#buried-ruins", title: "Buried Ruins" },
      { href: "#central-great-desert", title: "Central Great Desert" },
      { href: "#northern-great-desert", title: "Northern Great Desert" },
      { href: "#oasis", title: "Oasis" },
    ],
    prev: { path: "/collectibles/level/matrix-11", title: "Matrix 11 Collectibles" },
    next: { path: "/collectibles/level/abyss-levoire", title: "Abyss Levoire Collectibles" }
  },
  "abyss-levoire": {
    title: "Abyss Levoire",
    components: {
      EmergencyExit: lazy(() => import("./AbyssLevoire/EmergencyExit")),
      ClosedLobby: lazy(() => import("./AbyssLevoire/ClosedLobby")),
      CapsuleClusterRoom: lazy(() => import("./AbyssLevoire/CapsuleClusterRoom")),
      UndergroundPassage: lazy(() => import("./AbyssLevoire/UndergroundPassage")),
      LaboratoryRuins: lazy(() => import("./AbyssLevoire/LaboratoryRuins")),
    },
    subLinks: [
      { href: "#emergency-exit", title: "Emergency Exit" },
      { href: "#closed-lobby", title: "Closed Lobby" },
      { href: "#capsule-cluster-room", title: "Capsule Cluster Room" },
      { href: "#underground-passage", title: "Underground Passage" },
      { href: "#laboratory-ruins", title: "Laboratory Ruins" },
    ],
    prev: { path: "/collectibles/level/great-desert", title: "Great Desert Collectibles" },
    next: { path: "/collectibles/level/eidos-9", title: "Eidos 9 Collectibles" }
  },
  "eidos-9": {
    title: "Eidos 9",
    components: {
      FallenOverpass: lazy(() => import("./Eidos9/FallenOverpass")),
      SubmergedCity: lazy(() => import("./Eidos9/SubmergedCity")),
      Atelier: lazy(() => import("./Eidos9/Atelier")),
    },
    subLinks: [
      { href: "#fallen-overpass", title: "Fallen Overpass" },
      { href: "#submerged-city", title: "Submerged City" },
      { href: "#atelier", title: "Atelier" },
    ],
    prev: { path: "/collectibles/level/abyss-levoire", title: "Abyss Levoire Collectibles" },
    next: { path: "/collectibles/level/spire-4", title: "Spire 4 Collectibles" }
  },
  "spire-4": {
    title: "Spire 4",
    components: {
      OrcaSpaceComplex: lazy(() => import("./Spire4/OrcaSpaceComplex")),
      Hypertube: lazy(() => import("./Spire4/Hypertube")),
      SpaceLogisticsComplex: lazy(() => import("./Spire4/SpaceLogisticsComplex")),
      RaphaelSpaceCentre: lazy(() => import("./Spire4/RaphaelSpaceCentre")),
      CargoLift121: lazy(() => import("./Spire4/CargoLift121")),
      MaintenanceSector: lazy(() => import("./Spire4/MaintenanceSector")),
      TowerOuterWall: lazy(() => import("./Spire4/TowerOuterWall")),
      PassengerLift161: lazy(() => import("./Spire4/PassengerLift161")),
      PrestigeLounge: lazy(() => import("./Spire4/PrestigeLounge")),
      VermillionGarden: lazy(() => import("./Spire4/VermillionGarden")),
      HighOrbitStation: lazy(() => import("./Spire4/HighOrbitStation")),
      Nest: lazy(() => import("./Spire4/Nest")),
    },
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
    ],
    prev: { path: "/collectibles/level/eidos-9", title: "Eidos 9 Collectibles" },
    next: null
  },
};

// Common TOC generation function
const generateTocLinks = (currentLevel) => {
  return Object.keys(LEVELS_CONFIG).map((level) => {
    const config = LEVELS_CONFIG[level];
    const link = {
      mainLink: `/collectibles/level/${level}`,
      title: config.title,
    };

    // Add subLinks if this is the current level
    if (level === currentLevel && config.subLinks.length > 0) {
      link.subLinks = config.subLinks;
    }

    return link;
  });
};

const LevelCollectibles = () => {
  const { level } = useParams();
  const size = useWindowSize();
  const isMobile = size.width <= 768;
  const [isSlowLoading, setIsSlowLoading] = useState(false);

  // Get the level configuration or default to first level if not found
  const levelConfig = LEVELS_CONFIG[level] || Object.values(LEVELS_CONFIG)[0];
  const { title, components, prev, next } = levelConfig;

  useEffect(() => {
    window.scrollTo(0, 0);

    const timeout = setTimeout(() => {
      setIsSlowLoading(true);
    }, 5000); // 5 seconds to trigger slow loading feedback

    return () => clearTimeout(timeout);
  }, [level]);

  // Generate TOC links with the current level expanded
  const tocLinks = generateTocLinks(level);

  // Render components for this level
  const renderComponents = () => {
    return Object.entries(components).map(([name, Component]) => (
      <Component key={name} />
    ));
  };

  // Render navigation links
  const renderNavigation = () => {
    return (
      <div className='d-flex justify-content-between pb-5'>
        <div className='text-start ps-2'>
          {prev && (
            <>
              <p className='m-0 fw-bold'>« Previous guide</p>
              <h5>
                <Link to={prev.path} className='text-decoration-none'>
                  {prev.title}
                </Link>
              </h5>
            </>
          )}
        </div>
        <div className='text-end pe-2'>
          {next && (
            <>
              <p className='m-0 fw-bold'>Next guide »</p>
              <h5>
                <Link to={next.path} className='text-decoration-none'>
                  {next.title}
                </Link>
              </h5>
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
          <h1 className="mt-3 mb-0">{title} Collectibles</h1>
          {isMobile && <TableOfContents links={tocLinks} isMobile={isMobile} />}
          <Suspense fallback={<LoadingFallback isSlowLoading={isSlowLoading} />}>
            {renderComponents()}
            {renderNavigation()}
            {/* <CommentSection pageId={level} /> */}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LevelCollectibles;