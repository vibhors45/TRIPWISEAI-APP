"""
TripWise AI v2.0 — main.py (drop-in upgrade)
Replace your existing main.py with this file.
All existing routes preserved. New v2 route added.
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database.db import engine, Base

# ── Existing routes (unchanged) ──────────────────────────────────
from app.routes import trips, attractions, auth, geocode
# ── New v2 route ─────────────────────────────────────────────────
from app.routes import trips_v2
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="TripWise AI v2.0",
    description="AI Travel Intelligence Platform — ML + Real-Time + Explainable AI",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Existing routes — UNCHANGED ───────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",        tags=["Auth"])
app.include_router(trips.router,       prefix="/api/trips",       tags=["Trips v1"])
app.include_router(attractions.router, prefix="/api/attractions", tags=["Attractions"])
app.include_router(geocode.router,     prefix="/api/geocode",     tags=["Geocode"])

# ── NEW v2 route ──────────────────────────────────────────────────
app.include_router(trips_v2.router,    prefix="/api/v2/trips",    tags=["Trips v2 — Intelligence"])

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "message": "TripWise AI v2.0 is running 🚀",
        "features": ["ML Feasibility", "Weather", "Crowd Prediction",
                     "Price Trends", "Risk Alerts", "Intelligence Score", "Booking Links"]
    }

if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
