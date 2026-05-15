import { Database, FileText, Bot, BarChart3, Cookie, Globe, Shield, UserCheck, Users, RefreshCw } from 'lucide-react'
import SEO from '../components/SEO'
import SectionHeader from '../components/SectionHeader'

const sections = [
  { id: 'info-collected', label: 'Information we collect' },
  { id: 'how-we-use', label: 'How we use it' },
  { id: 'ai-moderation', label: 'AI comment moderation' },
  { id: 'analytics', label: 'Web analytics' },
  { id: 'cookies', label: 'Cookies & local storage' },
  { id: 'third-party', label: 'Third-party services' },
  { id: 'security', label: 'Data security & retention' },
  { id: 'rights', label: 'Your rights' },
  { id: 'international', label: 'International users & children' },
  { id: 'changes', label: 'Changes to this policy' },
]

const linkClass = "text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 hover:decoration-cyan-400 transition-colors"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-main bg-primary">
      <SEO title="Privacy Policy" description="Privacy Policy for Stellar Blade Guide. Learn how we collect, use, and protect your data." />
      <div className="container mx-auto px-3 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-100">Privacy Policy</h1>

        <nav className="bg-secondary/60 border border-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={linkClass}>{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-6 text-gray-300 leading-relaxed border border-gray-800">

          <section>
            <SectionHeader icon={Database} id="info-collected">Information We Collect</SectionHeader>
            <p><strong>Automatically collected:</strong> IP address, browser type, operating system, pages visited, referral source, and access timestamps via standard server logs.</p>
            <p className="mt-2"><strong>Account registration:</strong> If you create an account, we collect your username, email address, and a securely hashed password. We never store plaintext passwords.</p>
            <p className="mt-2"><strong>Comments:</strong> If you post a comment, we store the comment text, the username it was posted under, a timestamp, and the page it was posted on.</p>
            <p className="mt-2"><strong>Progress tracking:</strong> If you mark collectibles as found, we store your progress. For guests, this is saved locally in your browser (localStorage). For registered users, progress is synced to our database and associated with your account.</p>
            <p className="mt-2"><strong>Contact:</strong> If you email us, we collect your email address and message content.</p>
          </section>

          <section>
            <SectionHeader icon={FileText} id="how-we-use">How We Use Your Information</SectionHeader>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Authenticate your account and maintain your session</li>
              <li>Display your comments on the site</li>
              <li>Store and sync your collectible progress across devices</li>
              <li>Send transactional emails (e.g. password reset)</li>
              <li>Moderate comments for spam and policy violations</li>
              <li>Monitor site performance and detect technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <SectionHeader icon={Bot} id="ai-moderation">AI Comment Moderation</SectionHeader>
            <p>Comments are reviewed by an automated moderation system powered by OpenAI. When you submit or edit a comment, the text is sent to OpenAI's API to screen for spam, harassment, and other policy violations. OpenAI processes this data in accordance with their <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className={linkClass}>privacy policy</a>. By posting a comment, you consent to this processing.</p>
          </section>

          <section>
            <SectionHeader icon={BarChart3} id="analytics">Web Analytics</SectionHeader>
            <p>We use Cloudflare Web Analytics to understand how visitors use our site. It is a privacy-focused service that does not use cookies, does not track users across websites, and does not collect personally identifiable information. The data collected is aggregate and anonymized — page views, country-level visitor geography, browser and device types, referral sources, and page performance metrics. All analytics processing is handled by Cloudflare in accordance with their <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className={linkClass}>privacy policy</a>.</p>
          </section>

          <section>
            <SectionHeader icon={Cookie} id="cookies">Cookies, Sessions & Local Storage</SectionHeader>
            <p>We use cookies and server-side sessions to keep you logged in after authentication. We also use browser localStorage to store guest progress tracking data. These are strictly functional — no advertising or cross-site tracking cookies are used. You can clear cookies and localStorage through your browser settings, which will log you out and remove any unsaved guest progress.</p>
          </section>

          <section>
            <SectionHeader icon={Globe} id="third-party">Third-Party Services</SectionHeader>
            <p>We use the following third-party services, each with their own privacy policies:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li><strong>Cloudflare</strong> - CDN, security (DDoS and bot protection), and privacy-friendly web analytics</li>
              <li><strong>Railway</strong> - hosting and infrastructure</li>
              <li><strong>Cloudinary</strong> - image delivery and storage</li>
              <li><strong>OpenAI</strong> - automated comment moderation (comment text only)</li>
              <li><strong>Resend</strong> - transactional email delivery (email address only)</li>
            </ul>
          </section>

          <section>
            <SectionHeader icon={Shield} id="security">Data Security & Retention</SectionHeader>
            <p>We use HTTPS encryption, hashed passwords, rate limiting, and IP-based abuse detection. Server logs are retained for a limited period for operational purposes. Account data is retained for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <SectionHeader icon={UserCheck} id="rights">Your Rights</SectionHeader>
            <p>Depending on your location, you may have rights to access, correct, delete, or export your personal data, or to withdraw consent for certain processing. To exercise any of these rights, contact us and we will respond promptly.</p>
            <a href="mailto:contact@stellarbladeguide.com" className="font-mono text-cyan-400 text-sm underline decoration-cyan-400/30 underline-offset-2 hover:decoration-cyan-400 transition-colors">
              contact@stellarbladeguide.com
            </a>
          </section>

          <section>
            <SectionHeader icon={Users} id="international">International Users & Children</SectionHeader>
            <p>This site is operated from Canada. Your information may be processed in Canada or other countries where our service providers operate. By using the site, you consent to this. This site is not directed at children under 13, and we do not knowingly collect their information. If you believe a child has provided us personal data, please contact us for prompt removal.</p>
          </section>

          <section>
            <SectionHeader icon={RefreshCw} id="changes">Changes to This Policy</SectionHeader>
            <p>Updates are reflected via the "Last Updated" date below. Significant changes will be announced on the homepage. We encourage you to review this policy periodically.</p>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: May 12, 2026
          </div>
        </div>
      </div>
    </div>
  )
}