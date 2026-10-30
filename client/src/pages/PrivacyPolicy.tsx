import { Database, FileText, Globe, Bot, Cookie, /* Megaphone, */ Clock, Trash2, Shield, UserCheck, Users, RefreshCw } from 'lucide-react'
import SEO from '../components/SEO'
import seo from '../constants/seo.json'
import SectionHeader from '../components/SectionHeader'

const sections = [
  { id: 'info-collected', label: 'What we collect' },
  { id: 'how-we-use', label: 'How we use it' },
  { id: 'third-party', label: 'Who receives it' },
  { id: 'ai-moderation', label: 'AI moderation' },
  { id: 'cookies', label: 'Cookies & local storage' },
  // AdSense is off (its script in index.html is commented out). Every AdSense line on
  // this page is commented out, not deleted, so it can come back if ads return.
  // { id: 'advertising', label: 'Advertising' },
  // Since the October 30, 2026 rewrite, Third-Party Services is Who Receives It and sits above
  // Advertising, so a restored AdSense item there should say "below", not "above".
  { id: 'retention', label: 'How long we keep it' },
  { id: 'deleting', label: 'Deleting your account' },
  { id: 'security', label: 'Security' },
  { id: 'rights', label: 'Your rights' },
  { id: 'international', label: 'International users & children' },
  { id: 'changes', label: 'Changes to this policy' },
]

