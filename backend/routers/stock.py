import uuid
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AILog
from deps.auth import get_optional_current_user
from services.stock_data import (
    CHART_PRESETS,
    fetch_stock_data,
    fetch_price_history,
)
from services.ai_advisor import get_ai_suggestion
from services.backtester import run_backtest
from services.stock_search import search_yahoo_finance

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/search")
def stock_search(q: str = "", limit: int = 15):
    """Keyword search across Yahoo Finance symbols and company names."""
    try:
        results = search_yahoo_finance(q, limit=limit)
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Yahoo search failed (rate limit or network). Try again shortly. {e}",
        ) from e


@router.get("/{ticker}")
def get_stock(
    ticker: str,
    chart_range: str = Query("1y", description="Chart window: 1d, 1w, 1mo, 1y, 5y"),
):
    """Get current price, indicators, and price history for a stock."""
    key = chart_range if chart_range in CHART_PRESETS else "1y"
    period, interval = CHART_PRESETS[key]
    try:
        indicators = fetch_stock_data(ticker)
        history = fetch_price_history(ticker, period=period, interval=interval)
        return {
            "success": True,
            "data": {
                **indicators,
                "history": history,
                "chart_range": key,
                "chart_period": period,
                "chart_interval": interval,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{ticker}/ai")
def get_ai_analysis(
    ticker: str,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_current_user),
):
    """Get AI-powered BUY/HOLD/SELL suggestion. If signed in (Bearer token), saves a row to your AI log."""
    try:
        result = get_ai_suggestion(ticker)
        saved = False
        if user:
            log = AILog(
                id=str(uuid.uuid4()),
                user_id=user["id"],
                ticker=ticker.upper(),
                signal=result.get("signal", "HOLD"),
                reasoning=(result.get("reasoning") or "")[:8000],
                rsi_value=Decimal(str(result.get("rsi", 0) or 0)),
                macd_value=Decimal(str(result.get("macd", 0) or 0)),
            )
            db.add(log)
            db.commit()
            saved = True
        return {"success": True, "data": {**result, "saved_to_history": saved}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/backtest")
def get_backtest(ticker: str, strategy: str = "rsi", from_date: str = "2023-01-01", to_date: str = "2024-01-01"):
    """Run a backtest for a stock with a given strategy and date range."""
    try:
        result = run_backtest(ticker, strategy, from_date, to_date)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
