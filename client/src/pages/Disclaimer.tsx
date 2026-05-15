import { Copyright, AlertTriangle, Mail, Sparkles, Info } from 'lucide-react'
import SEO from '../components/SEO'
import SectionHeader from '../components/SectionHeader'
import Callout from '../components/Callout'

export default function Disclaimer() {
  return (
    <div className="min-h-main bg-primary">
      <SEO title="Disclaimer" description="Disclaimer for Stellar Blade Guide — an unofficial fan-made guide not affiliated with Shift Up Corporation or Sony Interactive Entertainment." />
      <div className="container mx-auto px-3 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-100">Disclaimer</h1>
        <Callout variant="warning">
          <p><strong>Unofficial fan-made guide.</strong> This website is not affiliated with, endorsed by, or connected to Shift Up Corporation or Sony Interactive Entertainment.</p>
        </Callout>
        
        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-6 text-gray-300 leading-relaxed border border-gray-800">
          <section>
            <SectionHeader icon={Info}>Unofficial Fan-Made Guide</SectionHeader>
            <p>This website is an <strong>unofficial, non-commercial fan guide</strong> for Stellar Blade. It is <strong>not affiliated with, endorsed by, or connected to</strong> Shift Up Corporation or Sony Interactive Entertainment.</p>
          </section>

          <section>
            <SectionHeader icon={Copyright}>Intellectual Property</SectionHeader>
            <p>All game content, including artwork, screenshots, character names, locations, and mechanics, belongs to Shift Up Corporation and Sony Interactive Entertainment. We believe our use constitutes fair dealing under applicable Canadian copyright law for commentary and educational purposes. Our original text, layout, and commentary are &copy; 2025&ndash;{new Date().getFullYear()} Stellar Blade Guide.</p>
          </section>

          <section>
            <SectionHeader icon={Sparkles}>Purpose & Use</SectionHeader>
            <p>This guide exists solely to <strong>help players</strong> locate collectibles, understand game mechanics, and navigate missions. We operate without commercial gain.</p>
          </section>

          <section>
            <SectionHeader icon={AlertTriangle}>Accuracy & Liability</SectionHeader>
            <p>Game content may change with patches and updates. Information may become outdated. Users access this site <strong>at their own risk</strong>. We are not responsible for issues arising from using this guide, including loss of game progress, corrupted save data, or in-game decisions based on outdated information.</p>
          </section>

          <section>
            <SectionHeader icon={Mail}>Copyright Concerns</SectionHeader>
            <p>If you are a rights holder with concerns about content on this site, please contact us. We will promptly address all legitimate requests.</p>
            <a href="mailto:contact@stellarbladeguide.com" className="font-mono text-cyan-400 text-sm underline decoration-cyan-400/30 underline-offset-2 hover:decoration-cyan-400 transition-colors">
              contact@stellarbladeguide.com
            </a>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: March 9, 2026
          </div>
        </div>
      </div>
    </div>
  )
}