import SignalBadge from './SignalBadge';
import './AISuggestionCard.css';

export default function AISuggestionCard({ data, loading }) {
  if (loading) {
    return (
      <div className="ai-card ai-card--loading">
        <div className="ai-card__shimmer" />
        <p>Analysing indicators with AI…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="ai-card">
      <div className="ai-card__header">
        <h3>AI Suggestion</h3>
        <SignalBadge signal={data.signal} />
      </div>
      <p className="ai-card__reasoning">{data.reasoning}</p>
      <div className="ai-card__meta">
        <span>RSI: {data.rsi}</span>
        <span>MACD: {data.macd}</span>
        <span>Price: ₹{data.current_price}</span>
      </div>
      {data.saved_to_history ? (
        <p className="ai-card__saved">Saved to your AI history (signed in).</p>
      ) : null}
    </div>
  );
}
