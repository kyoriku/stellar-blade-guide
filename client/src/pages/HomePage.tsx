import { Link } from 'react-router-dom'
import { Book, Map, Compass, ChevronRight } from 'lucide-react'
import { usePrefetch } from '../hooks/usePrefetch'
import { WALKTHROUGHS, LEVELS, COLLECTIBLES } from '../constants/navigation'

function HomePage() {
  const { prefetchLevel, prefetchCollectiblesByType, prefetchWalkthroughsByType } = usePrefetch()

  return (
    <div className="min-h-main bg-primary">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden max-h-[calc(100vh-4rem)]">
        {/* Hero image container */}
        <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[calc(100vh-4rem)]">
          <img
            src="https://res.cloudinary.com/drw9mrozr/image/upload/f_auto,q_auto,w_1920,c_scale/stellar-blade/homepage/banner.jpg"
            alt="Stellar Blade Banner"
            className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
            loading="eager"
            fetchPriority="high"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>

          {/* Subtle blue glow effect at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-500/20 via-blue-500/10 to-transparent"></div>
        </div>
      </div>

      {/* Blue glow separator between banner and content */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-6">
        {/* Welcome Card - Enhanced with blue accents */}
        <div className="relative bg-secondary rounded-lg p-8 mb-6 shadow-2xl border border-gray-500/20 overflow-hidden">
          {/* Decorative gradient blobs - more visible blue theme */}
          {/* <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div> */}

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-300">
              Find Everything in Stellar Blade
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
              A complete guide with screenshots and locations for every collectible in the game.
              Navigate by level or jump straight to what you're looking for.
            </p>
          </div>
        </div>

        {/* Three Columns - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">
          <EnhancedSection
            title="Walkthroughs"
            icon={<Book size={28} />}
            iconColor="blue"
            links={WALKTHROUGHS.map(item => ({
              to: `/walkthroughs/${item.slug}`,
              text: item.name,
              prefetch: () => prefetchWalkthroughsByType(item.slug),
            }))}
          />

          <EnhancedSection
            title="Levels"
            icon={<Map size={28} />}
            iconColor="green"
            links={LEVELS.map(item => ({
              to: `/levels/${item.slug}`,
              text: item.name,
              prefetch: () => prefetchLevel(item.slug),
            }))}
          />

          <EnhancedSection
            title="Collectibles"
            icon={<Compass size={28} />}
            iconColor="purple"
            links={COLLECTIBLES.map(item => ({
              to: `/collectibles/${item.slug}`,
              text: item.name,
              prefetch: () => prefetchCollectiblesByType(item.slug),
            }))}
          />
        </div>
      </div>
    </div>
  )
}

interface EnhancedSectionProps {
  title: string
  icon: React.ReactNode
  iconColor: 'blue' | 'green' | 'purple'
  links: { to: string; text: string; prefetch?: () => void }[]
}

function EnhancedSection({ title, icon, iconColor, links }: EnhancedSectionProps) {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500/20 to-transparent',
      icon: 'text-blue-400',
      border: 'border-blue-500/30',
      hover: 'group-hover:border-blue-400/60',
      glow: 'group-hover:shadow-blue-500/20',
      linkHover: 'hover:bg-blue-500/10',
    },
    green: {
      gradient: 'from-green-500/20 to-transparent',
      icon: 'text-green-400',
      border: 'border-green-500/30',
      hover: 'group-hover:border-green-400/60',
      glow: 'group-hover:shadow-green-500/20',
      linkHover: 'hover:bg-green-500/10',
    },
    purple: {
      gradient: 'from-purple-500/20 to-transparent',
      icon: 'text-purple-400',
      border: 'border-purple-500/30',
      hover: 'group-hover:border-purple-400/60',
      glow: 'group-hover:shadow-purple-500/20',
      linkHover: 'hover:bg-purple-500/10',
    },
  }

  const colors = colorClasses[iconColor]

  return (
    <div className={`group relative bg-secondary rounded-lg p-6 border ${colors.border} ${colors.hover} transition-all duration-300 hover:shadow-xl ${colors.glow} overflow-hidden`}>
      {/* Gradient overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700/50">
          <div className={`${colors.icon} transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>

        {/* Links */}
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li key={index} className="m-0">
              <Link
                to={link.to}
                onMouseEnter={link.prefetch}
                className={`group/link flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 py-2 px-3 rounded ${colors.linkHover}`}
              >
                <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                <span>{link.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default HomePage