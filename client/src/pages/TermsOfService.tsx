import { FileText, User, MessageSquare, ListChecks, Copyright, AlertTriangle, Link as LinkIcon, RefreshCw, Scale, Mail, Heart } from 'lucide-react'
import SEO from '../components/SEO'
import SectionHeader from '../components/SectionHeader'

export default function TermsOfService() {
  return (
    <div className="min-h-main bg-primary">
      <SEO title="Terms of Service" description="Terms of Service for Stellar Blade Guide. Read our rules for using the site and community features." />
      <div className="container mx-auto px-3 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-100">Terms of Service</h1>
        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-6 text-gray-300 leading-relaxed border border-gray-800">

          <section>
            <p>By using this website, you agree to these Terms of Service and our Privacy Policy. If you disagree, please do not use the site.</p>
          </section>

          <section>
            <SectionHeader icon={FileText}>Service Description</SectionHeader>
            <p>Stellar Blade Guide provides unofficial walkthroughs, collectible locations, and gameplay information for educational and informational purposes only. We also offer optional user accounts and a community comment system.</p>
          </section>

          <section>
            <SectionHeader icon={User}>User Accounts</SectionHeader>
            <p>You must be at least 13 years old to create an account. By registering, you agree to:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Provide accurate information and keep it up to date</li>
              <li>Keep your password secure and not share your account</li>
              <li>Create only one account per person</li>
              <li>Take responsibility for all activity under your account</li>
            </ul>
            <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <SectionHeader icon={MessageSquare}>Comments & Community Conduct</SectionHeader>
            <p>When posting comments, you agree not to:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Post spam, self-promotion, or repetitive content</li>
              <li>Harass, threaten, or demean other users</li>
              <li>Post illegal content or content that infringes third-party rights</li>
              <li>Share personal information about others without their consent</li>
              <li>Attempt to manipulate or abuse the moderation system</li>
            </ul>
            <p className="mt-2">All comments are subject to automated moderation via OpenAI. Comments that violate these rules may be removed without notice. Repeated violations may result in account suspension.</p>
            <p className="mt-2">By posting a comment, you grant us a non-exclusive, royalty-free licence to display it on the site. You retain ownership of your content.</p>
          </section>

          <section>
            <SectionHeader icon={ListChecks}>General User Responsibilities</SectionHeader>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Use the site lawfully and respectfully</li>
              <li>Do not interfere with site functionality or attempt to access unauthorized areas</li>
              <li>Do not scrape or harvest data using automated means without permission</li>
              <li>Do not distribute malware, spam, or harmful content</li>
            </ul>
          </section>

          <section>
            <SectionHeader icon={Copyright}>Intellectual Property</SectionHeader>
            <p><strong>Game Content:</strong> Stellar Blade&trade; and all related content are owned by Shift Up Corporation and Sony Interactive Entertainment. We claim no ownership over game assets, screenshots, or related material.</p>
            <p className="mt-2"><strong>Our Content:</strong> Original guide text, website design, and commentary are &copy; 2025&ndash;{new Date().getFullYear()} Stellar Blade Guide. You may view or share links for personal, non-commercial use. Commercial use or redistribution requires written permission.</p>
          </section>

          <section>
            <SectionHeader icon={Heart}>Optional Support Contributions</SectionHeader>
            <p>This site offers an optional way to support its operation through voluntary tips via third-party platforms (currently Ko-fi). By making a contribution, you agree to the following:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Contributions are voluntary gifts intended to support site operation and do not entitle you to any goods, services, or special access</li>
              <li>All site content remains freely accessible regardless of whether you contribute</li>
              <li>Contributions are <strong>non-refundable</strong> as they are gifts rather than purchases of goods or services</li>
              <li>Payment processing is handled entirely by Ko-fi and Stripe, subject to their respective terms of service</li>
              <li>We are not responsible for issues arising from the third-party payment process</li>
            </ul>
            <p className="mt-2">If you have an issue with a contribution (incorrect amount, accidental tip, etc.), please contact Ko-fi or Stripe directly for refund or dispute resolution.</p>
          </section>

          <section>
            <SectionHeader icon={AlertTriangle}>Disclaimers & Liability</SectionHeader>
            <p>This website is provided "as is" without warranties of any kind. We make no guarantees about accuracy, completeness, or availability.</p>
            <p className="mt-2"><strong>Important:</strong> Game content changes with patches and updates. Guide information may become outdated. Always verify critical information in-game before making irreversible decisions (selling rare items, choosing permanent upgrades, etc.).</p>
            <p className="mt-2">We are not liable for any damages arising from use of this site, including loss of game progress, missed collectibles, or consequences of following outdated information. <strong>Use at your own risk.</strong></p>
          </section>

          <section>
            <SectionHeader icon={LinkIcon}>Third-Party Links</SectionHeader>
            <p>External links are provided for convenience. We are not responsible for third-party content or practices.</p>
          </section>

          <section>
            <SectionHeader icon={RefreshCw}>Changes & Termination</SectionHeader>
            <p>We may modify these terms at any time. Continued use after changes constitutes acceptance. We reserve the right to terminate access for violations without notice.</p>
          </section>

          <section>
            <SectionHeader icon={Scale}>Governing Law</SectionHeader>
            <p>These terms are governed by the laws of Canada and the Province of Ontario. Disputes should first be addressed through good-faith communication.</p>
          </section>

          <section>
            <SectionHeader icon={Mail}>Contact</SectionHeader>
            <p>Questions about these terms:</p>
            <a href="mailto:contact@stellarbladeguide.com" className="font-mono text-cyan-400 text-sm underline decoration-cyan-400/30 underline-offset-2 hover:decoration-cyan-400 transition-colors">
              contact@stellarbladeguide.com
            </a>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: May 27, 2026
          </div>
        </div>
      </div>
    </div>
  )
}