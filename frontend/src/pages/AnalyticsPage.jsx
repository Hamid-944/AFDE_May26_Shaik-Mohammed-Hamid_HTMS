import { useEffect, useState, useCallback } from 'react';
import {
  BarChart2, RefreshCw, Database, TrendingUp,
  FileText, Zap, Server, CheckCircle2, AlertTriangle, Copy,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import {
  fetchAnalyticsSummary,
  fetchAnalyticsCategories,
  fetchAnalyticsPriorityDistribution,
  fetchAnalyticsDepartmentStats,
  fetchAnalyticsResolutionTrends,
  fetchEtlStatus,
  runEtl,
} from '../api';

const PRIORITY_TONE = { Low: 'mint', Medium: 'gold', High: 'coral', Critical: 'red' };
const PRIORITY_COLOR = {
  Low:      'var(--mint)',
  Medium:   'var(--gold)',
  High:     'var(--coral)',
  Critical: '#ff5555',
};

/* ── ETL Pipeline Card ─────────────────────────────────────────────────── */

function PipelineStage({ icon: Icon, label, value, sub, active, done }) {
  return (
    <div className={`pipeline-stage ${active ? 'pipeline-active' : ''} ${done ? 'pipeline-done' : ''}`}>
      <div className="pipeline-icon-wrap">
        <Icon size={18} />
      </div>
      <div className="pipeline-stage-body">
        <span className="pipeline-stage-label">{label}</span>
        {value != null && <strong className="pipeline-stage-value">{value}</strong>}
        {sub && <span className="pipeline-stage-sub">{sub}</span>}
      </div>
    </div>
  );
}

function EtlCard({ etlStatus, onRunEtl, running, result }) {
  const hasRun = !!etlStatus;

  return (
    <div className="etl-card glass-panel">
      <div className="etl-card-header">
        <div className="etl-card-title">
          <div className="etl-icon-badge">
            <Database size={20} />
          </div>
          <div>
            <h3>ETL Pipeline Control</h3>
            <p className="muted">
              {hasRun
                ? `Last run ${new Date(etlStatus.ran_at).toLocaleString()}`
                : 'No run recorded — click Run ETL to load historical data'}
            </p>
          </div>
        </div>
        <button
          className={`etl-trigger-btn ${running ? 'etl-trigger-running' : ''}`}
          onClick={onRunEtl}
          disabled={running}
          type="button"
        >
          <RefreshCw size={16} className={running ? 'spin' : ''} />
          {running ? 'Processing…' : 'Run ETL Pipeline'}
        </button>
      </div>

      <div className="pipeline-track">
        <PipelineStage
          icon={FileText}
          label="Extract"
          value={hasRun ? `${etlStatus.rows_in_csv} rows` : '—'}
          sub="CSV source file"
          done={hasRun}
        />
        <div className="pipeline-connector">
          <div className="pipeline-line" />
        </div>
        <PipelineStage
          icon={Zap}
          label="Transform"
          value={hasRun ? `-${etlStatus.bad_rows_dropped + etlStatus.duplicates_removed}` : '—'}
          sub={hasRun ? `${etlStatus.bad_rows_dropped} bad · ${etlStatus.duplicates_removed} dupes` : 'Normalize & deduplicate'}
          done={hasRun}
        />
        <div className="pipeline-connector">
          <div className="pipeline-line" />
        </div>
        <PipelineStage
          icon={Server}
          label="Load"
          value={hasRun ? `${etlStatus.rows_loaded} rows` : '—'}
          sub="reporting_tickets table"
          done={hasRun}
        />
      </div>

      {result && (
        <div className="etl-success-bar">
          <CheckCircle2 size={15} />
          Pipeline complete — {result.rows_loaded} rows loaded, {result.bad_rows_dropped} bad rows dropped,{' '}
          {result.duplicates_removed} duplicates removed.
        </div>
      )}
    </div>
  );
}

/* ── Category chart ────────────────────────────────────────────────────── */

function CategoryChart({ categories }) {
  const max = categories[0]?.count || 1;
  return (
    <article className="glass-panel content-card analytics-card">
      <div className="section-heading">
        <BarChart2 size={18} />
        <h3>Tickets by category</h3>
        <span className="section-count">{categories.length} categories</span>
      </div>
      {categories.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="analytics-bars">
          {categories.map((item, i) => (
            <div className="analytics-bar-row" key={item.category}>
              <span className="analytics-rank">#{i + 1}</span>
              <span className="analytics-bar-label">{item.category}</span>
              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill aqua-fill"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="analytics-bar-count">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

/* ── Priority distribution ─────────────────────────────────────────────── */

function PriorityChart({ distribution }) {
  const max = distribution[0]?.count || 1;
  return (
    <article className="glass-panel content-card analytics-card">
      <div className="section-heading">
        <AlertTriangle size={18} />
        <h3>Priority distribution</h3>
      </div>
      {distribution.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="analytics-bars">
          {distribution.map((item) => {
            const tone = PRIORITY_TONE[item.priority] || 'aqua';
            return (
              <div className="analytics-bar-row priority-row" key={item.priority}>
                <span className={`priority-pill prio-${tone}`}>{item.priority}</span>
                <div className="analytics-bar-track">
                  <div
                    className={`analytics-bar-fill prio-fill-${tone}`}
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
                <span className="analytics-bar-count">
                  {item.count}
                  <span className="pct-badge">{item.percentage}%</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

/* ── Department table ──────────────────────────────────────────────────── */

function DepartmentTable({ stats }) {
  return (
    <article className="glass-panel content-card analytics-card">
      <div className="section-heading">
        <CheckCircle2 size={18} />
        <h3>Department breakdown</h3>
      </div>
      {stats.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="dept-table-wrap">
          <table className="dept-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total</th>
                <th>Resolution rate</th>
                <th>Avg time</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => {
                const rate = row.total ? Math.round((row.resolved / row.total) * 100) : 0;
                return (
                  <tr key={row.department}>
                    <td className="dept-name">{row.department}</td>
                    <td className="dept-total">{row.total}</td>
                    <td className="dept-rate-cell">
                      <div className="dept-rate-bar-wrap">
                        <div className="dept-rate-bar">
                          <div className="dept-rate-fill" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="dept-rate-pct">{rate}%</span>
                      </div>
                    </td>
                    <td className="dept-avg">
                      {row.avg_resolution_hours != null
                        ? <span className="avg-chip">{row.avg_resolution_hours}h</span>
                        : <span className="muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

/* ── Trend bar chart ───────────────────────────────────────────────────── */

function TrendChart({ trends }) {
  const max = Math.max(...trends.map((t) => t.count), 1);
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <article className="glass-panel content-card analytics-card">
      <div className="section-heading">
        <TrendingUp size={18} />
        <h3>Monthly ticket volume</h3>
        {trends.length > 0 && (
          <span className="section-count">{trends.length} months</span>
        )}
      </div>
      {trends.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="trend-wrap">
          <div className="trend-y-axis">
            {[...gridLines].reverse().map((v) => (
              <span key={v} className="trend-y-label">{v}</span>
            ))}
          </div>
          <div className="trend-inner">
            <div className="trend-grid">
              {gridLines.map((v) => (
                <div key={v} className="trend-grid-line" />
              ))}
            </div>
            <div className="trend-bars">
              {trends.map((t) => {
                const pct = (t.count / max) * 100;
                return (
                  <div className="trend-bar-col" key={`${t.year}-${t.month}`}>
                    <span className="trend-bar-count">{t.count}</span>
                    <div className="trend-bar-slot">
                      <div className="trend-bar" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="trend-bar-label">
                      {t.month_label.replace(' ', '\n')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function EmptyChart() {
  return (
    <div className="empty-chart">
      <Copy size={28} />
      <p>No data yet — run the ETL pipeline to load historical records.</p>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [summary, setSummary]       = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorityDist, setPrio]     = useState([]);
  const [deptStats, setDept]        = useState([]);
  const [trends, setTrends]         = useState([]);
  const [etlStatus, setEtlStatus]   = useState(undefined);
  const [loading, setLoading]       = useState(true);
  const [etlRunning, setEtlRunning] = useState(false);
  const [etlResult, setEtlResult]   = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, cats, prio, dept, trend, etl] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchAnalyticsCategories(),
        fetchAnalyticsPriorityDistribution(),
        fetchAnalyticsDepartmentStats(),
        fetchAnalyticsResolutionTrends(),
        fetchEtlStatus(),
      ]);
      setSummary(sum);
      setCategories(cats);
      setPrio(prio);
      setDept(dept);
      setTrends(trend);
      setEtlStatus(etl);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRunEtl = async () => {
    setEtlRunning(true);
    setEtlResult(null);
    try {
      const result = await runEtl();
      setEtlResult(result);
      await loadAll();
    } finally {
      setEtlRunning(false);
    }
  };

  const hasData = summary && summary.total_tickets > 0;

  return (
    <div className="page-stack">
      <header className="page-hero glass-panel">
        <div>
          <span className="eyebrow">ETL analytics</span>
          <h2>Historical support data, cleaned and visualised.</h2>
          <p>
            The ETL pipeline extracts 223-row CSV data, normalises dirty values,
            drops bad records, deduplicates, then reloads the reporting table.
          </p>
        </div>
        <div className="hero-badge">
          <BarChart2 size={18} />
          <span>Admin only</span>
        </div>
      </header>

      <EtlCard
        etlStatus={etlStatus}
        onRunEtl={handleRunEtl}
        running={etlRunning}
        result={etlResult}
      />

      {loading && !summary ? (
        <div className="analytics-loading glass-panel">
          <RefreshCw size={22} className="spin" />
          <p className="muted">Loading analytics…</p>
        </div>
      ) : !hasData ? (
        <div className="analytics-empty glass-panel">
          <Database size={36} />
          <h3>No reporting data yet</h3>
          <p className="muted">Click "Run ETL Pipeline" above to extract and load the historical dataset.</p>
        </div>
      ) : (
        <>
          <section className="metric-grid">
            <MetricCard title="Total records"    value={summary.total_tickets}       caption="In reporting table"        tone="aqua"  />
            <MetricCard title="Resolved"         value={summary.resolved_tickets}    caption="Closed with notes"         tone="mint"  />
            <MetricCard title="Open"             value={summary.open_tickets}        caption="Awaiting action"           tone="gold"  />
            <MetricCard
              title="Avg resolution"
              value={summary.avg_resolution_hours != null ? `${summary.avg_resolution_hours}h` : '—'}
              caption="Hours from open to resolved"
              tone="coral"
            />
          </section>

          <section className="content-grid analytics-main-grid">
            <CategoryChart categories={categories} />
            <PriorityChart distribution={priorityDist} />
          </section>

          <section className="content-grid analytics-lower-grid">
            <DepartmentTable stats={deptStats} />
            <TrendChart trends={trends} />
          </section>
        </>
      )}
    </div>
  );
}
