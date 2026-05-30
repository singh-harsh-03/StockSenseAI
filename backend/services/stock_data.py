import yfinance as yf
import pandas as pd
import asyncio
import time
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator
from typing import Dict, Any, List

# yfinance (period, interval) for chart ranges — intraday where supported
CHART_PRESETS: Dict[str, tuple[str, str]] = {
    "1d": ("1d", "5m"),
    "1w": ("5d", "1h"),
    "1mo": ("1mo", "1d"),
    "1y": ("1y", "1d"),
    "5y": ("5y", "1wk"),
}

_INTRADAY_INTERVALS = frozenset({"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"})

# TTL cache for fetch_stock_data 
# Prevents duplicate Yahoo Finance calls when the AI endpoint is hit
# right after loading the stock detail page.  Keyed by ticker.
_stock_data_cache: Dict[str, tuple[float, Dict[str, Any]]] = {}  # ticker -> (timestamp, data)
_CACHE_TTL = 60  # seconds


def _chart_date_str(ts, interval: str) -> str:
    if interval in _INTRADAY_INTERVALS:
        return ts.strftime("%Y-%m-%d %H:%M")
    return ts.strftime("%Y-%m-%d")


def _compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Compute RSI, MACD, SMA-50, SMA-200 and add as columns."""
    close = df["Close"]

    # RSI (14-period)
    rsi = RSIIndicator(close=close, window=14)
    df["rsi"] = rsi.rsi()

    # MACD (12, 26, 9)
    macd = MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
    df["macd"] = macd.macd()
    df["macd_signal"] = macd.macd_signal()
    df["macd_hist"] = macd.macd_diff()

    # Simple Moving Averages
    df["sma50"] = SMAIndicator(close=close, window=50).sma_indicator()
    df["sma200"] = SMAIndicator(close=close, window=200).sma_indicator()

    # 20-day average volume
    df["vol_avg_20"] = df["Volume"].rolling(window=20).mean()

    df = df.fillna(0)
    return df


async def fetch_stock_data(ticker: str, period: str = "1y", interval: str = "1d") -> Dict[str, Any]:
    """
    Fetch stock data and calculate RSI, MACD, and Moving Averages.
    Expects yfinance ticker format (e.g. TCS.NS for NSE stocks).
    Results are cached for 60 seconds to avoid redundant Yahoo Finance calls.
    """
    # ── Check cache ──
    cache_key = ticker.upper()
    cached = _stock_data_cache.get(cache_key)
    if cached and (time.monotonic() - cached[0]) < _CACHE_TTL:
        return cached[1]

    stock = yf.Ticker(ticker)
    df = await asyncio.to_thread(stock.history, period=period, interval=interval)

    if df.empty:
        raise ValueError(f"No data found for ticker: {ticker}")

    df = _compute_indicators(df)

    latest = df.iloc[-1]
    vol_avg = latest.get("vol_avg_20", 0)
    volume_trend = "above" if latest["Volume"] > vol_avg and vol_avg > 0 else "below"

    # Company name from yfinance info
    info = stock.info
    company_name = info.get("shortName", info.get("longName", ticker))

    result = {
        "ticker": ticker,
        "company_name": company_name,
        "current_price": round(float(latest["Close"]), 2),
        "rsi": round(float(latest.get("rsi", 0)), 2),
        "macd": round(float(latest.get("macd", 0)), 4),
        "macd_signal": round(float(latest.get("macd_signal", 0)), 4),
        "macd_hist": round(float(latest.get("macd_hist", 0)), 4),
        "ma50": round(float(latest.get("sma50", 0)), 2),
        "ma200": round(float(latest.get("sma200", 0)), 2),
        "volume": int(latest["Volume"]),
        "volume_trend": volume_trend,
    }

    # ── Store in cache ──
    _stock_data_cache[cache_key] = (time.monotonic(), result)

    return result


async def fetch_price_history(ticker: str, period: str = "1y", interval: str = "1d") -> List[Dict[str, Any]]:
    """
    Return OHLCV price history + indicators as a list of dicts for charting.
    """
    stock = yf.Ticker(ticker)
    df = await asyncio.to_thread(stock.history, period=period, interval=interval)

    if df.empty:
        raise ValueError(f"No data found for ticker: {ticker}")

    df = _compute_indicators(df)

    records = []
    for date, row in df.iterrows():
        records.append({
            "date": _chart_date_str(date, interval),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
            "rsi": round(float(row.get("rsi", 0)), 2),
            "macd": round(float(row.get("macd", 0)), 4),
            "macd_signal": round(float(row.get("macd_signal", 0)), 4),
            "sma50": round(float(row.get("sma50", 0)), 2),
            "sma200": round(float(row.get("sma200", 0)), 2),
        })

    return records