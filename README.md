# StockSense AI

Full-stack stock research app for Indian markets: search, charts (1D–5Y), RSI/MACD, AI suggestions (Groq), backtests, watchlist, and portfolio. **Authentication is local:** email + password with **bcrypt** hashes and **JWT** sessions in **SQLite** (configurable via `DATABASE_URL`).

## Stack

- **Frontend:** React (Vite), React Router, Recharts, Axios  
- **Backend:** FastAPI, SQLAlchemy, SQLite, PyJWT, passlib/bcrypt, yfinance, Groq API  

## Prerequisites

- Node 18+  
- Python 3.11+  
- Optional: Groq API key for AI suggestions  

## Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set a strong **`JWT_SECRET`** (for example `openssl rand -hex 32`). Optional: `JWT_EXPIRE_HOURS` (default 168), `DATABASE_URL` for another DB.

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

On first start, SQLite tables are created; existing SQLite files get an `ALTER TABLE` for `users.password_hash` if needed.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

In development, Vite proxies `/stock`, `/auth`, `/watchlist`, `/portfolio`, `/ai-log` to `http://127.0.0.1:8000`.

For production builds, set **`VITE_API_URL`** to your API origin.

### 3. Using the app

- **Sign up / Sign in** at `/login`. Accounts live in your `users` table.  
- **Dashboard** (watchlist) and **Portfolio** require sign-in.  
- **Stock search** and **Backtester** are public.  
- **AI Suggestion:** works for everyone; when **signed in**, results are saved to **AI history** for that ticker.  

## API auth

Protected routes (`/watchlist`, `/portfolio`, `/ai-log`, `/auth/me`) expect:

`Authorization: Bearer <access_token>`

Tokens are returned from `POST /auth/register` and `POST /auth/login`. The frontend stores the token in `localStorage` and sends it on each request.

## License

Personal / portfolio use.
