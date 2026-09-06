import { Database, FileText, Bot, BarChart3, Cookie, Megaphone, Globe, Shield, UserCheck, Users, RefreshCw, Heart } from 'lucide-react'
import SEO from '../components/SEO'
import seo from '../constants/seo.json'
import SectionHeader from '../components/SectionHeader'

const sections = [
  { id: 'info-collected', label: 'Information we collect' },
  { id: 'how-we-use', label: 'How we use it' },
  { id: 'ai-moderation', label: 'AI comment moderation' },
  { id: 'analytics', label: 'Web analytics' },
  { id: 'cookies', label: 'Cookies & local storage' },
  { id: 'advertising', label: 'Advertising' },
  { id: 'support', label: 'Support contributions' },
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
      <SEO title={seo.pages['/privacy'].title} description={seo.pages['/privacy'].description} />
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
            <p className="mt-2">We do <strong>not</strong> sell or rent your personal information, and we never provide your account details — email address, password, or comment history — to advertisers. Loading Google AdSense does mean Google independently receives standard request data and may use advertising cookies; see <a href="#advertising" className={linkClass}>Advertising</a> below.</p>
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
            <p>We use cookies and server-side sessions to keep you logged in after authentication. We also use browser localStorage to store guest progress tracking data. These are strictly functional. Separately, this site loads Google AdSense, and Google may set or read its own advertising cookies and device identifiers as a third party — see <a href="#advertising" className={linkClass}>Advertising</a> below. You can clear cookies and localStorage through your browser settings, which will log you out and remove any unsaved guest progress.</p>
          </section>

          <section>
            <SectionHeader icon={Megaphone} id="advertising">Advertising</SectionHeader>
            <p>This site participates in Google AdSense, and the Google AdSense script is included on every page.</p>
            <p className="mt-2">The site is currently in Google's site-review stage. <strong>No ads are displayed</strong> — there are no ad units anywhere on the site. This section will be updated before any ads begin to serve.</p>
            <p className="mt-2">When your browser loads that script, it is requested directly from Google's servers, so Google receives standard request information including your IP address, browser user agent, and the page you are viewing. Google may also set or read cookies and similar device identifiers as a third party. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this site or other sites, and Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet. This processing is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Google's privacy policy</a> and by <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className={linkClass}>how Google uses information from sites that use its services</a>.</p>
            <p className="mt-2">You may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className={linkClass}>Google's Ads Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className={linkClass}>www.aboutads.info</a>.</p>
          </section>

          <section>
            <SectionHeader icon={Heart} id="support">Support Contributions</SectionHeader>
            <p>If you choose to support the site via Ko-fi, all payment processing is handled entirely by Ko-fi and Stripe. We never receive or store your payment details, including credit card numbers, billing addresses, or any other sensitive financial information. We may receive limited information about contributions (amount, optional supporter display name, and optional message) for accounting purposes. Payment processing is subject to <a href="https://more.ko-fi.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Ko-fi's privacy policy</a> and <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Stripe's privacy policy</a>.</p>
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
              <li><strong>Ko-fi & Stripe</strong> - voluntary tip processing (we never see your payment details)</li>
              <li><strong>Google AdSense</strong> - advertising (see <a href="#advertising" className={linkClass}>Advertising</a> above)</li>
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
            Last Updated: August 26, 2026
          </div>
        </div>
      </div>
    </div>
  )
}