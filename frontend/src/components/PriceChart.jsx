import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import './PriceChart.css';

function formatAxisDate(v) {
  if (!v || typeof v !== 'string') return '';
  if (v.includes(' ')) return v.slice(5, 16);
  return v.slice(5);
}

export default function PriceChart({ data }) {
  if (!data || data.length === 0) return <p className="chart-empty">No price data available.</p>;

  return (
    <div className="price-chart">
      <h3 className="chart-title">Price History</h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={formatAxisDate}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background: '#1e1b4b',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              color: '#e0e7ff',
              fontSize: '0.85rem',
            }}
            labelFormatter={(v) => (v && String(v).includes(' ') ? `Time: ${v}` : `Date: ${v}`)}
            formatter={(value) => [`₹${value}`, 'Price']}
          />
          <Area type="monotone" dataKey="close" stroke="#6366f1" fill="url(#priceGradient)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="sma50" stroke="#22d3ee" strokeWidth={1.2} dot={false} name="SMA 50" />
          <Line type="monotone" dataKey="sma200" stroke="#f472b6" strokeWidth={1.2} dot={false} name="SMA 200" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
