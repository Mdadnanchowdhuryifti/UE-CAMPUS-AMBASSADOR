import { Component, ErrorInfo, ReactNode } from 'react';
import { logSystemError } from '../services/adminService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Portal ErrorBoundary caught:', error, info);
    void logSystemError({
      source: 'ui_boundary',
      severity: 'critical',
      message: error.message || 'Unhandled React rendering error',
      path: window.location.pathname || '/',
      operation: 'render',
    });
  }

  render() {
    if (this.state.hasError) {
      let parsedDetail = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed && parsed.error) {
          parsedDetail = `Access or database error (${parsed.operationType} on ${parsed.path || 'database'}): ${parsed.error}`;
        }
      } catch {
        // plain string error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-[#0D0F12] p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4">
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              Portal Safeguard
            </div>
            <h2 className="font-display text-lg font-extrabold text-[#111318] dark:text-white">
              Something went wrong
            </h2>
            <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed break-words">
              {parsedDetail}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold py-2.5 rounded-lg cursor-pointer"
            >
              Reload Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
