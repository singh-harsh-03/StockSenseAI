import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist, addToWatchlist, removeFromWatchlist, getStockData } from '../services/api';
import StockSearchInput from '../components/StockSearchInput';
import './Dashboard.css';

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState([]);
  const [stockInput, setStockInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [enriched, setEnriched] = useState({});

  const fetchWatchlist = async () => {
    try {
      const res = await getWatchlist();
      setWatchlist(res.data.data);
    } catch {
      void 0;
    }
  };

  const enrichStock = async (ticker) => {
    try {
      const res = await getStockData(ticker);
      setEnriched((prev) => ({ ...prev, [ticker]: res.data.data }));
    } catch {
      // Silently fail on enrichment
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    watchlist.forEach((item) => {
      if (!enriched[item.ticker]) {
        enrichStock(item.ticker);
      }
    });
  }, [watchlist]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!stockInput.trim()) return;
    setLoading(true);
    try {
      await addToWatchlist(stockInput.trim().toUpperCase());
      setStockInput('');
      fetchWatchlist();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (ticker) => {
    try {
      await removeFromWatchlist(ticker);
      setEnriched((prev) => {
        const n = { ...prev };
        delete n[ticker];
        return n;
      });
      fetchWatchlist();
    } catch {
      alert('Failed to remove stock');
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dash-subtitle">Your watchlist at a glance</p>
        </div>
        <form onSubmit={handleAdd} className="add-stock-form">
          <StockSearchInput
            className="dash-add-stock-search-wrap"
            inputClassName="add-stock-input"
            value={stockInput}
            onChange={setStockInput}
            placeholder="Company or symbol…"
            minChars={2}
          />
          <button type="submit" className="add-stock-btn" disabled={loading}>
            {loading ? '…' : '+ Add'}
          </button>
        </form>
      </header>

      {watchlist.length === 0 ? (
        <div className="dash-empty">
          <p>Your watchlist is empty.</p>
          <p className="dash-empty-hint">Add a stock ticker above to get started, or <Link to="/stock">search for a stock</Link>.</p>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item) => {
            const data = enriched[item.ticker];
            return (
              <Link to={`/s/${encodeURIComponent(item.ticker)}`} key={item.id} className="watchlist-card">
                <div className="wl-card-header">
                  <h3>{item.ticker}</h3>
                  <button
                    className="wl-remove"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(item.ticker);
                    }}
                  >
                    ✕
                  </button>
                </div>
                {data ? (
                  <>
                    <p className="wl-price">₹{data.current_price}</p>
                    <div className="wl-indicators">
                      <span>RSI: {data.rsi}</span>
                    </div>
                  </>
                ) : (
                  <p className="wl-loading">Loading…</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
