import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import TabBar from './TabBar';
import Banner from './Banner';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      <TabBar />
      <main id="main">
        <Banner />
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
