"use client";

import { useEffect, useState } from "react";

const SHEET_URL = "https://opensheet.elk.sh/1lRG3_Tdfi95eu8LyLM9e8fic_IB8mpRj2s9YzOGiIDQ/Match%20Feed";

function fallbackAvatar(name = "") {
  const letter = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect width="100%" height="100%" rx="20" fill="#0f172a"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#cbd5e1">${letter}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function statusClass(status = "") {
  const s = String(status).toLowerCase();
  if (s.includes("active")) return "mc-status mc-active";
  if (s.includes("scheduled")) return "mc-status mc-scheduled";
  if (s.includes("completed")) return "mc-status mc-completed";
  return "mc-status mc-default";
}

export default function MatchCenterPage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(SHEET_URL, { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        setMatches(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setMatches([]);
      }
    };

    load();
    const id = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="app-shell">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <section className="container">
        <div className="hero">
          <div>
            <div className="eyebrow">MATCH CENTER</div>
            <h1 className="title">Challenge Matches</h1>
            <p className="subtitle">Live matchups synced from your Google Sheet</p>
          </div>
          <a href="/" className="hero-chip" style={{ textDecoration: "none" }}>
            Back to Rankings
          </a>
        </div>

        <div className="list">
          {matches.map((m, i) => {
            const challenger = m.CHALLENGER || "Challenger";
            const opponent = m.OPPONENT || "Opponent";
            const status = m.STATUS || "Pending";
            const approval = m.APPROVAL || "-";
            const eligible = m.ELIGIBLE || "-";
            const winner = m.WINNER || "-";
            const score = m.SCORE || "-";
            const date = m.DATE || "-";
            const time = m.TIME || "-";

            return (
              <div
                key={i}
                className="player-card tier-normal"
                style={{ gridTemplateColumns: "1fr", padding: 22 }}
              >
                <div className="mc-main">
                  <div className="mc-side">
                    <img className="photo" src={fallbackAvatar(challenger)} alt={challenger} />
                    <div>
                      <div className="player-name">{challenger}</div>
                      <div className="status-row">Challenger</div>
                    </div>
                  </div>

                  <div className="mc-vs">
                    <div className="mc-vs-text">VS</div>
                    <div className={statusClass(status)}>{status}</div>
                  </div>

                  <div className="mc-side mc-side-right">
                    <div style={{ textAlign: "right" }}>
                      <div className="player-name">{opponent}</div>
                      <div className="status-row">Opponent</div>
                    </div>
                    <img className="photo" src={fallbackAvatar(opponent)} alt={opponent} />
                  </div>
                </div>

                <div className="mc-grid">
                  <div className="mc-chip">
                    <div className="mc-label">Approval</div>
                    <div className="mc-value">{approval}</div>
                  </div>
                  <div className="mc-chip">
                    <div className="mc-label">Eligible</div>
                    <div className="mc-value">{eligible}</div>
                  </div>
                  <div className="mc-chip">
                    <div className="mc-label">Date</div>
                    <div className="mc-value">{date}</div>
                  </div>
                  <div className="mc-chip">
                    <div className="mc-label">Time</div>
                    <div className="mc-value">{time}</div>
                  </div>
                  <div className="mc-chip">
                    <div className="mc-label">Winner</div>
                    <div className="mc-value">{winner}</div>
                  </div>
                  <div className="mc-chip">
                    <div className="mc-label">Score</div>
                    <div className="mc-value">{score}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
