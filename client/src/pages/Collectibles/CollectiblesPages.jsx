// src/pages/CollectiblesPages.jsx
import React from "react";
import Collectibles from "../../components/Collectibles";
import { getSilentStreet, getParkingTower, getAbandonedStation, } from '../../utils/API/eidos7';

const SilentStreet = () => (
  <Collectibles
    fetchCollectibles={getSilentStreet}
    title="Silent Street"
    id="silent-street"
  />
);

const ParkingTower = () => (
  <Collectibles
    fetchCollectibles={getParkingTower}
    title="Parking Tower"
    id="parking-tower"
  />
);

const AbandonedStation = () => (
  <Collectibles
    fetchCollectibles={getAbandonedStation}
    title="Abandoned Station"
    id="abandoned-station"
  />
);

const Xion = () => (
  <Collectibles
    fetchCollectibles={getXion}
    title="Xion"
    id="xion"
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

export { SilentStreet, ParkingTower, AbandonedStation, Xion };
