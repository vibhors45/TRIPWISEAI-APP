import { useState } from "react";

const glass = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "24px 28px",
};
const sectionLabel = (text) => (
  <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1, marginBottom: 14, fontFamily: "sans-serif", fontWeight: 600 }}>{text}</div>
);
const pill = (bg, color, text) => (
  <span style={{ display: "inline-block", background: bg, borderRadius: 99, padding: "3px 10px", fontSize: 11, color, fontFamily: "sans-serif", fontWeight: 600 }}>{text}</span>
);

// ── 1. Feasibility Banner ────────────────────────────────────────
function FeasibilityBanner({ data }) {
  if (!data) return null;
  const colors = {
    FEASIBLE:     { bg: "rgba(16,185,129,0.12)", border: "#10b981", icon: "✅", text: "#34d399", label: "Budget is Feasible" },
    TIGHT:        { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", icon: "⚠️", text: "#fbbf24", label: "Budget is Tight" },
    NOT_FEASIBLE: { bg: "rgba(239,68,68,0.12)",  border: "#ef4444", icon: "❌", text: "#f87171", label: "Budget Not Feasible" },
  };
  const c = colors[data.status] || colors.TIGHT;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}40`, borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{c.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: c.text, fontFamily: "sans-serif" }}>{c.label}</span>
            <span style={{ display: "inline-block", background: `${c.border}22`, borderRadius: 99, padding: "3px 10px", fontSize: 11, color: c.text, fontFamily: "sans-serif", fontWeight: 600 }}>{data.confidence}% confidence</span>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#cbd5e1", fontFamily: "sans-serif", lineHeight: 1.6 }}>{data.explanation}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            {[
              { label: "Minimum Required", val: `₹${data.min_required?.toLocaleString()}` },
              { label: "Recommended", val: `₹${data.recommended?.toLocaleString()}` },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 14px" }}>
                <div style={{ fontSize: 10, color: "#64748b", fontFamily: "sans-serif" }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "sans-serif" }}>{s.val}</div>
              </div>
            ))}
          </div>
          {data.suggestions?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {data.suggestions.slice(0, 3).map((s, i) => (
                <li key={i} style={{ fontSize: 13, color: "#94a3b8", fontFamily: "sans-serif", marginBottom: 4 }}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 2. Intelligence Score ────────────────────────────────────────
function IntelligenceScoreCard({ data }) {
  if (!data) return null;
  const scoreColor = data.total >= 85 ? "#10b981" : data.total >= 70 ? "#f59e0b" : data.total >= 55 ? "#f97316" : "#ef4444";
  return (
    <div style={{ ...glass, marginBottom: 20 }}>
      {sectionLabel("⭐ TRIP INTELLIGENCE SCORE")}
      <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
        {/* Score circle */}
        <div style={{ width: 110, height: 110, borderRadius: "50%", background: `conic-gradient(${scoreColor} ${data.total * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 24px ${scoreColor}40` }}>
          <div style={{ width: 86, height: 86, borderRadius: "50%", background: "#0a0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, fontFamily: "sans-serif", lineHeight: 1 }}>{data.total}</div>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "sans-serif" }}>/ 100</div>
          </div>
        </div>
        {/* Grade */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "sans-serif", marginBottom: 4 }}>{data.grade}</div>
          <div style={{ fontSize: 14, color: "#94a3b8", fontFamily: "sans-serif", marginBottom: 12 }}>{data.verdict}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {data.badges?.map((b, i) => (
              <span key={i} style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#fbbf24", fontFamily: "sans-serif" }}>{b}</span>
            ))}
          </div>
        </div>
        {/* Component bars */}
        <div style={{ flex: 2, minWidth: 200 }}>
          {Object.values(data.components || {}).map((c, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "sans-serif" }}>{c.label}</span>
                <span style={{ fontSize: 11, color: "#fff", fontFamily: "sans-serif", fontWeight: 600 }}>{c.score}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${c.score}%`, borderRadius: 99, background: c.score >= 80 ? "#10b981" : c.score >= 60 ? "#f59e0b" : "#ef4444", transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 3. Weather Card ──────────────────────────────────────────────
function WeatherCard({ data }) {
  if (!data) return null;
  return (
    <div style={{ ...glass, marginBottom: 20 }}>
      {sectionLabel("🌤 WEATHER AT DESTINATION")}
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {data.icon && <img src={data.icon} alt="" width={64} height={64} />}
        <div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#fff", fontFamily: "sans-serif", lineHeight: 1 }}>{data.temperature}°C</div>
          <div style={{ fontSize: 14, color: "#94a3b8", fontFamily: "sans-serif", marginTop: 4 }}>{data.description}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "sans-serif", marginTop: 2 }}>Feels like {data.feels_like}°C · Humidity {data.humidity}% · Wind {data.wind_speed} km/h</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "sans-serif", lineHeight: 1.6, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px" }}>{data.travel_impact}</div>
        </div>
      </div>
      {data.alerts?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {data.alerts.map((a, i) => (
            <div key={i} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 13, color: "#fca5a5", fontFamily: "sans-serif" }}>{a}</div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {data.daily?.slice(0, 5).map((d, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", minWidth: 90, textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "sans-serif", marginBottom: 4 }}>{d.date}</div>
            {d.icon && <img src={d.icon} alt="" width={28} height={28} style={{ margin: "0 auto 4px", display: "block" }} />}
            <div style={{ fontSize: 14, color: "#fff", fontFamily: "sans-serif", fontWeight: 600 }}>{Math.round(d.temp_max)}°</div>
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "sans-serif" }}>{Math.round(d.temp_min)}°</div>
            {d.rain_prob > 20 && <div style={{ fontSize: 10, color: "#93c5fd", fontFamily: "sans-serif", marginTop: 2 }}>💧{d.rain_prob}%</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 4. Crowd + Price Trend ───────────────────────────────────────
function CrowdAndTrend({ crowd, priceTrend }) {
  const crowdColors = { Low: "#10b981", Moderate: "#f59e0b", High: "#f97316", "Very High": "#ef4444" };
  const crowdColor = crowdColors[crowd?.level] || "#94a3b8";
  const trendColor = priceTrend?.trend === "Increasing" ? "#ef4444" : priceTrend?.trend === "Decreasing" ? "#10b981" : "#f59e0b";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
      <div style={glass}>
        {sectionLabel("👥 EXPECTED CROWD")}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${crowdColor}22`, border: `2px solid ${crowdColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            {crowd?.level === "Low" ? "😌" : crowd?.level === "Moderate" ? "🙂" : crowd?.level === "High" ? "😐" : "😬"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: crowdColor, fontFamily: "sans-serif" }}>{crowd?.level}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontFamily: "sans-serif" }}>{crowd?.confidence}% confidence</div>
          </div>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${crowd?.score}%`, borderRadius: 99, background: crowdColor, transition: "width 1s ease" }} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontFamily: "sans-serif", lineHeight: 1.6 }}>{crowd?.best_time_to_visit}</p>
      </div>
      <div style={glass}>
        {sectionLabel("📊 PRICE TREND")}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 40 }}>{priceTrend?.trend_icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: trendColor, fontFamily: "sans-serif" }}>{priceTrend?.trend}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontFamily: "sans-serif" }}>{priceTrend?.confidence}% confidence</div>
          </div>
        </div>
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "#fbbf24", fontFamily: "sans-serif", fontWeight: 600 }}>{priceTrend?.recommendation}</div>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontFamily: "sans-serif", lineHeight: 1.5 }}>{priceTrend?.explanation?.slice(0, 140)}...</p>
      </div>
    </div>
  );
}

// ── 5. Risk Alerts ───────────────────────────────────────────────
function RiskAlertsPanel({ alerts }) {
  if (!alerts?.length) return null;
  const sevColor = { Low: "#10b981", Medium: "#f59e0b", High: "#ef4444" };
  return (
    <div style={{ ...glass, marginBottom: 20 }}>
      {sectionLabel("⚠ RISK ALERTS")}
      {alerts.map((a, i) => (
        <div key={i} style={{ background: `${sevColor[a.severity]}0f`, border: `1px solid ${sevColor[a.severity]}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "sans-serif" }}>{a.message}</span>
              <span style={{ background: `${sevColor[a.severity]}22`, borderRadius: 99, padding: "2px 8px", fontSize: 11, color: sevColor[a.severity], fontFamily: "sans-serif" }}>{a.severity}</span>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "sans-serif" }}>→ {a.action}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 6. Booking Links ─────────────────────────────────────────────
function BookingLinksPanel({ data }) {
  if (!data) return null;
  const [tab, setTab] = useState("flights");
  const tabs = [
    { key: "flights", label: "✈ Flights",  items: data.flights },
    { key: "trains",  label: "🚆 Trains",   items: data.trains },
    { key: "buses",   label: "🚌 Buses",    items: data.buses },
    { key: "hotels",  label: "🏨 Hotels",   items: data.hotels },
  ];
  const current = tabs.find(t => t.key === tab);
  return (
    <div style={{ ...glass, marginBottom: 20 }}>
      {sectionLabel("🔗 BOOK YOUR TRIP")}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "8px 6px", borderRadius: 8, border: "none", background: tab === t.key ? "rgba(245,158,11,0.2)" : "transparent", color: tab === t.key ? "#fbbf24" : "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 600, transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {current?.items?.map((item, i) => (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", textDecoration: "none", transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "sans-serif", marginBottom: 2 }}>
                {item.airline || item.operator || item.platform}
              </div>
              {item.note && <div style={{ fontSize: 11, color: "#64748b", fontFamily: "sans-serif" }}>{item.note}</div>}
            </div>
            <span style={{ fontSize: 18, color: "#f59e0b" }}>→</span>
          </a>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "#475569", fontFamily: "sans-serif" }}>{data.note}</div>
    </div>
  );
}

