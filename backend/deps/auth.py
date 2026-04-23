from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.security import decode_access_token
from db.database import get_db
from db.models import User

security = HTTPBearer(auto_error=False)


def _user_from_bearer_token(token: str, db: Session) -> dict:
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token") from None

    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")

    row = db.get(User, uid)
    if row is None or not row.password_hash:
        raise HTTPException(status_code=401, detail="User not found or account disabled")

    return {"id": row.id, "email": row.email, "name": row.name or row.email.split("@")[0]}


def get_current_user(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Session = Depends(get_db),
) -> dict:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _user_from_bearer_token(creds.credentials, db)


def get_optional_current_user(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Session = Depends(get_db),
) -> Optional[dict]:
    if creds is None or not creds.credentials:
        return None
    return _user_from_bearer_token(creds.credentials, db)


CurrentUser = Annotated[dict, Depends(get_current_user)]


def get_current_user_id(user: CurrentUser) -> str:
    return user["id"]


UserId = Annotated[str, Depends(get_current_user_id)]
