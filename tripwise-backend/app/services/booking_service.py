"""
TripWise AI v2.0 — Official Booking Links Generator
Only real, verified booking URLs — never invented.
Blueprint Part 3, Section 13 & Part 10.
"""
from dataclasses import dataclass
from urllib.parse import urlencode

# IATA airport codes for major Indian cities
IATA_CODES = {
    "lucknow": "LKO", "delhi": "DEL", "new delhi": "DEL",
    "mumbai": "BOM", "bangalore": "BLR", "bengaluru": "BLR",
    "chennai": "MAA", "kolkata": "CCU", "hyderabad": "HYD",
    "ahmedabad": "AMD", "goa": "GOI", "pune": "PNQ",
    "jaipur": "JAI", "kochi": "COK", "cochin": "COK",
    "varanasi": "VNS", "amritsar": "ATQ", "chandigarh": "IXC",
    "bhopal": "BHO", "indore": "IDR", "nagpur": "NAG",
    "srinagar": "SXR", "leh": "IXL", "jammu": "IXJ",
    "port blair": "IXZ", "guwahati": "GAU", "bhubaneswar": "BBI",
    "tiruchirappalli": "TRZ", "coimbatore": "CJB", "mangalore": "IXE",
    "visakhapatnam": "VTZ", "vijayawada": "VGA", "patna": "PAT",
    "ranchi": "IXR", "raipur": "RPR", "agartala": "IXA",
}

@dataclass
class BookingLinks:
    flights: list[dict]
    trains: list[dict]
    buses: list[dict]
    hotels: list[dict]
    note: str

def get_iata(city: str) -> str | None:
    return IATA_CODES.get(city.lower().strip().split(",")[0].strip())

def generate_booking_links(
    source_city: str,
    destination: str,
    travel_date: str = "",          # YYYY-MM-DD
    travelers: int = 2,
    days: int = 4,
) -> BookingLinks:

    src  = source_city.strip()
    dest = destination.strip().split(",")[0].strip()
    src_iata  = get_iata(src)
    dest_iata = get_iata(dest)
    date_str  = travel_date or ""

    flights = _flight_links(src, dest, src_iata, dest_iata, date_str, travelers)
    trains  = _train_links(src, dest, date_str, travelers)
    buses   = _bus_links(src, dest, date_str)
    hotels  = _hotel_links(dest, date_str, days, travelers)

    return BookingLinks(
        flights=flights, trains=trains, buses=buses, hotels=hotels,
        note="All links redirect to official or verified booking platforms only. TripWise AI does not earn commissions."
    )

def _flight_links(src, dest, src_iata, dest_iata, date_str, travelers) -> list[dict]:
    links = []
    dep   = date_str.replace("-", "") if date_str else ""

    # IndiGo
    if src_iata and dest_iata:
        indigo_params = f"origin={src_iata}&destination={dest_iata}"
        if dep:
            indigo_params += f"&departDate={dep}"
        links.append({
            "airline": "IndiGo",
            "logo": "https://www.goindigo.in/content/dam/goindigo/common/logo.svg",
            "url": f"https://www.goindigo.in/flight-booking.html?{indigo_params}&adult={travelers}&child=0&infant=0&tripType=O&cabinClass=E",
            "type": "Official Website",
            "badge": "🟢 Official",
        })
        # Air India
        links.append({
            "airline": "Air India",
            "logo": "https://www.airindia.com/content/dam/air-india/airindia-rebrand/logos/Air-India-logo.svg",
            "url": f"https://www.airindia.com/in/en/book/flights.html?origin={src_iata}&destination={dest_iata}&departureDate={date_str}&adults={travelers}&children=0&infants=0&cabinClass=Economy&tripType=O",
            "type": "Official Website",
            "badge": "🟢 Official",
        })
        # SpiceJet
        links.append({
            "airline": "SpiceJet",
            "logo": "",
            "url": f"https://www.spicejet.com/?from={src_iata}&to={dest_iata}&depdate={date_str}&adults={travelers}&child=0&infant=0&type=O",
            "type": "Official Website",
            "badge": "🟢 Official",
        })
        # Akasa Air
        links.append({
            "airline": "Akasa Air",
            "logo": "",
            "url": f"https://www.akasaair.com/booking/search?from={src_iata}&to={dest_iata}&date={date_str}&adult={travelers}&child=0&infant=0&tripType=OW",
            "type": "Official Website",
            "badge": "🟢 Official",
        })

    # MakeMyTrip flights (always works even without IATA)
    mmt_src  = src_iata  or src.upper()[:3]
    mmt_dest = dest_iata or dest.upper()[:3]
    links.append({
        "airline": "MakeMyTrip (All Airlines)",
        "logo": "",
        "url": f"https://www.makemytrip.com/flights/oneway-{src.lower()}-to-{dest.lower()}/{date_str}/{travelers}-0-0/F",
        "type": "Aggregator",
        "badge": "🔵 Compare",
    })

    return links

