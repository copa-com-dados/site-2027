import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../components/ui/ErrorState';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] uncaught error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-md mx-auto px-gutter-mobile pt-20">
          <ErrorState title="Algo deu errado" message="Recarregue a página para tentar novamente." />
        </div>
      );
    }
    return this.props.children;
  }
}
