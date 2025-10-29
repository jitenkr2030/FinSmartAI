'use client';

import React from 'react';
import { ErrorTracker } from '@/lib/services/monitoringService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorTracker.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'error-boundary' }, [
        React.createElement('h2', { key: 'title' }, 'Something went wrong.'),
        React.createElement('details', { key: 'details' }, [
          React.createElement('summary', { key: 'summary' }, 'Error details'),
          React.createElement('pre', { key: 'pre' }, this.state.error?.toString())
        ])
      ]);
    }

    return this.props.children;
  }
}