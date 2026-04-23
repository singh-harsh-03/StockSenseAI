from sqlalchemy import Column, String, Integer, Numeric, DateTime, Date, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Stock(Base):
    __tablename__ = "stocks"
    ticker = Column(String, primary_key=True, index=True)
    name = Column(String)
    exchange = Column(String)


class Watchlist(Base):
    __tablename__ = "watchlist"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, index=True)
    ticker = Column(String, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())


class Portfolio(Base):
    __tablename__ = "portfolio"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, index=True)
    ticker = Column(String, index=True)
    buy_price = Column(Numeric(10, 2))
    quantity = Column(Integer)
    bought_on = Column(Date)


class AILog(Base):
    __tablename__ = "ai_log"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, index=True)
    ticker = Column(String, index=True)
    signal = Column(String)
    reasoning = Column(Text)
    rsi_value = Column(Numeric(5, 2))
    macd_value = Column(Numeric(10, 4))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
