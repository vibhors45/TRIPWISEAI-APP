"""
TripWise AI v2.0 — Trip Intelligence Score Engine
Combines all prediction signals into one score (0-100).
Blueprint Part 4.3 — Section 3.
"""
from dataclasses import dataclass

@dataclass
class IntelligenceScore:
    total: int                  # 0-100
    grade: str                  # Excellent / Good / Fair / Poor
    verdict: str
    components: dict            # breakdown of each factor
    badges: list[str]

def calculate_intelligence_score(
    budget_pct_coverage: float,     # % of min budget covered (e.g. 120 = 20% over)
    days: int,
    travelers: int,
    travel_style: str,
    weather_score: float = 75.0,    # 0-100 from weather service
    crowd_score: float = 70.0,      # 0-100 (higher = less crowded = better)
    feasibility_status: str = "FEASIBLE",
    ai_confidence: float = 85.0,
) -> IntelligenceScore:

    # ── Weights (blueprint Part 4.3 table) ──
    weights = {
        "budget_fit":         20,
        "weather":            10,
        "travel_comfort":     10,
        "transport_efficiency":10,
        "attraction_match":   10,
        "crowd":              10,
        "hotel_quality":      10,
        "safety":             10,
        "ai_confidence":      10,
    }

    # ── Score each component ──
    # Budget fit
    if feasibility_status == "NOT_FEASIBLE":
        budget_fit = 15
    elif feasibility_status == "TIGHT":
        budget_fit = 55
    else:
        budget_fit = min(100, int(budget_pct_coverage * 0.85))

    # Travel comfort (based on style + days)
    comfort_map = {
        "Budget Explorer": 65, "Comfort Seeker": 80,
        "Luxury Traveler": 95, "Adventure Junkie": 70, "Culture & Heritage": 75
    }
    travel_comfort = comfort_map.get(travel_style, 70)

    # Transport efficiency (penalize very short or very long trips)
    if days <= 2:
        transport_eff = 60
    elif days <= 5:
        transport_eff = 90
    elif days <= 10:
        transport_eff = 80
    else:
        transport_eff = 70

    # Attraction match (style-based)
    attraction_map = {
        "Budget Explorer": 78, "Comfort Seeker": 82,
        "Luxury Traveler": 88, "Adventure Junkie": 85, "Culture & Heritage": 87
    }
    attraction_match = attraction_map.get(travel_style, 80)

    # Hotel quality (style-based proxy)
    hotel_map = {
        "Budget Explorer": 65, "Comfort Seeker": 80,
        "Luxury Traveler": 95, "Adventure Junkie": 68, "Culture & Heritage": 75
    }
    hotel_quality = hotel_map.get(travel_style, 75)

    # Safety (India domestic default = high)
    safety = 85

    components = {
        "budget_fit":          {"score": budget_fit,       "weight": weights["budget_fit"],          "label": "Budget Fit"},
        "weather":             {"score": int(weather_score),"weight": weights["weather"],             "label": "Weather"},
        "travel_comfort":      {"score": travel_comfort,    "weight": weights["travel_comfort"],      "label": "Travel Comfort"},
        "transport_efficiency":{"score": transport_eff,     "weight": weights["transport_efficiency"],"label": "Transport Efficiency"},
        "attraction_match":    {"score": attraction_match,  "weight": weights["attraction_match"],    "label": "Attraction Match"},
        "crowd":               {"score": int(crowd_score),  "weight": weights["crowd"],               "label": "Crowd Level"},
        "hotel_quality":       {"score": hotel_quality,     "weight": weights["hotel_quality"],       "label": "Hotel Quality"},
        "safety":              {"score": safety,             "weight": weights["safety"],              "label": "Safety"},
        "ai_confidence":       {"score": int(ai_confidence),"weight": weights["ai_confidence"],       "label": "AI Confidence"},
    }

    total = sum(
        round(v["score"] * v["weight"] / 100)
        for v in components.values()
    )
    total = max(0, min(100, total))

    if total >= 85:
        grade   = "Excellent"
        verdict = "Highly Recommended"
    elif total >= 70:
        grade   = "Good"
        verdict = "Recommended"
    elif total >= 55:
        grade   = "Fair"
        verdict = "Proceed with Caution"
    else:
        grade   = "Poor"
        verdict = "Not Recommended"

    badges = _generate_badges(components, feasibility_status, total)

    return IntelligenceScore(
        total=total, grade=grade, verdict=verdict,
        components=components, badges=badges,
    )

def _generate_badges(components: dict, feasibility_status: str, total: int) -> list[str]:
    badges = []
    if components["budget_fit"]["score"] >= 85:
        badges.append("💰 Budget Champion")
    if components["weather"]["score"] >= 80:
        badges.append("☀️ Perfect Weather")
    if components["crowd"]["score"] >= 80:
        badges.append("😌 Low Crowd")
    if components["safety"]["score"] >= 85:
        badges.append("🛡 Safe Destination")
    if components["travel_comfort"]["score"] >= 85:
        badges.append("✈️ Comfortable Journey")
    if total >= 90:
        badges.append("⭐ Top Pick")
    if feasibility_status == "NOT_FEASIBLE":
        badges.append("⚠️ Budget Review Needed")
    return badges
