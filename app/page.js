
"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [players,setPlayers]=useState([]);
  const SHEET_URL = "https://opensheet.elk.sh/1RFCQrPj8Jfvr8QILT8ss2vldVZccXbSjiJolOYW3i5A/Live%20Ranking";

  useEffect(()=>{
    fetch(SHEET_URL).then(r=>r.json()).then(setPlayers);
  },[]);

  const style=(rank)=>{
    if(rank==1) return "card" + " border:2px solid #7DD3FC; background:#F0FBFF;";
    return "card";
  };

  return (
    <main style={{padding:20}}>
      <h1>Live Rankings</h1>
      {players.map((p,i)=>(
        <div key={i} className="card" style={{background:"#111827"}}>
          <b>{p.RANK}</b> {p.PLAYER}
        </div>
      ))}
    </main>
  );
}