def _train_links(src, dest, date_str, travelers) -> list[dict]:
    # Date format for IRCTC: YYYYMMDD
    irctc_date = date_str.replace("-","") if date_str else ""
    return [
        {
            "operator": "IRCTC — Indian Railways",
            "url": f"https://www.irctc.co.in/nget/train-search?from={src.upper()[:5]}&to={dest.upper()[:5]}&date={irctc_date}&adults={travelers}",
            "type": "Official Government Portal",
            "badge": "🟢 Official",
            "note": "India's official railway booking portal",
        },
        {
            "operator": "ConfirmTkt (Train search)",
            "url": f"https://www.confirmtkt.com/train-between-stations?src={src.upper()[:5]}&dst={dest.upper()[:5]}",
            "type": "Verified Partner",
            "badge": "🔵 Verified",
            "note": "Train search & PNR status — redirects to IRCTC for booking",
        },
    ]

def _bus_links(src, dest, date_str) -> list[dict]:
    src_slug  = src.lower().replace(" ", "-")
    dest_slug = dest.lower().replace(" ", "-")
    return [
        {
            "operator": "RedBus",
            "url": f"https://www.redbus.in/bus-tickets/{src_slug}-to-{dest_slug}",
            "type": "Verified Partner",
            "badge": "🔵 Verified",
            "note": "India's largest bus booking platform",
        },
        {
            "operator": "AbhiBus",
            "url": f"https://www.abhibus.com/bus/{src_slug}-to-{dest_slug}/",
            "type": "Verified Partner",
            "badge": "🔵 Verified",
        },
    ]

def _hotel_links(dest, date_str, days: int, travelers: int) -> list[dict]:
    dest_slug = dest.lower().replace(" ", "-")
    checkin   = date_str or ""
    return [
        {
            "platform": "MakeMyTrip Hotels",
            "url": f"https://www.makemytrip.com/hotels/{dest_slug}-hotels.html",
            "type": "Verified Aggregator",
            "badge": "🔵 Verified",
        },
        {
            "platform": "OYO Rooms",
            "url": f"https://www.oyorooms.com/s/?q={dest.replace(' ', '+')}&city={dest.replace(' ', '+')}",
            "type": "Verified Partner",
            "badge": "🔵 Verified",
            "note": "Budget & mid-range hotels",
        },
        {
            "platform": "Goibibo",
            "url": f"https://www.goibibo.com/hotels/hotels-in-{dest_slug}/",
            "type": "Verified Aggregator",
            "badge": "🔵 Verified",
        },
        {
            "platform": "Treebo Hotels",
            "url": f"https://www.treebo.com/hotels/{dest_slug}/",
            "type": "Verified Partner",
            "badge": "🔵 Verified",
            "note": "Verified quality budget hotels",
        },
    ]
