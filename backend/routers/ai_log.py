from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import AILog

from deps.auth import UserId

router = APIRouter(prefix="/ai-log", tags=["AI Log"])


@router.get("/{ticker}")
def get_ai_log(ticker: str, user_id: UserId, db: Session = Depends(get_db)):
    """Get past AI suggestions for this ticker for the authenticated user."""
    query = db.query(AILog).filter(AILog.ticker == ticker, AILog.user_id == user_id)
    logs = query.order_by(AILog.created_at.desc()).all()
    return {
        "success": True,
        "data": [
            {
                "id": str(log.id),
                "ticker": log.ticker,
                "signal": log.signal,
                "reasoning": log.reasoning,
                "rsi_value": float(log.rsi_value) if log.rsi_value else None,
                "macd_value": float(log.macd_value) if log.macd_value else None,
                "created_at": str(log.created_at),
            }
            for log in logs
        ],
    }
