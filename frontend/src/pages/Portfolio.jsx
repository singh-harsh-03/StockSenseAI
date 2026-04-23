import { useState, useEffect } from 'react';
import { getPortfolio, addHolding, removeHolding, getStockData } from '../services/api';
import StockSearchInput from '../components/StockSearchInput';
import './Portfolio.css';

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [enriched, setEnriched] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ticker: '', buy_price: '', quantity: '', bought_on: '' });
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const res = await getPortfolio();
      setHoldings(res.data.data);
    } catch {
      void 0;
    }
  };

  const enrichTicker = async (ticker) => {
    try {
      const res = await getStockData(ticker);
      setEnriched((prev) => ({ ...prev, [ticker]: res.data.data }));
    } catch {
      void 0;
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    holdings.forEach((h) => {
      if (!enriched[h.ticker]) enrichTicker(h.ticker);
    });
  }, [holdings]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addHolding({
        ticker: form.ticker.trim().toUpperCase(),
        buy_price: parseFloat(form.buy_price),
        quantity: parseInt(form.quantity),
        bought_on: form.bought_on,
      });
      setForm({ ticker: '', buy_price: '', quantity: '', bought_on: '' });
      setShowForm(false);
      fetchPortfolio();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add holding');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeHolding(id);
      fetchPortfolio();
    } catch {
      alert('Failed to remove holding');
    }
  };

  // Calculate totals
  let totalInvested = 0;
  let totalCurrent = 0;
  holdings.forEach((h) => {
    const invested = h.buy_price * h.quantity;
    totalInvested += invested;
    const data = enriched[h.ticker];
    if (data) totalCurrent += data.current_price * h.quantity;
  });
  const totalPL = totalCurrent - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <h1>Portfolio</h1>
          <p className="port-subtitle">Track your holdings and P&L</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Holding'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="port-form">
          <div className="port-form-ticker">
            <StockSearchInput
              value={form.ticker}
              onChange={(v) => setForm((f) => ({ ...f, ticker: v }))}
              placeholder="Company or symbol…"
              minChars={2}
              required
            />
          </div>
          <input type="number" placeholder="Buy Price" step="0.01" value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: e.target.value })} required />
          <input type="number" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          <input type="date" value={form.bought_on} onChange={(e) => setForm({ ...form, bought_on: e.target.value })} required />
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? '…' : 'Add'}</button>
        </form>
      )}

      {holdings.length > 0 && (
        <div className="port-summary-bar">
          <div className="port-summary-item">
            <span>Invested</span><strong>₹{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
          </div>
          <div className="port-summary-item">
            <span>Current</span><strong>₹{totalCurrent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
          </div>
          <div className="port-summary-item">
            <span>P&L</span>
            <strong className={totalPL >= 0 ? 'positive' : 'negative'}>
              {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({totalPLPct.toFixed(2)}%)
            </strong>
          </div>
        </div>
      )}

      {holdings.length === 0 ? (
        <div className="port-empty">
          <p>No holdings yet. Add your first stock above!</p>
        </div>
      ) : (
        <table className="port-table">
          <thead>
            <tr><th>Ticker</th><th>Qty</th><th>Buy Price</th><th>Current</th><th>P&L</th><th></th></tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const data = enriched[h.ticker];
              const currentPrice = data ? data.current_price : 0;
              const pl = (currentPrice - h.buy_price) * h.quantity;
              const plPct = h.buy_price > 0 ? ((currentPrice - h.buy_price) / h.buy_price) * 100 : 0;
              return (
                <tr key={h.id}>
                  <td className="port-ticker">{h.ticker}</td>
                  <td>{h.quantity}</td>
                  <td>₹{h.buy_price}</td>
                  <td>{data ? `₹${currentPrice}` : '…'}</td>
                  <td className={pl >= 0 ? 'positive' : 'negative'}>
                    {data ? `${pl >= 0 ? '+' : ''}₹${pl.toFixed(0)} (${plPct.toFixed(1)}%)` : '…'}
                  </td>
                  <td>
                    <button className="port-remove" onClick={() => handleRemove(h.id)}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
