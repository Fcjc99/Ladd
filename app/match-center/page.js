'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID

    if (!sheetId) {
      setError('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID')
      setLoading(false)
      return
    }

    fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeFeed`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch ChallengeFeed (${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        setMatches(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Unknown error')
        setLoading(false)
      })
  }, [])

  const activeMatches = matches.filter((m) => m.active === 'Active')
  const completedMatches = matches.filter((m) => m.status === 'Completed')

  return (
    <div style={{ padding: 24, color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Match Center</h1>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <>
          <h2>Error</h2>
          <pre>{error}</pre>
        </>
      )}

      {!loading && !error && (
        <>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Active Challenges</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {activeMatches.map((match) => (
                <div
                  key={match.match_id}
                  style={{
                    border: '1px solid #333',
                    borderRadius: 16,
                    padding: 20,
                    background: '#111',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                    {match.challenger} vs {match.opponent}
                  </div>
                  <div>Rank #{match.challenger_rank} vs Rank #{match.opponent_rank}</div>
                  <div>Status: {match.status}</div>
                  <div>Approval: {match.approval}</div>
                  <div>Deadline: {match.deadline}</div>
                  <div>Days left: {match.days_left}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Completed Matches</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {completedMatches.map((match) => (
                <div
                  key={match.match_id}
                  style={{
                    border: '1px solid #333',
                    borderRadius: 16,
                    padding: 20,
                    background: '#111',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                    {match.challenger} vs {match.opponent}
                  </div>
                  <div>Winner: {match.winner || '—'}</div>
                  <div>Score: {match.score || '—'}</div>
                  <div>Status: {match.status}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
