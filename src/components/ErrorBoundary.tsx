import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '../i18n';

interface State {
  failed: boolean;
}

/** Catches render errors so one broken screen never blanks the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl font-extrabold">{i18n.t('errors.crashTitle')}</h1>
        <p className="max-w-md text-muted">{i18n.t('errors.crashBody')}</p>
        <button type="button" className="btn-primary" onClick={() => window.location.assign('/')}>
          {i18n.t('errors.crashCta')}
        </button>
      </main>
    );
  }
}
