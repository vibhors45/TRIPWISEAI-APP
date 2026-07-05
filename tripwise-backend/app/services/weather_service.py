"""
TripWise AI v2.0 — Weather Service
Uses OpenWeatherMap free tier (1M calls/month, no credit card).
Falls back to historical seasonal data if API unavailable.
"""
import os, httpx
from datetime import date, datetime
from dataclasses import dataclass

OWM_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OWM_URL = "https://api.openweathermap.org/data/2.5"

# Seasonal fallback data for Indian destinations
SEASONAL_WEATHER = {
    "goa":       {1:"Sunny 28°C",2:"Sunny 29°C",3:"Hot 32°C",4:"Hot 34°C",5:"Humid 35°C",6:"Heavy Rain 29°C",7:"Heavy Rain 28°C",8:"Rain 28°C",9:"Rain 29°C",10:"Pleasant 30°C",11:"Pleasant 29°C",12:"Sunny 28°C"},
    "manali":    {1:"Snow -2°C",2:"Snow 0°C",3:"Cold 5°C",4:"Cool 10°C",5:"Pleasant 15°C",6:"Rain 16°C",7:"Rain 16°C",8:"Rain 15°C",9:"Pleasant 12°C",10:"Cool 8°C",11:"Cold 2°C",12:"Snow -1°C"},
    "jaipur":    {1:"Cool 18°C",2:"Mild 22°C",3:"Warm 28°C",4:"Hot 35°C",5:"Very Hot 40°C",6:"Hot 38°C",7:"Humid 34°C",8:"Rain 31°C",9:"Rain 30°C",10:"Pleasant 30°C",11:"Cool 24°C",12:"Cool 18°C"},
    "kerala":    {1:"Pleasant 28°C",2:"Warm 30°C",3:"Hot 32°C",4:"Hot 33°C",5:"Humid 32°C",6:"Monsoon 28°C",7:"Heavy Rain 27°C",8:"Rain 27°C",9:"Rain 28°C",10:"Humid 29°C",11:"Pleasant 28°C",12:"Pleasant 27°C"},
    "ladakh":    {1:"Extreme Cold -10°C",2:"Very Cold -8°C",3:"Cold -2°C",4:"Cool 5°C",5:"Pleasant 12°C",6:"Sunny 18°C",7:"Sunny 20°C",8:"Sunny 19°C",9:"Cool 13°C",10:"Cold 3°C",11:"Very Cold -5°C",12:"Extreme Cold -10°C"},
    "default":   {1:"Cool",2:"Mild",3:"Warm",4:"Hot",5:"Hot",6:"Rainy",7:"Rainy",8:"Rainy",9:"Cloudy",10:"Pleasant",11:"Pleasant",12:"Cool"},
}

@dataclass
class WeatherInfo:
    city: str
    temperature: float
    feels_like: float
    description: str
    humidity: int
    wind_speed: float
    icon: str
    source: str   # "live" or "historical"
    confidence: int
    travel_impact: str
    alerts: list[str]

@dataclass
class WeatherForecast:
    current: WeatherInfo
    daily: list[dict]
    overall_score: float   # 0-100 travel suitability

async def get_weather(city: str, days: int = 5) -> WeatherForecast:
    """Try live API first, fall back to historical."""
    if OWM_KEY:
        try:
            return await _fetch_live_weather(city, days)
        except Exception:
            pass
    return _get_historical_weather(city, days)

