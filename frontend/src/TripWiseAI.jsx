import { useState, useEffect, useRef } from "react";
import TripDashboardV2 from "./TripDashboardV2";

const HERO_SLIDES = [
  { name: "Santorini, Greece", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80", tag: "Island Luxury" },
  { name: "Manali, Himachal Pradesh", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80", tag: "Mountain Escape" },
  { name: "Jaipur, Rajasthan", img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1600&q=80", tag: "Cultural Heritage" },
  { name: "Maldives", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80", tag: "Tropical Paradise" },
  { name: "Kerala Backwaters", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80", tag: "Serene & Lush" },
];

const TRAVEL_STYLES = ["Budget Explorer", "Comfort Seeker", "Luxury Traveler", "Adventure Junkie", "Culture & Heritage"];

const TRENDING_DESTINATIONS = [
  { name: "Leh-Ladakh", state: "Jammu & Kashmir", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", tag: "🏔 Mountain", reason: "Top pick for 2025 adventure seekers", budget: "₹25,000–₹45,000" },
  { name: "Goa", state: "India", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80", tag: "🏖 Beach", reason: "Year-round party & chill vibes", budget: "₹15,000–₹30,000" },
  { name: "Rishikesh", state: "Uttarakhand", img: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80", tag: "🌊 Adventure", reason: "Yoga, rafting & spiritual retreats", budget: "₹10,000–₹20,000" },
  { name: "Udaipur", state: "Rajasthan", img: "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=800&q=80", tag: "🏰 Heritage", reason: "City of Lakes — royal romance", budget: "₹12,000–₹25,000" },
  { name: "Coorg", state: "Karnataka", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80", tag: "🌿 Nature", reason: "Coffee plantations & misty hills", budget: "₹8,000–₹18,000" },
  { name: "Andaman Islands", state: "India", img: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80", tag: "🐠 Island", reason: "Crystal waters & pristine beaches", budget: "₹30,000–₹55,000" },
  { name: "Varanasi", state: "Uttar Pradesh", img: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=80", tag: "🕉 Spiritual", reason: "Ancient ghats & cultural depth", budget: "₹8,000–₹15,000" },
  { name: "Munnar", state: "Kerala", img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80", tag: "🍃 Hills", reason: "Tea gardens & cool climate escape", budget: "₹10,000–₹22,000" },
  { name: "Jaisalmer", state: "Rajasthan", img: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80", tag: "🏜 Desert", reason: "Golden Fort & camel safari magic", budget: "₹10,000–₹20,000" },
];

const HOW_IT_WORKS_STEPS = [
  { icon: "✦", title: "Tell Us Your Dream", desc: "Enter your departure city, destination preference, budget, number of travelers, and travel style. Be as specific or vague as you like — our AI understands both.", color: "#f59e0b" },
  { icon: "🤖", title: "AI Plans Everything", desc: "Our AI analyzes thousands of routes, hotels, and attractions to build a personalized itinerary that fits your exact budget and travel style.", color: "#3b82f6" },
  { icon: "📍", title: "Explore with Live Maps", desc: "Every destination comes with live OpenStreetMap integration showing your hotel zone, top attractions, and nearby points of interest with real coordinates.", color: "#10b981" },
  { icon: "🖼", title: "Visual Destination Cards", desc: "Browse stunning photos of each recommended destination and attraction, sourced live from Unsplash so you always see fresh, high-quality imagery.", color: "#ec4899" },
  { icon: "💰", title: "Smart Budget Breakdown", desc: "See exactly how your money is allocated across transport, hotel, food, and activities. Our budget engine adapts based on trip length and group size.", color: "#a855f7" },
  { icon: "📅", title: "Day-by-Day Itinerary", desc: "Get a detailed morning, afternoon, and evening plan for every day of your trip — complete with local tips, must-try food, and cultural experiences.", color: "#ef4444" },
];

async function fetchAttractionImages(attractionName, destinationName) {
  const query = encodeURIComponent(`${attractionName} ${destinationName} landmark`);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=AO3e2PfxNHhwzVN1C0GHD4TqfxBLOrS4LZMDKMhvXkg`;
  try {
    const r = await fetch(url);
    const d = await r.json();
    return d.results?.[0]?.urls?.regular || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80`;
  } catch {
    return `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80`;
  }
}

async function geocodePlace(name) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`, { headers: { "Accept-Language": "en" } });
    const d = await r.json();
    if (d[0]) return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), display: d[0].display_name };
    return null;
  } catch { return null; }
}

function SignInModal({ onClose }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = tab === "login" ? { email: form.email, password: form.password } : { name: form.name, email: form.email, password: form.password };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      localStorage.setItem("tw_token", data.access_token);
      localStorage.setItem("tw_user", JSON.stringify(data.user));
      setSuccess(`Welcome${tab === "register" ? `, ${data.user?.name}` : ""}! You're signed in.`);
      setTimeout(onClose, 1500);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  const inp = (placeholder, type, key) => (
    <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()}
      style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "sans-serif", boxSizing: "border-box", marginBottom: 12 }}
      onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"} />
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, width: "100%", maxWidth: 420, padding: "36px 32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}><span style={{ color: "#f59e0b" }}>Trip</span>Wise <span style={{ fontSize: 11, background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 4, padding: "2px 7px", color: "#fbbf24", fontFamily: "sans-serif" }}>AI</span></div>
        <p style={{ color: "#64748b", fontFamily: "sans-serif", fontSize: 13, marginBottom: 24 }}>Save your trips and access history</p>
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: tab === t ? "rgba(245,158,11,0.25)" : "transparent", color: tab === t ? "#fbbf24" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif", transition: "all 0.2s" }}>
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
        {tab === "register" && inp("Full Name", "text", "name")}
        {inp("Email address", "email", "email")}
        {inp("Password", "password", "password")}
        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, fontFamily: "sans-serif" }}>{error}</div>}
        {success && <div style={{ color: "#34d399", fontSize: 13, marginBottom: 12, fontFamily: "sans-serif" }}>{success}</div>}
        <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: loading ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "sans-serif" }}>
          {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

function DestinationsPage({ onClose }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a0f", zIndex: 9998, overflowY: "auto" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#f59e0b", marginBottom: 8, fontFamily: "sans-serif", fontWeight: 500 }}>EXPLORE · 2025</div>
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, fontFamily: "Georgia,serif" }}>Trending Destinations</h1>
            <p style={{ color: "#64748b", fontFamily: "sans-serif", fontSize: 14, margin: "8px 0 0" }}>Top attractions & hottest places to visit this year</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 20px", color: "#fff", cursor: "pointer", fontFamily: "sans-serif", fontSize: 13 }}>✕ Close</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 20 }}>
          {TRENDING_DESTINATIONS.map((d, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden", transition: "transform 0.2s, border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
              <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                <img src={d.img} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#fbbf24", fontFamily: "sans-serif" }}>{d.tag}</div>
                {i < 3 && <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#fff", fontFamily: "sans-serif", fontWeight: 600 }}>🔥 HOT</div>}
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", fontFamily: "sans-serif", marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: "#f59e0b", fontFamily: "sans-serif", marginBottom: 8 }}>{d.state}</div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 10px", fontFamily: "sans-serif" }}>{d.reason}</p>
                <div style={{ fontSize: 12, color: "#64748b", fontFamily: "sans-serif" }}>Est. budget: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{d.budget}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorksPage({ onClose }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a0f", zIndex: 9998, overflowY: "auto" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#f59e0b", marginBottom: 8, fontFamily: "sans-serif", fontWeight: 500 }}>GUIDE</div>
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, fontFamily: "Georgia,serif" }}>How TripWise AI Works</h1>
            <p style={{ color: "#64748b", fontFamily: "sans-serif", fontSize: 14, margin: "8px 0 0" }}>From idea to full itinerary in seconds</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 20px", color: "#fff", cursor: "pointer", fontFamily: "sans-serif", fontSize: 13 }}>✕ Close</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {HOW_IT_WORKS_STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 28px", alignItems: "flex-start" }}>
              <div style={{ minWidth: 52, height: 52, borderRadius: 14, background: `${s.color}22`, border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000", fontFamily: "sans-serif" }}>{i + 1}</div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#fff", fontFamily: "sans-serif" }}>{s.title}</div>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.7, fontFamily: "sans-serif" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 18, padding: "28px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#fff", fontFamily: "sans-serif", marginBottom: 8 }}>Powered by AI + Real Data</div>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", fontFamily: "sans-serif", lineHeight: 1.7 }}>TripWise AI uses large language models for planning, OpenStreetMap for live geocoding, and Unsplash for real destination photos — all stitched together in real time just for you.</p>
        </div>
      </div>
    </div>
  );
}

