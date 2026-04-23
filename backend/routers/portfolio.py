from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Portfolio
from pydantic import BaseModel
from datetime import date
import uuid

from deps.auth import UserId

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


class AddHolding(BaseModel):
    ticker: str
    buy_price: float
    quantity: int
    bought_on: date


@router.get("")
def get_portfolio(user_id: UserId, db: Session = Depends(get_db)):
    """Get all holdings for the authenticated user."""
    holdings = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    return {
        "success": True,
        "data": [
            {
                "id": str(h.id),
                "ticker": h.ticker,
                "buy_price": float(h.buy_price),
                "quantity": h.quantity,
                "bought_on": str(h.bought_on),
            }
            for h in holdings
        ],
    }


@router.post("")
def add_holding(body: AddHolding, user_id: UserId, db: Session = Depends(get_db)):
    """Add a new holding to the authenticated user's portfolio."""
    holding = Portfolio(
        id=str(uuid.uuid4()),
        user_id=user_id,
        ticker=body.ticker,
        buy_price=body.buy_price,
        quantity=body.quantity,
        bought_on=body.bought_on,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return {
        "success": True,
        "data": {
            "id": str(holding.id),
            "ticker": holding.ticker,
            "buy_price": float(holding.buy_price),
            "quantity": holding.quantity,
            "bought_on": str(holding.bought_on),
        },
    }


@router.delete("/{holding_id}")
def remove_holding(holding_id: str, user_id: UserId, db: Session = Depends(get_db)):
    """Remove a holding from the authenticated user's portfolio."""
    holding = (
        db.query(Portfolio)
        .filter(Portfolio.id == holding_id, Portfolio.user_id == user_id)
        .first()
    )
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
    return {"success": True, "message": "Holding removed"}
