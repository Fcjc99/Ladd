'use client'

import { useEffect, useMemo, useState } from 'react'

const sheetId = '1j3VgKy9fBHTTECzmRIYFijMtUAW5A0XdPoSNwdUDWOg'
const feedUrl = `https://opensheet.elk.sh/${sheetId}/ChallengeFeed`

const PLAYERS = [
  { name: 'Sophia', rank: 1 },
  { name: 'Skye', rank: 2 },
  { name: 'Viv', rank: 3 },
  { name: 'Julia', rank: 4 },
  { name: 'Clara', rank: 5 },
  { name: 'Caroline', rank: 6 },
  { name: 'Christi', rank: 7 },
  { name: 'Logan', rank: 8 },
  { name: 'Ella', rank: 9 },
  { name: 'Elizabeth', rank: 10 },
  { name: 'Karen', rank: 11 },
  { name: 'Ellie', rank: 12 },
  { name: 'Julianna', rank: 13 },
  { name: 'Lulu', rank: 14 },
  { name: 'Mia', rank: 15 },
  { name: 'Ava', rank: 16 },
]
<a
  href="/"
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 16px',
    borderRadius: 14,
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: 14,
    color: '#eef6ff',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.18)',
  }}
>
  ← Back to  Live Rankings
</a>

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeUpper(value) {
  return normalizeText(value).toUpperCase()
}

function isArchived(row) {
  const archived = normalizeUpper(row.archived)
  return archived === 'YES' || archived === 'TRUE'
}

function isCompleted(row) {
  const status = normalizeUpper(row.status)
  return status === 'COMPLETE' || status === 'COMPLETED'
}

function isActive(row) {
  if (isArchived(row)) return false
  if (isCompleted(row)) return false

  const status = normalizeUpper(row.status)
  const active = normalizeUpper(row.active)

  if (active === 'YES' || active === 'ACTIVE') return true
  if (status === 'ACTIVE' || status === 'PENDING' || status === 'SCHEDULED') return true

  return false
}

