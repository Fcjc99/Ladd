"use client";

import { useEffect, useState } from "react";

const SHEET_URL =
  "https://opensheet.elk.sh/1lRG3_Tdfi95eu8LyLM9e8fic_IB8mpRj2s9YzOGiIDQ/App%20Feed";

function tierClass(rank) {
  const n = Number(rank);
  if (n === 1) return "tier tier-r1";
  if (n === 2) return "tier tier-r2";
  if (n === 3) return "tier tier-r3";
  if (n >= 4 && n <= 7) return "tier tier-r47";
  return "tier tier-normal";
}

function moveBadge(move) {
  const n = Number(move);
  if (Number.isNaN(n)) return { label: String(move ?? "•"), className: "move move-flat" };
  if (n > 0) return { label: `▲ ${n}`, className: "move move-up" };
  if (n < 0) return { label: `▼ ${Math.abs(n)}`, className: "move move-down" };
  return { label: "•", className: "move move-flat" };
}

function fallbackAvatar(name = "") {
  const letter = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect width="100%" height="100%" rx="18" fill="#0f172a"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#cbd5e1">${letter}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function PlayerCard({ player, index }) {
  const rank = Number(player.RANK || index + 1);
  const photo = player.PHOTO?.trim() ? player.PHOTO : fallbackAvatar(player.PLAYER);
  const status = player.STATUS || "";
  const move = moveBadge(player.MOVE);

  return (
    <div
      className={`player-card ${tierClass(rank)}`}
      style={{ animationDelay: `${Math.min(index * 45, 500)}ms` }}
    >
      <div className="rank-col">
        <div className="rank-num">{rank}</div>
      </div>

      <div className="photo-wrap">
        <img
          src={photo}
          alt={player.PLAYER || "Player"}
          className="photo"
          onError={(e) => {
            e.currentTarget.src = fallbackAvatar(player.PLAYER);
          }}
        />
      </div>

      <div className="info">
        <div className="name-row">
          <div className="player-name">{player.PLAYER}</div>
          {rank === 1 && <span className="mini-badge">DIAMOND</span>}
          {rank === 2 && <span className="mini-badge">GOLD</span>}
          {rank === 3 && <span className="mini-badge">SILVER</span>}
          {rank >= 4 && rank <= 7 && <span className="mini-badge">COPPER</span>}
        </div>
        <div className="status-row">{status}</div>
      </div>

      <div className="right-col">
        <div className={move.className}>{move.label}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(SHEET_URL, { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        setPlayers(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setPlayers([]);
      } finally {
        if (mounted) setLoading(false);
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
            <div className="eyebrow">LIVE LADDER</div>
            <h1 className="title">Live Rankings</h1>
            <p className="subtitle">Hybrid esports UI powered by your Google Sheet</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="hero-chip">Top 16</div>
            <a href="/match-center" className="hero-chip" style={{ textDecoration: "none" }}>
              Match Center
            </a>
          </div>
        </div>

        {loading ? (
          <div className="list">
            {Array.from({ length: 10 }).map((_, i) => (
              <div className="player-card skeleton" key={i}>
                <div className="rank-col"><div className="sk sk-rank" /></div>
                <div className="photo-wrap"><div className="sk sk-photo" /></div>
                <div className="info">
                  <div className="sk sk-name" />
                  <div className="sk sk-status" />
                </div>
                <div className="right-col"><div className="sk sk-move" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="list">
            {players.map((player, index) => (
              <PlayerCard key={`${player.PLAYER}-${player.RANK}-${index}`} player={player} index={index} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
