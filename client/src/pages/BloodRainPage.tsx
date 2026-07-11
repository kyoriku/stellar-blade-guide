import { Link } from 'react-router-dom'
import { Info, CheckSquare, HelpCircle, BookOpen, ExternalLink, Book, Compass, ArrowRight } from 'lucide-react'
import { buildSrcSet, thumbnailUrl, ogImageUrl } from '../utils/cloudinary'
import SEO from '../components/SEO'
import SectionHeader from '../components/SectionHeader'

// ─── Update these as Shift Up announces more ──────────────────────────────
// Keep `confirmed: false` for anything not officially stated by Shift Up /
// Sony. The page renders unconfirmed items with a muted "Rumored" tag so you
// never accidentally present speculation as fact.

const LAST_UPDATED = 'June 7, 2026'

// Official Shift Up reveal trailer (Summer Game Fest 2026)
const TRAILER_URL = 'https://www.youtube.com/watch?v=zhdh_LspRHk'

const HERO_IMAGE = 'https://img.stellarbladeguide.com/stellar-blade/site/blood-rain-hero.webp'

const KEY_FACTS: { label: string; value: string; confirmed: boolean }[] = [
  { label: 'Title', value: 'Stellar Blade: Blood Rain', confirmed: true },
  { label: 'Developer', value: 'Shift Up', confirmed: true },
  { label: 'Publisher', value: 'Shift Up', confirmed: true },
  { label: 'Protagonist', value: 'Evie', confirmed: true },
  { label: 'Release date', value: 'TBA', confirmed: true },
  { label: 'Platforms', value: 'TBA', confirmed: true },
  { label: 'Development status', value: 'In development', confirmed: true },
]

type KnownItem = {
  text: string
  confirmed: boolean
  linkBefore?: string
  linkText?: string
  linkHref?: string
}

const INVEN_URL = 'https://www.inven.co.kr/webzine/news/?news=317188'
const FAMITSU_URL = 'https://www.famitsu.com/article/202606/77389'
const RULIWEB_URL = 'https://bbs.ruliweb.com/news/529/read/225463'

const WHAT_WE_KNOW: KnownItem[] = [
  {
    text: 'Revealed via a debut trailer at Summer Game Fest 2026.',
    confirmed: true,
  },
  {
    text: 'A direct sequel that continues the story from the first game’s ending, but built to stand alone so newcomers can follow it without playing the original.',
    confirmed: true,
  },
  {
    text: 'A new protagonist named Evie, distinct from the first game’s Eve.',
    confirmed: true,
  },
  {
    text: 'Combat centers on close-quarters fighting — Shift Up says the game can be cleared with CQC alone, with additional weapons (including a reverse-blade sword) and stance/combo depth layered on top.',
    confirmed: true,
  },
  {
    linkBefore: 'Set in a dense Asian-inspired city blending Hong Kong, Korean, and Japanese influences, which ',
    linkText: 'the director calls',
    linkHref: INVEN_URL,
    text: ' "another protagonist" of the game.',
    confirmed: true,
  },
  {
    text: 'Won’t be easier than the first game, but an easy mode is planned from the start this time.',
    confirmed: true,
  },
  {
    text: 'Self-published by Shift Up (not Sony), so it won’t be a PS5 exclusive like the first game.',
    confirmed: true,
  },
  {
    text: 'About a year into development as of the June 2026 reveal, with most of the first game’s team retained.',
    confirmed: true,
  },
  {
    text: 'Evie is part of a special forces unit hunting the group behind a major terrorist attack in the city; the man she chases in the trailer appears to lead them.',
    confirmed: true,
  },
  {
    linkBefore: 'The city is ',
    linkText: 'not Xion from the first game',
    linkHref: FAMITSU_URL,
    text: ' — Shift Up says enough in-world time has passed for humanity to build new cities beyond it.',
    confirmed: true,
  },
  {
    text: 'A sword returns: though not shown in the trailer, Evie will wield one, with more weapons unlocking as the story progresses.',
    confirmed: true,
  },
  {
    text: 'Side content returns, with Shift Up aiming to make it more substantial than the first game’s.',
    confirmed: true,
  },
  {
    linkBefore: 'Enemies are designed to fit the urban setting in a more realistic style, ',
    linkText: 'per Shift Up',
    linkHref: RULIWEB_URL,
    text: ' — though giant boss monsters like the first game’s are still present.',
    confirmed: true,
  },
]

