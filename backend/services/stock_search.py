import time
from typing import Any, Dict, List

import httpx

SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"

# Browser-like headers; Referer helps Yahoo accept automated requests.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
}


def _haystack(quote: Dict[str, Any]) -> str:
    parts = [
        quote.get("symbol") or "",
        quote.get("shortname") or "",
        quote.get("longname") or "",
        quote.get("exchDisp") or "",
        quote.get("exchange") or "",
        quote.get("sectorDisp") or "",
        quote.get("industryDisp") or "",
    ]
    return " ".join(parts).lower()


def _normalize_quote(quote: Dict[str, Any]) -> Dict[str, str]:
    symbol = quote.get("symbol") or ""
    short = quote.get("shortname") or ""
    longn = quote.get("longname") or ""
    return {
        "symbol": symbol.upper(),
        "short_name": short,
        "long_name": longn or short,
        "exchange": quote.get("exchDisp") or quote.get("exchange") or "",
        "type": quote.get("quoteType") or "",
    }


def _fetch_yahoo_search_json(params: Dict[str, Any]) -> dict:
    """Call Yahoo search; prefer curl_cffi (Chrome TLS) with retries on 429."""
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            import curl_cffi.requests as cr

            r = cr.get(
                SEARCH_URL,
                params=params,
                headers=HEADERS,
                impersonate="chrome",
                timeout=20,
            )
            if r.status_code == 429:
                time.sleep(1.0 + attempt * 1.5)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            last_error = e
            break

    for attempt in range(3):
        try:
            with httpx.Client(timeout=20.0, headers=HEADERS) as client:
                r = client.get(SEARCH_URL, params=params)
                if r.status_code == 429:
                    time.sleep(1.0 + attempt * 1.5)
                    continue
                r.raise_for_status()
                return r.json()
        except Exception as e:
            last_error = e

    assert last_error is not None
    raise last_error


def search_yahoo_finance(query: str, limit: int = 15) -> List[Dict[str, str]]:
    """
    Search Yahoo Finance for equities/ETFs. After Yahoo returns candidates,
    optionally keep only rows where every whitespace-separated keyword appears
    somewhere in symbol, names, exchange, sector, or industry (case-insensitive).
    If that filter removes everything, fall back to Yahoo's ranked list.
    """
    q = query.strip()
    if not q:
        return []

    limit = max(1, min(limit, 25))
    params = {
        "q": q,
        "quotesCount": min(50, limit * 3),
        "newsCount": 0,
        "listsCount": 0,
    }

    payload = _fetch_yahoo_search_json(params)

    quotes = payload.get("quotes") or []
    allowed_types = {"EQUITY", "ETF"}
    quotes = [x for x in quotes if x.get("quoteType") in allowed_types and x.get("symbol")]

    keywords = [k.lower() for k in q.split() if k.strip()]
    filtered: List[Dict[str, str]] = []

    for quote in quotes:
        hay = _haystack(quote)
        if keywords and not all(kw in hay for kw in keywords):
            continue
        filtered.append(_normalize_quote(quote))
        if len(filtered) >= limit:
            break

    if not filtered and quotes:
        for quote in quotes:
            filtered.append(_normalize_quote(quote))
            if len(filtered) >= limit:
                break

    return filtered
