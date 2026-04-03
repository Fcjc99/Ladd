'use client'

import { useEffect, useMemo, useState } from 'react'

const sheetId =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ||
  '1j3VgKy9fBHTTECzmRIYFijMtUAW5A0XdPoSNwdUDWOg'

const feedUrl = `https://opensheet.elk.sh/${sheetId}/ChallengeFeed`
const rankingUrl = `https://opensheet.elk.sh/${sheetId}/LiveRankingFeed`

const PLAYERS = [
  { name: 'Sophia', rank: 1 },
  { name: 'Viv', rank: 2 },
  { name: 'Julia', rank: 3 },
  { name: 'Clara', rank: 4 },
  { name: 'Skye', rank: 5 },
  { name: 'Caroline', rank: 6 },
  { name: 'Christi', rank: 7 },
  { name: 'Logan', rank: 8 },
  { name: 'Ella', rank: 9 },
  { name: 'Elizabeth', rank: 10 },
  { name: 'Karen', rank: 11 },
  { name: 'Aislinn', rank: 12 },
  { name: 'ChristyC', rank: 13 },
  { name: 'Bree', rank: 14 },
  { name: 'Ellie', rank: 15 },
  { name: 'Julianna', rank: 16 },
]

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

function playerByName(name) {
  return PLAYERS.find((p) => p.name === name)
}

function rankByName(name) {
  const player = playerByName(name)
  return player ? player.rank : '-'
}

function getRankTheme(rank) {
  const n = Number(rank)

  if (n === 1) {
    return {
      accent: '#aef2ff',
      accentSoft: 'rgba(174,242,255,0.16)',
      accentBorder: 'rgba(174,242,255,0.34)',
      glow: 'rgba(168,240,255,0.26)',
    }
  }

  if (n === 2) {
    return {
      accent: '#f6d56f',
      accentSoft: 'rgba(246,213,111,0.14)',
      accentBorder: 'rgba(246,213,111,0.28)',
      glow: 'rgba(247,215,108,0.18)',
    }
  }

  if (n === 3) {
    return {
      accent: '#dde6f0',
      accentSoft: 'rgba(221,230,240,0.13)',
      accentBorder: 'rgba(221,230,240,0.26)',
      glow: 'rgba(220,229,239,0.16)',
    }
  }

  if (n >= 4 && n <= 7) {
    return {
      accent: '#d29667',
      accentSoft: 'rgba(210,150,103,0.14)',
      accentBorder: 'rgba(210,150,103,0.28)',
      glow: 'rgba(210,150,103,0.14)',
    }
  }

  return {
    accent: '#b8c9e6',
    accentSoft: 'rgba(184,201,230,0.10)',
    accentBorder: 'rgba(184,201,230,0.18)',
    glow: 'rgba(184,201,230,0.10)',
  }
}

function parseScore(scoreText) {
  const text = String(scoreText || '').trim()
  if (!text) return []

  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/,/g, ' ')
    .trim()

  const sets = normalized.match(/\d+\s*-\s*\d+/g)
  if (!sets) return []

  return sets.map((setText) => {
    const [a, b] = setText.split('-').map((v) => Number(String(v).trim()))
    return { a, b }
  })
}

function winnerIsChallenger(row) {
  return normalizeText(row.winner) === normalizeText(row.challenger)
}

function Pill({ children, accent = '#dce8ff', muted = false, background, borderColor }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.02em',
        background: background || (muted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'),
        border: `1px solid ${borderColor || 'rgba(255,255,255,0.10)'}`,
        color: accent,
        whiteSpace: 'nowrap',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {children}
    </div>
  )
}

