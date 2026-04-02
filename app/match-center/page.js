use client'

import { useEffect, useMemo, useState } from 'react'

const PLAYERS = [
  { player: 'Sophia', rank: '1' },
  { player: 'Skye', rank: '2' },
  { player: 'Viv', rank: '3' },
  { player: 'Julia', rank: '4' },
  { player: 'Clara', rank: '5' },
  { player: 'Caroline', rank: '6' },
  { player: 'Christi', rank: '7' },
  { player: 'Logan', rank: '8' },
  { player: 'Ella', rank: '9' },
  { player: 'Elizabeth', rank: '10' },
  { player: 'Karen', rank: '11' },
  { player: 'Aislinn', rank: '12' },
  { player: 'Christyc', rank: '13' },
  { player: 'Bree', rank: '14' },
  { player: 'Ellie', rank: '15' },
  { player: 'Julianna', rank: '16' },
]

export default function Page() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [submittingChallenge, setSubmittingChallenge] = useState(false)
  const [challengeMessage, setChallengeMessage] = useState('')

  const [submittingResultId, setSubmittingResultId] = useState('')
  const [resultMessage, setResultMessage] = useState('')

  const [challengeForm, setChallengeForm] = useState({
    challenger: '',
    challenger_rank: '',
    opponent: '',
    opponent_rank: '',
    match_date: '',
    deadline: '',
  })

  const [scoreForms, setScoreForms] = useState({})

  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID

  function normalize(value) {
    return String(value || '').trim().toLowerCase()
  }

  function addDays(dateString, days) {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    if (Number.isNaN(date.getTime())) return ''
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(
        `https://opensheet.elk.sh/${sheetId}/ChallengeFeed`,
        { cache: 'no-store' }
      )

      if (!res.ok) {
        throw new Error(`Failed to fetch ChallengeFeed (${res.status})`)
      }

      const data = await res.json()
      setMatches(Array.isArray(data) ? data : [])
    } catch (err) {
      setMatches([])
      setError(err.message || 'Failed to fetch ChallengeFeed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const playerNames = useMemo(() => PLAYERS.map((p) => p.player), [])
  const playerRankMap = useMemo(() => {
    const map = {}
    PLAYERS.forEach((p) => {
      map[p.player] = p.rank
    })
    return map
  }, [])

  const activeMatches = useMemo(() => {
    return matches.filter((m) => {
      const eligible = normalize(m.eligible)
      const approval = normalize(m.approval)
      const status = normalize(m.status)

      return (
        eligible === 'eligible' &&
        approval === 'approved' &&
        status !== 'completed' &&
        status !== 'denied'
      )
    })
  }, [matches])

  const busyPlayers = useMemo(() => {
    const set = new Set()
    activeMatches.forEach((m) => {
      if (m.challenger) set.add(m.challenger)
      if (m.opponent) set.add(m.opponent)
    })
    return set
  }, [activeMatches])

  const availableChallengers = playerNames.filter((name) => !busyPlayers.has(name))
  const availableOpponents = playerNames.filter(
    (name) => name !== challengeForm.challenger && !busyPlayers.has(name)
  )

  const completedMatches = useMemo(() => {
    return matches.filter((m) => normalize(m.status) === 'completed')
  }, [matches])

  async function handleChallengeSubmit(e) {
    e.preventDefault()
    setSubmittingChallenge(true)
    setChallengeMessage('')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'challenge',
          challenger: challengeForm.challenger,
          challenger_rank: challengeForm.challenger_rank,
          opponent: challengeForm.opponent,
          opponent_rank: challengeForm.opponent_rank,
          match_date: challengeForm.match_date,
          deadline: challengeForm.deadline,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || data.raw || 'Challenge submit failed')
      }

      setChallengeMessage('Challenge submitted successfully')
      setChallengeForm({
        challenger: '',
        challenger_rank: '',
        opponent: '',
        opponent_rank: '',
        match_date: '',
        deadline: '',
      })

      setTimeout(loadData, 1500)
    } catch (err) {
      setChallengeMessage(err.message || 'Challenge submit failed')
    } finally {
      setSubmittingChallenge(false)
    }
  }

  function updateScoreForm(id, patch) {
    setScoreForms((prev) => ({
      ...prev,
      [id]: {
        winner: '',
        score: '',
        submitted_by: '',
        ...prev[id],
        ...patch,
      },
    }))
  }

  async function handleResultSubmit(e, match) {
    e.preventDefault()
    const id = match.match_id || `${match.challenger}-${match.opponent}`
    setSubmittingResultId(id)
    setResultMessage('')

    const form = scoreForms[id] || {
      winner: '',
      score: '',
      submitted_by: '',
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'match',
          challenger: match.challenger,
          opponent: match.opponent,
          winner: form.winner,
          score: form.score,
          submitted_by: form.submitted_by,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || data.raw || 'Result submit failed')
      }

      setResultMessage('Result submitted successfully')
      setTimeout(loadData, 1500)
    } catch (err) {
      setResultMessage(err.message || 'Result submit failed')
    } finally {
      setSubmittingResultId('')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #0f2747 0%, #05070b 35%, #030303 100%)',
        color: 'white',
        padding: '32px 20px 80px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#7ea8ff',
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Match Center
          </div>
          <h1 style={{ fontSize: 48, lineHeight: 1.05, margin: 0, fontWeight: 800 }}>
            Challenge Ladder
          </h1>
          <p style={{ color: '#9aa4b2', marginTop: 10, fontSize: 18 }}>
            Submit a challenge, track active matchups, and report results.
          </p>
        </div>

        {challengeMessage && <div style={messageStyle}>{challengeMessage}</div>}
        {resultMessage && <div style={messageStyle}>{resultMessage}</div>}

        <div style={{ ...messageStyle, marginBottom: 16 }}>
          Feed rows: {matches.length} | Active: {activeMatches.length} | Completed: {completedMatches.length}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 420px) 1fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <div style={panelStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 18, fontSize: 28 }}>Submit Challenge</h2>

            <form onSubmit={handleChallengeSubmit} style={{ display: 'grid', gap: 14 }}>
              <select
                value={challengeForm.challenger}
                onChange={(e) => {
                  const name = e.target.value
                  setChallengeForm({
                    ...challengeForm,
                    challenger: name,
                    challenger_rank: playerRankMap[name] || '',
                    opponent: challengeForm.opponent === name ? '' : challengeForm.opponent,
                    opponent_rank:
                      challengeForm.opponent === name ? '' : challengeForm.opponent_rank,
                  })
                }}
                style={inputStyle}
              >
                <option value="">Select challenger</option>
                {availableChallengers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {challengeForm.challenger_rank && (
                <div style={metaStyle}>Challenger Rank: #{challengeForm.challenger_rank}</div>
              )}

              <select
                value={challengeForm.opponent}
                onChange={(e) => {
                  const name = e.target.value
                  setChallengeForm({
                    ...challengeForm,
                    opponent: name,
                    opponent_rank: playerRankMap[name] || '',
                  })
                }}
                style={inputStyle}
              >
                <option value="">Select opponent</option>
                {availableOpponents.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {challengeForm.opponent_rank && (
                <div style={metaStyle}>Opponent Rank: #{challengeForm.opponent_rank}</div>
              )}

              <input
                type="date"
                value={challengeForm.match_date}
                onChange={(e) => {
                  const matchDate = e.target.value
                  setChallengeForm({
                    ...challengeForm,
                    match_date: matchDate,
                    deadline: addDays(matchDate, 7),
                  })
                }}
                style={inputStyle}
              />

              {challengeForm.deadline && (
                <div style={metaStyle}>Deadline: {challengeForm.deadline}</div>
              )}

              <button type="submit" disabled={submittingChallenge} style={buttonStyle}>
                {submittingChallenge ? 'Submitting...' : 'Submit Challenge'}
              </button>
            </form>
          </div>

          <div style={{ display: 'grid', gap: 26 }}>
            <section>
              <h2 style={sectionTitle}>Active Challenges</h2>

              {loading && <p>Loading...</p>}
              {!loading && error && <pre>{error}</pre>}
              {!loading && !error && activeMatches.length === 0 && (
                <div style={emptyCardStyle}>No active challenges yet.</div>
              )}

              <div style={{ display: 'grid', gap: 18 }}>
                {activeMatches.map((match) => {
                  const id = match.match_id || `${match.challenger}-${match.opponent}`
                  const form = scoreForms[id] || {
                    winner: '',
                    score: '',
                    submitted_by: '',
                  }

                  return (
                    <div key={id} style={cardStyle}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 20,
                          alignItems: 'start',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
                            {match.challenger} <span style={{ color: '#6b7280' }}>vs</span>{' '}
                            {match.opponent}
                          </div>
                          <div style={detailStyle}>Date: {match.match_date || '—'}</div>
                          <div style={detailStyle}>Deadline: {match.deadline || '—'}</div>
                          <div style={detailStyle}>
                            Challenger Rank: {match.challenger_rank || '—'}
                          </div>
                          <div style={detailStyle}>
                            Opponent Rank: {match.opponent_rank || '—'}
                          </div>
                          <div style={detailStyle}>Approval: {match.approval || '—'}</div>
                          <div style={detailStyle}>Eligible: {match.eligible || '—'}</div>
                          <div style={detailStyle}>Status: {match.status || '—'}</div>
                        </div>

                        <div
                          style={{
                            minWidth: 320,
                            flex: '1 1 340px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 18,
                            padding: 16,
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                            Report Score
                          </div>

                          <form
                            onSubmit={(e) => handleResultSubmit(e, match)}
                            style={{ display: 'grid', gap: 10 }}
                          >
                            <select
                              value={form.winner}
                              onChange={(e) => updateScoreForm(id, { winner: e.target.value })}
                              style={inputStyle}
                            >
                              <option value="">Select winner</option>
                              <option value={match.challenger}>{match.challenger}</option>
                              <option value={match.opponent}>{match.opponent}</option>
                            </select>

                            <input
                              placeholder="Score"
                              value={form.score}
                              onChange={(e) => updateScoreForm(id, { score: e.target.value })}
                              style={inputStyle}
                            />

                            <input
                              placeholder="Your name"
                              value={form.submitted_by}
                              onChange={(e) =>
                                updateScoreForm(id, { submitted_by: e.target.value })
                              }
                              style={inputStyle}
                            />

                            <button
                              type="submit"
                              disabled={submittingResultId === id}
                              style={buttonStyle}
                            >
                              {submittingResultId === id ? 'Submitting...' : 'Submit Result'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 style={sectionTitle}>Completed Matches</h2>

              {!loading && !error && completedMatches.length === 0 && (
                <div style={emptyCardStyle}>No completed matches yet.</div>
              )}

              <div style={{ display: 'grid', gap: 18 }}>
                {completedMatches.map((match) => {
                  const id = match.match_id || `${match.challenger}-${match.opponent}`
                  return (
                    <div key={id} style={cardStyle}>
                      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
                        {match.challenger} <span style={{ color: '#6b7280' }}>vs</span>{' '}
                        {match.opponent}
                      </div>
                      <div style={detailStyle}>Date: {match.match_date || '—'}</div>
                      <div style={detailStyle}>Winner: {match.winner || '—'}</div>
                      <div style={detailStyle}>Score: {match.score || '—'}</div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.96)',
  color: '#111827',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
}

const buttonStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)',
  color: '#0f172a',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: '0 12px 30px rgba(59,130,246,0.15)',
}

const cardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  padding: 22,
  background: 'rgba(9,12,18,0.84)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.32)',
}

const emptyCardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  padding: 22,
  background: 'rgba(9,12,18,0.84)',
  color: '#94a3b8',
}

const sectionTitle = {
  fontSize: 32,
  fontWeight: 800,
  marginTop: 0,
  marginBottom: 18,
}

const detailStyle = {
  color: '#cbd5e1',
  marginBottom: 6,
  fontSize: 15,
}

const metaStyle = {
  fontSize: 14,
  color: '#94a3b8',
}

const panelStyle = {
  background: 'rgba(9,12,18,0.82)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(10px)',
}

const messageStyle = {
  marginBottom: 20,
  padding: 14,
  borderRadius: 14,
  background: 'rgba(126,168,255,0.10)',
  border: '1px solid rgba(126,168,255,0.18)',
}
