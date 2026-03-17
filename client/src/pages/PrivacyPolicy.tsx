import SEO from '../components/SEO'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-main bg-primary">
      <SEO title="Privacy Policy" description="Privacy Policy for Stellar Blade Guide. Learn how we collect, use, and protect your data." />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Privacy Policy</h1>
        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-6 text-gray-300 leading-relaxed border border-gray-800">

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Information We Collect</h2>
            <p><strong>Automatically collected:</strong> IP address, browser type, operating system, pages visited, referral source, and access timestamps via standard server logs and internal analytics.</p>
            <p className="mt-2"><strong>Account registration:</strong> If you create an account, we collect your username, email address, and a securely hashed password. We never store plaintext passwords.</p>
            <p className="mt-2"><strong>Comments:</strong> If you post a comment, we store the comment text, the username it was posted under, a timestamp, and the page it was posted on.</p>
            <p className="mt-2"><strong>Contact:</strong> If you email us, we collect your email address and message content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">How We Use Your Information</h2>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Authenticate your account and maintain your session</li>
              <li>Display your comments on the site</li>
              <li>Send transactional emails (e.g. password reset)</li>
              <li>Moderate comments for spam and policy violations</li>
              <li>Monitor site performance and detect technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">AI Comment Moderation</h2>
            <p>Comments are reviewed by an automated moderation system powered by OpenAI. When you submit or edit a comment, the text is sent to OpenAI's API to screen for spam, harassment, and other policy violations. OpenAI processes this data in accordance with their <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">privacy policy</a>. By posting a comment, you consent to this processing.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Cookies & Sessions</h2>
            <p>We use cookies and server-side sessions to keep you logged in after authentication. These are strictly functional — no advertising or cross-site tracking cookies are used. You can clear cookies through your browser settings, which will log you out.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Third-Party Services</h2>
            <p>We use the following third-party services, each with their own privacy policies:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li><strong>Railway</strong> - hosting and infrastructure (including Fastly)</li>
              <li><strong>Cloudinary</strong> - image delivery and storage</li>
              <li><strong>OpenAI</strong> - automated comment moderation (comment text only)</li>
              <li><strong>Resend</strong> - transactional email delivery (email address only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Data Security & Retention</h2>
            <p>We use HTTPS encryption, hashed passwords, rate limiting, and IP-based abuse detection. Server logs are retained for a limited period for operational purposes. Account data is retained for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, delete, or export your personal data, or to withdraw consent for certain processing. To exercise any of these rights, contact us and we will respond promptly.</p>
            <a href="mailto:contact@stellarbladeguide.com" className="font-mono text-cyan-400 text-sm hover:underline">
              contact@stellarbladeguide.com
            </a>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">International Users & Children</h2>
            <p>This site is operated from Canada. Your information may be processed in Canada or other countries where our service providers operate. By using the site, you consent to this. This site is not directed at children under 13, and we do not knowingly collect their information. If you believe a child has provided us personal data, please contact us for prompt removal.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Changes to This Policy</h2>
            <p>Updates are reflected via the "Last Updated" date below. Significant changes will be announced on the homepage. We encourage you to review this policy periodically.</p>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: March 9, 2026
          </div>
        </div>
      </div>
    </div>
  )
}