export default function MatchCenterPage() {
  const [feedRows, setFeedRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [challengeMessage, setChallengeMessage] = useState('')
  const [submittingChallenge, setSubmittingChallenge] = useState(false)

  const [selectedMatch, setSelectedMatch] = useState(null)
  const [resultForm, setResultForm] = useState({
    winner: '',
    score: '',
  })
  const [submittingResult, setSubmittingResult] = useState(false)

  const [challengeForm, setChallengeForm] = useState({
    challenger: '',
    challenger_rank: '',
    opponent: '',
    opponent_rank: '',
    match_date: '',
    deadline: '',
  })

  async function loadData() {
    try {
      setLoading(true)
      const res = await fetch(feedUrl, { cache: 'no-store' })
      const data = await res.json()

      if (!Array.isArray(data)) {
        setFeedRows([])
        return
      }

      setFeedRows(data)
    } catch (err) {
      console.error('Failed to load ChallengeFeed:', err)
      setFeedRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeChallenges = useMemo(() => {
    return feedRows.filter(isActive)
  }, [feedRows])

  const completedChallenges = useMemo(() => {
    return feedRows.filter((row) => isCompleted(row) || isArchived(row))
  }, [feedRows])

  function updateChallengeField(name, value) {
    if (name === 'challenger') {
      const player = PLAYERS.find((p) => p.name === value)
      setChallengeForm((prev) => ({
        ...prev,
        challenger: value,
        challenger_rank: player ? String(player.rank) : '',
      }))
      return
    }

    if (name === 'opponent') {
      const player = PLAYERS.find((p) => p.name === value)
      setChallengeForm((prev) => ({
        ...prev,
        opponent: value,
        opponent_rank: player ? String(player.rank) : '',
      }))
      return
    }

    setChallengeForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleChallengeSubmit(e) {
    e.preventDefault()
    setSubmittingChallenge(true)
    setChallengeMessage('')

    try {
      if (!challengeForm.challenger || !challengeForm.opponent) {
        throw new Error('Please select both challenger and opponent')
      }

      if (challengeForm.challenger === challengeForm.opponent) {
        throw new Error('Challenger and opponent must be different')
      }

      const payload = {
        action: 'challenge',
        challenger: challengeForm.challenger,
        challenger_rank: challengeForm.challenger_rank,
        opponent: challengeForm.opponent,
        opponent_rank: challengeForm.opponent_rank,
        match_date: challengeForm.match_date,
        deadline: challengeForm.deadline,
        eligible: 'YES',
        approval: 'PENDING',
        status: 'ACTIVE',
        winner: '',
        score: '',
        active: 'YES',
        archived: 'NO',
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

      setTimeout(() => {
        loadData()
      }, 1000)
    } catch (err) {
      console.error('Challenge submit failed:', err)
      setChallengeMessage(err.message || 'Challenge submit failed')
    } finally {
      setSubmittingChallenge(false)
    }
  }

  async function handleResultSubmit(e) {
    e.preventDefault()
    if (!selectedMatch) return

    setSubmittingResult(true)
    setChallengeMessage('')

    try {
      if (!selectedMatch.source_row) {
        throw new Error('Missing source_row from ChallengeFeed')
      }

      if (!resultForm.winner || !resultForm.score) {
        throw new Error('Please select winner and enter score')
      }

      const payload = {
        action: 'complete_match',
        source_row: Number(selectedMatch.source_row),
        winner: resultForm.winner,
        score: resultForm.score,
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('Result submit response:', data)

      if (!data.success) {
        throw new Error(data.error || data.raw || 'Failed to submit result')
      }

      setFeedRows((prev) =>
        prev.map((row) => {
          if (String(row.source_row) !== String(payload.source_row)) return row

          return {
            ...row,
            winner: payload.winner,
            score: payload.score,
            status: 'Completed',
            active: 'Inactive',
            archived: 'Yes',
          }
        })
      )

      setSelectedMatch(null)
      setResultForm({
        winner: '',
        score: '',
      })

      setChallengeMessage('Match result saved successfully')

      setTimeout(() => {
        loadData()
      }, 1500)
    } catch (err) {
      console.error('Result submit failed:', err)
      setChallengeMessage(err.message || 'Failed to submit result')
    } finally {
      setSubmittingResult(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, #0b2447 0%, #07111f 40%, #02060d 100%)',
        color: 'white',
        padding: '32px 16px 60px',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 20 }}>
          Match Center
        </h1>

        {challengeMessage ? (
          <div
            style={{
              marginBottom: 24,
              padding: '18px 20px',
              borderRadius: 16,
              background: '#11284a',
              border: '1px solid #234b86',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {challengeMessage}
          </div>
        ) : null}

        <div
          style={{
            marginBottom: 24,
            padding: '18px 20px',
            borderRadius: 16,
            background: '#11284a',
            border: '1px solid #234b86',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Feed rows: {feedRows.length} | Active: {activeChallenges.length} | Completed:{' '}
          {completedChallenges.length}
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 28,
            padding: 28,
            marginBottom: 28,
            boxShadow: '0 0 40px rgba(0, 100, 255, 0.12)',
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
            Submit Challenge
          </h2>

          <form onSubmit={handleChallengeSubmit}>
            <div style={{ display: 'grid', gap: 18 }}>
              <select
                value={challengeForm.challenger}
                onChange={(e) => updateChallengeField('challenger', e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">Select challenger</option>
                {PLAYERS.map((player) => (
                  <option key={player.name} value={player.name}>
                    {player.name} (#{player.rank})
                  </option>
                ))}
              </select>

              <select
                value={challengeForm.opponent}
                onChange={(e) => updateChallengeField('opponent', e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">Select opponent</option>
                {PLAYERS.map((player) => (
                  <option key={player.name} value={player.name}>
                    {player.name} (#{player.rank})
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={challengeForm.match_date}
                onChange={(e) => updateChallengeField('match_date', e.target.value)}
                style={inputStyle}
              />

              <button
                type="submit"
                disabled={submittingChallenge}
                style={{
                  ...buttonStyle,
                  opacity: submittingChallenge ? 0.7 : 1,
                  cursor: submittingChallenge ? 'not-allowed' : 'pointer',
                }}
              >
                {submittingChallenge ? 'Submitting...' : 'Submit Challenge'}
              </button>
            </div>
          </form>
        </div>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
            Active Challenges
          </h2>

          {loading ? (
            <div style={cardStyle}>Loading...</div>
          ) : activeChallenges.length === 0 ? (
            <div style={cardStyle}>No active challenges found.</div>
          ) : (
            <div style={listStyle}>
              {activeChallenges.map((row, index) => (
                <div
                  key={`active-${index}`}
                  style={{ ...cardStyle, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedMatch(row)
                    setResultForm({
                      winner: '',
                      score: '',
                    })
                  }}
                >
                  <div style={rowTitleStyle}>
                    {row.challenger} (#{row.challenger_rank}) vs {row.opponent} (#
                    {row.opponent_rank})
                  </div>
                  <div style={metaStyle}>Status: {row.status || 'ACTIVE'}</div>
                  <div style={metaStyle}>Approval: {row.approval || 'PENDING'}</div>
                  <div style={metaStyle}>Eligible: {row.eligible || 'YES'}</div>
                  <div style={metaStyle}>Match Date: {row.match_date || '-'}</div>
                  <div style={metaStyle}>Deadline: {row.deadline || '-'}</div>
                  <div style={{ ...metaStyle, marginTop: 10, fontWeight: 700 }}>
                    Click to enter result
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
            Completed Challenges
          </h2>

          {loading ? (
            <div style={cardStyle}>Loading...</div>
          ) : completedChallenges.length === 0 ? (
            <div style={cardStyle}>No completed challenges found.</div>
          ) : (
            <div style={listStyle}>
              {completedChallenges.map((row, index) => (
                <div key={`completed-${index}`} style={cardStyle}>
                  <div style={rowTitleStyle}>
                    {row.challenger} (#{row.challenger_rank}) vs {row.opponent} (#
                    {row.opponent_rank})
                  </div>
                  <div style={metaStyle}>Status: {row.status || '-'}</div>
                  <div style={metaStyle}>Winner: {row.winner || '-'}</div>
                  <div style={metaStyle}>Score: {row.score || '-'}</div>
                  <div style={metaStyle}>Archived: {row.archived || 'NO'}</div>
                  <div style={metaStyle}>Match Date: {row.match_date || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedMatch ? (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
              Enter Match Result
            </h3>

            <div style={{ marginBottom: 12, opacity: 0.7 }}>
              Source row: {selectedMatch.source_row || 'missing'}
            </div>

            <div style={{ marginBottom: 16, fontSize: 18 }}>
              {selectedMatch.challenger} vs {selectedMatch.opponent}
            </div>

            <form onSubmit={handleResultSubmit}>
              <div style={{ display: 'grid', gap: 16 }}>
                <select
                  value={resultForm.winner}
                  onChange={(e) =>
                    setResultForm((prev) => ({ ...prev, winner: e.target.value }))
                  }
                  style={inputStyle}
                  required
                >
                  <option value="">Select winner</option>
                  <option value={selectedMatch.challenger}>
                    {selectedMatch.challenger}
                  </option>
                  <option value={selectedMatch.opponent}>
                    {selectedMatch.opponent}
                  </option>
                </select>

                <input
                  type="text"
                  placeholder="Enter score, e.g. 6-3, 6-4"
                  value={resultForm.score}
                  onChange={(e) =>
                    setResultForm((prev) => ({ ...prev, score: e.target.value }))
                  }
                  style={inputStyle}
                  required
                />

                <div style={{ display: 'grid', gap: 12 }}>
                  <button
                    type="submit"
                    style={buttonStyle}
                    disabled={submittingResult}
                  >
                    {submittingResult ? 'Saving...' : 'Save Result'}
                  </button>

                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => setSelectedMatch(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  height: 60,
  borderRadius: 18,
  border: 'none',
  outline: 'none',
  padding: '0 18px',
  fontSize: 18,
  background: '#f3f4f6',
  color: '#111827',
}

const buttonStyle = {
  width: '100%',
  height: 60,
  borderRadius: 18,
  border: 'none',
  fontSize: 18,
  fontWeight: 800,
  background: '#dbe7f7',
  color: '#182235',
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  width: '100%',
  height: 60,
  borderRadius: 18,
  border: '1px solid #4b648f',
  fontSize: 18,
  fontWeight: 700,
  background: 'transparent',
  color: 'white',
  cursor: 'pointer',
}

const listStyle = {
  display: 'grid',
  gap: 16,
}

const cardStyle = {
  background: 'rgba(17, 40, 74, 0.7)',
  border: '1px solid #234b86',
  borderRadius: 18,
  padding: 18,
}

const rowTitleStyle = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 10,
}

const metaStyle = {
  fontSize: 15,
  opacity: 0.95,
  marginBottom: 6,
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 1000,
}

const modalStyle = {
  width: '100%',
  maxWidth: 520,
  background: '#0f223f',
  border: '1px solid #234b86',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
}
