import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import TabBar from './TabBar';
import Banner from './Banner';
import ErrorBoundary from './ErrorBoundary';
import RailCards from '../rail/RailCards';

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      <TabBar />
      {/* .content holds the page and the right rail side by side on wide screens (index.css). */}
      <div className="content">
        <main id="main">
          <Banner />
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        {/* The rail: shown from 1520 px up and only when RailCards has something (a visitor sees nothing). */}
        <aside className="rail" aria-label="Your progress"><RailCards /></aside>
      </div>
    </div>
  );
}