import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    // Clear potentially corrupted game state
    try {
      localStorage.removeItem('poolGame');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Reload the page to start fresh
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Something went wrong</h2>
            <p className="text-gray-300 mb-6">
              The app encountered an error and needs to be reset. Your current game progress may be lost.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
              >
                Reset App
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                  Show Error Details (Dev Only)
                </summary>
                <div className="mt-2 p-4 bg-black/50 rounded text-xs text-red-300 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 