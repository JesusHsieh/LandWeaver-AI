import React from 'react';

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.warn('[ErrorBoundary] caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '16px',
          background: '#0d0f0c', color: '#e3e3dd', fontFamily: 'Manrope, sans-serif',
        }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#b6f642' }}>載入失敗</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#8c947c', maxWidth: '400px', textAlign: 'center' }}>
            {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{
              padding: '8px 20px', background: 'transparent',
              border: '1px solid #b6f642', color: '#b6f642',
              borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            重試
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
