import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-danger/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-danger/15 border border-danger/30 flex items-center justify-center text-danger mb-6 shadow-[0_0_30px_rgba(255,51,102,0.2)] animate-pulse">
            <AlertOctagon size={40} />
          </div>

          <h1 className="text-[26px] font-heading font-black text-white mb-2">Something went wrong</h1>
          <p className="text-[14px] text-charcoal-light max-w-sm mb-6 leading-relaxed font-medium">
            An unexpected glitch occurred. Don't worry, your data and active tasks are completely safe.
          </p>

          {this.state.error?.message && (
            <div className="max-w-md w-full bg-dark/80 border border-white/10 rounded-2xl p-4 mb-8 text-left font-mono text-[11px] text-danger/80 overflow-x-auto">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="w-full py-4 rounded-2xl bg-accent text-dark font-heading font-black text-[14px] uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,135,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
