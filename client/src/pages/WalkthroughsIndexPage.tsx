import { Book } from "lucide-react";
import CategoryCard from "../components/CategoryCard";
import { WALKTHROUGHS } from "../constants/navigation";
import { WALKTHROUGH_IMAGES } from "../constants/categoryImages";
import { usePrefetch } from "../hooks/usePrefetch";
import SEO from "../components/SEO";
import StructuredData from "../components/StructuredData";

const WALKTHROUGHS_ITEM_LIST = WALKTHROUGHS.map((cat, i) => ({
  "@type": "ListItem",
  position: i + 1,
  name: cat.name,
  url: `https://stellarbladeguide.com/walkthroughs/${cat.slug}`,
}));

function WalkthroughsIndexPage() {
  const { prefetchWalkthroughsByType } = usePrefetch();

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Walkthroughs"
        description={`Complete walkthrough guides for Stellar Blade. Browse ${WALKTHROUGHS.length} categories including main story missions, side quests, and more.`}
        canonical="/walkthroughs"
      />
      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Walkthroughs"
        description={`Complete walkthrough guides for all Stellar Blade missions.`}
        extraSchemas={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Stellar Blade Walkthrough Categories",
            numberOfItems: WALKTHROUGHS.length,
            itemListElement: WALKTHROUGHS_ITEM_LIST,
          },
        ]}
      />

      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            Walkthroughs
          </h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            Step-by-step walkthrough guides for Stellar Blade covering the main
            story, side quests, and more. Each guide includes screenshots, boss
            strategies, and tips.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {WALKTHROUGHS.map((category) => (
            <CategoryCard
              key={category.slug}
              to={`/walkthroughs/${category.slug}`}
              imageUrl={WALKTHROUGH_IMAGES[category.slug]}
              name={category.name}
              FallbackIcon={Book}
              onMouseEnter={() => void prefetchWalkthroughsByType(category.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default WalkthroughsIndexPage;
