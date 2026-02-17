export default function PrivacyPolicy() {
  return (
    <div className="min-h-main bg-primary">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Privacy Policy</h1>
        <div className="bg-secondary shadow-lg rounded-lg p-4 md:p-6 space-y-6 text-gray-300 leading-relaxed border border-gray-800">

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Information Collection</h2>
            <p><strong>Automatically collected:</strong> IP address, browser type, operating system, pages visited, referral source, access timestamps. This data is collected through standard server logs.</p>
            <p className="mt-2"><strong>User-provided:</strong> If you contact us via email, we collect your email address and message content. Future features (user accounts, comments) may collect additional information—this policy will be updated accordingly.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Use of Information</h2>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Maintain and improve website performance</li>
              <li>Monitor usage patterns and detect technical issues</li>
              <li>Respond to inquiries (note: we may not reply to all messages)</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell, rent, or share personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Cookies & Tracking</h2>
            <p>Currently minimal cookies for basic site functionality only. May expand in the future for user preferences, login sessions, or privacy-respecting analytics. You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Third-Party Services</h2>
            <p><strong>Current:</strong> Railway (hosting), Cloudinary (image delivery). These services have their own privacy policies.</p>
            <p className="mt-2"><strong>Future:</strong> Analytics tools, OAuth providers (Google, Discord), additional CDN services. This policy will be updated before implementing new services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Data Security & Retention</h2>
            <p>We use HTTPS encryption, secure server infrastructure, and regular monitoring. Server logs are retained for a limited period necessary for site operation. Email correspondence is retained as needed to address inquiries. Future user accounts will include data deletion options.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, delete, or port your data, or object to processing. To exercise these rights:</p>
            <p className="mt-2 font-mono text-sm text-cyan-400">contact@stellarbladeguide.com</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">International Users & Children</h2>
            <p>This site is operated from Canada. Your information may be transferred to and processed in Canada or other countries. By using the site, you consent to this transfer. This site is not directed to children under 13, and we do not knowingly collect their information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Changes</h2>
            <p>Updates will be reflected via the "Last Updated" date. Significant changes may be announced on the homepage. Please review periodically.</p>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: November 15, 2025
          </div>
        </div>
      </div>
    </div>
  )
}