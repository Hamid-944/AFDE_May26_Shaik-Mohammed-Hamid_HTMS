import { NavLink } from 'react-router-dom';
import { BadgeCheck, BarChart2, LayoutDashboard, PlusCircle, Search, Ticket, Shield, LogOut } from 'lucide-react';

const BASE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  { to: '/create', label: 'Create Ticket', icon: PlusCircle },
  { to: '/search', label: 'Search', icon: Search },
];

const ADMIN_NAV = [
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
];

export default function Shell({ user, onLogout, children }) {
  const navItems = user?.role === 'admin' ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;
  return (
    <div className="app-shell">
      <aside className="sidebar glass-panel">
        <div className="brand-block">
          <div className="brand-mark">HT</div>
          <div>
            <p className="eyebrow">Enterprise Support</p>
            <h1>Helpdesk Ticket Management</h1>
          </div>
        </div>

        <div className="identity-card">
          <div className="identity-icon">
            <Shield size={18} />
          </div>
          <div>
            <span className="muted">Signed in as</span>
            <strong>{user?.full_name}</strong>
            <span className="pill soft">{user?.role}</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end ?? false} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="status-chip">
            <BadgeCheck size={16} />
            <span>Connected to MySQL</span>
          </div>
          <button className="ghost-button" onClick={onLogout} type="button">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="workspace">
        <div className="ambient ambient-a" />
        <div className="ambient ambient-b" />
        {children}
      </main>
    </div>
  );
}
