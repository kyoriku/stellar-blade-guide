import { Component, type ErrorInfo, type ReactNode } from 'react'
import ErrorPage from '../pages/ErrorPage'

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production this could be sent to an error tracking service like Sentry
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // A crash in the browser, not a server answer, so no status numeral; a
      // reload is the honest retry, since the boundary has no state to reset.
      return (
        <ErrorPage
          code={null}
          title="Something went wrong"
          message="This page hit an error it couldn't recover from. Try again, or head back home."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;