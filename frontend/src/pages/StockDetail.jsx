import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getStockData, getAISuggestion, addToWatchlist, searchStocks, getAILog } from '../services/api';
import PriceChart from '../components/PriceChart';
import IndicatorChart from '../components/IndicatorChart';
import AISuggestionCard from '../components/AISuggestionCard';
import StockSearchInput from '../components/StockSearchInput';
import { useAuth } from '../contexts/AuthContext.jsx';
import './StockDetail.css';

const CHART_RANGES = [
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
  { id: '1mo', label: '1M' },
  { id: '1y', label: '1Y' },
  { id: '5y', label: '5Y' },
];

export default function StockDetail() {
  const { ticker: paramTicker } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [ticker, setTicker] = useState(paramTicker || '');
  const [searchInput, setSearchInput] = useState(paramTicker || '');
  const [stockData, setStockData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartRange, setChartRange] = useState('1y');
  const [aiHistory, setAiHistory] = useState([]);
  const hadTickerRouteRef = useRef(false);
  const prevParamTickerRef = useRef(undefined);
  const lastFetchedKeyRef = useRef(null);

  const fetchStock = useCallback(async (t, rangeKey, { soft } = { soft: false }) => {
    if (!soft) {
      setLoading(true);
      setStockData(null);
      setAiData(null);
    } else {
      setHistoryLoading(true);
    }
    setError('');
    try {
      const res = await getStockData(t, { chart_range: rangeKey });
      setStockData(res.data.data);
      setTicker(t);
    } catch (err) {
      setError(err.response?.data?.detail || 'Stock not found');
      if (!soft) {
        setStockData(null);
        setAiData(null);
      }
      lastFetchedKeyRef.current = null;
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  }, []);

  const refreshAiHistory = useCallback(async (symbol) => {
    if (!isAuthenticated || !symbol) {
      setAiHistory([]);
      return;
    }
    try {
      const res = await getAILog(symbol);
      setAiHistory(res.data.data || []);
    } catch {
      setAiHistory([]);
    }
  }, [isAuthenticated]);

  const fetchAI = async () => {
    setAiLoading(true);
    try {
      const res = await getAISuggestion(ticker);
      setAiData(res.data.data);
      await refreshAiHistory(ticker);
    } catch {
      setAiData({ signal: 'N/A', reasoning: 'AI analysis failed. Check API key.', saved_to_history: false });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const sym = stockData?.ticker || paramTicker;
    void refreshAiHistory(sym);
  }, [stockData?.ticker, paramTicker, isAuthenticated, refreshAiHistory]);

  const handleAddWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { replace: false, state: { from: location } });
      return;
    }
    try {
      await addToWatchlist(ticker);
      alert(`${ticker} added to watchlist!`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add');
    }
  };

  useEffect(() => {
    if (!paramTicker) {
      setStockData(null);
      setAiData(null);
      setError('');
      setTicker('');
      prevParamTickerRef.current = undefined;
      lastFetchedKeyRef.current = null;
      if (hadTickerRouteRef.current) {
        setSearchInput('');
        hadTickerRouteRef.current = false;
      }
      return;
    }
    hadTickerRouteRef.current = true;
    setSearchInput(paramTicker);
    const tickerChanged = prevParamTickerRef.current !== paramTicker;
    prevParamTickerRef.current = paramTicker;
    if (tickerChanged) {
      setChartRange('1y');
    }
    const rangeKey = tickerChanged ? '1y' : chartRange;
    const soft = !tickerChanged;
    const dedupeKey = `${paramTicker}|${rangeKey}`;
    if (lastFetchedKeyRef.current === dedupeKey) return;
    lastFetchedKeyRef.current = dedupeKey;
    void fetchStock(paramTicker, rangeKey, { soft });
  }, [paramTicker, chartRange, fetchStock]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setError('');
    try {
      if (/\.(NS|BO)$/i.test(q)) {
        navigate(`/s/${encodeURIComponent(q.toUpperCase())}`);
        return;
      }
      const res = await searchStocks(q, 12);
      const hits = res.data?.data || [];
      if (!hits.length) {
        setError('No matches — pick from the list or enter e.g. RELIANCE.NS');
        return;
      }
      const upper = q.toUpperCase();
      const hit =
        hits.find((h) => h.symbol.toUpperCase() === upper) ||
        hits.find((h) => h.symbol.split('.')[0].toUpperCase() === upper) ||
        hits[0];
      navigate(`/s/${encodeURIComponent(hit.symbol.toUpperCase())}`);
    } catch {
      setError('Search failed. Try again.');
    }
  };

  const handleSearchSelect = (sym) => {
    navigate(`/s/${encodeURIComponent(sym)}`);
  };

  const inputMatchesRoute =
    !!paramTicker &&
    searchInput.trim().toUpperCase() === String(paramTicker).toUpperCase();
  const suggestionsSuppressed =
    inputMatchesRoute && (!!stockData || loading);

  return (
    <div className="stock-detail">
      <form onSubmit={handleSearch} className="stock-search-form">
        <StockSearchInput
          className="stock-search-grow"
          inputClassName="stock-search-input"
          value={searchInput}
          onChange={setSearchInput}
          onSelect={handleSearchSelect}
          suppressSuggestions={suggestionsSuppressed}
          placeholder="e.g. reliance or TCS.NS"
          minChars={2}
        />
        <button type="submit" className="stock-search-btn">Analyse</button>
      </form>

      {loading && <p className="stock-loading">Fetching data…</p>}
      {error && <p className="stock-error">{error}</p>}

      {stockData && (
        <>
          <div className="stock-header">
            <div>
              <h1>{stockData.company_name}</h1>
              <span className="stock-ticker-label">{stockData.ticker}</span>
            </div>
            <div className="stock-header-right">
              <p className="stock-price">₹{stockData.current_price}</p>
              <div className="stock-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddWatchlist}
                  title={!isAuthenticated ? 'Sign in to save to your watchlist' : undefined}
                >
                  + Watchlist
                </button>
                <button className="btn-primary" onClick={fetchAI} disabled={aiLoading}>
                  {aiLoading ? 'Analysing…' : '🤖 Get AI Suggestion'}
                </button>
              </div>
            </div>
          </div>

          <div className="stock-indicators-row">
            <div className="indicator-pill"><span>RSI</span><strong>{stockData.rsi}</strong></div>
            <div className="indicator-pill"><span>MACD</span><strong>{stockData.macd}</strong></div>
            <div className="indicator-pill"><span>50 MA</span><strong>₹{stockData.ma50}</strong></div>
            <div className="indicator-pill"><span>200 MA</span><strong>₹{stockData.ma200}</strong></div>
            <div className="indicator-pill"><span>Vol</span><strong>{stockData.volume_trend}</strong></div>
          </div>

          <AISuggestionCard data={aiData} loading={aiLoading} />
          {isAuthenticated && stockData && (
            <div className="ai-history-panel">
              <h4 className="ai-history-title">Your AI history · {stockData.ticker}</h4>
              {aiHistory.length === 0 ? (
                <p className="ai-history-empty">No saved runs yet. Use “Get AI Suggestion” while signed in to build history.</p>
              ) : (
                <ul className="ai-history-list">
                  {aiHistory.slice(0, 10).map((row) => (
                    <li key={row.id} className="ai-history-row">
                      <span className={`ai-history-signal ai-history-signal--${String(row.signal).toLowerCase()}`}>
                        {row.signal}
                      </span>
                      <span className="ai-history-time">{row.created_at}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="chart-section">
            <div className="chart-range-toolbar">
              {CHART_RANGES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`chart-range-btn${chartRange === id ? ' chart-range-btn-active' : ''}`}
                  onClick={() => setChartRange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={`chart-section-body${historyLoading ? ' chart-section-loading' : ''}`}>
              <PriceChart data={stockData.history} />
              <IndicatorChart data={stockData.history} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
