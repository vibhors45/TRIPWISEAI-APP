"""
TripWise AI v2.0 — Crowd & Price Trend Prediction Engine
Based on historical seasonality, Indian holidays, and demand patterns.
"""
from datetime import date, datetime
from dataclasses import dataclass
from typing import Literal

# Indian public holidays & peak travel periods (month, day)
INDIAN_HOLIDAYS = {
    (1, 26), (8, 15), (10, 2),   # Republic, Independence, Gandhi
    (11, 1), (12, 25),            # Diwali-ish, Christmas
}

# Month-based peak demand index (1-10) — higher = more crowded & expensive
MONTHLY_DEMAND = {
    1: 8,  # Jan - peak winter travel
    2: 7,  # Feb
    3: 6,  # Mar
    4: 5,  # Apr
    5: 4,  # May - hot, off-season
    6: 3,  # Jun - monsoon
    7: 3,  # Jul - monsoon
    8: 5,  # Aug - Independence Day travel
    9: 6,  # Sep
    10: 8, # Oct - peak season starts
    11: 9, # Nov - peak season
    12: 9, # Dec - peak Christmas/New Year
}

DESTINATION_CROWD_MULTIPLIER = {
    "goa": 1.4, "manali": 1.3, "shimla": 1.3, "mussoorie": 1.2,
    "jaipur": 1.2, "agra": 1.1, "varanasi": 1.0, "rishikesh": 1.1,
    "leh": 1.2, "ladakh": 1.2, "andaman": 1.0, "kerala": 1.0,
    "ooty": 1.1, "darjeeling": 1.1, "coorg": 1.0, "munnar": 1.0,
}

@dataclass
class CrowdPrediction:
    level: Literal["Low", "Moderate", "High", "Very High"]
    score: int          # 0-100 (100 = most crowded)
    confidence: int
    peak_risk: bool
    explanation: str
    best_time_to_visit: str

@dataclass
class PriceTrendPrediction:
    current_index: int          # relative price index 100 = baseline
    trend: Literal["Increasing", "Stable", "Decreasing"]
    trend_icon: str
    confidence: int
    recommendation: str
    book_within_days: int | None
    explanation: str

def predict_crowd(destination: str, travel_date: date | None = None) -> CrowdPrediction:
    if travel_date is None:
        travel_date = date.today()

    month  = travel_date.month
    is_weekend = travel_date.weekday() >= 5

    base_demand = MONTHLY_DEMAND.get(month, 5)
    dest_key = destination.lower().split(",")[0].strip()
    multiplier = DESTINATION_CROWD_MULTIPLIER.get(dest_key, 1.0)
    is_holiday = (travel_date.month, travel_date.day) in INDIAN_HOLIDAYS

    raw_score = base_demand * 10 * multiplier
    if is_weekend:
        raw_score *= 1.15
    if is_holiday:
        raw_score *= 1.30

    score = min(100, int(raw_score))
    peak_risk = score >= 70

    if score >= 80:
        level = "Very High"
        best_time = "Consider travelling mid-week or in off-season months (May-Sep)"
    elif score >= 60:
        level = "High"
        best_time = "Book early and plan to visit popular spots before 9 AM"
    elif score >= 40:
        level = "Moderate"
        best_time = "Good time to visit — moderate crowds expected"
    else:
        level = "Low"
        best_time = "Excellent time — low crowds and better prices"

    confidence = 82 if is_holiday else 75

    explanation = (
        f"Crowd prediction for {destination} is based on historical monthly demand "
        f"(index {base_demand}/10 for {travel_date.strftime('%B')}), "
        f"{'weekend travel,' if is_weekend else 'weekday travel,'} "
        f"{'a public holiday,' if is_holiday else ''} "
        f"and destination popularity data."
    )

    return CrowdPrediction(
        level=level, score=score, confidence=confidence,
        peak_risk=peak_risk, explanation=explanation,
        best_time_to_visit=best_time,
    )

def predict_price_trend(destination: str, travel_date: date | None = None) -> PriceTrendPrediction:
    if travel_date is None:
        travel_date = date.today()

    month = travel_date.month
    demand = MONTHLY_DEMAND.get(month, 5)
    next_month = MONTHLY_DEMAND.get(month % 12 + 1, 5)
    dest_key = destination.lower().split(",")[0].strip()
    multiplier = DESTINATION_CROWD_MULTIPLIER.get(dest_key, 1.0)

    current_index = int(85 + demand * 5 * multiplier)

    delta = next_month - demand
    if delta >= 2:
        trend        = "Increasing"
        trend_icon   = "📈"
        book_within  = 3
        recommendation = "Book within 3 days to avoid price hike."
    elif delta <= -2:
        trend        = "Decreasing"
        trend_icon   = "📉"
        book_within  = None
        recommendation = "Prices may drop — safe to wait a few days."
    else:
        trend        = "Stable"
        trend_icon   = "➡️"
        book_within  = 7
        recommendation = "Prices are stable — book within a week."

    confidence = 78 + (demand * 2)
    confidence = min(confidence, 94)

    explanation = (
        f"Price trend is {trend.lower()} because demand index moves from "
        f"{demand}/10 this month to {next_month}/10 next month for {destination}. "
        f"Historical data shows {'rising' if delta > 0 else 'falling' if delta < 0 else 'stable'} "
        f"fares during this period. This is a probabilistic forecast, not a guarantee."
    )

    return PriceTrendPrediction(
        current_index=current_index, trend=trend, trend_icon=trend_icon,
        confidence=confidence, recommendation=recommendation,
        book_within_days=book_within, explanation=explanation,
    )
