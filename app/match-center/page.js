'use client'

import { useEffect, useMemo, useState } from 'react'

const sheetId = '1jHgb5MdCVlGWHxLng9O3Hq_yJOEJGO7KOYUqkmvZfp4'
const feedUrl = `https://opensheet.elk.sh/${sheetId}/ChallengeFeed`

const PLAYERS = [
  { name: 'Ali', rank: 1 },
  { name: 'Basil', rank: 2 },
  { name: 'Cameron', rank: 3 },
  { name: 'Dylan', rank: 4 },
  { name: 'Ethan', rank: 5 },
  { name: 'Faris', rank: 6 },
  { name: 'Gabe', rank: 7 },
  { name: 'Hassan', rank: 8 },
  { name: 'Isaac', rank: 9 },
  { name: 'Jared', rank: 10 },
  { name: 'Kai', rank: 11 },
  { name: 'Leo', rank: 12 },
  { name: 'Mason', rank: 13 },
  { name: 'Noah', rank: 14 },
  { name: 'Omar', rank: 15 },
  { name: 'Zane', rank: 16 },
]

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeUpper(value) {
  return normalizeText(value).toUpperCase()
}

function isTruthyYes(value) {
  const v = normalizeUpper(value)
  return v === 'YES' || v === 'TRUE' || v === '1'
}

function isArchived(row) {
  return isTruthyYes(row.archived)
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

  if (active === 'YES') return true
  if (status === 'ACTIVE' || status === 'PENDING') return true

  return false
}

export default function MatchCenterPage() {
  const [feedRows, setFeedRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [challengeMessage, setChallengeMessage] = useState('')
  const [submittingChallenge, setSubmittingChallenge] = useState(false)

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

      console.log('Submitting challenge payload:', payload)

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('Submit response:', data)

      if (!data.success) {
        throw new Error(data.error || data.raw || 'Challenge submit failed')
      }

      const writtenRow = data.appsScript?.row || data.row || ''
      setChallengeMessage(
        writtenRow
          ? `Challenge submitted successfully (row ${writtenRow})`
          : 'Challenge submitted successfully'
      )

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
      console.error('Challenge submit failed:', err)
      setChallengeMessage(err.message || 'Challenge submit failed')
    } finally {
      setSubmittingChallenge(false)
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
                <div key={`active-${index}`} style={cardStyle}>
                  <div style={rowTitleStyle}>
                    {row.challenger} (#{row.challenger_rank}) vs {row.opponent} (#
                    {row.opponent_rank})
                  </div>
                  <div style={metaStyle}>Status: {row.status || 'ACTIVE'}</div>
                  <div style={metaStyle}>Approval: {row.approval || 'PENDING'}</div>
                  <div style={metaStyle}>Eligible: {row.eligible || 'YES'}</div>
                  <div style={metaStyle}>Match Date: {row.match_date || '-'}</div>
                  <div style={metaStyle}>Deadline: {row.deadline || '-'}</div>
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
