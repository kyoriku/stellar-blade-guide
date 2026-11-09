import { Component, type ErrorInfo, type ReactNode } from 'react'
import ErrorPage from '../pages/ErrorPage'

interface Props {
  children: ReactNode;
  // Compared by identity: a new value clears a caught error. RootLayout passes the router's location.
  resetKey?: unknown;
}

interface State {
  hasError: boolean;
  error?: Error;
  resetKey?: unknown;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, resetKey: props.resetKey };
  }

  // Leaves resetKey alone: a reset during the crash's own pass would send the crash up.
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  // Every new key is recorded, crashed or not, so a crash's own pass never sees a stale key.
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey === state.resetKey) return null;
    return { hasError: false, error: undefined, resetKey: props.resetKey };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production this could be sent to an error tracking service like Sentry
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // A crash in the browser, not a server answer, so no status numeral; a
      // reload is the honest retry, since anything less renders the same data again.
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
