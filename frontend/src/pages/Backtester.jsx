import { useState } from 'react';
import { getBacktest } from '../services/api';
import BacktestResults from '../components/BacktestResults';
import StockSearchInput from '../components/StockSearchInput';
import './Backtester.css';

export default function Backtester() {
  const [ticker, setTicker] = useState('');
  const [strategy, setStrategy] = useState('rsi');
  const [fromDate, setFromDate] = useState('2023-01-01');
  const [toDate, setToDate] = useState('2024-01-01');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const sym = ticker.trim().toUpperCase();
      const res = await getBacktest(sym, strategy, fromDate, toDate);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Backtest failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backtester">
      <h1>Backtester</h1>
      <p className="bt-subtitle">Simulate trading strategies on historical data</p>

      <form onSubmit={handleRun} className="bt-form">
        <div className="bt-field bt-field-ticker">
          <label>Ticker</label>
          <StockSearchInput
            value={ticker}
            onChange={setTicker}
            placeholder="e.g. reliance or TCS.NS"
            minChars={2}
          />
        </div>
        <div className="bt-field">
          <label>Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="rsi">RSI (Buy &lt;30, Sell &gt;70)</option>
            <option value="macd">MACD Crossover</option>
          </select>
        </div>
        <div className="bt-field">
          <label>From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="bt-field">
          <label>To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button type="submit" className="bt-run" disabled={loading}>
          {loading ? 'Running…' : '▶ Run Backtest'}
        </button>
      </form>

      {error && <p className="bt-error">{error}</p>}
      <BacktestResults data={result} />
    </div>
  );
}
