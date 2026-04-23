import os
import logging
from groq import Groq
from services.stock_data import fetch_stock_data
from typing import Dict, Any

logger = logging.getLogger(__name__)


PROMPT_TEMPLATE = """
You are a stock research assistant for Indian retail investors.

Analyze the following stock data and provide a clear, practical trading insight.

Stock: {ticker} ({company_name})

Price: ₹{current_price}
RSI (14): {rsi}
MACD: {macd}, Signal: {macd_signal}
50-day MA: ₹{ma50}
200-day MA: ₹{ma200}
Volume trend: {volume_trend}

Follow these guidelines:
- RSI > 70 → overbought (possible pullback)
- RSI < 30 → oversold (possible bounce)
- Price above 50 & 200 MA → bullish trend
- MACD above signal → bullish momentum
- High volume supports trend strength

Now provide:

1. SHORT TERM (1–2 weeks): BUY / HOLD / SELL  
2. LONG TERM (3–6 months): BUY / HOLD / SELL  
3. CONFIDENCE SCORE: (0–100)

Then explain reasoning in 3–5 concise sentences.

Keep it direct, practical, and investor-friendly.
Do NOT include disclaimers.
"""


def get_ai_suggestion(ticker: str) -> Dict[str, Any]:
    """
    Fetch current indicators for a ticker and call Groq API
    to get a BUY/HOLD/SELL suggestion with reasoning.
    """
    # Fetch live indicator data
    data = fetch_stock_data(ticker)

    # Build the prompt
    prompt = PROMPT_TEMPLATE.format(
        ticker=data["ticker"],
        company_name=data["company_name"],
        current_price=data["current_price"],
        rsi=data["rsi"],
        macd=data["macd"],
        macd_signal=data["macd_signal"],
        ma50=data["ma50"],
        ma200=data["ma200"],
        volume_trend=data["volume_trend"],
    )

    # Call Groq API
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in environment variables")

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a stock research assistant for Indian retail investors. Be direct and practical."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        full_text = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error("Groq API error: %s", e)
        raise RuntimeError(f"AI service error: {e}") from e

    # Extract signal from first line
    signal = "HOLD"  # default
    first_line = full_text.split("\n")[0].strip().upper()
    for s in ["BUY", "SELL", "HOLD"]:
        if s in first_line:
            signal = s
            break

    # Reasoning is everything after the first line
    reasoning = "\n".join(full_text.split("\n")[1:]).strip()
    if not reasoning:
        reasoning = full_text

    return {
        "ticker": ticker,
        "company_name": data["company_name"],
        "signal": signal,
        "reasoning": reasoning,
        "current_price": data["current_price"],
        "rsi": data["rsi"],
        "macd": data["macd"],
        "macd_signal": data["macd_signal"],
        "ma50": data["ma50"],
        "ma200": data["ma200"],
        "volume_trend": data["volume_trend"],
    }
