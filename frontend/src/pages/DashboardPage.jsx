import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlusCircle, ShieldCheck, Ticket, User2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';

const STATUS_CONFIG = [
  { key: 'Open', label: 'Open', tone: 'gold' },
  { key: 'In Progress', label: 'In Progress', tone: 'coral' },
  { key: 'Resolved', label: 'Resolved', tone: 'mint' },
  { key: 'Closed', label: 'Closed', tone: 'aqua' },
];

function recentTickets(tickets) {
  return [...tickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
}

function useStats(tickets) {
  return useMemo(() => {
    const statusCount = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    const statusBreakdown = STATUS_CONFIG.map((item) => {
      const count = statusCount[item.key] || 0;
      return {
        ...item,
        count,
        share: tickets.length ? (count / tickets.length) * 100 : 0,
      };
    });

    return {
      total: tickets.length,
      open: statusCount.Open || 0,
      progress: statusCount['In Progress'] || 0,
      resolved: statusCount.Resolved || 0,
      closed: statusCount.Closed || 0,
      statusBreakdown,
    };
  }, [tickets]);
}

function formatShare(value) {
  return `${Math.round(value)}%`;
}

function buildDonutBackground(statusBreakdown) {
  const total = statusBreakdown.reduce((sum, item) => sum + item.count, 0);
  if (!total) {
    return 'radial-gradient(circle at center, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';
  }

  let cursor = 0;
  const slices = statusBreakdown
    .filter((item) => item.count > 0)
    .map((item) => {
      const start = cursor;
      const end = cursor + (item.count / total) * 100;
      cursor = end;
      const colorMap = {
        gold: 'rgba(255, 203, 107, 0.95)',
        coral: 'rgba(255, 143, 115, 0.95)',
        mint: 'rgba(139, 233, 197, 0.95)',
        aqua: 'rgba(64, 224, 208, 0.95)',
      };
      return `${colorMap[item.tone]} ${start}% ${end}%`;
    });

  return `conic-gradient(${slices.join(', ')})`;
}

function StatusAtlas({ stats }) {
  const total = stats.total;
  const topStatus = total ? [...stats.statusBreakdown].sort((a, b) => b.count - a.count)[0] : null;
  const donutBackground = buildDonutBackground(stats.statusBreakdown);

  return (
    <article className="glass-panel content-card status-atlas-card">
      <div className="section-heading">
        <Ticket size={18} />
        <h3>Ticket status atlas</h3>
      </div>

      <div className="status-atlas">
        <div className="status-donut-shell">
          <div className="status-donut" style={{ background: donutBackground }}>
            <div className="status-donut-core">
              <strong>{total}</strong>
              <span>Total tickets</span>
            </div>
          </div>
          <div className="status-donut-caption">
            <span className="muted">Largest slice</span>
            <strong>{topStatus?.label || 'No tickets yet'}</strong>
            <p>
              {topStatus && total
                ? `${formatShare(topStatus.share)} of the queue is currently ${topStatus.label.toLowerCase()}.`
                : 'Status distribution will appear once tickets are created.'}
            </p>
          </div>
        </div>

        <div className="status-legend">
          {stats.statusBreakdown.map((item) => (
            <div className="status-legend-item" key={item.key}>
              <div className="status-legend-head">
                <span className="status-legend-label">
                  <span className={`status-dot status-tone-${item.tone}`} />
                  {item.label}
                </span>
                <strong>{item.count}</strong>
              </div>
              <div className="status-track">
                <div
                  className={`status-fill status-tone-${item.tone}`}
                  style={{ width: `${item.share}%` }}
                />
              </div>
              <div className="status-legend-foot">
                <span>{formatShare(item.share)}</span>
                <span>{item.key === 'Open' ? 'Awaiting action' : item.key === 'In Progress' ? 'Active work' : item.key === 'Resolved' ? 'Fix completed' : 'Archived'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function RecentList({ tickets }) {
  if (!tickets.length) {
    return <p className="muted">No tickets yet.</p>;
  }
  return (
    <div className="recent-list">
      {recentTickets(tickets).map((ticket) => (
        <div className="recent-item" key={ticket.ticket_id}>
          <div>
            <strong>#{ticket.ticket_id} {ticket.issue_category}</strong>
            <p>{ticket.employee_name} · {ticket.department}</p>
          </div>
          <span className={`pill status-${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span>
        </div>
      ))}
    </div>
  );
}

function EmployeeDashboard({ tickets, user }) {
  const stats = useStats(tickets);
  return (
    <div className="page-stack">
      <header className="page-hero glass-panel">
        <div>
          <span className="eyebrow">My support tickets</span>
          <h2>Track your requests from submission to resolution.</h2>
          <p>All support tickets you've raised are shown here with live status updates.</p>
        </div>
        <div className="hero-badge">
          <User2 size={18} />
          <span>{user?.full_name}</span>
        </div>
      </header>

      <section className="metric-grid">
        <MetricCard title="Total submitted" value={stats.total} caption="Tickets you've raised" tone="aqua" />
        <MetricCard title="Open" value={stats.open} caption="Awaiting assignment" tone="gold" />
        <MetricCard title="In progress" value={stats.progress} caption="Being actively worked on" tone="coral" />
        <MetricCard title="Resolved" value={stats.resolved} caption="Completed and closed" tone="mint" />
      </section>

      <section className="content-grid">
        <article className="glass-panel content-card">
          <div className="section-heading">
            <Ticket size={18} />
            <h3>Your recent tickets</h3>
          </div>
          <RecentList tickets={tickets} />
        </article>

        <article className="glass-panel content-card accent-card">
          <div className="section-heading">
            <PlusCircle size={18} />
            <h3>Need help?</h3>
          </div>
          <div className="signal-list">
            <div>
              <strong>Raise a new request</strong>
              <p>Submit a ticket and the support team will respond as soon as possible.</p>
            </div>
            <div>
              <strong>Track your tickets</strong>
              <p>View status changes and resolution notes on the Tickets page.</p>
            </div>
            <div>
              <strong>Search your history</strong>
              <p>Use Search to find past tickets by keyword, category, or status.</p>
            </div>
          </div>
          <Link to="/create" className="primary-button dashboard-cta">
            Create new ticket <ArrowRight size={16} />
          </Link>
        </article>
      </section>
    </div>
  );
}

function AdminDashboard({ tickets }) {
  const stats = useStats(tickets);
  return (
    <div className="page-stack">
      <header className="page-hero glass-panel">
        <div>
          <span className="eyebrow">Operations dashboard</span>
          <h2>Turn support requests into a visible workflow.</h2>
          <p>Track total volume, live status, and recent activity from one polished command surface.</p>
        </div>
        <div className="hero-badge">
          <ShieldCheck size={18} />
          <span>Ready for support ops</span>
        </div>
      </header>

      <section className="metric-grid">
        <MetricCard title="Total tickets" value={stats.total} caption="All records in the system" tone="aqua" />
        <MetricCard title="Open" value={stats.open} caption="Fresh requests waiting" tone="gold" />
        <MetricCard title="In progress" value={stats.progress} caption="Currently being handled" tone="coral" />
        <MetricCard title="Resolved" value={stats.resolved} caption="Closed with resolution notes" tone="mint" />
      </section>

      <section className="content-grid">
        <article className="glass-panel content-card">
          <div className="section-heading">
            <Ticket size={18} />
            <h3>Recent tickets</h3>
          </div>
          <RecentList tickets={tickets} />
        </article>

        <StatusAtlas stats={stats} />
      </section>
    </div>
  );
}

export default function DashboardPage({ tickets, user }) {
  if (user?.role === 'admin') {
    return <AdminDashboard tickets={tickets} />;
  }
  return <EmployeeDashboard tickets={tickets} user={user} />;
}
