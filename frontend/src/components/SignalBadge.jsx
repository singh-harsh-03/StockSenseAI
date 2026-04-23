import './SignalBadge.css';

export default function SignalBadge({ signal }) {
  const cls = signal ? signal.toLowerCase() : 'hold';
  return <span className={`signal-badge signal-${cls}`}>{signal || 'N/A'}</span>;
}
