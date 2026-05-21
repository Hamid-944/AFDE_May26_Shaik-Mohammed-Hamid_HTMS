export default function MetricCard({ title, value, caption, tone = 'aqua' }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span className="metric-title">{title}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-caption">{caption}</span>
    </article>
  );
}
