import { Link } from 'react-router-dom'
import { Book, Layers, Compass, Zap, Box, Sparkles, ChevronRight, ArrowRight } from 'lucide-react'
import { WALKTHROUGHS, LEVELS, COLLECTIBLES, UPGRADES, MATERIALS, COSMETICS } from '../constants/navigation'
import { LEVEL_IMAGES } from '../constants/categoryImages'
import { usePrefetch } from '../hooks/usePrefetch'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'

const SITE_STATS = {
  collectibles: 818,
  screenshots: 1000,
} as const;

function HomePage() {
  const { prefetchLevel, prefetchWalkthroughsByType } = usePrefetch()

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title=""
        description="Complete guide for Stellar Blade with locations and screenshots for every collectible, walkthrough, and secret in the game."
        canonical="/"
      />
      <StructuredData
        headline="Stellar Blade Guide"
        description="Complete guide for Stellar Blade collectibles, walkthroughs, and secrets"
      />

      {/* Hero */}
      <div className="relative h-[40vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
        <img
          src="https://res.cloudinary.com/drw9mrozr/image/upload//w_1920/f_webp,q_auto/v1771136778/stellar_blade2_c9qinq.jpg"
          alt="Stellar Blade"
          className="absolute inset-0 w-full h-full object-cover object-[center_40%] scale-125 md:scale-100"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117]/20 via-[#0d1117]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d1117] to-transparent" />

        {/* Desktop only overlay */}
        <div className="hidden md:flex absolute inset-0 items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-lg">
              <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
                Stellar Blade Guide
              </h1>
              <p className="text-gray-300 text-lg max-w-lg mb-4">
                Every collectible, walkthrough, and secret - with detailed screenshots and locations.
              </p>
              <div className="flex gap-5 text-base">
                <span className="text-gray-400">
                  <span className="text-white font-semibold">{SITE_STATS.collectibles}</span> Collectibles
                </span>
                <span className="text-gray-400">
                  <span className="text-white font-semibold">{LEVELS.length}</span> Levels
                </span>
                <span className="text-gray-400">
                  <span className="text-white font-semibold">{SITE_STATS.screenshots}+</span> Screenshots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile only text - below the image */}
      <div className="md:hidden p-4">
        <h1 className="text-3xl font-bold text-white mb-2">
          Stellar Blade Guide
        </h1>
        <p className="text-gray-400 mb-3">
          Every collectible, walkthrough, and secret - with detailed screenshots and locations.
        </p>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">
            <span className="text-white font-semibold">{SITE_STATS.collectibles}</span> Collectibles
          </span>
          <span className="text-gray-400">
            <span className="text-white font-semibold">{LEVELS.length}</span> Levels
          </span>
          <span className="text-gray-400">
            <span className="text-white font-semibold">{SITE_STATS.screenshots}+</span> Screenshots
          </span>
        </div>
      </div>

      {/* Level Strip */}
      <div className="border-b border-zinc-800 bg-secondary/50">
        <div className="container mx-auto px-3 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-300 uppercase tracking-wider">Browse by Level</h2>
            <Link
              to="/levels"
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
            {LEVELS.map((level) => (
              <Link
                key={level.slug}
                to={`/levels/${level.slug}`}
                onMouseEnter={() => prefetchLevel(level.slug)}
                className="group flex-shrink-0"
              >
                <div className="relative w-40 md:w-50 aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800 
                              hover:border-zinc-600 transition-all duration-200">
                  {LEVEL_IMAGES[level.slug] ? (
                    <img
                      src={LEVEL_IMAGES[level.slug]}
                      alt={level.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-tertiary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute bottom-2 left-2.5 text-sm font-medium text-white drop-shadow-lg">
                    {level.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Left Column - Walkthroughs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Book className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Walkthroughs</h2>
              </div>
              <Link
                to="/walkthroughs"
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {WALKTHROUGHS.map((category) => (
                <Link
                  key={category.slug}
                  to={`/walkthroughs/${category.slug}`}
                  onMouseEnter={() => prefetchWalkthroughsByType(category.slug)}
                  className="group flex items-center justify-between p-3.5 bg-secondary rounded-lg border border-zinc-800
                           hover:border-zinc-700 hover:bg-secondary/80 transition-all duration-200"
                >
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {category.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              ))}
            </div>

            {WALKTHROUGHS.length <= 2 && (
              <p className="text-sm text-gray-500 mt-3 italic">More coming soon</p>
            )}
          </div>

          {/* Right Column - Categories */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2.5 mb-4">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Find by Type</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CategoryCard
                title="Collectibles"
                description="Documents, cans, memorysticks, and more"
                icon={<Compass size={18} />}
                to="/collectibles"
                count={COLLECTIBLES.length}
                imageUrl="https://res.cloudinary.com/drw9mrozr/image/upload/w_480,h_270/f_webp,q_auto/v1765221806/stellar-blade/collectibles/spire-4/tower-outer-wall/3-can-moonwell-3.jpg"
              />
              <CategoryCard
                title="Upgrades"
                description="Beta cores, body cores, exospines"
                icon={<Zap size={18} />}
                to="/upgrades"
                count={UPGRADES.length}
                imageUrl="https://res.cloudinary.com/drw9mrozr/image/upload/w_480,h_270/f_webp,q_auto/v1765221093/stellar-blade/collectibles/eidos-7/silent-street/10-beta-core-1.jpg"
              />
              <CategoryCard
                title="Cosmetics"
                description="Nano suits, outfits, glasses, earrings"
                icon={<Sparkles size={18} />}
                to="/cosmetics"
                count={COSMETICS.length}
                imageUrl="https://res.cloudinary.com/drw9mrozr/image/upload/w_480,h_270/f_webp,q_auto/v1769725933/stellar-blade/xion/xion/stellar-blade-20260104000600.jpg"
              />
              <CategoryCard
                title="Materials"
                description="Supply boxes, chests, locked chests"
                icon={<Box size={18} />}
                to="/materials"
                count={MATERIALS.length}
                imageUrl="https://res.cloudinary.com/drw9mrozr/image/upload/w_480,h_270/f_webp,q_auto/v1765220998/stellar-blade/collectibles/eidos-7/construction-zone/1-crate-16.jpg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  count: number;
  imageUrl: string;
}

function CategoryCard({ title, description, icon, to, count, imageUrl }: CategoryCardProps) {
  return (
    <Link
      to={to}
      className="group block"
    >
      <div className="bg-secondary border border-zinc-800 rounded-lg overflow-hidden h-full
                    hover:border-zinc-700 hover:bg-secondary/80 transition-all duration-200
                    hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">

        {/* Image */}
        <div className="aspect-[16/9] relative overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 drop-shadow-lg">
              <span className="text-cyan-400">{icon}</span>
              <span className="text-sm font-semibold text-white">{title}</span>
            </div>
            <span className="text-xs text-gray-200 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {count} types
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <p className="text-sm text-gray-300 line-clamp-1">{description}</p>
        </div>
      </div>
    </Link>
  )
}

export default HomePage