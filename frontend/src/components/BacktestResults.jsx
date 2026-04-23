import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './BacktestResults.css';

export default function BacktestResults({ data }) {
  if (!data) return null;

  const isPositive = data.total_return_pct >= 0;

  return (
    <div className="backtest-results">
      <div className="backtest-summary">
        <div className="backtest-stat">
          <span className="stat-label">Strategy</span>
          <span className="stat-value">{data.strategy.toUpperCase()}</span>
        </div>
        <div className="backtest-stat">
          <span className="stat-label">Period</span>
          <span className="stat-value">{data.from_date} → {data.to_date}</span>
        </div>
        <div className="backtest-stat">
          <span className="stat-label">Initial Capital</span>
          <span className="stat-value">₹{data.initial_capital.toLocaleString()}</span>
        </div>
        <div className="backtest-stat">
          <span className="stat-label">Final Value</span>
          <span className="stat-value">₹{data.final_value.toLocaleString()}</span>
        </div>
        <div className="backtest-stat">
          <span className="stat-label">Return</span>
          <span className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{data.total_return_pct}%
          </span>
        </div>
        <div className="backtest-stat">
          <span className="stat-label">Trades</span>
          <span className="stat-value">{data.total_trades}</span>
        </div>
      </div>

      <h4 className="chart-title">Equity Curve</h4>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data.equity_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#e0e7ff', fontSize: '0.8rem' }}
            formatter={(v) => [`₹${v.toLocaleString()}`, 'Portfolio']}
          />
          <Area type="monotone" dataKey="value" stroke={isPositive ? '#10b981' : '#ef4444'} fill="url(#equityGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      {data.trades.length > 0 && (
        <div className="trades-table-wrap">
          <h4 className="chart-title">Trade Log</h4>
          <table className="trades-table">
            <thead>
              <tr><th>Date</th><th>Action</th><th>Price</th><th>Shares</th><th>Value</th></tr>
            </thead>
            <tbody>
              {data.trades.map((t, i) => (
                <tr key={i}>
                  <td>{t.date}</td>
                  <td className={t.action === 'BUY' ? 'positive' : 'negative'}>{t.action}</td>
                  <td>₹{t.price}</td>
                  <td>{t.shares}</td>
                  <td>₹{t.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
