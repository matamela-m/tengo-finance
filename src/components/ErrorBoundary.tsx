import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '../i18n';
import { recordDiagnostic } from '../lib/diagnostics';

interface State {
  failed: boolean;
}

/**
 * Catches render errors so one broken screen never blanks the whole app. The top-level boundary takes
 * over the page; an embedded one (around each page) keeps the navigation so the person can move on.
 * Only the error name and route pattern are recorded, never the message (see lib/diagnostics).
 */
export class ErrorBoundary extends Component<{ children: ReactNode; embedded?: boolean; resetKey?: string }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    recordDiagnostic('render', error, window.location.pathname);
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Moving to another page clears an embedded error.
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.embedded) {
      return (
        <section role="alert" className="card mx-auto max-w-xl p-8 text-center">
          <h1 className="font-heading text-h2 text-ink">{i18n.t('errors.crashTitle')}</h1>
          <p className="mt-2 text-muted">{i18n.t('errors.crashBody')}</p>
          <button type="button" className="btn-primary mt-6" onClick={() => this.setState({ failed: false })}>
            {i18n.t('errors.retry')}
          </button>
        </section>
      );
    }
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-3xl font-extrabold">{i18n.t('errors.crashTitle')}</h1>
        <p className="max-w-md text-muted">{i18n.t('errors.crashBody')}</p>
        <button type="button" className="btn-primary" onClick={() => window.location.assign('/')}>
          {i18n.t('errors.crashCta')}
        </button>
      </main>
    );
  }
}
