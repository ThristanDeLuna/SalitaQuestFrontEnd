import { Component } from 'react';
import SystemScreen from './SystemScreen';
import ReportLink from './ReportLink';

// Catches a crash inside a page so the user sees a friendly screen, not a blank page.
// resetKey changes when the route changes, which clears the error.
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <SystemScreen title="Something went wrong"
                    actions={<>
                      <button type="button" className="btn" onClick={() => this.setState({ failed: false })}>Try again</button>
                      <ReportLink>Report this</ReportLink>
                    </>}>
        It is not your fault. Try again, or tell us.
      </SystemScreen>
    );
  }
}