const OPEN_QUESTIONS = [
  'Release date — a 2027 target was mentioned but Shift Up now says it may need more time',
  'Release platforms (only "not a PS5 exclusive" is confirmed)',
  'The exact relationship between Evie and Eve (confirmed related, but Shift Up is keeping details secret)',
  'What "CDDP" on Evie’s back stands for (Shift Up calls it a spoiler)',
  'Price, editions, and pre-order details',
]
// ──────────────────────────────────────────────────────────────────────────

function StatusTag({ confirmed }: { confirmed: boolean }) {
  if (confirmed) return null
  return (
    <span className="inline-block text-xs font-semibold uppercase tracking-wide text-yellow-400 border border-yellow-700 rounded px-2 py-0.5 ml-2 align-middle">
      Rumored
    </span>
  )
}

export default function BloodRainPage() {
  return (
    <div className="min-h-main bg-primary">
      <SEO
        title="Stellar Blade: Blood Rain — Release Date, Platforms & News"
        description="Everything confirmed about Stellar Blade: Blood Rain, the sequel revealed at Summer Game Fest 2026 — new protagonist Evie, combat, platforms, and release info. Updated as news breaks."
        canonical="/blood-rain"
        ogType="article"
        ogImage={ogImageUrl(HERO_IMAGE)}
      />

      <div className="container mx-auto px-3 py-8 max-w-4xl">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
            Stellar Blade: Blood Rain
          </h1>
          <p className="text-gray-300 mt-2">
            The announced sequel to Stellar Blade. This page tracks everything
            officially confirmed and is updated as Shift Up shares more.
          </p>
        </div>

        {/* Hero image */}
        <div className="mb-8 rounded-lg overflow-hidden border border-gray-800">
          <img
            src={thumbnailUrl(HERO_IMAGE, 960)}
            srcSet={buildSrcSet(HERO_IMAGE)}
            sizes="(min-width: 896px) 872px, calc(100vw - 24px)"
            alt="Stellar Blade: Blood Rain"
            className="w-full aspect-video object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Content card */}
        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-8 text-gray-300 leading-relaxed border border-gray-800">

          {/* At a Glance */}
          <section>
            <SectionHeader icon={Info}>At a Glance</SectionHeader>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {KEY_FACTS.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                    {fact.label}
                  </dt>
                  <dd className="text-gray-200">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <a
                href={TRAILER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-cyan-400 text-sm font-semibold transition-all duration-200"
              >
                Watch the official reveal trailer
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>

          {/* What We Know */}
          <section>
            <SectionHeader icon={CheckSquare}>What We Know</SectionHeader>
            <ul className="mt-4 space-y-3">
              {WHAT_WE_KNOW.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">&bull;</span>
                  <span>
                    {item.linkHref ? (
                      <>
                        {item.linkBefore}
                        <a
                          href={item.linkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 hover:decoration-cyan-400 transition-colors"
                        >
                          {item.linkText}
                        </a>
                        {item.text}
                      </>
                    ) : (
                      item.text
                    )}
                    <StatusTag confirmed={item.confirmed} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Still Unknown */}
          <section>
            <SectionHeader icon={HelpCircle}>Still Unknown</SectionHeader>
            <ul className="mt-4 space-y-3">
              {OPEN_QUESTIONS.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">&bull;</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Playing the First Game? */}
          <section>
            <SectionHeader icon={BookOpen}>Playing the First Game?</SectionHeader>
            <p className="mt-3 mb-4">
              While we wait for Blood Rain, the original Stellar Blade is the
              best way to prepare for the sequel&apos;s story.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/walkthroughs"

                className="group flex items-center gap-3 p-4 bg-linear-to-r from-cyan-600/20 to-cyan-500/10 hover:from-cyan-600/30 hover:to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
              >
                <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors shrink-0">
                  <Book className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">Full Walkthroughs</div>
                  <div className="text-xs text-gray-400">Main story, side quests &amp; more</div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-400 transition-colors shrink-0" />
              </Link>

              <Link
                to="/collectibles"

                className="group flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-200"
              >
                <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-gray-700 transition-colors shrink-0">
                  <Compass className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">Collectible Guides</div>
                  <div className="text-xs text-gray-400">Cans, Documents, Memorysticks &amp; more</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              </Link>
            </div>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: {LAST_UPDATED}
          </div>
        </div>
      </div>
    </div>
  )
}
