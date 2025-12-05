import { Link } from 'react-router-dom'
import { Book, Map, Compass, ChevronRight } from 'lucide-react'
import { WALKTHROUGHS, LEVELS, COLLECTIBLES } from '../constants/navigation'

function HomePage() {
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
      <div className="container mx-auto px-3 pt-6">
        {/* Welcome Card */}
        <div className="relative bg-secondary rounded-lg p-8 mb-6 shadow-2xl border border-gray-500/20 overflow-hidden">
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
          <HomeCard
            title="Walkthroughs"
            description="Complete step-by-step guides for all main story missions, side quests, and other content"
            icon={<Book size={24} />}
            iconColor="blue"
            to="/walkthroughs"
            itemCount={WALKTHROUGHS.length}
            itemLabel="Categories"
            imageUrl="https://res.cloudinary.com/drw9mrozr/image/upload/w_960,h_540,c_fill/f_auto,q_auto/v1764350642/stellar-blade/walkthroughs/main-story/scavenger-adam/stellar-blade-20251127221921.jpg"
          />

          <HomeCard
            title="Levels"
            description="Explore every location and find all collectibles organized by level"
            icon={<Map size={24} />}
            iconColor="green"
            to="/levels"
            itemCount={LEVELS.length}
            itemLabel="Levels"
            imageUrl="https://res.cloudinary.com/drw9mrozr/image/upload/w_960,h_540,c_fill/f_auto,q_auto/v1764282977/stellar-blade/collectibles/eidos-7/construction-zone/4-supply-camp-construction-zone.jpg"
          />

          <HomeCard
            title="Collectibles"
            description="Track down every item with detailed locations and screenshots"
            icon={<Compass size={24} />}
            iconColor="purple"
            to="/collectibles"
            itemCount={COLLECTIBLES.length}
            itemLabel="Types"
            imageUrl="https://res.cloudinary.com/drw9mrozr/image/upload/w_960,h_540,c_fill/f_auto,q_auto/v1764284541/stellar-blade/collectibles/spire-4/tower-outer-wall/3-can-moonwell-3.jpg"
          />
        </div>
      </div>
    </div>
  )
}

interface HomeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'purple';
  to: string;
  itemCount: number;
  itemLabel: string;
  imageUrl: string;
}

function HomeCard({ title, description, icon, iconColor, to, itemCount, itemLabel, imageUrl }: HomeCardProps) {
  const colorClasses = {
    blue: {
      border: 'border-blue-500/30',
      stats: 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-blue-500/30',
      icon: 'text-blue-400',
    },
    green: {
      border: 'border-green-500/30',
      stats: 'bg-gradient-to-r from-green-600/20 to-green-500/10 border-green-500/30',
      icon: 'text-green-400',
    },
    purple: {
      border: 'border-purple-500/30',
      stats: 'bg-gradient-to-r from-purple-600/20 to-purple-500/10 border-purple-500/30',
      icon: 'text-purple-400',
    },
  }

  const colors = colorClasses[iconColor]

  return (
    <Link
      to={to}
      className="group block"
    >
      <div className="bg-secondary border border-zinc-800 rounded-lg overflow-hidden 
                    transition-all duration-200 h-full
                    hover:border-zinc-700 hover:bg-secondary/80
                    hover:shadow-xl hover:shadow-black/30
                    hover:-translate-y-1">
        
        {/* Image Header */}
        <div className="aspect-video bg-gradient-to-br from-tertiary to-secondary 
                      relative overflow-hidden border-b border-zinc-800">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title with icon */}
          <div className="flex items-center gap-2 mb-2">
            <div className={colors.icon}>
              {icon}
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-zinc-100 transition-colors">
              {title}
            </h2>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
            {description}
          </p>

          {/* Stats */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${colors.stats} border rounded-lg mb-3`}>
            <span className="text-xs font-medium text-gray-300">
              {itemCount} {itemLabel}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">
              Explore all
            </span>
            <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default HomePage