'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingChallenge, setSubmittingChallenge] = useState(false)
  const [challengeMessage, setChallengeMessage] = useState('')
  const [submittingResult, setSubmittingResult] = useState(false)
  const [resultMessage, setResultMessage] = useState('')

  const [challengeForm, setChallengeForm] = useState({
    challenger: '',
    opponent: '',
    match_date: '',
  })

  const [resultForm, setResultForm] = useState({
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

  async function handleChallengeSubmit(e) {
    e.preventDefault()
    setSubmittingChallenge(true)
    setChallengeMessage('')

    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'challenge',
          challenger: challengeForm.challenger,
          opponent: challengeForm.opponent,
          match_date: challengeForm.match_date,
          challenger_rank: '',
          opponent_rank: '',
          approval: 'Pending',
          eligible: 'Eligible',
          deadline: '',
          winner: '',
          score: '',
          status: 'Scheduled',
        }),
      })

      if (!res.ok) {
        throw new Error(`Challenge submit failed (${res.status})`)
      }

      setChallengeMessage('Challenge submitted successfully')
      setChallengeForm({
        challenger: '',
        opponent: '',
        match_date: '',
      })
    } catch (err) {
      setChallengeMessage(err.message || 'Challenge submit failed')
    } finally {
      setSubmittingChallenge(false)
    }
  }

  async function handleResultSubmit(e) {
    e.preventDefault()
    setSubmittingResult(true)
    setResultMessage('')

    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'match',
          ...resultForm,
        }),
      })

      if (!res.ok) {
        throw new Error(`Result submit failed (${res.status})`)
      }

      setResultMessage('Result submitted successfully')
      setResultForm({
        challenger: '',
        opponent: '',
        winner: '',
        score: '',
        submitted_by: '',
      })
    } catch (err) {
      setResultMessage(err.message || 'Result submit failed')
    } finally {
      setSubmittingResult(false)
    }
  }

  const activeMatches = matches.filter((m) => (m.active || '').trim() === 'Active')
  const completedMatches = matches.filter((m) => (m.status || '').trim() === 'Completed')

  return (
    <div style={{ padding: 24, color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Match Center</h1>

      <section style={{ marginBottom: 48, maxWidth: 560 }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Submit Challenge</h2>

        <form onSubmit={handleChallengeSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            placeholder="Challenger name"
            value={challengeForm.challenger}
            onChange={(e) => setChallengeForm({ ...challengeForm, challenger: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Opponent name"
            value={challengeForm.opponent}
            onChange={(e) => setChallengeForm({ ...challengeForm, opponent: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
  type="date"
  value={challengeForm.match_date}
  onChange={(e) => setChallengeForm({ ...challengeForm, match_date: e.target.value })}
  style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
/>

          <button
            type="submit"
            disabled={submittingChallenge}
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
            {submittingChallenge ? 'Submitting...' : 'Submit Challenge'}
          </button>
        </form>

        {challengeMessage && <p style={{ marginTop: 12 }}>{challengeMessage}</p>}
      </section>

      <section style={{ marginBottom: 48, maxWidth: 560 }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Report Result</h2>

        <form onSubmit={handleResultSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            placeholder="Challenger"
            value={resultForm.challenger}
            onChange={(e) => setResultForm({ ...resultForm, challenger: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Opponent"
            value={resultForm.opponent}
            onChange={(e) => setResultForm({ ...resultForm, opponent: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Winner"
            value={resultForm.winner}
            onChange={(e) => setResultForm({ ...resultForm, winner: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Score"
            value={resultForm.score}
            onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <input
            placeholder="Your name"
            value={resultForm.submitted_by}
            onChange={(e) => setResultForm({ ...resultForm, submitted_by: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          <button
            type="submit"
            disabled={submittingResult}
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
            {submittingResult ? 'Submitting...' : 'Submit Result'}
          </button>
        </form>

        {resultMessage && <p style={{ marginTop: 12 }}>{resultMessage}</p>}
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
                  <div>Date: {match.match_date || '—'}</div>
                  <div>Deadline: {match.deadline || '—'}</div>
                  <div>Challenger Rank: {match.challenger_rank || '—'}</div>
                  <div>Opponent Rank: {match.opponent_rank || '—'}</div>
                  <div>Approval: {match.approval || '—'}</div>
                  <div>Eligible: {match.eligible || '—'}</div>
                  <div>Status: {match.status || '—'}</div>
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
                  <div>Date: {match.match_date || '—'}</div>
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
