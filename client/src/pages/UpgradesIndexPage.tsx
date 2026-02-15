import { Link } from 'react-router-dom'
import { UPGRADES } from '../constants/navigation'
import { UPGRADE_IMAGES } from '../constants/categoryImages'
import { Zap } from 'lucide-react'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'

function UpgradesIndexPage() {
  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Upgrades"
        description="Browse all upgrade types in Stellar Blade including Beta Cores, Body Cores, and Exospines"
      />
      <StructuredData
        type="CollectionPage"
        headline="Stellar Blade Upgrades"
        description={`Browse all ${UPGRADES.length} upgrade types in Stellar Blade.`}
        extraSchemas={[{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Stellar Blade Upgrade Types',
          numberOfItems: UPGRADES.length,
          itemListElement: UPGRADES.map((type, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: type.name,
            url: `https://stellarbladeguide.com/upgrades/${type.slug}`
          }))
        }]}
      />
      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Upgrades</h1>
          <p className="text-gray-300">Beta Cores, Body Cores, and Exospines</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {UPGRADES.map((type) => (
            <Link
              key={type.slug}
              to={`/upgrades/${type.slug}`}
              className="group block"
            >
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800
                            hover:border-zinc-600 transition-all duration-200
                            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                {UPGRADE_IMAGES[type.slug] ? (
                  <img
                    src={UPGRADE_IMAGES[type.slug]}
                    alt={type.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-tertiary flex items-center justify-center">
                    <Zap className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow-lg">
                  {type.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UpgradesIndexPage