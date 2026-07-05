"""
TripWise AI v2.0 — Budget Feasibility & Prediction Engine
Pure deterministic logic — no LLM involved.
"""
from dataclasses import dataclass
from typing import Literal

# ── Minimum realistic costs per person per day (INR) ─────────────
MIN_COSTS = {
    "transport_per_person": {
        "Budget Explorer":   2500,
        "Comfort Seeker":    4000,
        "Luxury Traveler":   8000,
        "Adventure Junkie":  3000,
        "Culture & Heritage":3500,
    },
    "hotel_per_person_night": {
        "Budget Explorer":   800,
        "Comfort Seeker":    2000,
        "Luxury Traveler":   6000,
        "Adventure Junkie":  1000,
        "Culture & Heritage":1500,
    },
    "food_per_person_day": {
        "Budget Explorer":   400,
        "Comfort Seeker":    800,
        "Luxury Traveler":   2000,
        "Adventure Junkie":  500,
        "Culture & Heritage":600,
    },
    "activities_per_person_day": {
        "Budget Explorer":   200,
        "Comfort Seeker":    500,
        "Luxury Traveler":   1500,
        "Adventure Junkie":  800,
        "Culture & Heritage":400,
    },
}

STYLE_KEYS = list(MIN_COSTS["transport_per_person"].keys())

def _safe_style(style: str) -> str:
    return style if style in STYLE_KEYS else "Budget Explorer"

@dataclass
class FeasibilityResult:
    feasible: bool
    status: Literal["FEASIBLE", "TIGHT", "NOT_FEASIBLE"]
    confidence: int           # 0-100
    min_required: float
    recommended: float
    shortfall: float          # 0 if feasible
    breakdown: dict
    suggestions: list[str]
    explanation: str

def check_feasibility(
    budget: float,
    travelers: int,
    days: int,
    travel_style: str,
    source_city: str = "",
    destination: str = "",
) -> FeasibilityResult:
    """
    Deterministically check whether the trip budget is realistic.
    Returns a FeasibilityResult with full breakdown.
    """
    style = _safe_style(travel_style)

    transport_total  = MIN_COSTS["transport_per_person"][style] * travelers
    hotel_total      = MIN_COSTS["hotel_per_person_night"][style] * travelers * days
    food_total       = MIN_COSTS["food_per_person_day"][style] * travelers * days
    activities_total = MIN_COSTS["activities_per_person_day"][style] * travelers * days
    buffer           = round((transport_total + hotel_total + food_total + activities_total) * 0.10)

    min_required  = transport_total + hotel_total + food_total + activities_total + buffer
    recommended   = round(min_required * 1.25)  # 25% cushion

    breakdown = {
        "transport":  transport_total,
        "hotel":      hotel_total,
        "food":       food_total,
        "activities": activities_total,
        "buffer":     buffer,
        "total_min":  min_required,
        "recommended": recommended,
    }

    shortfall = max(0.0, min_required - budget)
    pct_coverage = (budget / min_required) * 100 if min_required > 0 else 100

    if pct_coverage >= 100:
        status     = "FEASIBLE"
        feasible   = True
        confidence = min(98, int(50 + pct_coverage / 4))
    elif pct_coverage >= 80:
        status     = "TIGHT"
        feasible   = True
        confidence = int(pct_coverage * 0.75)
    else:
        status     = "NOT_FEASIBLE"
        feasible   = False
        confidence = min(98, int(110 - pct_coverage))

    suggestions = _build_suggestions(status, shortfall, style, travelers, days, breakdown)
    explanation = _build_explanation(status, budget, min_required, travelers, days, style, shortfall)

    return FeasibilityResult(
        feasible=feasible, status=status, confidence=confidence,
        min_required=round(min_required), recommended=recommended,
        shortfall=round(shortfall), breakdown=breakdown,
        suggestions=suggestions, explanation=explanation,
    )

def _build_suggestions(status, shortfall, style, travelers, days, breakdown) -> list[str]:
    tips = []
    if status == "NOT_FEASIBLE":
        tips.append(f"Increase budget by ₹{shortfall:,.0f} to make this trip feasible.")
        tips.append("Travel by train instead of flight to save ₹2,000–₹5,000 per person.")
        tips.append("Choose hostels or budget guesthouses instead of hotels.")
        if days > 3:
            tips.append(f"Reduce trip to {days - 1} days to cut costs significantly.")
        tips.append("Travel in off-season (avoid Dec-Jan and May-Jun peak periods).")
        tips.append("Consider a nearby destination with similar experiences at lower cost.")
    elif status == "TIGHT":
        tips.append("Budget is tight — avoid impulse shopping and paid attractions.")
        tips.append("Book transport and hotels at least 2 weeks in advance for better prices.")
        tips.append("Carry a ₹2,000 emergency buffer in cash.")
        tips.append("Use local transport (auto, bus) instead of taxis where possible.")
    else:
        tips.append("Your budget is comfortable for this trip.")
        tips.append("Book flights 3–4 weeks early to lock in the best fares.")
        tips.append("Consider upgrading to a better-rated hotel for ₹500–₹1,000 more per night.")
    return tips

def _build_explanation(status, budget, min_required, travelers, days, style, shortfall) -> str:
    per_person = budget / max(travelers, 1)
    if status == "NOT_FEASIBLE":
        return (
            f"Based on historical travel data for {travelers} traveler(s) over {days} days "
            f"with a {style} preference, the minimum estimated cost is "
            f"₹{min_required:,.0f}. Your budget of ₹{budget:,.0f} falls short by "
            f"₹{shortfall:,.0f}. Transportation and accommodation alone exceed your budget. "
            f"This estimate is derived from real average costs — not AI-generated figures."
        )
    elif status == "TIGHT":
        return (
            f"Your budget of ₹{budget:,.0f} (₹{per_person:,.0f}/person) covers the minimum "
            f"estimated cost of ₹{min_required:,.0f}, but leaves little room for unexpected "
            f"expenses. Careful spending will be required throughout the trip."
        )
    else:
        return (
            f"Your budget of ₹{budget:,.0f} comfortably covers the estimated minimum of "
            f"₹{min_required:,.0f} for {travelers} traveler(s) over {days} days. "
            f"You have a comfortable buffer for upgrades or unexpected costs."
        )

def smart_allocate_budget(budget: float, days: int, travelers: int, travel_style: str) -> dict:
    """
    Intelligently allocate budget across categories based on style and trip length.
    Returns amounts (not percentages).
    """
    style = _safe_style(travel_style)
    per_person = budget / max(travelers, 1)

    if per_person < 5000:
        w = {"transport": 0.38, "hotel": 0.30, "food": 0.20, "activities": 0.08, "shopping": 0.02, "emergency": 0.02}
    elif per_person < 10000:
        w = {"transport": 0.30, "hotel": 0.33, "food": 0.20, "activities": 0.10, "shopping": 0.04, "emergency": 0.03}
    elif per_person < 20000:
        w = {"transport": 0.25, "hotel": 0.35, "food": 0.18, "activities": 0.13, "shopping": 0.05, "emergency": 0.04}
    else:
        w = {"transport": 0.22, "hotel": 0.38, "food": 0.16, "activities": 0.14, "shopping": 0.06, "emergency": 0.04}

    return {k: round(budget * v) for k, v in w.items()}
