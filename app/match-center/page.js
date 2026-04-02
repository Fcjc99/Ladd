'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    challenger: '',
    opponent: '',
    winner: '',
    score: '',
    submitted_by: '',
  })

  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID
  const submitUrl = process.env.NEXT_PUBLIC_MATCH_SUBMIT_URL

  async function loadMatches() {
    try {
      const res = await fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeFeed`)
      if (!res.ok) throw new Error(`Failed to fetch ChallengeFeed (${res.status})`)
      const data = await res.json()
      setMatches(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        throw new Error(`Submit failed (${res.status})`)
      }

      setMessage('Match submitted successfully')
      setForm({
        challenger: '',
        opponent: '',
        winner: '',
        score: '',
        submitted_by: '',
      })
    } catch (err) {
      setMessage(err.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const activeMatches = matches.filter((m) => (m.active || '').trim() === 'Active')
  const completedMatches = matches.filter((m) => (m.status || '').trim() === 'Completed')

  return (
    <div style={{ padding: 24, color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Match Center</h1>

      <section style={{ marginBottom: 40, maxWidth: 520 }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Report Match</h2> 

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            placeholder="Challenger"
            value={form.challenger}
            onChange={(e) => setForm({ ...form, challenger: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Opponent"
            value={form.opponent}
            onChange={(e) => setForm({ ...form, opponent: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Winner"
            value={form.winner}
            onChange={(e) => setForm({ ...form, winner: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Score"
            value={form.score}
            onChange={(e) => setForm({ ...form, score: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Your name"
            value={form.submitted_by}
            onChange={(e) => setForm({ ...form, submitted_by: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: 'white',
              color: 'black',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Match'}
          </button>
        </form>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </section>

      {loading && <p>Loading...</p>}
      {!loading && error && <pre>{error}</pre>}

      {!loading && !error && (
        <>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Active Challenges</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {activeMatches.map((match, index) => (
                <div
                  key={match.match_id || index}
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
                  <div>Deadline: {match.deadline}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Completed Matches</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {completedMatches.map((match, index) => (
                <div
                  key={match.match_id || index}
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
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
