import { useState, useEffect, useRef } from 'react';
import { searchStocks } from '../services/api';
import './StockSearchInput.css';

export default function StockSearchInput({
  value,
  onChange,
  onSelect,
  /** When true, hide suggestions (e.g. symbol loaded and input still shows that ticker). */
  suppressSuggestions = false,
  placeholder = 'Search company or symbol…',
  className = '',
  inputClassName = '',
  minChars = 2,
  debounceMs = 200,
  disabled = false,
  required = false,
  autoComplete = 'off',
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [err, setErr] = useState('');
  /** Hide dropdown after a pick; reopen when user focuses or types again. */
  const [menuOpen, setMenuOpen] = useState(false);
  const skipSearchRef = useRef(false);
  const requestIdRef = useRef(0);

  const runSearch = async (q) => {
    const t = q.trim();
    if (t.length < minChars) return;
    const id = ++requestIdRef.current;
    setLoading(true);
    setErr('');
    try {
      const res = await searchStocks(t, 15);
      if (id !== requestIdRef.current) return;
      setResults(res.data.data || []);
    } catch {
      if (id !== requestIdRef.current) return;
      setResults([]);
      setErr('Search failed — same host as Vite (127.0.0.1 vs localhost) and API on :8000');
    } finally {
      if (id === requestIdRef.current) {
        setLoading(false);
        setDebouncing(false);
      }
    }
  };

  useEffect(() => {
    if (suppressSuggestions) {
      setResults([]);
      setErr('');
      setDebouncing(false);
      setLoading(false);
      return;
    }

    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      setResults([]);
      setDebouncing(false);
      return;
    }

    const t = value.trim();
    if (t.length < minChars) {
      setResults([]);
      setErr('');
      setDebouncing(false);
      return;
    }

    setDebouncing(true);
    const timeoutId = window.setTimeout(() => {
      void runSearch(value);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, debounceMs, minChars, suppressSuggestions]);

  const pick = (symbol) => {
    const sym = symbol.toUpperCase();
    skipSearchRef.current = true;
    requestIdRef.current += 1;
    onChange(sym);
    setResults([]);
    setErr('');
    setDebouncing(false);
    setLoading(false);
    setMenuOpen(false);
    onSelect?.(sym);
  };

  const trimmed = value.trim();
  const busy = debouncing || loading;
  const showPanel = menuOpen && !suppressSuggestions && trimmed.length >= 1;

  return (
    <div className={`stock-search-wrap ${className}`.trim()}>
      <input
        type="text"
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onFocus={() => setMenuOpen(true)}
        onBlur={() => setMenuOpen(false)}
        onChange={(e) => {
          setMenuOpen(true);
          onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            pick(results[0].symbol);
          }
        }}
      />
      {showPanel && (
        <ul
          className="stock-search-dropdown"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {trimmed.length < minChars && (
            <li className="stock-search-hint">Type at least {minChars} characters</li>
          )}
          {trimmed.length >= minChars && busy && (
            <li className="stock-search-hint">Searching…</li>
          )}
          {trimmed.length >= minChars && !busy && err && (
            <li className="stock-search-hint stock-search-err">{err}</li>
          )}
          {trimmed.length >= minChars && !busy && !err && results.length === 0 && (
            <li className="stock-search-hint">No matches</li>
          )}
          {trimmed.length >= minChars &&
            !busy &&
            !err &&
            results.map((row) => (
              <li key={row.symbol}>
                <button
                  type="button"
                  className="stock-search-option"
                  onClick={() => pick(row.symbol)}
                >
                  <span className="stock-search-sym">{row.symbol}</span>
                  <span className="stock-search-name">{row.long_name || row.short_name}</span>
                  {row.exchange ? <span className="stock-search-exch">{row.exchange}</span> : null}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
