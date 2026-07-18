import { Link } from 'react-router-dom'
import { Book, Layers, Compass, Zap, Box, Sparkles, ChevronRight, ArrowRight, Map } from 'lucide-react'
import { WALKTHROUGHS, LEVELS, COLLECTIBLES, UPGRADES, MATERIALS, COSMETICS } from '../constants/navigation'
import { LEVEL_IMAGES } from '../constants/categoryImages'
import { buildSrcSet, thumbnailUrl } from '../utils/image'
import { usePrefetch } from '../hooks/usePrefetch'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'

const HERO_IMAGE = "https://img.stellarbladeguide.com/stellar-blade/site/home-hero.webp";
const HERO_SRCSET = [640, 960, 1200, 1600, 1920, 2560]
  .map(w => `${thumbnailUrl(HERO_IMAGE, w)} ${w}w`)
  .join(', ');


const SITE_STATS = {
  collectibles: 1000,
  screenshots: 1500,
} as const;

function HomePage() {
  const { prefetchLevel, prefetchWalkthroughsByType } = usePrefetch()

  return (
    <div className="min-h-main bg-primary">
      <SEO
        title=""
        description="Complete Stellar Blade guide with every collectible and full walkthroughs. Locations, screenshots, and detailed descriptions for the entire game."
        canonical="/"
      />
      <StructuredData
        headline="Stellar Blade Guide"
        description="Complete guide for Stellar Blade collectibles, walkthroughs, and secrets"
      />

      {/* Hero */}
      <div className="relative h-[40vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
        <img
          src={thumbnailUrl(HERO_IMAGE, 1920)}
          srcSet={HERO_SRCSET}
          sizes="100vw"
          alt="Stellar Blade"
          className="absolute inset-0 w-full h-full object-cover object-[center_40%] scale-125 md:scale-100"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#0d1117]/20 via-[#0d1117]/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#0d1117] to-transparent" />

        {/* Desktop only overlay */}
        <div className="hidden md:flex absolute inset-0 items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-lg">
              <h1 className="text-5xl font-bold text-gray-100 mb-2 drop-shadow-lg">
                Stellar Blade Guide
              </h1>
              <p className="text-gray-300 text-lg max-w-lg mb-4">
                Every collectible, walkthrough, and secret — with detailed screenshots and locations.
              </p>
              <div className="flex gap-5 text-base">
                <span className="text-gray-300">
                  <span className="text-gray-100 font-semibold">{SITE_STATS.collectibles}+</span> Collectibles
                </span>
                <span className="text-gray-300">
                  <span className="text-gray-100 font-semibold">{LEVELS.length}</span> Levels
                </span>
                <span className="text-gray-300">
                  <span className="text-gray-100 font-semibold">{SITE_STATS.screenshots}+</span> Screenshots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile only text - below the image */}
      <div className="md:hidden p-4">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          Stellar Blade Guide
        </h1>
        <p className="text-gray-300 mb-3">
          Every collectible, walkthrough, and secret — with detailed screenshots and locations.
        </p>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-300">
            <span className="text-gray-100 font-semibold">{SITE_STATS.collectibles}+</span> Collectibles
          </span>
          <span className="text-gray-300">
            <span className="text-gray-100 font-semibold">{LEVELS.length}</span> Levels
          </span>
          <span className="text-gray-300">
            <span className="text-gray-100 font-semibold">{SITE_STATS.screenshots}+</span> Screenshots
          </span>
        </div>
      </div>

      {/* Blood Rain Announcement — remove this block when hype dies down */}
      <div className="border-b border-cyan-900/50 bg-linear-to-r from-cyan-600/10 to-secondary/60">
        <div className="container mx-auto px-3 py-4">
          <Link
            to="/blood-rain"
            className="group flex items-center gap-3"
          >
            <span className="shrink-0 px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wide rounded border border-cyan-500/40">
              New
            </span>
            <span className="flex flex-col sm:flex-row sm:items-center sm:gap-1 font-medium">
              <span className="text-gray-200 group-hover:text-white transition-colors">Sequel announced:</span>
              <span className="text-cyan-400 font-semibold">Stellar Blade: Blood Rain</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
          </Link>
        </div>
      </div>

      {/* Level Strip */}
      <div className="border-b border-zinc-800 bg-secondary/50">
        <div className="container mx-auto px-3 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Map className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-gray-100">Browse by Level</h2>
            </div>
            <Link
              to="/levels"
              className="group text-sm text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:text-cyan-400 transition-all" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
            {LEVELS.map((level) => (
              <Link
                key={level.slug}
                to={`/levels/${level.slug}`}
                onMouseEnter={() => void prefetchLevel(level.slug)}
                className="group shrink-0"
              >
                <div className="relative w-40 md:w-50 aspect-4/3 sm:aspect-16/10 rounded-lg overflow-hidden border border-zinc-800 
                              hover:border-zinc-600 transition-all duration-200">
                  {LEVEL_IMAGES[level.slug] ? (
                    <img
                      src={thumbnailUrl(LEVEL_IMAGES[level.slug])}
                      srcSet={buildSrcSet(LEVEL_IMAGES[level.slug])}
                      sizes="(min-width: 768px) 200px, 160px"
                      alt={level.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-tertiary" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
                  <span className="absolute bottom-2 left-2.5 text-sm font-medium text-gray-100 drop-shadow-lg">
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
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 lg:gap-10">

          {/* Left Column - Walkthroughs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Book className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-gray-100">Walkthroughs</h2>
              </div>
              <Link
                to="/walkthroughs"
                className="group text-sm text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:text-cyan-400 transition-all" />
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
                  <span className="text-sm font-medium text-gray-300 group-hover:text-gray-100 transition-colors">
                    {category.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>

            {WALKTHROUGHS.length <= 2 && (
              <p className="text-sm text-gray-400 mt-3 italic">More coming soon</p>
            )}
          </div>

          {/* Right Column - Categories */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-gray-100">Find by Type</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CategoryCard
                title="Collectibles"
                description="Cans, Documents, Memorysticks, Passcodes, Camps"
                icon={<Compass size={18} />}
                to="/collectibles"
                count={COLLECTIBLES.length}
                imageUrl="https://img.stellarbladeguide.com/stellar-blade/collectibles/spire-4/tower-outer-wall/stellar-blade-20240809025324.webp"
              />
              <CategoryCard
                title="Upgrades"
                description="Beta Cores, Body Cores, Weapon Cores, Exospines, Gear, Tumbler Expansion Modules, Drone Upgrade Modules"
                icon={<Zap size={18} />}
                to="/upgrades"
                count={UPGRADES.length}
                imageUrl="https://img.stellarbladeguide.com/stellar-blade/collectibles/eidos-7/silent-street/stellar-blade-20240514035151.webp"
              />
              <CategoryCard
                title="Cosmetics"
                description="Nano Suits, Glasses, Earrings, Hairstyles, Drone Appearances, Lily Outfits, Adam Outfits"
                icon={<Sparkles size={18} />}
                to="/cosmetics"
                count={COSMETICS.length}
                imageUrl="https://img.stellarbladeguide.com/stellar-blade/collectibles/default/default/stellar-blade-20260320183427.webp"
              />
              <CategoryCard
                title="Materials"
                description="Supply Boxes, Supply Chests"
                icon={<Box size={18} />}
                to="/materials"
                count={MATERIALS.length}
                imageUrl="https://img.stellarbladeguide.com/stellar-blade/collectibles/eidos-7/construction-zone/stellar-blade-20240514060129.webp"
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
        <div className="aspect-4/3 sm:aspect-video relative overflow-hidden">
          <img
            src={thumbnailUrl(imageUrl)}
            srcSet={buildSrcSet(imageUrl)}
            sizes="(min-width: 1024px) calc((100vw - 62px) / 3), calc(50vw - 18px)"
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 drop-shadow-lg">
              <span className="text-cyan-400">{icon}</span>
              <span className="text-sm font-semibold text-gray-100">{title}</span>
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