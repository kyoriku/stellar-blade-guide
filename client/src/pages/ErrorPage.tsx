import { Link } from 'react-router-dom'
import { Home, AlertCircle, Clock, ServerCrash, RefreshCw, WifiOff } from 'lucide-react'
import SEO from '../components/SEO'
import { NETWORK_ERROR_MESSAGE } from '../services/api'

interface ErrorPageProps {
  code?: number;
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

  return (
    <div className="min-h-main bg-primary flex items-center justify-center px-4">
      <SEO
        title={offline ? (title || defaults.title) : `${code} ${title || defaults.title}`}
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

        {!offline && <h1 className="text-6xl font-bold text-gray-100 mb-4">{code}</h1>}
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">
          {title || defaults.title}
        </h2>
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
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;