import { Component, type ReactNode } from 'react'
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

  componentDidCatch(error: Error, errorInfo: any) {
    // In production this could be sent to an error tracking service like Sentry
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage code={500} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;