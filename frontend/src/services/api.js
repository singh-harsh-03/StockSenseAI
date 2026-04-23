import axios from 'axios';

/** In dev, use same-origin URLs so Vite proxies to FastAPI (see vite.config.js). */
function defaultApiBase() {
  if (import.meta.env.DEV) {
    return '';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
}

const API_URL = defaultApiBase();

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let accessTokenGetter = () => null;

/** Called from AuthProvider so protected API routes receive the JWT. */
export function setAccessTokenGetter(fn) {
  accessTokenGetter = typeof fn === 'function' ? fn : () => null;
}

api.interceptors.request.use((config) => {
  const token = accessTokenGetter();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Stock endpoints
export const searchStocks = (q, limit = 15) =>
  api.get('/stock/search', { params: { q, limit } });

export const getStockData = (ticker, params = {}) =>
  api.get(`/stock/${encodeURIComponent(ticker)}`, { params });
export const getAISuggestion = (ticker) => api.get(`/stock/${ticker}/ai`);
export const getBacktest = (ticker, strategy, fromDate, toDate) =>
  api.get(`/stock/${ticker}/backtest`, {
    params: { strategy, from_date: fromDate, to_date: toDate },
  });

// Watchlist (requires Authorization: Bearer <JWT>)
export const getWatchlist = () => api.get('/watchlist');
export const addToWatchlist = (ticker) => api.post('/watchlist', { ticker });
export const removeFromWatchlist = (ticker) =>
  api.delete(`/watchlist/${encodeURIComponent(ticker)}`);

// Portfolio
export const getPortfolio = () => api.get('/portfolio');
export const addHolding = (data) => api.post('/portfolio', data);
export const removeHolding = (holdingId) => api.delete(`/portfolio/${holdingId}`);

// AI Log
export const getAILog = (ticker) => api.get(`/ai-log/${encodeURIComponent(ticker)}`);

export const authMe = () => api.get('/auth/me');

export default api;
