'use client'

import { useEffect, useMemo, useState } from 'react'

export default function Page() {
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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
  const submitUrl = process.env.NEXT_PUBLIC_MATCH_SUBMIT_URL

  async function loadData() {
    try {
      const matchesRes = await fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeFeed`)
      const playersRes = await fetch(`https://opensheet.elk.sh/${sheetId}/PlayersFeed`)
      const submissionsRes = await fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeSubmissions`)
      const matchLogRes = await fetch(`https://opensheet.elk.sh/${sheetId}/MatchLog`)

      if (!matchesRes.ok) throw new Error(`Failed to fetch ChallengeFeed (${matchesRes.status})`)
      if (!playersRes.ok) throw new Error(`Failed to fetch PlayersFeed (${playersRes.status})`)
      if (!submissionsRes.ok) throw new Error(`Failed to fetch ChallengeSubmissions (${submissionsRes.status})`)
      if (!matchLogRes.ok) throw new Error(`Failed to fetch MatchLog (${matchLogRes.status})`)

      const matchesData = await matchesRes.json()
      const playersData = await playersRes.json()
      const submissionsData = await submissionsRes.json()
      const matchLogData = await matchLogRes.json()

      const approvedSubmittedChallenges = submissionsData
        .filter((m) => {
          const eligible = String(m.eligible || '').trim().toLowerCase() === 'eligible'
          const approval = String(m.approval || '').trim().toLowerCase() === 'approved'
          const status = String(m.status || '').trim().toLowerCase() !== 'completed'
          return eligible && approval && status
        })
        .map((m, index) => ({
          id: `submission-${index}`,
          challenger: m.challenger || '',
          challenger_rank: m.challenger_rank || '',
          opponent: m.opponent || '',
          opponent_rank: m.opponent_rank || '',
          approval: m.approval || '',
          eligible: m.eligible || '',
          match_date: m.match_date || '',
          deadline: m.deadline || '',
          status: m.status || '',
          source: 'submission',
        }))

      const completedFromLog = matchLogData
        .filter((m) => m.challenger && m.opponent)
        .map((m, index) => ({
          id: `log-${index}`,
          challenger: m.challenger || '',
          opponent: m.opponent || '',
          winner: m.winner || '',
          score: m.score || '',
          match_date: m.created_at || '',
          status: 'Completed',
          source: 'log',
        }))

      setMatches([...matchesData, ...approvedSubmittedChallenges, ...completedFromLog])
      setPlayers(playersData)
      setError('')
    } catch (err) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const playerNames = useMemo(() => {
    return players
      .map((p) => String(p.player || '').trim())
      .filter(Boolean)
  }, [players])

  const playerRankMap = useMemo(() => {
    const map = {}
    players.forEach((p) => {
      const name = String(p.player || '').trim()
      if (name) map[name] = p.rank || ''
    })
    return map
  }, [players])

  function addDays(dateString, days) {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    if (Number.isNaN(date.getTime())) return ''
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  function pairKey(a, b) {
    return [String(a || '').trim().toLowerCase(), String(b || '').trim().toLowerCase()]
      .sort()
      .join('__')
  }

  const completedPairSet = useMemo(() => {
    const set = new Set()
    matches.forEach((m) => {
      const status = String(m.status || '').trim().toLowerCase()
      if (status === 'completed' && m.challenger && m.opponent) {
        set.add(pairKey(m.challenger, m.opponent))
      }
    })
    return set
  }, [matches])

  async function handleChallengeSubmit(e) {
    e.preventDefault()
    setSubmittingChallenge(true)
    setChallengeMessage('')

    try {
      await fetch(submitUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'challenge',
          challenger: challengeForm.challenger,
          challenger_rank: challengeForm.challenger_rank,
          opponent: challengeForm.opponent,
          opponent_rank: challengeForm.opponent_rank,
          approval: 'Approved',
          eligible: 'Eligible',
          match_date: challengeForm.match_date,
          deadline: challengeForm.deadline,
          winner: '',
          score: '',
          status: 'Scheduled',
        }),
      })

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
    setSubmittingResultId(match.id)
    setResultMessage('')

    const form = scoreForms[match.id] || {
      winner: '',
      score: '',
      submitted_by: '',
    }

    try {
      await fetch(submitUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'match',
          challenger: match.challenger,
          opponent: match.opponent,
          winner: form.winner,
          score: form.score,
          submitted_by: form.submitted_by,
        }),
      })

      setResultMessage('Result submitted successfully')
      setTimeout(loadData, 1500)
    } catch (err) {
      setResultMessage(err.message || 'Result submit failed')
    } finally {
      setSubmittingResultId('')
    }
  }

  const activeMatches = matches.filter((m) => {
    const eligible = String(m.eligible || '').trim().toLowerCase()
    const approval = String(m.approval || '').trim().toLowerCase()
    const status = String(m.status || '').trim().toLowerCase()
    const notCompleted = !completedPairSet.has(pairKey(m.challenger, m.opponent))
    return eligible === 'eligible' && approval === 'approved' && status !== 'completed' && notCompleted
  })

  const completedMatches = matches.filter(
    (m) => String(m.status || '').trim().toLowerCase() === 'completed'
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, #0f2747 0%, #05070b 35%, #030303 100%)',
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
                    opponent_rank: challengeForm.opponent === name ? '' : challengeForm.opponent_rank,
                  })
                }}
                style={inputStyle}
              >
                <option value="">Select challenger</option>
                {playerNames.map((name) => (
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
                {playerNames
                  .filter((name) => name !== challengeForm.challenger)
                  .map((name) => (
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
                  const form = scoreForms[match.id] || { winner: '', score: '', submitted_by: '' }

                  return (
                    <div key={match.id} style={cardStyle}>
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
                            {match.challenger} <span style={{ color: '#6b7280' }}>vs</span> {match.opponent}
                          </div>
                          <div style={detailStyle}>Date: {match.match_date || '—'}</div>
                          <div style={detailStyle}>Deadline: {match.deadline || '—'}</div>
                          <div style={detailStyle}>Challenger Rank: {match.challenger_rank || '—'}</div>
                          <div style={detailStyle}>Opponent Rank: {match.opponent_rank || '—'}</div>
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

                          <form onSubmit={(e) => handleResultSubmit(e, match)} style={{ display: 'grid', gap: 10 }}>
                            <select
                              value={form.winner}
                              onChange={(e) => updateScoreForm(match.id, { winner: e.target.value })}
                              style={inputStyle}
                            >
                              <option value="">Select winner</option>
                              <option value={match.challenger}>{match.challenger}</option>
                              <option value={match.opponent}>{match.opponent}</option>
                            </select>

                            <input
                              placeholder="Score"
                              value={form.score}
                              onChange={(e) => updateScoreForm(match.id, { score: e.target.value })}
                              style={inputStyle}
                            />

                            <input
                              placeholder="Your name"
                              value={form.submitted_by}
                              onChange={(e) => updateScoreForm(match.id, { submitted_by: e.target.value })}
                              style={inputStyle}
                            />

                            <button
                              type="submit"
                              disabled={submittingResultId === match.id}
                              style={buttonStyle}
                            >
                              {submittingResultId === match.id ? 'Submitting...' : 'Submit Result'}
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
                {completedMatches.map((match) => (
                  <div key={match.id} style={cardStyle}>
                    <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
                      {match.challenger} <span style={{ color: '#6b7280' }}>vs</span> {match.opponent}
                    </div>
                    <div style={detailStyle}>Date: {match.match_date || '—'}</div>
                    <div style={detailStyle}>Winner: {match.winner || '—'}</div>
                    <div style={detailStyle}>Score: {match.score || '—'}</div>
                  </div>
                ))}
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
