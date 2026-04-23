from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from db.database import engine
from db import models
from routers import stock, watchlist, portfolio, ai_log, auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockSense AI API", description="AI-powered stock research assistant for Indian retail investors")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock.router)
app.include_router(auth.router)
app.include_router(watchlist.router)
app.include_router(portfolio.router)
app.include_router(ai_log.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to StockSense AI API"}
