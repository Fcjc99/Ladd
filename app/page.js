"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const SHEET_URL = "https://opensheet.elk.sh/1zoH3KnR8sAh51XwOo5rDdK51OqcI5SXG1F_LTvtmTGk/App%20Feed";

  useEffect(() => {
    fetch(SHEET_URL)
      .then((r) => r.json())
      .then((data) => setPlayers(data));
  }, []);

  return (
    <main style={{ padding: 20, background: "#0b0f1a", minHeight: "100vh", color: "white" }}>
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
            src={p.PHOTO}
            alt={p.PLAYER}
            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 12 }}
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