function MetaBox({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(220,232,255,0.56)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 750,
          color: '#eef6ff',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SectionCard({ title, children, right, accent = 'rgba(91,171,255,0.12)' }) {
  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 28,
        padding: 24,
        boxShadow: `0 0 40px ${accent}`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 28, fontWeight: 850, margin: 0 }}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

function PlayerPhoto({ name, photoUrl, size = 74, borderColor = 'rgba(255,255,255,0.14)' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
        boxShadow: `0 14px 30px rgba(0,0,0,0.22), 0 0 20px ${borderColor}`,
        flexShrink: 0,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name || 'Player'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: 'rgba(255,255,255,0.75)',
            fontWeight: 900,
            fontSize: Math.max(18, size * 0.22),
            letterSpacing: '-0.03em',
          }}
        >
          {(name || '?').slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function ActiveMatchCard({ row, onClick, getPlayerPhotoUrl }) {
  const challengerRank = row.challenger_rank || rankByName(row.challenger)
  const opponentRank = row.opponent_rank || rankByName(row.opponent)
  const challengerTheme = getRankTheme(challengerRank)
  const opponentTheme = getRankTheme(opponentRank)

  return (
    <div
      onClick={onClick}
      style={{
        background:
          'linear-gradient(180deg, rgba(17,40,74,0.92) 0%, rgba(12,26,48,0.94) 100%)',
        border: '1px solid rgba(91,171,255,0.20)',
        borderRadius: 24,
        padding: 18,
        boxShadow: '0 12px 32px rgba(0,0,0,0.20), 0 0 22px rgba(56,189,248,0.05)',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, border-color 0.18s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <PlayerPhoto
                name={row.challenger}
                photoUrl={getPlayerPhotoUrl(row.challenger)}
                size={56}
                borderColor={challengerTheme.accentBorder}
              />
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 850,
                  color: '#eef6ff',
                }}
              >
                {row.challenger}
              </div>
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'rgba(220,232,255,0.64)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              vs
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <PlayerPhoto
                name={row.opponent}
                photoUrl={getPlayerPhotoUrl(row.opponent)}
                size={56}
                borderColor={opponentTheme.accentBorder}
              />
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 850,
                  color: '#eef6ff',
                }}
              >
                {row.opponent}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill accent="#bdefff">{row.status || 'Active'}</Pill>
            {row.approval ? <Pill muted>Approval: {row.approval}</Pill> : null}
            {row.eligible ? <Pill muted>Eligible: {row.eligible}</Pill> : null}
          </div>
        </div>

        <Pill
          accent="#aef2ff"
          background="rgba(174,242,255,0.10)"
          borderColor="rgba(174,242,255,0.20)"
        >
          Click to enter result
        </Pill>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <MetaBox label="Match Date" value={row.match_date || '-'} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 12,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            padding: '12px 14px',
            background: challengerTheme.accentSoft,
            border: `1px solid ${challengerTheme.accentBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(220,232,255,0.56)',
              marginBottom: 8,
            }}
          >
            Challenger
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: challengerTheme.accent }}>
            {row.challenger} (#{challengerRank})
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: '12px 14px',
            background: opponentTheme.accentSoft,
            border: `1px solid ${opponentTheme.accentBorder}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(220,232,255,0.56)',
              marginBottom: 8,
            }}
          >
            Opponent
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: opponentTheme.accent }}>
            {row.opponent} (#{opponentRank})
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreDisplay({ row }) {
  const sets = parseScore(row.score)
  const winnerIsChall = winnerIsChallenger(row)

  if (!sets.length) {
    return (
      <div
        style={{
          borderRadius: 18,
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          minWidth: 180,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(220,232,255,0.56)',
            marginBottom: 8,
          }}
        >
          Reported Score
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#eef6ff',
          }}
        >
          {row.score || '-'}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minWidth: 220,
        borderRadius: 20,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(220,232,255,0.56)',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Reported Score
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {sets.map((set, index) => {
          const winnerScore = winnerIsChall ? set.a : set.b
          const loserScore = winnerIsChall ? set.b : set.a

          return (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  height: 1,
                  background: 'rgba(255,255,255,0.18)',
                  width: '100%',
                }}
              />
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#0f2342',
                  background: '#dbe7f7',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.18)',
                }}
              >
                {winnerScore}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#eef6ff',
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {loserScore}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CompletedMatchCard({ row, getPlayerPhotoUrl }) {
  const winnerName = row.winner || '-'
  const loserName =
    normalizeText(row.winner) === normalizeText(row.challenger)
      ? row.opponent
      : row.challenger

  const winnerRank = rankByName(winnerName)
  const winnerTheme = getRankTheme(winnerRank)

  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(17,40,74,0.84) 0%, rgba(12,26,48,0.88) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 18,
        boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
      }}
    >
      <div
        className="completed-match-card-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(220px, 1fr) auto',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <PlayerPhoto
          name={winnerName}
          photoUrl={getPlayerPhotoUrl(winnerName)}
          size={108}
          borderColor={winnerTheme.accentBorder}
        />

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: '#eef6ff',
              lineHeight: 1.05,
              marginBottom: 8,
            }}
          >
            {winnerName}
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(190,220,255,0.70)',
              marginBottom: 8,
            }}
          >
            Defeats
          </div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 850,
              color: '#dce8ff',
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            {loserName || '-'}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill accent="#bdefff">Completed</Pill>
            <Pill muted>Match Date: {row.match_date || '-'}</Pill>
          </div>
        </div>

        <ScoreDisplay row={row} />
      </div>
    </div>
  )
}

