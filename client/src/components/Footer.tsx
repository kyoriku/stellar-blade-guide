import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-nav border-t border-gray-800/50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Stellar Blade Guide. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Not affiliated with Shift Up Corporation or Sony Interactive Entertainment
            </p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link to="/disclaimer" className="hover:text-cyan-400 transition-colors">
              Disclaimer
            </Link>
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">
              Privacy
            </Link>
            <a
              href="mailto:contact@stellarbladeguide.com"
              className="hover:text-cyan-400 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}