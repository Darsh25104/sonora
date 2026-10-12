import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileNav from './MobileNav.jsx';

/**
 * Persistent application shell:
 *
 *  ┌─────────┬──────────────────────────┐
 *  │ Sidebar │ Topbar + <Outlet/>       │
 *  └─────────┴──────────────────────────┘
 *  │            PlayerBar (fixed)       │
 *  │   MobileNav (mobile only, fixed)   │
 *  └────────────────────────────────────┘
 *
 * The player itself is rendered in App.jsx so audio never remounts.
 */
export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
