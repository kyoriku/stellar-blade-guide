export default function TermsOfService() {
  return (
    <div className="min-h-main bg-primary">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Terms of Service</h1>
        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-6 text-gray-300 leading-relaxed border border-gray-800">

          <section>
            <p>By using this website, you agree to these Terms of Service and our Privacy Policy. If you disagree, please do not use the site.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Service Description</h2>
            <p>Stellar Blade Guide provides unofficial walkthroughs, collectible locations, and gameplay information for educational and informational purposes only.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">User Responsibilities</h2>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Use the site lawfully and respectfully</li>
              <li>Do not interfere with site functionality or access unauthorized areas</li>
              <li>Do not scrape or harvest data using automated means without permission</li>
              <li>Respect intellectual property rights</li>
              <li>Do not distribute malware, spam, or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Intellectual Property</h2>
            <p><strong>Game Content:</strong> Stellar Blade™ and all related content are owned by Shift Up Corporation and Sony Interactive Entertainment. We claim no ownership.</p>
            <p className="mt-2"><strong>Our Content:</strong> Original guide text, website design, and commentary are © 2025 Stellar Blade Guide. You may view, print, or share links for personal, non-commercial use. Commercial use or redistribution requires written permission.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Disclaimers & Liability</h2>
            <p>This website is provided "as is" without warranties of any kind. We make no guarantees about accuracy, completeness, or availability.</p>
            <p className="mt-2"><strong>Important:</strong> Game content changes with patches and updates. Guide information may become outdated. Always verify critical information in-game before making irreversible decisions (selling rare items, choosing permanent upgrades, etc.).</p>
            <p className="mt-2">We are not liable for any damages arising from use of this site, including but not limited to: loss of game progress, corrupted save files, missed collectibles, or consequences of following outdated information. <strong>Use at your own risk.</strong></p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Third-Party Links</h2>
            <p>External links are provided for convenience. We are not responsible for third-party content or practices.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Changes & Termination</h2>
            <p>We may modify these terms at any time. Continued use after changes constitutes acceptance. We reserve the right to terminate access for violations without notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Governing Law</h2>
            <p>These terms are governed by the laws of Canada and the Province of Ontario. Disputes should first be addressed through good-faith communication.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Contact</h2>
            <p>Questions about these terms:</p>
            <p className="mt-2 font-mono text-blue-400">contact@stellarbladeguide.com</p>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: November 15, 2025
          </div>
        </div>
      </div>
    </div>
  )
}