"""
TripWise AI v2.0 — Risk Intelligence Engine
Blueprint Part 4.3 Section 10.
"""
from dataclasses import dataclass
from typing import Literal
from datetime import date

@dataclass
class RiskAlert:
    type: str
    severity: Literal["Low", "Medium", "High"]
    message: str
    action: str
    source: str     # "live" or "predicted"
    icon: str

def generate_risk_alerts(
    destination: str,
    travel_date: date | None,
    weather_alerts: list[str],
    crowd_level: str,
    feasibility_status: str,
    budget: float,
    min_required: float,
    price_trend: str,
    days: int,
) -> list[RiskAlert]:

    alerts = []
    d = destination.lower()

    # ── Weather risks ──
    for w in weather_alerts:
        severity = "High" if "heavy" in w.lower() or "extreme" in w.lower() or "snow" in w.lower() else "Medium"
        alerts.append(RiskAlert(
            type="Weather", severity=severity, message=w,
            action="Check forecast daily and have indoor backup plans.",
            source="live" if True else "predicted", icon="🌦"
        ))

    # ── Crowd risks ──
    if crowd_level in ("High", "Very High"):
        alerts.append(RiskAlert(
            type="Crowd", severity="Medium" if crowd_level == "High" else "High",
            message=f"⚠ {crowd_level} crowd expected at {destination}.",
            action="Book hotels and transport at least 2 weeks in advance. Visit popular spots before 9 AM.",
            source="predicted", icon="👥"
        ))

    # ── Budget risk ──
    if feasibility_status == "NOT_FEASIBLE":
        shortfall = min_required - budget
        alerts.append(RiskAlert(
            type="Budget", severity="High",
            message=f"⚠ Budget is ₹{shortfall:,.0f} short of the estimated minimum.",
            action="Increase budget, choose train travel, or reduce trip duration.",
            source="predicted", icon="💰"
        ))
    elif feasibility_status == "TIGHT":
        alerts.append(RiskAlert(
            type="Budget", severity="Medium",
            message="⚠ Budget is tight — little room for unexpected expenses.",
            action="Keep ₹2,000 emergency cash. Avoid impulse purchases.",
            source="predicted", icon="💳"
        ))

    # ── Price trend risk ──
    if price_trend == "Increasing":
        alerts.append(RiskAlert(
            type="Pricing", severity="Medium",
            message="📈 Flight and hotel prices are trending upward for your travel period.",
            action="Book transport and accommodation within 48 hours.",
            source="predicted", icon="📈"
        ))

    # ── Destination-specific risks ──
    if any(x in d for x in ["goa", "beach", "andaman"]) and travel_date:
        if travel_date.month in [6, 7, 8]:
            alerts.append(RiskAlert(
                type="Seasonal", severity="High",
                message="🌊 Monsoon season — rough seas and heavy rain expected.",
                action="Avoid water sports and check beach safety flags daily.",
                source="predicted", icon="🌊"
            ))

    if any(x in d for x in ["manali", "ladakh", "leh", "rohtang"]) and travel_date:
        if travel_date.month in [11, 12, 1, 2]:
            alerts.append(RiskAlert(
                type="Seasonal", severity="High",
                message="❄️ Mountain roads may be blocked due to snowfall.",
                action="Check road status on HRTC/BRO portals before travel.",
                source="predicted", icon="🏔"
            ))

    # ── Trip duration risk ──
    if days == 1:
        alerts.append(RiskAlert(
            type="Planning", severity="Low",
            message="⏱ Single-day trips are rushed — you may not cover all planned spots.",
            action="Prioritise top 2-3 attractions. Avoid overplanning.",
            source="predicted", icon="⏱"
        ))

    return alerts
