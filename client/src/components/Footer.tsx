import { Link } from 'react-router-dom'

type FooterLink = { label: string; to: string } | { label: string; href: string }

// One flat row, not titled groups: at five links the headings were more chrome
// than content, and `Disclaimer / Terms / Privacy` reads as legal without being
// labelled so. The `nav` landmark is what a screen reader jumps to, and it stays.
// Worth regrouping if this list roughly doubles, or gains a category that is not
// self-evident from the labels.
const FOOTER_LINKS: FooterLink[] = [
  { label: 'Ko-fi', href: 'https://ko-fi.com/stellarbladeguide' },
  { label: 'Contact', href: 'mailto:contact@stellarbladeguide.com' },
  { label: 'Disclaimer', to: '/disclaimer' },
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

const linkClass = 'hover:text-cyan-400 transition-colors'

function FooterLinkItem({ link }: { link: FooterLink }) {
  if ('to' in link) {
    return (
      <Link to={link.to} className={linkClass}>
        {link.label}
      </Link>
    )
  }

  const external = link.href.startsWith('http')

  return (
    <a
      href={link.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={linkClass}
    >
      {link.label}
    </a>
  )
}

export default function Footer() {
  return (
    // The extra pb-20 clears the floating Contents / Back-to-top controls, which
    // stand ~66px off the viewport floor and land on the last line — which sits
    // under a button at most widths, so the 14px over 66 is doing visible work.
    // useFloatingControl marks <html> while either control is mounted; max-lg is
    // the controls' own breakpoint.
    <footer className="bg-nav border-t border-gray-800 py-8 max-lg:[:root[data-floating-controls]_&]:pb-20">
      {/* Nav is first in the DOM so mobile stacks it above the copyright. From md up,
          row-reverse moves the copyright to the left, and shrink-0 on the nav makes the
          copyright wrap instead of the link labels. */}
      <div className="container mx-auto px-4 flex flex-col gap-8 md:flex-row-reverse md:justify-between md:items-center">
        <nav aria-label="Footer" className="shrink-0">
          <ul className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <FooterLinkItem link={link} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-center md:text-left">
          <p className="text-gray-300 text-sm">
            &copy; {new Date().getFullYear()} Stellar Blade Guide. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Not affiliated with Shift Up Corporation or Sony Interactive Entertainment
          </p>
        </div>
      </div>
    </footer>
  )
}