const linkClass = "text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 hover:decoration-cyan-400 transition-colors"

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 bg-primary">
      <SEO title={seo.pages['/privacy'].title} description={seo.pages['/privacy'].description} />
      <div className="container mx-auto px-3 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-100">Privacy Policy</h1>

        <nav className="bg-secondary/60 border border-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</h2>
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
            <SectionHeader icon={Database} id="info-collected">What We Collect</SectionHeader>
            <p><strong>When you visit:</strong> Our server logs the requests your browser makes to it. Each entry records your IP address, the time, and what was requested, so the log shows which walkthrough, level, and item type pages you open and what you search for. Some entries also record your browser type, such as those for signing in or staying signed in, and some record your username or account number, for example when you post a comment or change your password. If you sign up with an email address and password, that email address is logged too. A request that goes wrong or is refused can also log details from it. Our server doesn't log requests for images or the site's own files, or anything Cloudflare serves from its cache.</p>
            <p className="mt-2"><strong>Your account:</strong> If you sign up with an email address and password, we store your email address, your username, and a hash of your password (a one-way scrambled form of it). We never store the password itself. Every account also has a role (such as moderator), the dates it was created and last changed, and a link to its avatar, if it has one. Your email address is never shown publicly.</p>
            <p className="mt-2"><strong>Signing in with Google or Discord:</strong> If you sign in with Google or Discord, we use only your Google or Discord account ID, your email address and whether they've verified it, your name (on Discord, your username), and your profile picture, if you have one. A new account gets that email address, a username based on that name, and a link to that picture. Anyone can see that username next to your comments, and you can change it in Settings. If an account made through Google or Discord already has that email address, we link your sign-in to it instead. We keep your Google or Discord account ID so we can recognize you next time. Apart from that ID and what a new account is made from, we keep nothing they send, and we keep no access to your Google or Discord account. We never see your Google or Discord password, and accounts made this way have no password on our site. Signing in on their side is covered by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Google's privacy policy</a> or <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Discord's privacy policy</a>.</p>
            <p className="mt-2"><strong>Avatar:</strong> You can set an avatar in Settings by giving us a link to an image. Our server downloads the image once, so the site hosting it sees our server rather than you. OpenAI checks it (see <a href="#ai-moderation" className={linkClass}>AI moderation</a>), and if it passes, we store a small copy of it with Cloudinary; we don't keep the link you gave us. Your avatar shows next to your comments and in your account menu, and you can change or remove it in Settings.</p>
            <p className="mt-2"><strong>Google and Discord pictures:</strong> An account made through Google or Discord starts with your profile picture there as its avatar, if you have one. We save that picture's link once and never copy or check the picture, so browsers load it from Google or Discord until you set your own avatar or remove it. A Discord picture's link includes your Discord account ID, so anyone who can see your comments can find it.</p>
            <p className="mt-2"><strong>Comments:</strong> When you post a comment, we store its text, the page it's on, the comment it replies to (if any), when it was posted and last changed, and which account posted it. Comments are public. Each one shows your current username and avatar, plus a badge if you're a moderator or admin. The comment data anyone can load also includes your account number and when each comment was last changed.</p>
            <p className="mt-2"><strong>Reply notifications:</strong> When someone replies to your comment, we store a notification for you that says who replied, on which page, and when. We also store whether you've read it. Only you can see your notifications, and they appear only on the site, never by email.</p>
            <p className="mt-2"><strong>Progress:</strong> The collectibles you mark as found are saved in your browser while you're signed out, and with your account while you're signed in. When you sign in, what your browser saved is added to your account.</p>
            <p className="mt-2"><strong>Contact:</strong> If you email us, we receive your email address and your message.</p>
          </section>

          <section>
            <SectionHeader icon={FileText} id="how-we-use">How We Use It</SectionHeader>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>Sign you in and keep you signed in</li>
              <li>Show your comments, and let you know on the site when someone replies</li>
              <li>Save your progress and sync it across your devices</li>
              <li>Send a password reset email when one is requested for your account</li>
              <li>Check comments and the avatars you set in Settings for harmful content, and remove spam and other comments that break our Terms of Service</li>
              <li>Keep the site working and safe: watch its performance, find and fix problems, see which searches find nothing so we can improve the guide, and protect the site and accounts from abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell or rent your personal information, and we never provide your account details (email address or comment history) to advertisers.{/* AdSense is off:  Loading Google AdSense does mean Google independently receives standard request data and may use advertising cookies; see <a href="#advertising" className={linkClass}>Advertising</a> below. */}</p>
          </section>

          <section>
            <SectionHeader icon={Globe} id="third-party">Who Receives It</SectionHeader>
            <p>Some outside services handle your data so the site can run. Each has its own privacy policy.</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li><strong>Cloudflare</strong>: sits in front of the whole site, protects it from attacks and bots, keeps copies of the guide's public content so pages load faster, stores and serves the guide's images, and runs our web analytics</li>
              <li><strong>Railway</strong>: keeps our server logs and its own log of requests, and hosts our server, database, and cache, which hold your account, progress, comments, notifications, and sign-in sessions</li>
              <li><strong>OpenAI</strong>: checks comment text and the avatar images you set in Settings</li>
              <li><strong>Cloudinary</strong>: stores the avatars you set in Settings and delivers them to visitors' browsers</li>
              <li><strong>Resend</strong>: sends password reset emails, so it receives your email address and the email, including its one-time reset link, which expires after an hour</li>
              <li><strong>Migadu</strong>: hosts our contact mailbox, so it stores the emails you send us</li>
              <li><strong>Google and Discord</strong>: optional sign-in, and the profile pictures of accounts made that way, which visitors' browsers load from Google's or Discord's servers</li>
              <li><strong>Ko-fi and Stripe</strong>: voluntary tips, paid on Ko-fi's site through Stripe, not on ours</li>
              {/* AdSense is off: <li><strong>Google AdSense</strong> - advertising (see <a href="#advertising" className={linkClass}>Advertising</a> above)</li> */}
            </ul>
            <p className="mt-2">Every visit passes through Cloudflare, which decrypts it on the way. That means Cloudflare sees your IP address and everything your browser and our site send each other, including what you type into the site and your account details, such as your email address.</p>
            <p className="mt-2">Cloudflare also adds two scripts of its own to our pages: one helps tell people from bots, and the other runs our web analytics by reporting each page view. Cloudflare says its analytics use no cookies or other storage in your browser and don't identify or follow individual visitors. From the analytics, we see only totals, such as visits, countries, browsers, referring sites, and how fast pages load. See <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className={linkClass}>Cloudflare's privacy policy</a>.</p>
            <p className="mt-2">Avatars load in your browser straight from Cloudinary, Google, or Discord. Whenever a page shows one, that service receives your IP address and basic browser details, and can tell the request came from our site.</p>
            <p className="mt-2">The Ko-fi link at the bottom of every page opens Ko-fi's own site; there's no Ko-fi code on this site. If you support the site there, Ko-fi handles the payment through Stripe, and nothing from either reaches our server. Ko-fi shows us your Ko-fi username, the amount, and your message if you leave one. See <a href="https://more.ko-fi.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Ko-fi's privacy policy</a> and <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Stripe's privacy policy</a>.</p>
            <p className="mt-2">How long each of these services keeps what it receives depends on its own policies and, for some, on our account settings with it.</p>
          </section>

          <section>
            <SectionHeader icon={Bot} id="ai-moderation">AI Moderation</SectionHeader>
            <p>We use OpenAI's moderation service to check comments for harmful content such as harassment, hate, sexual content, violence, and self-harm. It also checks the avatars you set in Settings for sexual content, violence, and self-harm. It doesn't look for spam; our moderators can remove spam and other comments that break our Terms of Service.</p>
            <p className="mt-2">Comments are checked when you post or edit them, before they're saved. If OpenAI flags one, it isn't saved, and you'll see a message saying so. If the check can't be done, for example because OpenAI is down, the comment or edit is saved without it.</p>
            <p className="mt-2">For an avatar, OpenAI gets the image itself, not your link, and your current avatar stays unless the new image passes. We never send your username, email address, or IP address with a comment or an avatar. How OpenAI uses and keeps what we send depends on its rules for sites and apps that use its service, and on our account settings with it; see <a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer" className={linkClass}>how OpenAI handles that data</a>. By posting a comment or setting an avatar, you consent to this processing.</p>
          </section>

          <section>
            <SectionHeader icon={Cookie} id="cookies">Cookies & Local Storage</SectionHeader>
            <p>We set two cookies, both for signing in. One keeps you signed in: your session ends when you sign out, after 7 days without a visit, or 90 days after you signed in, whichever comes first. Changing or resetting your password, signing out of all devices, or deleting your account ends all of your sessions. The other protects a Google or Discord sign-in from forgery while it happens, and lasts at most 10 minutes. Cloudflare may also set cookies of its own, depending on our settings with it.</p>
            <p className="mt-2">We also keep a few small things in your browser's local storage: your progress while you're signed out; a note that you're signed in, with display details such as your username and avatar so pages can show them right away; the page to return to after a Google or Discord sign-in; and whether a one-time tip about clearing progress still needs to show.</p>
            <p className="mt-2">Our two cookies and these items are strictly functional.{/* AdSense is off:  Separately, this site loads Google AdSense, and Google may set or read its own advertising cookies and device identifiers as a third party — see <a href="#advertising" className={linkClass}>Advertising</a> below. */} You can clear cookies and local storage in your browser settings, which signs you out and deletes any progress that isn't on an account yet.</p>
          </section>

          {/* AdSense is off (its script in index.html is commented out). If ads return, restore
              this section with the Megaphone import, its entry in `sections`, and the AdSense
              lines in How We Use, Cookies and Third-Party Services.
          <section>
            <SectionHeader icon={Megaphone} id="advertising">Advertising</SectionHeader>
            <p>This site participates in Google AdSense, and the Google AdSense script is included on every page.</p>
            <p className="mt-2">The site is currently in Google's site-review stage. <strong>No ads are displayed</strong> — there are no ad units anywhere on the site. This section will be updated before any ads begin to serve.</p>
            <p className="mt-2">When your browser loads that script, it is requested directly from Google's servers, so Google receives standard request information including your IP address, browser user agent, and the page you are viewing. Google may also set or read cookies and similar device identifiers as a third party. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this site or other sites, and Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet. This processing is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>Google's privacy policy</a> and by <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className={linkClass}>how Google uses information from sites that use its services</a>.</p>
            <p className="mt-2">You may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className={linkClass}>Google's Ads Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className={linkClass}>www.aboutads.info</a>.</p>
          </section>
          */}

          <section>
            <SectionHeader icon={Clock} id="retention">How Long We Keep It</SectionHeader>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li><strong>Server logs</strong>: Railway, our host, keeps our server logs, and its own log of the requests that reach our server (page loads included), for 90 days. They can't be deleted or changed before then, even if you delete your account.</li>
              <li><strong>Your account and its data</strong>: until the account is deleted. Nothing deletes an account automatically, however long it goes unused. If we remove an item from the guide, it also disappears from your progress.</li>
              <li><strong>Deactivated accounts</strong>: if we deactivate an account, it can no longer sign in, but its data is kept and its comments stay visible. Its owner can ask us to delete it.</li>
              <li><strong>Comments</strong>: until you or a moderator delete them. Deleting a comment erases its text, but we keep a record that you posted a comment on that page and when. A deleted comment disappears from the page, or, while a reply to it is still up, shows as "[deleted]" without your username or avatar.</li>
              <li><strong>Notifications</strong>: until you delete your account. Deleting a reply doesn't remove the notification it sent, which still shows your username to the person you replied to.</li>
            </ul>
          </section>

          <section>
            <SectionHeader icon={Trash2} id="deleting">Deleting Your Account</SectionHeader>
            <p>You can delete your account at any time in Settings, or ask us to. Deleting it signs you out everywhere and removes your account, any link to a Google or Discord account, your progress, and the notifications you received. We keep no backups, so these are gone for good. Removing an avatar you set in Settings, or deleting your account, also asks Cloudinary to delete the image; if that doesn't work, it stays there. Copies Cloudinary has already cached, including copies of an avatar you've replaced, can stay reachable for a while, depending on Cloudinary.</p>
            <p className="mt-2">Some things stay after you delete your account:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li><strong>Your comments</strong>: they stay on their pages with the author shown as "[deleted]", without your username or avatar, and are no longer linked to any account. In the comment data anyone can load, though, they all show the same last-changed time (when you deleted your account), so someone could tell they came from one account.</li>
              <li><strong>Notifications you sent</strong>: the ones your replies sent to other people stay, showing "Someone" in place of your username.</li>
              <li><strong>Server logs</strong>: entries already written stay until their 90 days are up.</li>
            </ul>
            <p className="mt-2">To remove a comment's text, delete the comment before you delete your account, or email us afterwards.</p>
          </section>

          <section>
            <SectionHeader icon={Shield} id="security">Security</SectionHeader>
            <p>Connections to the site use HTTPS, and passwords are stored only as hashes. Our server limits how many requests each IP address can make, and Cloudflare screens traffic for attacks and bots before it reaches us.</p>
          </section>

          <section>
            <SectionHeader icon={UserCheck} id="rights">Your Rights</SectionHeader>
            <p>Depending on your location, you may have rights to access, correct, delete, or export your personal data, or to withdraw consent for certain processing. In Settings you can change your username and avatar, change your password if your account has one, sign out of all devices, and delete your account. To exercise any of these rights, or for anything Settings doesn't cover, such as changing your email address or getting a copy of your data, contact us and we will respond promptly.</p>
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
            <p>Updates are reflected via the "Last Updated" date below. We encourage you to review this policy periodically.</p>
          </section>

          <div className="text-sm text-gray-400 text-center pt-6 border-t border-gray-700">
            Last Updated: October 30, 2026
          </div>
        </div>
      </div>
    </div>
  )
}