async def _fetch_live_weather(city: str, days: int) -> WeatherForecast:
    async with httpx.AsyncClient(timeout=8) as client:
        # Current weather
        curr_r = await client.get(f"{OWM_URL}/weather", params={
            "q": city, "appid": OWM_KEY, "units": "metric"
        })
        curr_r.raise_for_status()
        curr = curr_r.json()

        # Forecast
        fore_r = await client.get(f"{OWM_URL}/forecast", params={
            "q": city, "appid": OWM_KEY, "units": "metric", "cnt": days * 8
        })
        fore_r.raise_for_status()
        fore = fore_r.json()

    temp        = curr["main"]["temp"]
    description = curr["weather"][0]["description"].title()
    humidity    = curr["main"]["humidity"]
    wind        = curr["wind"]["speed"]
    icon_code   = curr["weather"][0]["icon"]
    icon        = f"https://openweathermap.org/img/wn/{icon_code}@2x.png"

    alerts = _generate_alerts(description, temp, humidity, wind)
    travel_impact = _assess_travel_impact(description, temp, humidity)
    score = _weather_travel_score(temp, humidity, wind, description)

    current = WeatherInfo(
        city=city, temperature=round(temp, 1), feels_like=round(curr["main"]["feels_like"], 1),
        description=description, humidity=humidity, wind_speed=round(wind, 1),
        icon=icon, source="live", confidence=95,
        travel_impact=travel_impact, alerts=alerts,
    )

    # Build daily summary from forecast
    daily = {}
    for item in fore["list"]:
        dt  = datetime.fromtimestamp(item["dt"])
        day = dt.strftime("%a %d %b")
        if day not in daily:
            daily[day] = {
                "date": day, "temp_min": item["main"]["temp_min"],
                "temp_max": item["main"]["temp_max"],
                "description": item["weather"][0]["description"].title(),
                "humidity": item["main"]["humidity"],
                "rain_prob": round(item.get("pop", 0) * 100),
                "icon": f"https://openweathermap.org/img/wn/{item['weather'][0]['icon']}.png",
            }
        else:
            daily[day]["temp_min"] = min(daily[day]["temp_min"], item["main"]["temp_min"])
            daily[day]["temp_max"] = max(daily[day]["temp_max"], item["main"]["temp_max"])

    return WeatherForecast(current=current, daily=list(daily.values())[:days], overall_score=score)

def _get_historical_weather(city: str, days: int) -> WeatherForecast:
    month = date.today().month
    key = city.lower().split(",")[0].strip()
    seasonal = SEASONAL_WEATHER.get(key, SEASONAL_WEATHER["default"])
    desc_raw = seasonal.get(month, "Mild weather")

    # Parse temperature from string like "Sunny 28°C"
    temp = 28.0
    parts = desc_raw.split()
    for p in parts:
        if "°C" in p:
            try: temp = float(p.replace("°C",""))
            except: pass

    desc = " ".join(p for p in parts if "°C" not in p)
    alerts = _generate_alerts(desc, temp, 60, 10)
    score  = _weather_travel_score(temp, 60, 10, desc)

    current = WeatherInfo(
        city=city, temperature=temp, feels_like=temp - 2,
        description=desc, humidity=60, wind_speed=10.0,
        icon="", source="historical", confidence=65,
        travel_impact=_assess_travel_impact(desc, temp, 60), alerts=alerts,
    )
    daily = [{"date": f"Day {i+1}", "temp_min": temp-3, "temp_max": temp+2,
              "description": desc, "humidity": 60, "rain_prob": 20, "icon": ""}
             for i in range(min(days, 5))]
    return WeatherForecast(current=current, daily=daily, overall_score=score)

def _generate_alerts(description: str, temp: float, humidity: int, wind: float) -> list[str]:
    alerts = []
    d = description.lower()
    if "rain" in d or "drizzle" in d or "thunder" in d:
        alerts.append("☔ Rain expected — carry umbrella, avoid outdoor treks")
    if "snow" in d:
        alerts.append("❄️ Snowfall likely — road conditions may be challenging")
    if temp >= 40:
        alerts.append("🌡️ Extreme heat — stay hydrated, avoid midday outdoor activity")
    if temp <= 5:
        alerts.append("🧣 Very cold — pack warm layers and thermal wear")
    if humidity >= 85:
        alerts.append("💧 High humidity — lightweight breathable clothing recommended")
    if wind >= 30:
        alerts.append("💨 Strong winds — avoid boat/water activities")
    return alerts

def _assess_travel_impact(description: str, temp: float, humidity: int) -> str:
    d = description.lower()
    if "thunder" in d or "heavy rain" in d:
        return "⚠️ Outdoor activities severely impacted — consider indoor alternatives"
    if "rain" in d or "drizzle" in d:
        return "🌧️ Some outdoor plans may need adjustment"
    if temp >= 42:
        return "🌡️ Extreme heat — early morning/evening outdoor activities recommended"
    if temp <= 0:
        return "❄️ Freezing conditions — only suitable for winter sports enthusiasts"
    return "✅ Good conditions for travel and outdoor activities"

def _weather_travel_score(temp: float, humidity: int, wind: float, description: str) -> float:
    score = 80.0
    if 20 <= temp <= 32:
        score += 15
    elif temp > 38 or temp < 5:
        score -= 25
    if humidity > 85:
        score -= 10
    d = description.lower()
    if "heavy rain" in d or "thunder" in d:
        score -= 30
    elif "rain" in d:
        score -= 15
    elif "sunny" in d or "clear" in d:
        score += 10
    return max(10.0, min(100.0, score))
