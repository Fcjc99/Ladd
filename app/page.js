"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const SHEET_URL =
    "https://opensheet.elk.sh/1lRG3_Tdfi95eu8LyLM9e8fic_IB8mpRj2s9YzOGiIDQ/App%20Feed";

  useEffect(() => {
    fetch(SHEET_URL)
      .then((r) => r.json())
      .then((data) => setPlayers(Array.isArray(data) ? data : []))
      .catch(() => setPlayers([]));
  }, []);

  return (
    <main
      style={{
        padding: 20,
        background: "#0b0f1a",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1>Live Rankings</h1>

      {players.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "#111827",
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 800, width: 40 }}>{p.RANK}</div>

          <img
            src={p.PHOTO || "https://placehold.co/64x64/png"}
            alt={p.PLAYER || "Player"}
            style={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: 12,
              background: "#1f2937",
            }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{p.PLAYER}</div>
            <div style={{ opacity: 0.7 }}>{p.STATUS}</div>
          </div>

          <div style={{ fontWeight: 700 }}>{p.MOVE}</div>
        </div>
      ))}
    </main>
  );
}
