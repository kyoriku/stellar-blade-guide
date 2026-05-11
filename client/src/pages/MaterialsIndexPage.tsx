import { MATERIALS } from "../constants/navigation";
import { MATERIAL_IMAGES } from "../constants/categoryImages";
import { Box } from "lucide-react";
import CategoryCard from "../components/CategoryCard";
import { usePrefetch } from "../hooks/usePrefetch";
import SEO from "../components/SEO";
import StructuredData from "../components/StructuredData";

const MATERIALS_ITEM_LIST = MATERIALS.map((type, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: type.name,
  url: `https://stellarbladeguide.com/materials/${type.slug}`,
}));

function MaterialsIndexPage() {
  const { prefetchCollectiblesByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Materials"
        description={`Browse all ${MATERIALS.length} material types in Stellar Blade. Find every Supply Box, Supply Chest, and Item with screenshots and locations.`}
        canonical="/materials"
      />

      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Materials"
        description={`Browse all ${MATERIALS.length} material types in Stellar Blade.`}
        extraSchemas={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Stellar Blade Material Types",
            numberOfItems: MATERIALS.length,
            itemListElement: MATERIALS_ITEM_LIST,
          },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            Materials
          </h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            All material items in Stellar Blade including Supply Boxes, Supply
            Chests, and miscellaneous items. Found throughout every level, often
            containing resources and upgrade materials.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {MATERIALS.map((type) => (
            <CategoryCard
              key={type.slug}
              to={`/materials/${type.slug}`}
              imageUrl={MATERIAL_IMAGES[type.slug]}
              name={type.name}
              FallbackIcon={Box}
              onMouseEnter={() => void prefetchCollectiblesByType(type.slug, "materials")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MaterialsIndexPage;
