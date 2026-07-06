from dotenv import load_dotenv
load_dotenv()
import os, json, re, httpx
from app.schemas.schemas import TripRequest

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL     = "https://openrouter.ai/api/v1/chat/completions"
UNSPLASH_KEY       = os.getenv("UNSPLASH_ACCESS_KEY", "")

def allocate_budget(budget: float, days: int, travelers: int) -> dict:
    per_person = budget / max(travelers, 1)
    if per_person < 5000:
        w = {"transport": 0.40, "hotel": 0.30, "food": 0.20, "activities": 0.10}
    elif per_person < 15000:
        w = {"transport": 0.30, "hotel": 0.35, "food": 0.22, "activities": 0.13}
    else:
        w = {"transport": 0.25, "hotel": 0.38, "food": 0.20, "activities": 0.17}
    return {k: round(budget * v) for k, v in w.items()}

def clean_json_string(raw: str) -> str:
    """Robustly extract and clean JSON from LLM response."""
    # Remove markdown code blocks
    raw = raw.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    raw = raw.strip()

    # Find the first { and last } to extract JSON object
    start = raw.find('{')
    end   = raw.rfind('}')
    if start != -1 and end != -1:
        raw = raw[start:end+1]

    # Fix common JSON issues caused by special characters
    # Replace smart quotes with regular quotes
    raw = raw.replace('\u2018', "'").replace('\u2019', "'")
    raw = raw.replace('\u201c', '"').replace('\u201d', '"')

    # Remove control characters except newlines and tabs
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)

    return raw

def safe_parse_json(raw: str) -> dict:
    """Try multiple strategies to parse JSON."""
    # Strategy 1: Direct parse after cleaning
    cleaned = clean_json_string(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Fix unterminated strings by truncating at last valid }
    try:
        # Find the last complete JSON structure
        depth = 0
        last_valid = 0
        in_string = False
        escape_next = False
        for i, ch in enumerate(cleaned):
            if escape_next:
                escape_next = False
                continue
            if ch == '\\' and in_string:
                escape_next = True
                continue
            if ch == '"' and not escape_next:
                in_string = not in_string
            if not in_string:
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        last_valid = i
        if last_valid > 0:
            return json.loads(cleaned[:last_valid+1])
    except (json.JSONDecodeError, Exception):
        pass

    # Strategy 3: Return a safe fallback structure
    raise ValueError(f"Could not parse JSON from response. Raw start: {raw[:200]}")

async def get_ai_trip_plan(req) -> dict:
    budget_split = allocate_budget(req.budget, req.days, req.travelers)

    # Sanitize destination to avoid JSON issues
    destination = req.destination.replace('"', '').replace('\\', '')

    prompt = f"""You are TripWise AI, a premium Indian travel advisor.

User trip details:
- From: {req.source_city}
- Preference: {destination}
- Days: {req.days}
- Travelers: {req.travelers}
- Budget: Rs {req.budget:.0f} total
- Style: {req.travel_style}

Suggested budget split:
Transport Rs {budget_split['transport']}, Hotel Rs {budget_split['hotel']}, Food Rs {budget_split['food']}, Activities Rs {budget_split['activities']}

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no extra text, no special characters in strings.
Use only plain ASCII characters in all string values. Do not use hyphens in destination names within JSON strings.

Use this exact structure:
{{
  "budget_breakdown": {{"transport": 8000, "hotel": 12000, "food": 5000, "activities": 5000}},
  "destinations": [
    {{
      "name": "City Name State",
      "country": "India",
      "budget": 20000,
      "reason": "Two sentence explanation here.",
      "best_season": "Oct to Mar",
      "language": "Hindi",
      "currency": "Indian Rupee INR",
      "attractions": [
        {{"name": "Attraction Name", "type": "Temple", "desc": "One sentence description."}},
        {{"name": "Attraction Name", "type": "Lake", "desc": "One sentence description."}},
        {{"name": "Attraction Name", "type": "Market", "desc": "One sentence description."}},
        {{"name": "Attraction Name", "type": "Fort", "desc": "One sentence description."}}
      ]
    }},
    {{
      "name": "Second City",
      "country": "India",
      "budget": 18000,
      "reason": "Two sentence explanation.",
      "best_season": "Oct to Apr",
      "language": "Hindi",
      "currency": "Indian Rupee INR",
      "attractions": [
        {{"name": "Attraction Name", "type": "Beach", "desc": "One sentence."}},
        {{"name": "Attraction Name", "type": "Fort", "desc": "One sentence."}},
        {{"name": "Attraction Name", "type": "Market", "desc": "One sentence."}},
        {{"name": "Attraction Name", "type": "Temple", "desc": "One sentence."}}
      ]
    }},
    {{
      "name": "Third City",
      "country": "India",
      "budget": 16000,
      "reason": "Two sentence explanation.",
      "best_season": "Sep to Mar",
      "language": "Hindi",
      "currency": "Indian Rupee INR",
      "attractions": [
        {{"name": "Attraction Name", "type": "Garden", "desc": "One sentence."}},
        {{"name": "Attraction Name", "type": "Palace", "desc": "One sentence."}},
        {{"name": "Attraction Name", "type": "Museum", "desc": "One sentence."}},
        {{"name": "Attraction Name", "type": "Park", "desc": "One sentence."}}
      ]
    }}
  ],
  "top_destination": "City Name State",
  "itinerary": [
    {{"day": 1, "activities": [{{"time": "Morning", "activity": "Activity description."}}, {{"time": "Afternoon", "activity": "Activity description."}}, {{"time": "Evening", "activity": "Activity description."}}]}},
    {{"day": 2, "activities": [{{"time": "Morning", "activity": "Activity description."}}, {{"time": "Afternoon", "activity": "Activity description."}}, {{"time": "Evening", "activity": "Activity description."}}]}},
    {{"day": 3, "activities": [{{"time": "Morning", "activity": "Activity description."}}, {{"time": "Afternoon", "activity": "Activity description."}}, {{"time": "Evening", "activity": "Activity description."}}]}},
    {{"day": 4, "activities": [{{"time": "Morning", "activity": "Activity description."}}, {{"time": "Afternoon", "activity": "Activity description."}}, {{"time": "Evening", "activity": "Activity description."}}]}}
  ],
  "ai_tip": "One practical budget saving tip."
}}"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tripwiseai-app-1.onrender.com",
        "X-Title": "TripWise AI",
    }
    body = {
        "model": "openrouter/auto",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 3000,
        "temperature": 0.3,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()

    raw = data["choices"][0]["message"]["content"]
    return safe_parse_json(raw)

async def geocode_place(place: str) -> dict | None:
    # Sanitize place name
    place = place.replace('"', '').strip()
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": place, "format": "json", "limit": 1}
    headers = {"User-Agent": "TripWiseAI/2.0"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, params=params, headers=headers)
            results = r.json()
        if results:
            return {
                "lat": float(results[0]["lat"]),
                "lon": float(results[0]["lon"]),
                "display_name": results[0]["display_name"]
            }
    except Exception:
        pass
    return None

async def fetch_attraction_image(attraction: str, destination: str) -> str:
    fallback = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"
    if not UNSPLASH_KEY:
        return fallback
    query = f"{attraction} {destination} landmark"
    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": query, "per_page": 1,
        "orientation": "landscape", "client_id": UNSPLASH_KEY
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url, params=params)
            d = r.json()
        return d["results"][0]["urls"]["regular"] if d.get("results") else fallback
    except Exception:
        return fallback
