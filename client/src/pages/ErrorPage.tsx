import { Link, useInRouterContext } from 'react-router-dom'
import { Home, AlertCircle, Clock, ServerCrash, RefreshCw, WifiOff } from 'lucide-react'
import SEO from '../components/SEO'
import { NETWORK_ERROR_MESSAGE } from '../services/api'

// Shared by the two home-link variants below so they cannot drift apart.
const HOME_LINK_CLASSES = 'inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all duration-200';

interface ErrorPageProps {
  // null: nothing to number, a crash in the browser rather than an HTTP answer.
  code?: number | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  offline?: boolean;
}

function ErrorPage({
  code = 404,
  title,
  message,
  onRetry,
  offline = false,
}: ErrorPageProps) {

  const getDefaults = () => {
    if (offline) {
      return {
        title: 'Connection problem',
        message: NETWORK_ERROR_MESSAGE,
        icon: WifiOff,
      };
    }
    switch (code) {
      case 404:
        return {
          title: 'Page Not Found',
          message: "The page you're looking for doesn't exist or has been moved.",
          icon: AlertCircle
        };
      case 429:
        return {
          title: 'Too Many Requests',
          message: "Slow Down. Try again in a few minutes.",
          icon: Clock
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          icon: ServerCrash
        };
      default:
        return {
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again later.',
          icon: AlertCircle
        };
    }
  };

  const defaults = getDefaults();
  const Icon = defaults.icon;
  // The root ErrorBoundary (main.tsx) sits above BrowserRouter, so its fallback
  // renders this page with no Router in context, where <Link> throws and React
  // empties the root to a blank page. A plain anchor keeps the way out usable,
  // and the page fills the viewport itself: flex-1 is sized for the space
  // between a navbar and footer that are not rendered there.
  const inRouter = useInRouterContext();

  return (
    <div className={`${inRouter ? 'flex-1' : 'min-h-dvh'} bg-primary flex items-center justify-center px-4`}>
      <SEO
        title={offline || code === null ? (title || defaults.title) : `${code} ${title || defaults.title}`}
        description={message || defaults.message}
        noindex
      />
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-full border border-gray-700">
              <Icon className="w-16 h-16 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* The status number is a label, not the heading — it is absent on the
            offline and unknown-code branches, which would otherwise have no h1
            at all. The title carries the heading on every branch. */}
        {!offline && code !== null && <div className="text-6xl font-bold text-gray-100 mb-4">{code}</div>}
        <h1 className="text-2xl font-semibold text-gray-300 mb-4">
          {title || defaults.title}
        </h1>
        <p className="text-gray-400 mb-8">
          {message || defaults.message}
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {onRetry && (offline || code !== 404) && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-gray-100 font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          {inRouter ? (
            <Link to="/" className={HOME_LINK_CLASSES}>
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          ) : (
            <a href="/" className={HOME_LINK_CLASSES}>
              <Home className="w-4 h-4" />
              Back to Home
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;