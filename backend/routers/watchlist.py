from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Watchlist
from pydantic import BaseModel
import uuid

from deps.auth import UserId

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


class AddWatchlistItem(BaseModel):
    ticker: str


@router.get("")
def get_watchlist(user_id: UserId, db: Session = Depends(get_db)):
    """Get all watchlist items for the authenticated user."""
    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    return {
        "success": True,
        "data": [
            {
                "id": str(item.id),
                "ticker": item.ticker,
                "added_at": str(item.added_at),
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
