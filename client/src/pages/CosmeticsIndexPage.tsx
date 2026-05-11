import { COSMETICS } from "../constants/navigation";
import { COSMETIC_IMAGES } from "../constants/categoryImages";
import { Sparkles } from "lucide-react";
import CategoryCard from "../components/CategoryCard";
import { usePrefetch } from "../hooks/usePrefetch";
import SEO from "../components/SEO";
import StructuredData from "../components/StructuredData";

const COSMETICS_ITEM_LIST = COSMETICS.map((type, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: type.name,
  url: `https://stellarbladeguide.com/cosmetics/${type.slug}`,
}));

function CosmeticsIndexPage() {
  const { prefetchCollectiblesByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Cosmetics"
        description={`Browse all ${COSMETICS.length} cosmetic types in Stellar Blade. Find every Nano Suit, Earring, and pair of Glasses with screenshots and locations.`}
        canonical="/cosmetics"
      />

      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Cosmetics"
        description={`Browse all ${COSMETICS.length} cosmetic types in Stellar Blade.`}
        extraSchemas={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Stellar Blade Cosmetic Types",
            numberOfItems: COSMETICS.length,
            itemListElement: COSMETICS_ITEM_LIST,
          },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            Cosmetics
          </h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            All cosmetic items in Stellar Blade including Nano Suits, Glasses,
            Earrings, Hairstyles, Drone Appearances, and outfits for Lily and
            Adam. Most are found in chests, purchased from shops, or earned
            through quests.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {COSMETICS.map((type) => (
            <CategoryCard
              key={type.slug}
              to={`/cosmetics/${type.slug}`}
              imageUrl={COSMETIC_IMAGES[type.slug]}
              name={type.name}
              FallbackIcon={Sparkles}
              onMouseEnter={() => void prefetchCollectiblesByType(type.slug, "cosmetics")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CosmeticsIndexPage;
