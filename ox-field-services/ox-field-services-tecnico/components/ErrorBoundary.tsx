import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-white">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
          <h1 className="text-xl font-bold mb-2">Algo deu errado</h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-secondary text-primary font-bold rounded-xl hover:bg-secondary/90"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