// ── 7. Smart Budget ──────────────────────────────────────────────
function SmartBudgetCard({ data, totalBudget }) {
  if (!data) return null;
  const categories = [
    { key: "transport",  label: "✈ Transport",  color: "linear-gradient(90deg,#3b82f6,#818cf8)" },
    { key: "hotel",      label: "🏨 Hotel",      color: "linear-gradient(90deg,#f59e0b,#f97316)" },
    { key: "food",       label: "🍽 Food",        color: "linear-gradient(90deg,#10b981,#06b6d4)" },
    { key: "activities", label: "🎯 Activities",  color: "linear-gradient(90deg,#ec4899,#a855f7)" },
    { key: "shopping",   label: "🛍 Shopping",    color: "linear-gradient(90deg,#8b5cf6,#6366f1)" },
    { key: "emergency",  label: "🚨 Emergency",   color: "linear-gradient(90deg,#ef4444,#f97316)" },
  ];
  return (
    <div style={{ ...glass, marginBottom: 20 }}>
      {sectionLabel("💰 SMART BUDGET BREAKDOWN")}
      {categories.map(({ key, label, color }) => {
        const amt = data[key] || 0;
        const pct = Math.min(Math.round((amt / totalBudget) * 100), 100);
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "#cbd5e1", fontFamily: "sans-serif" }}>{label}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: "sans-serif" }}>{pct}%</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "sans-serif" }}>₹{amt.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: color, transition: "width 1.1s cubic-bezier(.22,.61,.36,1)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────────
export default function TripDashboardV2({ result, budget }) {
  if (!result || !result.trip_version) return null;
  const { feasibility, weather, crowd, price_trend, risk_alerts, intelligence_score, booking_links, smart_budget } = result;
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 2, fontFamily: "sans-serif", fontWeight: 600 }}>⭐ TRAVEL INTELLIGENCE REPORT</div>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>
      <FeasibilityBanner data={feasibility} />
      <IntelligenceScoreCard data={intelligence_score} />
      <SmartBudgetCard data={smart_budget} totalBudget={budget} />
      <WeatherCard data={weather} />
      <CrowdAndTrend crowd={crowd} priceTrend={price_trend} />
      <RiskAlertsPanel alerts={risk_alerts} />
      <BookingLinksPanel data={booking_links} />
    </div>
  );
}
