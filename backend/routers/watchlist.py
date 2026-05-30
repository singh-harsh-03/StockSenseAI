from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Watchlist
from pydantic import BaseModel
import uuid
import asyncio
import logging

from deps.auth import UserId
from services.stock_data import fetch_stock_data

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

logger = logging.getLogger(__name__)


class AddWatchlistItem(BaseModel):
    ticker: str


async def _enrich_one(ticker: str) -> dict | None:
    """Fetch live price/indicators for a single ticker; return None on failure."""
    try:
        return await fetch_stock_data(ticker)
    except Exception:
        logger.warning("Failed to enrich watchlist ticker %s", ticker, exc_info=True)
        return None


@router.get("")
async def get_watchlist(user_id: UserId, db: Session = Depends(get_db)):
    """Get all watchlist items for the authenticated user, enriched with live prices."""
    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()

    # Fetch live data for all tickers concurrently
    tickers = [item.ticker for item in items]
    results = await asyncio.gather(*[_enrich_one(t) for t in tickers])
    price_map = {t: r for t, r in zip(tickers, results) if r is not None}

    return {
        "success": True,
        "data": [
            {
                "id": str(item.id),
                "ticker": item.ticker,
                "added_at": str(item.added_at),
                **(price_map.get(item.ticker) or {}),
            }
            for item in items
        ],
    }


@router.post("")
def add_to_watchlist(body: AddWatchlistItem, user_id: UserId, db: Session = Depends(get_db)):
    """Add a stock to the authenticated user's watchlist."""
    existing = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == user_id, Watchlist.ticker == body.ticker)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Stock already in watchlist")

    item = Watchlist(id=str(uuid.uuid4()), user_id=user_id, ticker=body.ticker)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "success": True,
        "data": {"id": str(item.id), "ticker": item.ticker, "added_at": str(item.added_at)},
    }


@router.delete("/{ticker}")
def remove_from_watchlist(ticker: str, user_id: UserId, db: Session = Depends(get_db)):
    """Remove a stock from the authenticated user's watchlist."""
    item = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == user_id, Watchlist.ticker == ticker)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stock not in watchlist")
    db.delete(item)
    db.commit()
    return {"success": True, "message": f"{ticker} removed from watchlist"}
