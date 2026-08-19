import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#141414] border border-[#EF5350]/40 p-6 my-4 text-[#F2F0E4] max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 pb-3 border-b border-[#EF5350]/20 mb-4">
            <AlertTriangle className="text-[#EF5350]" size={20} />
            <h3 className="font-display text-base uppercase tracking-wider text-[#EF5350]">
              {this.props.fallbackTitle || 'Component Rendering Recovered'}
            </h3>
          </div>
          <p className="font-sans text-xs text-[#888888] mb-3 leading-relaxed">
            An unexpected error occurred while rendering this section. The rest of the application remains active.
          </p>
          <div className="bg-[#0A0A0A] border border-[#EF5350]/20 p-3 mb-4 max-h-40 overflow-auto">
            <pre className="font-mono text-[11px] text-[#EF5350]/90 whitespace-pre-wrap break-words">
              {this.state.error?.message || String(this.state.error)}
            </pre>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0A] font-bold text-xs px-4 py-2 hover:bg-[#D4AF37]/90 transition-colors uppercase tracking-widest"
          >
            <RefreshCw size={12} /> Reload View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