function BudgetBar({ label, amount, total, color }) {
  const pct = Math.min(Math.round((amount / total) * 100), 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "#cbd5e1", fontFamily: "sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "sans-serif" }}>₹{amount.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: color, transition: "width 1.1s cubic-bezier(.22,.61,.36,1)" }} />
      </div>
    </div>
  );
}

function ItineraryDay({ day, activities }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
      <div style={{ minWidth: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0, fontFamily: "sans-serif" }}>D{day}</div>
      <div>
        {activities.map((a, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <span style={{ display: "inline-block", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, padding: "2px 9px", fontSize: 12, color: "#fbbf24", marginRight: 8, fontFamily: "sans-serif" }}>{a.time}</span>
            <span style={{ fontSize: 14, color: "#e2e8f0", fontFamily: "sans-serif" }}>{a.activity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DestModal({ dest, onClose }) {
  const [imgLoaded, setImgLoaded] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => {
    if (!dest.coords || mapLoaded) return;
    const initMap = () => {
      if (leafletMap.current || !mapRef.current) return;
      const L = window.L; if (!L) return;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([dest.coords.lat, dest.coords.lon], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      const mainIcon = L.divIcon({ html: `<div style="background:linear-gradient(135deg,#f59e0b,#ef4444);width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`, className: "", iconSize: [36, 36], iconAnchor: [18, 36] });
      L.marker([dest.coords.lat, dest.coords.lon], { icon: mainIcon }).addTo(map).bindPopup(`<b>${dest.name}</b>`).openPopup();
      dest.attractions?.forEach(a => { if (a.coords) { const ai = L.divIcon({ html: `<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`, className: "", iconSize: [12, 12], iconAnchor: [6, 6] }); L.marker([a.coords.lat, a.coords.lon], { icon: ai }).addTo(map).bindPopup(`<b>${a.name}</b><br><small>${a.type}</small>`); } });
      leafletMap.current = map; setMapLoaded(true);
    };
    if (window.L) { initMap(); } else {
      const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = initMap; document.head.appendChild(script);
    }
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [dest.coords]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <div style={{ position: "relative", height: 220, overflow: "hidden", borderRadius: "24px 24px 0 0" }}>
          <img src={dest.heroImg} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,17,23,1) 0%, rgba(15,17,23,0.3) 60%, transparent 100%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ position: "absolute", bottom: 20, left: 24 }}>
            <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 2, fontFamily: "sans-serif", fontWeight: 600, marginBottom: 4 }}>{dest.country?.toUpperCase()}</div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: "Georgia, serif" }}>{dest.name}</h2>
          </div>
        </div>
        <div style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[{ label: "Est. Budget", val: `₹${dest.budget?.toLocaleString()}` }, { label: "Best Season", val: dest.best_season || "Year-round" }, { label: "Language", val: dest.language || "Local" }, { label: "Currency", val: dest.currency || "Local" }].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", flex: "1 1 100px" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: "sans-serif", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "sans-serif" }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1, marginBottom: 10, fontFamily: "sans-serif", fontWeight: 600 }}>📍 LIVE LOCATION MAP</div>
            {dest.coords ? <div ref={mapRef} style={{ height: 260, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }} /> : <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "sans-serif", fontSize: 13 }}>⚠ Could not load map</div>}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1, marginBottom: 14, fontFamily: "sans-serif", fontWeight: 600 }}>🏛 TOP ATTRACTIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {dest.attractions?.map((a, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ height: 130, overflow: "hidden", position: "relative", background: "#1a1a2e" }}>
                    {!imgLoaded[i] && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 28, height: 28, border: "3px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}
                    <img src={a.img} alt={a.name} onLoad={() => setImgLoaded(p => ({ ...p, [i]: true }))} onError={e => { e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"; setImgLoaded(p => ({ ...p, [i]: true })); }} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded[i] ? 1 : 0, transition: "opacity 0.4s" }} />
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#fbbf24", fontFamily: "sans-serif" }}>{a.type}</div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", fontFamily: "sans-serif", marginBottom: 4 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "sans-serif", lineHeight: 1.5 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function DestCard({ dest, rank, onExplore }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div onClick={onExplore} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
      <div style={{ height: 140, overflow: "hidden", position: "relative", background: "#1a1a2e" }}>
        <img src={dest.heroImg} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: 10, left: 10, fontSize: 22 }}>{medals[rank]}</div>
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#fbbf24", fontFamily: "sans-serif" }}>Tap to explore →</div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", fontFamily: "sans-serif", marginBottom: 2 }}>{dest.name}</div>
        <div style={{ fontSize: 12, color: "#f59e0b", fontFamily: "sans-serif", marginBottom: 8 }}>Est. ₹{dest.budget?.toLocaleString()}</div>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0, fontFamily: "sans-serif" }}>{dest.reason}</p>
      </div>
    </div>
  );
}

