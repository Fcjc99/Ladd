
"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [players,setPlayers]=useState([]);
  const SHEET_URL="https://docs.google.com/spreadsheets/d/10GcIrpebf6vvFMf7KD6_us0m6XdgtB0eRUWe36XCGiY/edit?gid=1580102111#gid=1580102111";

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
