import { Compass } from "lucide-react";
import CategoryCard from "../components/CategoryCard";
import { COLLECTIBLES } from "../constants/navigation";
import { COLLECTIBLE_IMAGES } from "../constants/categoryImages";
import { usePrefetch } from "../hooks/usePrefetch";
import SEO from "../components/SEO";
import StructuredData from "../components/StructuredData";

const COLLECTIBLES_ITEM_LIST = COLLECTIBLES.map((type, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: type.name,
  url: `https://stellarbladeguide.com/collectibles/${type.slug}`,
}));

function CollectiblesIndexPage() {
  const { prefetchCollectiblesByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Collectibles"
        description={`Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade. Find every Document, Can, Memorystick, and more with screenshots and locations.`}
        canonical="/collectibles"
      />

      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Collectibles"
        description={`Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade.`}
        extraSchemas={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Stellar Blade Collectible Types",
            numberOfItems: COLLECTIBLES.length,
            itemListElement: COLLECTIBLES_ITEM_LIST,
          },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            Collectibles
          </h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            All collectible types in Stellar Blade including Cans, Documents,
            Memorysticks, Passcodes, and Camps. Found throughout every level
            with screenshots and detailed locations.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {COLLECTIBLES.map((type) => (
            <CategoryCard
              key={type.slug}
              to={`/collectibles/${type.slug}`}
              imageUrl={COLLECTIBLE_IMAGES[type.slug]}
              name={type.name}
              FallbackIcon={Compass}
              onMouseEnter={() => void prefetchCollectiblesByType(type.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CollectiblesIndexPage;
