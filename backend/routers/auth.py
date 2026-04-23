import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.security import create_access_token, hash_password, verify_password
from db.database import get_db
from db.models import User
from deps.auth import CurrentUser

router = APIRouter(prefix="/auth", tags=["Auth"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterBody(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field("", max_length=120)


class LoginBody(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=1, max_length=128)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    """Create a local user (password stored as bcrypt hash in SQLite)."""
    email = _normalize_email(body.email)
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    name = (body.name or "").strip() or email.split("@")[0]
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=email,
        name=name,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email, name=user.name)
    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name},
        },
    }


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    email = _normalize_email(body.email)
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user_id=user.id, email=user.email, name=user.name)
    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name},
        },
    }


@router.get("/me")
def auth_me(user: CurrentUser):
    """Return the current user (JWT in Authorization header)."""
    return {"success": True, "data": user}
