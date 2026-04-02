'use client'

import { useEffect, useMemo, useState } from 'react'

export default function Page() {
  const [challengeFeed, setChallengeFeed] = useState([])
  const [challengeSubmissions, setChallengeSubmissions] = useState([])
  const [matchLog, setMatchLog] = useState([])
  const [players, setPlayers] = useState([])

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
  const submitUrl = process.env.NEXT_PUBLIC_MATCH_SUBMIT_URL

  async function loadData() {
    try {
      const [feedRes, playersRes, submissionsRes, matchLogRes] = await Promise.all([
        fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeFeed`),
        fetch(`https://opensheet.elk.sh/${sheetId}/PlayersFeed`),
        fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeSubmissions`),
        fetch(`https://opensheet.elk.sh/${sheetId}/MatchLog`),
      ])

      if (!feedRes.ok) throw new Error(`Failed to fetch ChallengeFeed (${feedRes.status})`)
      if (!playersRes.ok) throw new Error(`Failed to fetch PlayersFeed (${playersRes.status})`)
      if (!submissionsRes.ok) throw new Error(`Failed to fetch ChallengeSubmissions (${submissionsRes.status})`)
      if (!matchLogRes.ok) throw new Error(`Failed to fetch MatchLog (${matchLogRes.status})`)

      const [feedData, playersData, submissionsData, matchLogData] = await Promise.all([
        feedRes.json(),
        playersRes.json(),
        submissionsRes.json(),
        matchLogRes.json(),
      ])

      setChallengeFeed(feedData)
      setPlayers(playersData)
      setChallengeSubmissions(submissionsData)
      setMatchLog(matchLogData)
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
      .map((p) => (p.player || '').trim())
      .filter(Boolean)
  }, [players])

  const playerRankMap = useMemo(() => {
    const map = {}
    players.forEach((p) => {
      const name = (p.player || '').trim()
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

  function normalize(v) {
    return String(v || '').trim().toLowerCase()
  }

  function pairKey(a, b) {
    return [String(a || '').trim().toLowerCase(), String(b || '').trim().toLowerCase()].sort().join('__')
  }

  const completedFromFeed = useMemo(() => {
    return challengeFeed
      .filter((m) => normalize(m.status) === 'completed')
      .map((m, index) => ({
        id: `feed-completed-${m.match_id || index}`,
        challenger: m.challenger || '',
        opponent: m.opponent || '',
        winner: m.winner || '',
        score: m.score || '',
        match_date: m.match_date || '',
        source: 'feed',
      }))
  }, [challengeFeed])

  const completedFromLog = useMemo(() => {
    return matchLog
      .filter((m) => (m.challenger || '') && (m.opponent || ''))
      .map((m, index) => ({
        id: `log-completed-${index}`,
        challenger: m.challenger || '',
        opponent: m.opponent || '',
        winner: m.winner || '',
        score: m.score || '',
        match_date: m.created_at || '',
        source: 'log',
      }))
  }, [matchLog])

  const completedPairSet = useMemo(() => {
    const set = new Set()
    ;[...completedFromFeed, ...completedFromLog].forEach((m) => {
      set.add(pairKey(m.challenger, m.opponent))
    })
    return set
  }, [completedFromFeed, completedFromLog])

  const activeFromFeed = useMemo(() => {
    return challengeFeed
      .filter((m) => {
        const eligible = normalize(m.eligible) === 'eligible'
        const approval = normalize(m.approval) === 'approved'
        const status = normalize(m.status) !== 'completed'
        const notCompletedAlready = !completedPairSet.has(pairKey(m.challenger, m.opponent))
        return eligible && approval && status && notCompletedAlready
      })
      .map((m, index) => ({
        id: `feed-active-${m.match_id || index}`,
        challenger: m.challenger || '',
        challenger_rank: m.challenger_rank || '',
        opponent: m.opponent || '',
        opponent_rank: m.opponent_rank || '',
        approval: m.approval || '',
        eligible: m.eligible || '',
        match_date: m.match_date || '',
        deadline: m.deadline || '',
        status: m.status || '',
      }))
  }, [challengeFeed, completedPairSet])

  const activeFromSubmissions = useMemo(() => {
    return challengeSubmissions
      .filter((m) => {
        const eligible = normalize(m.eligible) === 'eligible'
        const approval = normalize(m.approval) === 'approved'
        const status = normalize(m.status) !== 'completed'
        const notCompletedAlready = !completedPairSet.has(pairKey(m.challenger, m.opponent))
        return eligible && approval && status && notCompletedAlready
      })
      .map((m, index) => ({
        id: `submission-active-${index}`,
        challenger: m.challenger || '',
        challenger_rank: m.challenger_rank || '',
        opponent: m.opponent || '',
        opponent_rank: m.opponent_rank || '',
        approval: m.approval || '',
        eligible: m.eligible || '',
        match_date: m.match_date || '',
        deadline: m.deadline || '',
        status: m.status || '',
      }))
  }, [challengeSubmissions, completedPairSet])

  const activeMatches = [...activeFromFeed, ...activeFromSubmissions]
  const completedMatches = [...completedFromFeed, ...completedFromLog]

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
        challenger: '',
        opponent: '',
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
      challenger: match.challenger,
      opponent: match.opponent,
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
      setScoreForms((prev) => {
        const next = { ...prev }
        delete next[match.id]
        return next
      })

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

        {resultMessage && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {resultMessage}
          </div>
        )}

        {challengeMessage && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 14,
              background: 'rgba(126,168,255,0.10)',
              border: '1px solid rgba(126,168,255,0.18)',
            }}
          >
            {challengeMessage}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 420px) 1fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              background: 'rgba(9,12,18,0.82)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24,
              padding: 22,
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(10px)',
            }}
          >
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
                  const form = scoreForms[match.id] || {
                    winner: '',
                    score: '',
                    submitted_by: '',
                  }

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
                            {match.challenger} <span style={{ color: '#6b7280' }}>vs</span>{' '}
                            {match.opponent}
                          </div>
                          <div style={detailStyle}>Date: {match.match_date || '—'}</div>
                          <div style={detailStyle}>Deadline: {match.deadline || '—'}</div>
                          <div style={detailStyle}>
                            Challenger Rank: {match.challenger_rank || '—'}
                          </div>
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

                          <form
                            onSubmit={(e) => handleResultSubmit(e, match)}
                            style={{ display: 'grid', gap: 10 }}
                          >
                            <select
                              value={form.winner}
                              onChange={(e) =>
                                updateScoreForm(match.id, { winner: e.target.value })
                              }
                              style={inputStyle}
                            >
                              <option value="">Select winner</option>
                              <option value={match.challenger}>{match.challenger}</option>
                              <option value={match.opponent}>{match.opponent}</option>
                            </select>

                            <input
                              placeholder="Score"
                              value={form.score}
                              onChange={(e) =>
                                updateScoreForm(match.id, { score: e.target.value })
                              }
                              style={inputStyle}
                            />

                            <input
                              placeholder="Your name"
                              value={form.submitted_by}
                              onChange={(e) =>
                                updateScoreForm(match.id, { submitted_by: e.target.value })
                              }
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
                      {match.challenger} <span style={{ color: '#6b7280' }}>vs</span>{' '}
                      {match.opponent}
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
                              }    try {
      const matchesRes = await fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeFeed`)
      const playersRes = await fetch(`https://opensheet.elk.sh/${sheetId}/PlayersFeed`)

      if (!matchesRes.ok) {
        throw new Error(`Failed to fetch ChallengeFeed (${matchesRes.status})`)
      }

      if (!playersRes.ok) {
        throw new Error(`Failed to fetch PlayersFeed (${playersRes.status})`)
      }

      const matchesData = await matchesRes.json()
      const playersData = await playersRes.json()

      setMatches(matchesData)

      const playerMap = {}
      playersData.forEach((p) => {
        if (p.player) {
          playerMap[p.player.trim()] = p.rank || ''
        }
      })

      window.playerRankMap = playerMap
      window.playerNames = playersData.map((p) => p.player).filter(Boolean)
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

  function addDays(dateString, days) {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    if (Number.isNaN(date.getTime())) return ''
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const playerNames = window.playerNames || []
  const playerRankMap = window.playerRankMap || {}

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

      setTimeout(() => {
        loadData()
      }, 1500)
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
      await fetch(submitUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'match',
          ...resultForm,
        }),
      })

      setResultMessage('Result submitted successfully')
      setResultForm({
        challenger: '',
        opponent: '',
        winner: '',
        score: '',
        submitted_by: '',
      })

      setTimeout(() => {
        loadData()
      }, 1500)
    } catch (err) {
      setResultMessage(err.message || 'Result submit failed')
    } finally {
      setSubmittingResult(false)
    }
  }

  const activeMatches = matches.filter((m) => {
    const eligible = (m.eligible || '').trim().toLowerCase()
    const approval = (m.approval || '').trim().toLowerCase()
    const status = (m.status || '').trim().toLowerCase()

    return eligible === 'eligible' && approval === 'approved' && status !== 'completed'
  })

  const completedMatches = matches.filter(
    (m) => (m.status || '').trim().toLowerCase() === 'completed'
  )

  return (
    <div style={{ padding: 24, color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Match Center</h1>

      <section style={{ marginBottom: 48, maxWidth: 560 }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Submit Challenge</h2>

        <form onSubmit={handleChallengeSubmit} style={{ display: 'grid', gap: 12 }}>
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
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          >
            <option value="">Select challenger</option>
            {playerNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {challengeForm.challenger_rank && (
            <div style={{ fontSize: 14, color: '#aaa' }}>
              Challenger Rank: {challengeForm.challenger_rank}
            </div>
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
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
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
            <div style={{ fontSize: 14, color: '#aaa' }}>
              Opponent Rank: {challengeForm.opponent_rank}
            </div>
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
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          />

          {challengeForm.deadline && (
            <div style={{ fontSize: 14, color: '#aaa' }}>
              Deadline: {challengeForm.deadline}
            </div>
          )}

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
          <select
            value={resultForm.challenger}
            onChange={(e) =>
              setResultForm({
                ...resultForm,
                challenger: e.target.value,
                opponent: '',
                winner: '',
              })
            }
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          >
            <option value="">Select challenger</option>
            {playerNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={resultForm.opponent}
            onChange={(e) =>
              setResultForm({
                ...resultForm,
                opponent: e.target.value,
                winner: '',
              })
            }
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          >
            <option value="">Select opponent</option>
            {playerNames
              .filter((name) => name !== resultForm.challenger)
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>

          <select
            value={resultForm.winner}
            onChange={(e) => setResultForm({ ...resultForm, winner: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #444' }}
          >
            <option value="">Select winner</option>
            {resultForm.challenger && (
              <option value={resultForm.challenger}>{resultForm.challenger}</option>
            )}
            {resultForm.opponent && (
              <option value={resultForm.opponent}>{resultForm.opponent}</option>
            )}
          </select>

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