export default function TripWiseAI() {
  const [slide, setSlide] = useState(0);
  const [form, setForm] = useState({ destination: "", from: "Lucknow", days: "4", travelers: "2", budget: "30000", style: "Budget Explorer", travel_date: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dots, setDots] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("tw_user")); } catch { return null; } });
  const resultsRef = useRef(null);

  useEffect(() => { const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!loading) return; const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 450); return () => clearInterval(t); }, [loading]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const plan = async () => {
    if (!form.destination.trim()) { setError("Please enter a destination or preference."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      // ── v2.0: Call the upgraded intelligence endpoint ──────────
      const res = await fetch("/api/v2/trips/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_city: form.from,
          destination: form.destination,
          budget: parseInt(form.budget),
          travelers: parseInt(form.travelers),
          days: parseInt(form.days),
          travel_style: form.style,
          travel_date: form.travel_date || null,
        }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.detail || `Server error: ${res.status}`); }
      const parsed = await res.json();

      // ── Enrich destinations with frontend geocoding + images ──
      // (Backend already does this for v2, but fallback if missing)
      const enriched = await Promise.all((parsed.destinations || []).map(async (dest) => {
        if (dest.heroImg && dest.coords) return dest; // already enriched by backend
        const heroQuery = encodeURIComponent(`${dest.name} city landmark travel`);
        let heroImg = dest.heroImg || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80`;
        try { const hr = await fetch(`https://api.unsplash.com/search/photos?query=${heroQuery}&per_page=1&orientation=landscape&client_id=AO3e2PfxNHhwzVN1C0GHD4TqfxBLOrS4LZMDKMhvXkg`); const hd = await hr.json(); if (hd.results?.[0]?.urls?.regular) heroImg = hd.results[0].urls.regular; } catch {}
        const coords = dest.coords || await geocodePlace(dest.name);
        const attractions = await Promise.all((dest.attractions || []).map(async (a) => {
          if (a.img && a.coords) return a;
          const [img, aCoords] = await Promise.all([fetchAttractionImages(a.name, dest.name), geocodePlace(`${a.name}, ${dest.name}`)]);
          return { ...a, img: a.img || img, coords: a.coords || aCoords };
        }));
        return { ...dest, heroImg, coords, attractions };
      }));

      setResult({ ...parsed, destinations: enriched });
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      console.error(e);
      setError(e.message?.includes("Server error") || e.message?.includes("Failed to fetch")
        ? "Could not connect to the backend. Make sure the server is running on port 8000."
        : e.message || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const budgetNum = parseInt(form.budget) || 30000;
  const bb = result?.budget_breakdown || {};
  const totalBB = (bb.transport || 0) + (bb.hotel || 0) + (bb.food || 0) + (bb.activities || 0);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#0a0a0f", minHeight: "100vh", color: "#fff" }}>
      <div style={{ position: "relative", height: "100vh", minHeight: 600, overflow: "hidden" }}>
        {HERO_SLIDES.map((d, i) => (<div key={i} style={{ position: "absolute", inset: 0, backgroundImage: `url(${d.img})`, backgroundSize: "cover", backgroundPosition: "center", opacity: slide === i ? 1 : 0, transition: "opacity 1.4s ease" }} />))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.6) 50%, rgba(10,10,15,0.94) 100%)" }} />

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: "#f59e0b" }}>Trip</span>Wise
            <span style={{ fontSize: 11, background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 4, padding: "2px 7px", marginLeft: 8, color: "#fbbf24", verticalAlign: "middle", fontFamily: "sans-serif", fontWeight: 500 }}>AI</span>
          </div>
          <div style={{ display: "flex", gap: 28, fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "sans-serif", alignItems: "center" }}>
            <span onClick={() => setShowDestinations(true)} style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>Destinations</span>
            <span onClick={() => setShowHowItWorks(true)} style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>How it works</span>
            {user ? (
              <span style={{ cursor: "pointer", color: "#fbbf24", fontSize: 13 }} onClick={() => { localStorage.clear(); setUser(null); }}>👤 {user.name?.split(" ")[0]} · Sign out</span>
            ) : (
              <span onClick={() => setShowSignIn(true)} style={{ cursor: "pointer", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 20, padding: "6px 16px", color: "#fbbf24", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.25)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,0.15)"}>Sign in</span>
            )}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 210, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
          {HERO_SLIDES.map((_, i) => (<div key={i} onClick={() => setSlide(i)} style={{ width: slide === i ? 24 : 6, height: 6, borderRadius: 99, background: slide === i ? "#f59e0b" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.4s" }} />))}
        </div>
        <div style={{ position: "absolute", bottom: 228, right: 40, fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif", letterSpacing: 1 }}>{HERO_SLIDES[slide].tag.toUpperCase()} · {HERO_SLIDES[slide].name}</div>

        <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "90%", maxWidth: 680, zIndex: 5 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#f59e0b", marginBottom: 16, fontFamily: "sans-serif", fontWeight: 500 }}>AI-POWERED TRAVEL PLANNING</div>
          <h1 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 700, lineHeight: 1.15, margin: "0 0 16px", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>Discover Your Perfect Trip<br /><span style={{ color: "#f59e0b" }}>Within Budget</span></h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", fontFamily: "sans-serif", fontWeight: 400, margin: 0 }}>AI-powered travel planning tailored to your budget — flights, hotels, itineraries & more.</p>
        </div>

        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", width: "92%", maxWidth: 860, background: "rgba(10,10,20,0.75)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "28px 32px", zIndex: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 16 }}>
            {[{ label: "Departure City", key: "from", type: "text", placeholder: "e.g. Lucknow" }, { label: "Destination / Preference", key: "destination", type: "text", placeholder: "e.g. Beach, Goa, Hills" }, { label: "Travel Date", key: "travel_date", type: "date", placeholder: "" }, { label: "Trip Days", key: "days", type: "number", placeholder: "4" }, { label: "Travelers", key: "travelers", type: "number", placeholder: "2" }, { label: "Budget (₹)", key: "budget", type: "number", placeholder: "30000" }].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, letterSpacing: 0.5, fontFamily: "sans-serif", fontWeight: 500 }}>{label.toUpperCase()}</div>
                <input type={type} value={form[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "sans-serif", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8, letterSpacing: 0.5, fontFamily: "sans-serif", fontWeight: 500 }}>TRAVEL STYLE</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TRAVEL_STYLES.map(s => (<button key={s} onClick={() => update("style", s)} style={{ padding: "7px 14px", borderRadius: 99, border: `1px solid ${form.style === s ? "#f59e0b" : "rgba(255,255,255,0.15)"}`, background: form.style === s ? "rgba(245,158,11,0.2)" : "transparent", color: form.style === s ? "#fbbf24" : "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif", transition: "all 0.2s" }}>{s}</button>))}
            </div>
          </div>
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, fontFamily: "sans-serif" }}>{error}</div>}
          <button onClick={plan} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: loading ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "sans-serif", letterSpacing: 0.5, transition: "opacity 0.2s, transform 0.15s" }} onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)")} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            {loading ? `✦ AI is planning your trip${dots}` : "✦ Plan My Trip with AI"}
          </button>
        </div>
      </div>

      {result && (
        <div ref={resultsRef} style={{ maxWidth: 920, margin: "0 auto", padding: "60px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#f59e0b", marginBottom: 10, fontFamily: "sans-serif", fontWeight: 500 }}>YOUR PERSONALIZED PLAN</div>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Trip to <span style={{ color: "#f59e0b" }}>{result.top_destination}</span></h2>
            <p style={{ color: "#64748b", fontFamily: "sans-serif", fontSize: 14, marginTop: 8 }}>Click any destination card to explore attractions, live map & details</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 32px", marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: "#94a3b8", letterSpacing: 1, marginBottom: 22, fontFamily: "sans-serif" }}>BUDGET BREAKDOWN · ₹{totalBB.toLocaleString()} allocated</div>
            <BudgetBar label="✈ Transport" amount={bb.transport} total={budgetNum} color="linear-gradient(90deg,#3b82f6,#818cf8)" />
            <BudgetBar label="🏨 Hotel" amount={bb.hotel} total={budgetNum} color="linear-gradient(90deg,#f59e0b,#f97316)" />
            <BudgetBar label="🍽 Food" amount={bb.food} total={budgetNum} color="linear-gradient(90deg,#10b981,#06b6d4)" />
            <BudgetBar label="🎯 Activities" amount={bb.activities} total={budgetNum} color="linear-gradient(90deg,#ec4899,#a855f7)" />
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: "#94a3b8", letterSpacing: 1, marginBottom: 16, fontFamily: "sans-serif" }}>AI RECOMMENDATIONS — CLICK TO EXPLORE</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px,1fr))", gap: 16 }}>
              {result.destinations?.map((d, i) => <DestCard key={i} dest={d} rank={i} onExplore={() => setActiveModal(d)} />)}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 32px", marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: "#94a3b8", letterSpacing: 1, marginBottom: 24, fontFamily: "sans-serif" }}>{form.days}-DAY ITINERARY · {result.top_destination}</div>
            {result.itinerary?.slice(0, parseInt(form.days)).map(d => <ItineraryDay key={d.day} day={d.day} activities={d.activities} />)}
          </div>
          {result.ai_tip && (
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: "20px 24px", display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 28 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 1, marginBottom: 6, fontFamily: "sans-serif", fontWeight: 600 }}>AI BUDGET TIP</div>
                <p style={{ margin: 0, fontSize: 14, color: "#e2e8f0", lineHeight: 1.65, fontFamily: "sans-serif" }}>{result.ai_tip}</p>
              </div>
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <button onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "13px 32px", borderRadius: 99, border: "1px solid rgba(245,158,11,0.5)", background: "transparent", color: "#f59e0b", fontSize: 14, cursor: "pointer", fontFamily: "sans-serif" }}>← Plan a new trip</button>
          </div>
        </div>
      )}

      {/* ── TripWise AI v2.0 Intelligence Dashboard ── */}
      {result && <TripDashboardV2 result={result} budget={parseInt(form.budget) || 30000} />}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700 }}><span style={{ color: "#f59e0b" }}>Trip</span>Wise AI</div>
        <div style={{ fontSize: 12, color: "#475569", fontFamily: "sans-serif" }}>Powered by AI · Built for explorers</div>
      </div>

      {activeModal && <DestModal dest={activeModal} onClose={() => setActiveModal(null)} />}
      {showSignIn && <SignInModal onClose={() => { setShowSignIn(false); try { setUser(JSON.parse(localStorage.getItem("tw_user"))); } catch {} }} />}
      {showDestinations && <DestinationsPage onClose={() => setShowDestinations(false)} />}
      {showHowItWorks && <HowItWorksPage onClose={() => setShowHowItWorks(false)} />}
    </div>
  );
}
