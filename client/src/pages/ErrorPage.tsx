import { Link } from 'react-router-dom'
import { Home, AlertCircle, Clock, ServerCrash } from 'lucide-react'

interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
}

function ErrorPage({
  code = 404,
  title,
  message
}: ErrorPageProps) {

  const getDefaults = () => {
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
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-full border border-gray-700">
              <Icon className="w-16 h-16 text-blue-400" />
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">{code}</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">
          {title || defaults.title}
        </h2>
        <p className="text-gray-400 mb-8">
          {message || defaults.message}
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;