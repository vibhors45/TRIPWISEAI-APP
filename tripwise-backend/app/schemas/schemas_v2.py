"""
TripWise AI v2.0 — Extended Schemas
Adds travel_date to TripRequest. Backward compatible.
"""
from pydantic import BaseModel, Field
from typing import Optional

class TripRequestV2(BaseModel):
    source_city:  str   = Field(..., example="Lucknow")
    destination:  str   = Field(..., example="Goa or Beach")
    budget:       float = Field(..., gt=0, example=30000)
    travelers:    int   = Field(default=2, ge=1, le=20)
    days:         int   = Field(default=4, ge=1, le=30)
    travel_style: str   = Field(default="Budget Explorer")
    travel_date:  Optional[str] = Field(default=None, example="2025-12-15")

class TripResponseV2(BaseModel):
    trip_id:           int
    trip_version:      str
    top_destination:   str
    budget_breakdown:  dict
    destinations:      list
    itinerary:         list
    ai_tip:            str
    feasibility:       dict
    weather:           dict
    crowd:             dict
    price_trend:       dict
    risk_alerts:       list
    intelligence_score:dict
    booking_links:     dict
    smart_budget:      dict
    data_labels:       dict
