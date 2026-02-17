export default function Disclaimer() {
  return (
    <div className="min-h-main bg-primary">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Disclaimer</h1>
        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-6 text-gray-300 leading-relaxed border border-gray-800">

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Unofficial Fan-Made Guide</h2>
            <p>This website is an <strong>unofficial, non-commercial fan guide</strong> for Stellar Blade. It is <strong>not affiliated with, endorsed by, or connected to</strong> Shift Up Corporation or Sony Interactive Entertainment.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Intellectual Property</h2>
            <p>All game content, including artwork, screenshots, character names, locations, and mechanics, belongs to Shift Up Corporation and Sony Interactive Entertainment. We believe our use constitutes fair use under applicable copyright law for commentary and educational purposes. Our original text, layout, and commentary are © 2025 Stellar Blade Guide.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Purpose & Use</h2>
            <p>This guide exists solely to <strong>help players</strong> locate collectibles, understand game mechanics, and navigate missions. We operate without commercial gain.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Accuracy & Liability</h2>
            <p>Game content may change with patches and updates. Information may become outdated. Users access this site <strong>at their own risk</strong>. We are not responsible for issues arising from using this guide, including loss of game progress, corrupted save data, or in-game decisions based on outdated information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Copyright Concerns</h2>
            <p>If you are a rights holder with concerns about content on this site, please contact us. We will promptly address all legitimate requests.</p>
            <p className="mt-2 font-mono text-sm text-cyan-400">contact@stellarbladeguide.com</p>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: November 15, 2025
          </div>
        </div>
      </div>
    </div>
  )
}