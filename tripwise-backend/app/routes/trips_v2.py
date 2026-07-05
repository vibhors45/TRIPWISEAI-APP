"""
TripWise AI v2.0 — Upgraded Trip Planning Route
Adds: Feasibility Engine, Intelligence Score, Weather, Crowd,
Price Trend, Risk Alerts, Booking Links — all in one response.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
import asyncio

from app.database.db import get_db
from app.models.models import Trip
from app.schemas.schemas_v2 import TripRequestV2, TripResponseV2
from app.ai.ai_service import get_ai_trip_plan, geocode_place, fetch_attraction_image
from app.ml.budget_engine import check_feasibility, smart_allocate_budget
from app.ml.intelligence_score import calculate_intelligence_score
from app.ml.crowd_engine import predict_crowd, predict_price_trend
from app.services.weather_service import get_weather
from app.services.booking_service import generate_booking_links
from app.services.risk_service import generate_risk_alerts

router = APIRouter()

async def enrich_destinations(destinations: list) -> list:
    enriched = []
    for dest in destinations:
        coords = await geocode_place(dest.get("name", ""))
        hero_img = await fetch_attraction_image(dest.get("name", ""), "")
        attractions = []
        for attr in dest.get("attractions", []):
            img, attr_coords = await asyncio.gather(
                fetch_attraction_image(attr["name"], dest["name"]),
                geocode_place(f"{attr['name']}, {dest['name']}")
            )
            attractions.append({**attr, "img": img, "coords": attr_coords})
        enriched.append({**dest, "heroImg": hero_img, "coords": coords, "attractions": attractions})
    return enriched

@router.post("/plan", status_code=200)
async def plan_trip_v2(body: TripRequestV2, db: Session = Depends(get_db)):
    """
    v2.0 Main Planning Endpoint:
    1. Budget Feasibility Check (ML)
    2. AI Trip Plan (OpenRouter)
    3. Weather (Live API + fallback)
    4. Crowd Prediction (ML)
    5. Price Trend (ML)
    6. Risk Alerts (Rule engine)
    7. Trip Intelligence Score (ML)
    8. Booking Links (Official URLs)
    9. Enrich destinations with geocoords + images
    10. Save to DB
    """

    travel_date = None
    if body.travel_date:
        try:
            travel_date = datetime.strptime(body.travel_date, "%Y-%m-%d").date()
        except Exception:
            pass
    if not travel_date:
        travel_date = date.today()

    # ── 1. Budget feasibility ──────────────────────────────────────
    feasibility = check_feasibility(
        budget=body.budget,
        travelers=body.travelers,
        days=body.days,
        travel_style=body.travel_style,
        source_city=body.source_city,
        destination=body.destination,
    )
    smart_budget = smart_allocate_budget(body.budget, body.days, body.travelers, body.travel_style)

    # ── 2. AI plan (always run — even if not feasible, show what's possible) ──
    try:
        ai_result = await get_ai_trip_plan(body)
    except Exception as e:
        raise HTTPException(502, f"AI service error: {str(e)}")

    top_dest = ai_result.get("top_destination", body.destination)

    # ── 3-7. Run in parallel for speed ────────────────────────────
    weather_task      = get_weather(top_dest, body.days)
    crowd_result      = predict_crowd(top_dest, travel_date)
    price_result      = predict_price_trend(top_dest, travel_date)

    weather_result = await weather_task

    # ── 6. Risk alerts ─────────────────────────────────────────────
    risk_alerts = generate_risk_alerts(
        destination=top_dest,
        travel_date=travel_date,
        weather_alerts=weather_result.current.alerts,
        crowd_level=crowd_result.level,
        feasibility_status=feasibility.status,
        budget=body.budget,
        min_required=feasibility.min_required,
        price_trend=price_result.trend,
        days=body.days,
    )

    # ── 7. Intelligence score ──────────────────────────────────────
    pct_coverage = (body.budget / max(feasibility.min_required, 1)) * 100
    intel_score = calculate_intelligence_score(
        budget_pct_coverage=pct_coverage,
        days=body.days,
        travelers=body.travelers,
        travel_style=body.travel_style,
        weather_score=weather_result.overall_score,
        crowd_score=max(0, 100 - crowd_result.score),
        feasibility_status=feasibility.status,
        ai_confidence=87.0,
    )

    # ── 8. Booking links ───────────────────────────────────────────
    booking = generate_booking_links(
        source_city=body.source_city,
        destination=top_dest,
        travel_date=body.travel_date or "",
        travelers=body.travelers,
        days=body.days,
    )

    # ── 9. Enrich destinations ─────────────────────────────────────
    ai_result["destinations"] = await enrich_destinations(ai_result.get("destinations", []))

    # ── Assemble response ──────────────────────────────────────────
    response = {
        "trip_version": "2.0",

        # Original AI result (unchanged — frontend compatibility)
        **ai_result,
        "budget_breakdown": smart_budget,

        # v2.0 additions
        "feasibility": {
            "status":       feasibility.status,
            "feasible":     feasibility.feasible,
            "confidence":   feasibility.confidence,
            "min_required": feasibility.min_required,
            "recommended":  feasibility.recommended,
            "shortfall":    feasibility.shortfall,
            "breakdown":    feasibility.breakdown,
            "suggestions":  feasibility.suggestions,
            "explanation":  feasibility.explanation,
        },
        "weather": {
            "city":         weather_result.current.city,
            "temperature":  weather_result.current.temperature,
            "feels_like":   weather_result.current.feels_like,
            "description":  weather_result.current.description,
            "humidity":     weather_result.current.humidity,
            "wind_speed":   weather_result.current.wind_speed,
            "icon":         weather_result.current.icon,
            "source":       weather_result.current.source,
            "confidence":   weather_result.current.confidence,
            "travel_impact":weather_result.current.travel_impact,
            "alerts":       weather_result.current.alerts,
            "daily":        weather_result.daily,
            "overall_score":weather_result.overall_score,
        },
        "crowd": {
            "level":              crowd_result.level,
            "score":              crowd_result.score,
            "confidence":         crowd_result.confidence,
            "peak_risk":          crowd_result.peak_risk,
            "explanation":        crowd_result.explanation,
            "best_time_to_visit": crowd_result.best_time_to_visit,
        },
        "price_trend": {
            "current_index":    price_result.current_index,
            "trend":            price_result.trend,
            "trend_icon":       price_result.trend_icon,
            "confidence":       price_result.confidence,
            "recommendation":   price_result.recommendation,
            "book_within_days": price_result.book_within_days,
            "explanation":      price_result.explanation,
        },
        "risk_alerts": [
            {
                "type":     r.type,
                "severity": r.severity,
                "message":  r.message,
                "action":   r.action,
                "source":   r.source,
                "icon":     r.icon,
            }
            for r in risk_alerts
        ],
        "intelligence_score": {
            "total":      intel_score.total,
            "grade":      intel_score.grade,
            "verdict":    intel_score.verdict,
            "components": intel_score.components,
            "badges":     intel_score.badges,
        },
        "booking_links": {
            "flights": booking.flights,
            "trains":  booking.trains,
            "buses":   booking.buses,
            "hotels":  booking.hotels,
            "note":    booking.note,
        },
        "smart_budget":   smart_budget,
        "data_labels": {
            "weather":      "🟢 Live" if weather_result.current.source == "live" else "🟡 Historical",
            "crowd":        "🔵 Predicted",
            "price_trend":  "🔵 Predicted",
            "feasibility":  "🔵 ML Model",
            "booking_links":"🟢 Official",
        },
    }

    # ── 10. Save to DB ─────────────────────────────────────────────
    trip = Trip(
        source_city=body.source_city,
        destination=body.destination,
        budget=body.budget,
        travelers=body.travelers,
        days=body.days,
        travel_style=body.travel_style,
        top_destination=top_dest,
        ai_result=response,
    )
    db.add(trip); db.commit(); db.refresh(trip)
    response["trip_id"] = trip.id

    return response
