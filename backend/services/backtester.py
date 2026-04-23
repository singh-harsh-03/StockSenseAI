import yfinance as yf
import pandas as pd
import numpy as np
from ta.momentum import RSIIndicator
from ta.trend import MACD
from typing import Dict, Any, List


def run_backtest(
    ticker: str,
    strategy: str = "rsi",
    from_date: str = "2023-01-01",
    to_date: str = "2024-01-01",
) -> Dict[str, Any]:
    """
    Run a backtest for a given ticker and strategy over a date range.

    Strategies:
        rsi   - Buy when RSI < 30, sell when RSI > 70
        macd  - Buy on MACD bullish crossover, sell on bearish crossover

    Returns trade log, equity curve data, and summary statistics.
    """
    stock = yf.Ticker(ticker)
    df = stock.history(start=from_date, end=to_date)

    if df.empty:
        raise ValueError(f"No data found for {ticker} in date range {from_date} to {to_date}")

    close = df["Close"]

    # Compute indicators
    if strategy == "rsi":
        rsi = RSIIndicator(close=close, window=14)
        df["rsi"] = rsi.rsi()
        df = df.fillna(0)

        # Generate signals
        df["signal"] = 0
        df.loc[df["rsi"] < 30, "signal"] = 1     # Buy
        df.loc[df["rsi"] > 70, "signal"] = -1    # Sell

    elif strategy == "macd":
        macd = MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        df["macd_line"] = macd.macd()
        df["signal_line"] = macd.macd_signal()
        df = df.fillna(0)

        # Generate signals: buy when MACD crosses above signal, sell on cross below
        df["signal"] = 0
        df.loc[
            (df["macd_line"] > df["signal_line"]) &
            (df["macd_line"].shift(1) <= df["signal_line"].shift(1)),
            "signal"
        ] = 1
        df.loc[
            (df["macd_line"] < df["signal_line"]) &
            (df["macd_line"].shift(1) >= df["signal_line"].shift(1)),
            "signal"
        ] = -1
    else:
        raise ValueError(f"Unknown strategy: {strategy}. Use 'rsi' or 'macd'.")

    # Simulate trades
    initial_capital = 100000.0
    capital = initial_capital
    shares = 0
    trades: List[Dict[str, Any]] = []
    equity_curve: List[Dict[str, Any]] = []

    for date, row in df.iterrows():
        date_str = date.strftime("%Y-%m-%d")
        price = float(row["Close"])

        if row["signal"] == 1 and shares == 0:
            # BUY
            shares = int(capital // price)
            if shares > 0:
                cost = shares * price
                capital -= cost
                trades.append({
                    "date": date_str,
                    "action": "BUY",
                    "price": round(price, 2),
                    "shares": shares,
                    "value": round(cost, 2),
                })
        elif row["signal"] == -1 and shares > 0:
            # SELL
            revenue = shares * price
            capital += revenue
            trades.append({
                "date": date_str,
                "action": "SELL",
                "price": round(price, 2),
                "shares": shares,
                "value": round(revenue, 2),
            })
            shares = 0

        portfolio_value = capital + shares * price
        equity_curve.append({
            "date": date_str,
            "value": round(portfolio_value, 2),
        })

    # Final value
    final_value = capital + shares * float(df.iloc[-1]["Close"])
    total_return = ((final_value - initial_capital) / initial_capital) * 100

    return {
        "ticker": ticker,
        "strategy": strategy,
        "from_date": from_date,
        "to_date": to_date,
        "initial_capital": initial_capital,
        "final_value": round(final_value, 2),
        "total_return_pct": round(total_return, 2),
        "total_trades": len(trades),
        "trades": trades,
        "equity_curve": equity_curve,
    }
