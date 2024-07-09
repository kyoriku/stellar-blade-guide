import React from "react";
import Collectibles from "../../components/Collectibles";
import MediaDisplay from "../../components/MediaDisplay";
import {
  getSilentStreet,
  getParkingTower,
  getAbandonedStation,
  getFloodedCommercialSector,
  getMemoryTower,
  getConstructionZone,
  getCityUnderground,
  getCrater,
  getEidos7Continued
} from '../../utils/API/eidos7';
import {
  getXion,
  getXionContinued
} from '../../utils/API/xion';

const SilentStreet = () => (
  <Collectibles
    fetchCollectibles={getSilentStreet}
    title="Silent Street"
    id="silent-street"
    skeletonLength={[18]}
  />
);

const ParkingTower = () => (
  <Collectibles
    fetchCollectibles={getParkingTower}
    title="Parking Tower"
    id="parking-tower"
    skeletonLength={[19]}
  />
);

const AbandonedStation = () => (
  <Collectibles
    fetchCollectibles={getAbandonedStation}
    title="Abandoned Station"
    id="abandoned-station"
    skeletonLength={[4]}
  />
);

const FloodedCommercialSector = () => (
  <Collectibles
    fetchCollectibles={getFloodedCommercialSector}
    title="Flooded Commercial Sector"
    id="flooded-commercial-sector"
    skeletonLength={[15]}
  />
);

const MemoryTower = () => (
  <Collectibles
    fetchCollectibles={getMemoryTower}
    title="Memory Tower"
    id="memory-tower"
    skeletonLength={[9]}
  />
);

const ConstructionZone = () => (
  <Collectibles
    fetchCollectibles={getConstructionZone}
    title="Construction Zone"
    id="construction-zone"
    skeletonLength={[17]}
  />
);

const CityUnderground = () => (
  <Collectibles
    fetchCollectibles={getCityUnderground}
    title="City Underground"
    id="city-underground"
    skeletonLength={[14]}
  />
);

const Crater = () => (
  <Collectibles
    fetchCollectibles={getCrater}
    title="Crater"
    id="crater"
    skeletonLength={[2]}
  />
);

const Eidos7Continued = () => (
  <Collectibles
    fetchCollectibles={getEidos7Continued}
    title="Eidos 7 Continued"
    id="eidos-7-continued"
    skeletonLength={[19]}
    extraContent={
      <p>
        <i>The next set of collectibles won't be available on your first time through the area, and require a side quest/Request/Double Jump to access them.</i>
      </p>
    }
  />
);

const Xion = () => (
  <Collectibles
    fetchCollectibles={getXion}
    title="Xion"
    id="xion"
    skeletonLength={[44]}
    renderItem={(item, index, content) => {
      const isLastItem = index === content.length - 1;
      const isNextTextArray = !isLastItem && Array.isArray(content[index + 1].text);
      const showHr = !isLastItem && (!Array.isArray(item.text) || !isNextTextArray);
      const addBottomMargin = item.id === 24;

      return (
        <MediaDisplay
          key={item.id}
          title={item.title}
          text={item.text}
          images={item.images}
          showHr={showHr}
          addBottomMargin={addBottomMargin}
        />
      );
    }}
  />
);

const XionContinued = () => (
  <Collectibles
    fetchCollectibles={getXionContinued}
    title="Xion (Continued)"
    id="xion-continued"
    skeletonLength={[16]}
    extraContent={
      <p>
        <i>The next set of collectibles won't be available on your first time through the area, and require a side quest/Request/Double Jump to access them.</i>
      </p>
    }
    renderItem={(item, index, content) => {
      const isLastList = index === content.length - 1 || !Array.isArray(content[index + 1].text);

      return (
        <MediaDisplay
          key={item.id}
          title={item.title}
          text={item.text}
          images={item.images}
          showHr={!Array.isArray(item.text) || isLastList}
        />
      );
    }}
  />
);

export {
  SilentStreet,
  ParkingTower,
  AbandonedStation,
  FloodedCommercialSector,
  MemoryTower,
  ConstructionZone,
  CityUnderground,
  Crater,
  Eidos7Continued,
  Xion,
  XionContinued
};