export default function MatchCenterPage() {
  const [feedRows, setFeedRows] = useState([])
  const [rankingRows, setRankingRows] = useState([])
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
  })

  function getPlayerPhotoUrl(name) {
    const match = rankingRows.find(
      (row) => normalizeUpper(row.player) === normalizeUpper(name)
    )
    return match?.photo_url || ''
  }

  async function loadData() {
    try {
      setLoading(true)

      const [feedRes, rankingRes] = await Promise.all([
        fetch(feedUrl, { cache: 'no-store' }),
        fetch(rankingUrl, { cache: 'no-store' }),
      ])

      const feedData = await feedRes.json()
      const rankingData = await rankingRes.json()

      setFeedRows(Array.isArray(feedData) ? feedData : [])
      setRankingRows(Array.isArray(rankingData) ? rankingData : [])
    } catch (err) {
      console.error('Failed to load Match Center data:', err)
      setFeedRows([])
      setRankingRows([])
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
        deadline: '',
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
    <>
      <style>{`
        @media (max-width: 860px) {
          .completed-match-card-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 700px) {
          .match-center-title {
            font-size: 34px !important;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top, #0b2447 0%, #07111f 40%, #02060d 100%)',
          color: 'white',
          padding: '32px 16px 60px',
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: 'rgba(168,240,255,0.08)',
                  border: '1px solid rgba(168,240,255,0.14)',
                  color: '#bdefff',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                }}
              >
                NDA 2026 Tennis
              </div>

              <h1
                className="match-center-title"
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  lineHeight: 0.95,
                }}
              >
                Match Center
              </h1>
            </div>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 54,
                padding: '0 20px',
                borderRadius: 16,
                textDecoration: 'none',
                fontWeight: 900,
                fontSize: 15,
                color: '#eef6ff',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                border: '2px solid rgba(219,231,247,0.38)',
                boxShadow:
                  '0 12px 30px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              ← Back to Live Rankings
            </a>
          </div>

          <div
            style={{
              height: 1,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(168,240,255,0.18) 22%, rgba(255,255,255,0.08) 50%, rgba(168,240,255,0.18) 78%, rgba(255,255,255,0) 100%)',
              marginBottom: 24,
            }}
          />

          {challengeMessage ? (
            <div
              style={{
                marginBottom: 24,
                padding: '18px 20px',
                borderRadius: 18,
                background: 'rgba(17,40,74,0.78)',
                border: '1px solid rgba(91,171,255,0.26)',
                fontSize: 17,
                fontWeight: 700,
                boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
              }}
            >
              {challengeMessage}
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 28,
            }}
          >
            <MetaBox label="Feed Rows" value={String(feedRows.length)} />
            <MetaBox label="Active" value={String(activeChallenges.length)} />
            <MetaBox label="Completed" value={String(completedChallenges.length)} />
          </div>

          <div style={{ display: 'grid', gap: 24 }}>
            <SectionCard title="Submit Challenge" accent="rgba(168,240,255,0.10)">
              <form onSubmit={handleChallengeSubmit}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Challenger</label>
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
                  </div>

                  <div>
                    <label style={labelStyle}>Opponent</label>
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
                  </div>

                  <div>
                    <label style={labelStyle}>Match Date</label>
                    <input
                      type="date"
                      value={challengeForm.match_date}
                      onChange={(e) => updateChallengeField('match_date', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

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
              </form>
            </SectionCard>

            <SectionCard
              title="Active Challenges"
              accent="rgba(168,240,255,0.08)"
              right={
                <Pill
                  accent="#aef2ff"
                  background="rgba(174,242,255,0.10)"
                  borderColor="rgba(174,242,255,0.18)"
                >
                  {loading ? 'Loading...' : `${activeChallenges.length} Active`}
                </Pill>
              }
            >
              {loading ? (
                <div style={emptyStateStyle}>Loading active challenges...</div>
              ) : activeChallenges.length === 0 ? (
                <div style={emptyStateStyle}>No active challenges found.</div>
              ) : (
                <div style={listStyle}>
                  {activeChallenges.map((row, index) => (
                    <ActiveMatchCard
                      key={`active-${index}`}
                      row={row}
                      onClick={() => {
                        setSelectedMatch(row)
                        setResultForm({
                          winner: '',
                          score: '',
                        })
                      }}
                      getPlayerPhotoUrl={getPlayerPhotoUrl}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Completed Challenges"
              accent="rgba(255,255,255,0.05)"
              right={
                <Pill muted>
                  {loading ? 'Loading...' : `${completedChallenges.length} Completed`}
                </Pill>
              }
            >
              {loading ? (
                <div style={emptyStateStyle}>Loading completed challenges...</div>
              ) : completedChallenges.length === 0 ? (
                <div style={emptyStateStyle}>No completed challenges found.</div>
              ) : (
                <div style={listStyle}>
                  {completedChallenges.map((row, index) => (
                    <CompletedMatchCard
                      key={`completed-${index}`}
                      row={row}
                      getPlayerPhotoUrl={getPlayerPhotoUrl}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {selectedMatch ? (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  marginBottom: 18,
                  flexWrap: 'wrap',
                }}
              >
                <h3 style={{ fontSize: 26, fontWeight: 850, margin: 0 }}>
                  Enter Match Result
                </h3>
                <Pill muted>Row: {selectedMatch.source_row || 'missing'}</Pill>
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 750,
                  lineHeight: 1.45,
                  marginBottom: 18,
                }}
              >
                {selectedMatch.challenger} vs {selectedMatch.opponent}
              </div>

              <form onSubmit={handleResultSubmit}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Winner</label>
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
                  </div>

                  <div>
                    <label style={labelStyle}>Score</label>
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
                  </div>

                  <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
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
    </>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(220,232,255,0.72)',
}

const inputStyle = {
  width: '100%',
  height: 58,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.12)',
  outline: 'none',
  padding: '0 18px',
  fontSize: 17,
  background: 'rgba(243,244,246,0.96)',
  color: '#111827',
  boxSizing: 'border-box',
}

const buttonStyle = {
  width: '100%',
  height: 58,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 18,
  fontWeight: 850,
  background: '#dbe7f7',
  color: '#182235',
  cursor: 'pointer',
  boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
}

const secondaryButtonStyle = {
  width: '100%',
  height: 58,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.18)',
  fontSize: 17,
  fontWeight: 750,
  background: 'rgba(255,255,255,0.04)',
  color: 'white',
  cursor: 'pointer',
}

const listStyle = {
  display: 'grid',
  gap: 16,
}

const emptyStateStyle = {
  borderRadius: 20,
  padding: 18,
  background: 'rgba(17,40,74,0.68)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 16,
  color: 'rgba(238,246,255,0.88)',
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.60)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 1000,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
}

const modalStyle = {
  width: '100%',
  maxWidth: 560,
  background:
    'linear-gradient(180deg, rgba(15,34,63,0.96) 0%, rgba(10,23,43,0.98) 100%)',
  border: '1px solid rgba(91,171,255,0.24)',
  borderRadius: 26,
  padding: 24,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
}
