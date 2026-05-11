import { UPGRADES } from "../constants/navigation";
import { UPGRADE_IMAGES } from "../constants/categoryImages";
import { Zap } from "lucide-react";
import CategoryCard from "../components/CategoryCard";
import { usePrefetch } from "../hooks/usePrefetch";
import SEO from "../components/SEO";
import StructuredData from "../components/StructuredData";

const UPGRADES_ITEM_LIST = UPGRADES.map((type, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: type.name,
  url: `https://stellarbladeguide.com/upgrades/${type.slug}`,
}));

function UpgradesIndexPage() {
  const { prefetchCollectiblesByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Upgrades"
        description={`Browse all ${UPGRADES.length} upgrade types in Stellar Blade. Find every Beta Core, Body Core, and Exospine with screenshots and locations.`}
        canonical="/upgrades"
      />

      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Upgrades"
        description={`Browse all ${UPGRADES.length} upgrade types in Stellar Blade.`}
        extraSchemas={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Stellar Blade Upgrade Types",
            numberOfItems: UPGRADES.length,
            itemListElement: UPGRADES_ITEM_LIST,
          },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            Upgrades
          </h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            All upgrade items in Stellar Blade including Beta Cores, Body Cores,
            Exospines, Tumbler Expansion Modules, and Drone Upgrade Modules.
            These items enhance Eve's abilities and equipment.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {UPGRADES.map((type) => (
            <CategoryCard
              key={type.slug}
              to={`/upgrades/${type.slug}`}
              imageUrl={UPGRADE_IMAGES[type.slug]}
              name={type.name}
              FallbackIcon={Zap}
              onMouseEnter={() => void prefetchCollectiblesByType(type.slug, "upgrades")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UpgradesIndexPage;
