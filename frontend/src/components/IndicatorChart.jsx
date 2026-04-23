import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './PriceChart.css';

function formatAxisDate(v) {
  if (!v || typeof v !== 'string') return '';
  if (v.includes(' ')) return v.slice(5, 16);
  return v.slice(5);
}

export default function IndicatorChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="indicator-chart">
      <h3 className="chart-title">RSI & MACD</h3>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ color: '#a5b4fc', fontSize: '0.85rem', margin: '0 0 8px 0' }}>RSI (14)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatAxisDate} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '70', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: '30', fill: '#10b981', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e0e7ff', fontSize: '0.8rem' }}
            />
            <Line type="monotone" dataKey="rsi" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 style={{ color: '#a5b4fc', fontSize: '0.85rem', margin: '0 0 8px 0' }}>MACD</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatAxisDate} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Tooltip
              contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e0e7ff', fontSize: '0.8rem' }}
            />
            <Line type="monotone" dataKey="macd" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="MACD" />
            <Line type="monotone" dataKey="macd_signal" stroke="#f472b6" strokeWidth={1.5} dot={false} name="Signal" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
