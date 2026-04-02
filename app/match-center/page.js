'use client'

import { useEffect, useMemo, useState } from 'react'

export default function Page() {
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [submittingChallenge, setSubmittingChallenge] = useState(false)
  const [challengeMessage, setChallengeMessage] = useState('')

  const [submittingResult, setSubmittingResult] = useState(false)
  const [resultMessage, setResultMessage] = useState('')

  const [challengeForm, setChallengeForm] = useState({
    challenger: '',
    challenger_rank: '',
    opponent: '',
    opponent_rank: '',
    match_date: '',
    deadline: '',
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

  async function loadData() {
    try {
      const [matchesRes, playersRes] = await Promise.all([
        fetch(`https://opensheet.elk.sh/${sheetId}/ChallengeFeed`),
        fetch(`https://opensheet.elk.sh/${sheetId}/App%20Feed`),
      ])

      if (!matchesRes.ok) {
        throw new Error(`Failed to fetch ChallengeFeed (${matchesRes.status})`)
      }

      if (!playersRes.ok) {
        throw new Error(`Failed to fetch App Feed (${playersRes.status})`)
      }

      const matchesData = await matchesRes.json()
      const playersData = await playersRes.json()

      setMatches(matchesData)
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
      .map((p) => (p.player || p.name || '').trim())
      .filter(Boolean)
  }, [players])

  const playerMap = useMemo(() => {
    return Object.fromEntries(
      players.map((p) => {
        const name = (p.player || p.name || '').trim()
        return [
          name,
          {
            rank: p.rank || '',
            photo: p.photo || '',
            flag: p.flag || '',
            status: p.status || '',
          },
        ]
      })
    )
  }, [players])

  function addDays(dateString, days) {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    if (Number.isNaN(date.getTime())) return ''
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

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
          approval: 'Pending',
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

  const activeMatches = matches.filter((m) => (m.active || '').trim() === 'Active')
  const completedMatches = matches.filter((m) => (m.status || '').trim() === 'Completed')

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
                challenger_rank: playerMap[name]?.rank || '',
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
                opponent_rank: playerMap[name]?.rank || '',
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
