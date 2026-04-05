'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const sheetId =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ||
  '1j3VgKy9fBHTTECzmRIYFijMtUAW5A0XdPoSNwdUDWOg'

const rankingUrl = `https://opensheet.elk.sh/${sheetId}/LiveRankingFeed`
const challengeFeedUrl = `https://opensheet.elk.sh/${sheetId}/ChallengeFeed`
const externalMatchLogUrl = `https://opensheet.elk.sh/${sheetId}/ExternalMatchLog`

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeUpper(value) {
  return normalizeText(value).toUpperCase()
}

function toNumber(value, fallback = 999) {
  const n = Number(String(value || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : fallback
}

function isCompleted(row) {
  const status = normalizeUpper(row?.status)
  return status === 'COMPLETE' || status === 'COMPLETED'
}

function isArchived(row) {
  const archived = normalizeUpper(row?.archived)
  return archived === 'YES' || archived === 'TRUE'
}

function isActiveChallenge(row) {
  if (!row) return false
  if (isCompleted(row) || isArchived(row)) return false

  const active = normalizeUpper(row.active)
  const status = normalizeUpper(row.status)

  if (active === 'YES' || active === 'ACTIVE') return true
  if (status === 'ACTIVE' || status === 'PENDING' || status === 'SCHEDULED') return true

  return false
}

function sortRankings(rows) {
  return [...rows].sort((a, b) => toNumber(a.rank) - toNumber(b.rank))
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getRankTheme(rank) {
  const n = Number(rank)

  if (n === 1) {
    return {
      accent: '#aef2ff',
      accentStrong: '#f6feff',
      border: 'rgba(174,242,255,0.68)',
      glow: 'rgba(174,242,255,0.38)',
      badgeBg:
        'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(225,250,255,1) 54%, rgba(154,235,255,1) 100%)',
      badgeColor: '#102444',
      cardBg:
        'linear-gradient(180deg, rgba(19,53,101,0.997) 0%, rgba(7,20,41,1) 100%)',
      platformBg:
        'linear-gradient(180deg, rgba(174,242,255,0.20) 0%, rgba(255,255,255,0.04) 100%)',
      rail:
        'linear-gradient(180deg, rgba(174,242,255,1) 0%, rgba(174,242,255,0.22) 100%)',
    }
  }

  if (n === 2) {
    return {
      accent: '#f6d56f',
      accentStrong: '#fff7d3',
      border: 'rgba(246,213,111,0.50)',
      glow: 'rgba(246,213,111,0.22)',
      badgeBg:
        'linear-gradient(180deg, rgba(255,252,241,1) 0%, rgba(250,229,151,1) 58%, rgba(219,171,53,1) 100%)',
      badgeColor: '#3b2a00',
      cardBg:
        'linear-gradient(180deg, rgba(57,42,14,0.995) 0%, rgba(24,18,8,1) 100%)',
      platformBg:
        'linear-gradient(180deg, rgba(246,213,111,0.16) 0%, rgba(255,255,255,0.03) 100%)',
      rail:
        'linear-gradient(180deg, rgba(246,213,111,0.95) 0%, rgba(246,213,111,0.18) 100%)',
    }
  }

  if (n === 3) {
    return {
      accent: '#dde6f0',
      accentStrong: '#fcfdff',
      border: 'rgba(221,230,240,0.46)',
      glow: 'rgba(221,230,240,0.20)',
      badgeBg:
        'linear-gradient(180deg, rgba(252,254,255,1) 0%, rgba(230,236,243,1) 58%, rgba(186,198,214,1) 100%)',
      badgeColor: '#263445',
      cardBg:
        'linear-gradient(180deg, rgba(35,42,55,0.995) 0%, rgba(15,19,28,1) 100%)',
      platformBg:
        'linear-gradient(180deg, rgba(221,230,240,0.12) 0%, rgba(255,255,255,0.03) 100%)',
      rail:
        'linear-gradient(180deg, rgba(221,230,240,0.94) 0%, rgba(221,230,240,0.18) 100%)',
    }
  }

  if (n >= 4 && n <= 7) {
    return {
      accent: '#d29667',
      accentStrong: '#f2d5bf',
      border: 'rgba(210,150,103,0.26)',
      glow: 'rgba(210,150,103,0.10)',
      badgeBg:
        'linear-gradient(180deg, rgba(243,213,191,1) 0%, rgba(210,150,103,1) 58%, rgba(181,111,66,1) 100%)',
      badgeColor: '#3f1f0d',
      cardBg:
        'linear-gradient(180deg, rgba(18,36,61,0.98) 0%, rgba(11,22,39,1) 100%)',
      platformBg:
        'linear-gradient(180deg, rgba(210,150,103,0.09) 0%, rgba(255,255,255,0.03) 100%)',
      rail:
        'linear-gradient(180deg, rgba(210,150,103,0.82) 0%, rgba(210,150,103,0.14) 100%)',
    }
  }

  return {
    accent: '#b8c9e6',
    accentStrong: '#eff5ff',
    border: 'rgba(184,201,230,0.16)',
    glow: 'rgba(184,201,230,0.06)',
    badgeBg: 'linear-gradient(180deg, #eff5ff 0%, #dbe7f7 100%)',
    badgeColor: '#182235',
    cardBg:
      'linear-gradient(180deg, rgba(11,24,44,0.96) 0%, rgba(7,15,28,0.99) 100%)',
    platformBg:
      'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
    rail:
      'linear-gradient(180deg, rgba(184,201,230,0.52) 0%, rgba(184,201,230,0.10) 100%)',
  }
}

function getMoveInfo(moveValue) {
  const raw = normalizeText(moveValue)
  const upper = normalizeUpper(moveValue)

  if (!raw || upper === '—' || upper === '-') {
    return {
      label: '0',
      type: 'neutral',
      color: 'rgba(220,232,255,0.62)',
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.08)',
      icon: '',
    }
  }

  if (upper === 'NEW') {
    return {
      label: 'NEW',
      type: 'up',
      color: '#c7ffd7',
      bg: 'linear-gradient(180deg, rgba(41,84,54,0.92) 0%, rgba(23,49,32,0.98) 100%)',
      border: 'rgba(132,255,172,0.20)',
      icon: '↗',
    }
  }

  const n = Number(raw.replace(/[^\d+-]/g, ''))
  if (Number.isFinite(n)) {
    if (n > 0) {
      return {
        label: `${n}`,
        type: 'up',
        color: '#c7ffd7',
        bg: 'linear-gradient(180deg, rgba(41,84,54,0.92) 0%, rgba(23,49,32,0.98) 100%)',
        border: 'rgba(132,255,172,0.22)',
        icon: '↗',
      }
    }

    if (n < 0) {
      return {
        label: `${Math.abs(n)}`,
        type: 'down',
        color: '#ffd7d7',
        bg: 'linear-gradient(180deg, rgba(92,38,38,0.92) 0%, rgba(48,20,20,0.98) 100%)',
        border: 'rgba(255,132,132,0.20)',
        icon: '↘',
      }
    }
  }

  return {
    label: raw,
    type: 'neutral',
    color: 'rgba(220,232,255,0.68)',
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    icon: '',
  }
}

function getTierLabel(rank) {
  const n = Number(rank)
  if (n === 1) return 'Champion'
  if (n <= 3) return 'Podium'
  if (n <= 7) return 'Chase Pack'
  return 'Field'
}

function SignatureChampionMark() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 999,
        background:
          'linear-gradient(180deg, rgba(174,242,255,0.14) 0%, rgba(255,255,255,0.05) 100%)',
        border: '1px solid rgba(174,242,255,0.22)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.18), 0 0 20px rgba(174,242,255,0.16)',
      }}
    >
      <span
        style={{
          fontSize: 13,
          lineHeight: 1,
          filter: 'drop-shadow(0 0 8px rgba(246,213,111,0.28))',
        }}
      >
        👑
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#dffcff',
        }}
      >
        Champion Crest
      </span>
    </div>
  )
}

function ChallengeMapCard({ title, players, emptyText }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
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
          color: 'rgba(220,232,255,0.58)',
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      {players.length === 0 ? (
        <div
          style={{
            fontSize: 14,
            color: 'rgba(220,232,255,0.68)',
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {players.map((item) => (
            <div
              key={`${title}-${item.rank}-${item.player}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderRadius: 14,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#eef6ff',
                }}
              >
                {item.player}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: 'rgba(220,232,255,0.70)',
                }}
              >
                #{item.rank}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExternalMatchLogCard({ entry }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 14,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#eef6ff',
          }}
        >
          {formatDate(entry.match_date)}
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: '#dffcff',
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(174,242,255,0.08)',
            border: '1px solid rgba(174,242,255,0.16)',
          }}
        >
          {entry.set_score || '—'}
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          color: 'rgba(220,232,255,0.76)',
          marginBottom: 6,
        }}
      >
        <strong style={{ color: '#eef6ff' }}>Team:</strong> {entry.team_name || '—'}
      </div>

      <div
        style={{
          fontSize: 14,
          color: 'rgba(220,232,255,0.76)',
        }}
      >
        <strong style={{ color: '#eef6ff' }}>Opponent:</strong> {entry.opponent_name || '—'}
      </div>
    </div>
  )
}

function DrawerInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(220,232,255,0.72)',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 50,
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.12)',
          outline: 'none',
          padding: '0 14px',
          fontSize: 15,
          background: 'rgba(243,244,246,0.96)',
          color: '#111827',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function PlayerDetailDrawer({
  player,
  rows,
  externalMatches,
  onClose,
  onExternalMatchSaved,
}) {
  const [form, setForm] = useState({
    match_date: '',
    team_name: '',
    opponent_name: '',
    set_score: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      match_date: '',
      team_name: '',
      opponent_name: '',
      set_score: '',
    })
  }, [player])

  if (!player) return null

  const sorted = [...rows].sort((a, b) => toNumber(a.rank) - toNumber(b.rank))
  const index = sorted.findIndex((item) => normalizeUpper(item.player) === normalizeUpper(player))
  if (index === -1) return null

  const row = sorted[index]
  const rank = toNumber(row.rank)
  const move = getMoveInfo(row.move)
  const theme = getRankTheme(rank)

  const canChallenge = [sorted[index - 1], sorted[index - 2]].filter(Boolean)
  const canBeChallengedBy = [sorted[index + 1], sorted[index + 2]].filter(Boolean)

  const playerExternalMatches = [...externalMatches]
    .filter((entry) => normalizeUpper(entry.player) === normalizeUpper(player))
    .sort((a, b) => {
      const da = new Date(a.match_date)
      const db = new Date(b.match_date)
      return db - da
    })

  async function handleSaveExternalMatch(e) {
    e.preventDefault()

    try {
      if (!form.match_date || !form.team_name || !form.opponent_name || !form.set_score) {
        throw new Error('Please complete all external match fields')
      }

      setSaving(true)

      const payload = {
        action: 'external_match_log',
        player: row.player,
        match_date: form.match_date,
        team_name: form.team_name,
        opponent_name: form.opponent_name,
        set_score: form.set_score,
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || data.raw || 'Failed to save external match')
      }

      setForm({
        match_date: '',
        team_name: '',
        opponent_name: '',
        set_score: '',
      })

      onExternalMatchSaved?.()
    } catch (err) {
      alert(err.message || 'Failed to save external match')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.56)',
        zIndex: 1200,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 470,
          height: '100%',
          overflowY: 'auto',
          background:
            'linear-gradient(180deg, rgba(10,23,43,0.985) 0%, rgba(7,17,32,0.995) 100%)',
          borderLeft: `1px solid ${theme.border}`,
          boxShadow: '-20px 0 60px rgba(0,0,0,0.35)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(174,242,255,0.70)',
            }}
          >
            Ladder Window
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#eef6ff',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            borderRadius: 24,
            padding: 18,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <PlayerPhoto
              name={row.player}
              url={row.photo_url}
              rank={row.rank}
              size={110}
            />

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: '#eef6ff',
                  lineHeight: 1.02,
                  marginBottom: 8,
                }}
              >
                {row.player}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <RankBadge rank={row.rank} />
                <MoveChip move={row.move} />
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(220,232,255,0.62)',
            }}
          >
            Rank #{row.rank} · {getTierLabel(rank)}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
          <ChallengeMapCard
            title="Players This Rank Can Challenge"
            players={canChallenge}
            emptyText="No higher ranks available."
          />
          <ChallengeMapCard
            title="Players Who Can Challenge This Rank"
            players={canBeChallengedBy}
            emptyText="No lower ranks in range."
          />
        </div>

        <div
          style={{
            borderRadius: 20,
            padding: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(220,232,255,0.62)',
              marginBottom: 14,
            }}
          >
            Log Outside Match
          </div>

          <form onSubmit={handleSaveExternalMatch}>
            <div style={{ display: 'grid', gap: 12 }}>
              <DrawerInput
                label="Date"
                type="date"
                value={form.match_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, match_date: e.target.value }))
                }
              />

              <DrawerInput
                label="Team Name"
                value={form.team_name}
                placeholder="Enter team name"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, team_name: e.target.value }))
                }
              />

              <DrawerInput
                label="Opponent Name"
                value={form.opponent_name}
                placeholder="Enter opponent name"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, opponent_name: e.target.value }))
                }
              />

              <DrawerInput
                label="Set Score"
                value={form.set_score}
                placeholder="Example: 6-3, 6-4"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, set_score: e.target.value }))
                }
              />

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 14,
                  border: '1px solid rgba(174,242,255,0.16)',
                  background:
                    'linear-gradient(180deg, rgba(174,242,255,0.14) 0%, rgba(174,242,255,0.06) 100%)',
                  color: '#dffcff',
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Outside Match'}
              </button>
            </div>
          </form>
        </div>

        <div
          style={{
            borderRadius: 20,
            padding: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(220,232,255,0.62)',
              marginBottom: 14,
            }}
          >
            Outside Match History
          </div>

          {playerExternalMatches.length === 0 ? (
            <div
              style={{
                fontSize: 14,
                color: 'rgba(220,232,255,0.68)',
              }}
            >
              No outside matches logged yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {playerExternalMatches.map((entry, index) => (
                <ExternalMatchLogCard
                  key={`${entry.player}-${entry.match_date}-${entry.opponent_name}-${index}`}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PodiumCard({
  row,
  activeChallengesByPlayer,
  highlightedCard,
  triggerHighlight,
  openPlayer,
}) {
  const rank = toNumber(row.rank)
  const theme = getRankTheme(rank)
  const isLeader = rank === 1
  const activeCount = activeChallengesByPlayer[normalizeUpper(row.player)] || 0
  const isHighlighted =
    highlightedCard &&
    normalizeUpper(row.player) === normalizeUpper(highlightedCard)

  const heightMap = {
    1: 540,
    2: 386,
    3: 368,
  }

  return (
    <div
      onMouseEnter={() => triggerHighlight(row.player || null)}
      onClick={(e) => {
        e.preventDefault()
        triggerHighlight(row.player || null)
        openPlayer(row.player)
      }}
      onTouchStart={(e) => {
        e.preventDefault()
        triggerHighlight(row.player || null)
      }}
      className={`interactive-card fade-in podium-card ${isLeader ? 'podium-card-1' : ''} ${
        rank === 1 ? 'hover-rank-1' : rank === 2 ? 'hover-rank-2' : 'hover-rank-3'
      } ${activeCount ? 'active-outline-card' : ''} ${
        isHighlighted ? 'target-card-highlighted' : ''
      }`}
      style={{
        position: 'relative',
        minHeight: heightMap[rank] || 368,
        borderRadius: 34,
        padding: rank === 1 ? '42px 22px 24px' : '24px 18px 18px',
        background: theme.cardBg,
        border: `1px solid ${activeCount ? 'rgba(255,132,132,0.34)' : theme.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isLeader
          ? `0 58px 124px rgba(0,0,0,0.50), 0 0 102px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -10px 24px rgba(0,0,0,0.20)`
          : `0 26px 58px rgba(0,0,0,0.30), 0 0 34px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -8px 20px rgba(0,0,0,0.18)`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 24,
          bottom: 24,
          width: 5,
          borderRadius: 999,
          background: activeCount
            ? 'linear-gradient(180deg, rgba(255,132,132,0.92) 0%, rgba(255,132,132,0.18) 100%)'
            : theme.rail,
          boxShadow: activeCount ? '0 0 20px rgba(255,132,132,0.20)' : 'none',
        }}
      />

      <div className="podium-frame-outer" />
      <div className="podium-frame-inner" />
      <div className="podium-bottom-lip" />
      <div className="podium-top-highlight" />

      {isLeader ? <div className="podium-hero-breath" /> : <div className="podium-soft-breath" />}
      {isLeader ? <div className="podium-hero-outline" /> : null}

      {isLeader ? (
        <>
          <div className="hero-spotlight-behind-photo" />
          <div className="hero-ambient-rise" />
          <div className="hero-crown-light" />
          <div className="hero-card-bloom" />
        </>
      ) : null}

      {activeCount ? <div className="active-challenge-outline" /> : null}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: isLeader ? 24 : 18,
          zIndex: 3,
        }}
      >
        <RankBadge rank={row.rank} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeCount ? (
            <div
              style={{
                minWidth: 42,
                height: 24,
                padding: '0 10px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(180deg, rgba(91,43,43,0.95) 0%, rgba(48,20,20,0.98) 100%)',
                border: '1px solid rgba(255,132,132,0.20)',
                color: '#ffd8d8',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              live
            </div>
          ) : null}
          <MoveChip move={row.move} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 3 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: isLeader ? 28 : 22,
          }}
        >
          <PlayerPhoto
            name={row.player}
            url={row.photo_url}
            rank={row.rank}
            size={isLeader ? 216 : 116}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          {isLeader ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <SignatureChampionMark />
            </div>
          ) : null}

          <div
            className={isLeader ? 'leader-name' : rank === 2 ? 'metal-name-gold' : 'metal-name-silver'}
            style={{
              fontSize: isLeader ? 46 : 27,
              fontWeight: isLeader ? 950 : 900,
              color: '#eef6ff',
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              marginBottom: 10,
            }}
          >
            {row.player || '—'}
          </div>

          {row.flag_url ? (
            <div
              style={{
                width: 34,
                height: 22,
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.14)',
                margin: '0 auto 12px',
              }}
            >
              <img
                draggable={false}
                src={row.flag_url}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="podium-platform"
        style={{
          position: 'relative',
          zIndex: 3,
          marginTop: 18,
          height: isLeader ? 110 : 66,
          borderRadius: 24,
          background: theme.platformBg,
          border: `1px solid ${theme.border}`,
          display: 'grid',
          placeItems: 'center',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -14px 18px rgba(0,0,0,0.22), 0 12px 22px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 14,
            right: 14,
            height: 1,
            background: 'rgba(255,255,255,0.22)',
            borderRadius: 999,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 18,
            right: 18,
            height: 12,
            borderRadius: 999,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.20) 100%)',
          }}
        />
        <div
          style={{
            fontSize: isLeader ? 15 : 13,
            fontWeight: 900,
            letterSpacing: isLeader ? '0.26em' : '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(220,232,255,0.80)',
            textShadow: isLeader
              ? '0 1px 0 rgba(255,255,255,0.16), 0 0 10px rgba(255,255,255,0.05)'
              : '0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          Rank {row.rank}
        </div>
      </div>
    </div>
  )
}

function LadderRow({
  row,
  activeChallengesByPlayer,
  highlightedCard,
  triggerHighlight,
  openPlayer,
}) {
  const rank = toNumber(row.rank)
  const theme = getRankTheme(rank)
  const activeCount = activeChallengesByPlayer[normalizeUpper(row.player)] || 0
  const isHighlighted =
    highlightedCard &&
    normalizeUpper(row.player) === normalizeUpper(highlightedCard)

  return (
    <div
      onMouseEnter={() => triggerHighlight(row.player || null)}
      onClick={(e) => {
        e.preventDefault()
        triggerHighlight(row.player || null)
        openPlayer(row.player)
      }}
      onTouchStart={(e) => {
        e.preventDefault()
        triggerHighlight(row.player || null)
      }}
      className={`interactive-card fade-in ladder-row ${
        rank >= 4 && rank <= 7 ? 'hover-rank-bronze' : 'hover-rank-basic'
      } ${activeCount ? 'active-outline-card' : ''} ${
        isHighlighted ? 'target-card-highlighted' : ''
      }`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 16,
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 22,
        background: rank >= 4 && rank <= 7 ? 'rgba(210,150,103,0.06)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${
          activeCount
            ? 'rgba(255,132,132,0.26)'
            : rank >= 4 && rank <= 7
              ? 'rgba(210,150,103,0.12)'
              : 'rgba(255,255,255,0.08)'
        }`,
        boxShadow: activeCount
          ? '0 0 0 1px rgba(255,132,132,0.04), 0 12px 24px rgba(255,132,132,0.06)'
          : rank >= 4 && rank <= 7
            ? `0 0 0 1px rgba(210,150,103,0.03), 0 12px 24px ${theme.glow}`
            : `0 0 0 1px rgba(255,255,255,0.01), 0 12px 24px ${theme.glow}`,
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 14,
          bottom: 14,
          width: 4,
          borderRadius: 999,
          background: activeCount
            ? 'linear-gradient(180deg, rgba(255,132,132,0.82) 0%, rgba(255,132,132,0.14) 100%)'
            : theme.rail,
        }}
      />

      {activeCount ? <div className="active-challenge-outline" /> : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <RankBadge rank={row.rank} />
        <PlayerPhoto name={row.player} url={row.photo_url} rank={row.rank} size={58} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 850,
              color: '#eef6ff',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              minWidth: 0,
            }}
          >
            {row.player || '—'}
          </div>

          {row.flag_url ? (
            <div
              style={{
                width: 28,
                height: 19,
                borderRadius: 5,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              <img
                draggable={false}
                src={row.flag_url}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ) : null}

          {activeCount ? (
            <div
              style={{
                minWidth: 42,
                height: 24,
                padding: '0 10px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(180deg, rgba(91,43,43,0.95) 0%, rgba(48,20,20,0.98) 100%)',
                border: '1px solid rgba(255,132,132,0.20)',
                color: '#ffd8d8',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              live
            </div>
          ) : null}
        </div>
      </div>

      <MoveChip move={row.move} />
    </div>
  )
}

function LoadingCard() {
  return (
    <div
      className="skeleton-card"
      style={{
        borderRadius: 24,
        height: 120,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
      }}
    />
  )
}

export default function LiveRankingPage() {
  const [rows, setRows] = useState([])
  const [challengeRows, setChallengeRows] = useState([])
  const [externalMatches, setExternalMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [highlightedCard, setHighlightedCard] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const highlightTimerRef = useRef(null)

  async function loadData() {
    try {
      setLoading(true)

      const [rankingRes, challengeRes, externalRes] = await Promise.all([
        fetch(rankingUrl, { cache: 'no-store' }),
        fetch(challengeFeedUrl, { cache: 'no-store' }),
        fetch(externalMatchLogUrl, { cache: 'no-store' }),
      ])

      const rankingData = await rankingRes.json()
      const challengeData = await challengeRes.json()
      const externalData = await externalRes.json()

      setRows(Array.isArray(rankingData) ? sortRankings(rankingData) : [])
      setChallengeRows(Array.isArray(challengeData) ? challengeData : [])
      setExternalMatches(Array.isArray(externalData) ? externalData : [])
    } catch (err) {
      console.error('Failed to load rankings:', err)
      setRows([])
      setChallengeRows([])
      setExternalMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [])

  function triggerHighlight(name) {
    if (!name) return
    setHighlightedCard(name)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedCard(null)
    }, 2000)
  }

  function openPlayer(name) {
    setSelectedPlayer(name || null)
  }

  const topThree = useMemo(() => rows.slice(0, 3), [rows])
  const middleTier = useMemo(() => rows.slice(3, 7), [rows])
  const fullLadder = useMemo(() => rows.slice(7), [rows])

  const leader = rows[0]?.player || '—'

  const biggestMove = useMemo(() => {
    if (!rows.length) return '—'

    let bestLabel = '—'
    let bestValue = -Infinity

    rows.forEach((row) => {
      const raw = normalizeText(row.move)
      const upper = normalizeUpper(row.move)

      if (upper === 'NEW') {
        if (50 > bestValue) {
          bestValue = 50
          bestLabel = `${row.player} (NEW)`
        }
        return
      }

      const n = Number(raw.replace(/[^\d+-]/g, ''))
      if (Number.isFinite(n) && n > bestValue) {
        bestValue = n
        bestLabel = n > 0 ? `${row.player} (+${n})` : `${row.player} (${n})`
      }
    })

    return bestLabel
  }, [rows])

  const activeChallengesByPlayer = useMemo(() => {
    const map = {}

    challengeRows.filter(isActiveChallenge).forEach((row) => {
      const challenger = normalizeUpper(row.challenger)
      const opponent = normalizeUpper(row.opponent)

      if (challenger) map[challenger] = (map[challenger] || 0) + 1
      if (opponent) map[opponent] = (map[opponent] || 0) + 1
    })

    return map
  }, [challengeRows])

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes cinematicFadeRise {
          0% { opacity: 0; transform: translateY(16px) scale(0.982); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes heroBreath {
          0% { opacity: 0.52; transform: scale(0.99); }
          50% { opacity: 1; transform: scale(1.015); }
          100% { opacity: 0.52; transform: scale(0.99); }
        }

        @keyframes softBreath {
          0% { opacity: 0.28; transform: scale(0.996); }
          50% { opacity: 0.62; transform: scale(1.008); }
          100% { opacity: 0.28; transform: scale(0.996); }
        }

        @keyframes heroNameGlow {
          0% { text-shadow: 0 0 14px rgba(174,242,255,0.16), 0 0 28px rgba(174,242,255,0.10); }
          50% { text-shadow: 0 0 24px rgba(174,242,255,0.38), 0 0 52px rgba(174,242,255,0.20); }
          100% { text-shadow: 0 0 14px rgba(174,242,255,0.16), 0 0 28px rgba(174,242,255,0.10); }
        }

        @keyframes heroOutlineTrace {
          0% {
            opacity: 0.42;
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.00),
              0 0 0 rgba(174,242,255,0.00);
          }
          50% {
            opacity: 1;
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.88),
              0 0 42px rgba(174,242,255,0.30);
          }
          100% {
            opacity: 0.42;
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.00),
              0 0 0 rgba(174,242,255,0.00);
          }
        }

        @keyframes rankTrace {
          0% { clip-path: inset(0 100% 0 0 round 999px); opacity: 0.85; }
          25% { clip-path: inset(0 0 100% 0 round 999px); opacity: 1; }
          50% { clip-path: inset(0 0 0 100% round 999px); opacity: 0.92; }
          75% { clip-path: inset(100% 0 0 0 round 999px); opacity: 1; }
          100% { clip-path: inset(0 100% 0 0 round 999px); opacity: 0.85; }
        }

        @keyframes activePulse {
          0% { box-shadow: 0 0 10px rgba(255,132,132,0.08); border-color: rgba(255,132,132,0.22); }
          50% { box-shadow: 0 0 24px rgba(255,132,132,0.16); border-color: rgba(255,132,132,0.34); }
          100% { box-shadow: 0 0 10px rgba(255,132,132,0.08); border-color: rgba(255,132,132,0.22); }
        }

        .fade-in {
          animation: cinematicFadeRise 0.85s cubic-bezier(.22,.8,.22,1) both;
        }

        .interactive-card {
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
          -webkit-tap-highlight-color: transparent;
          tap-highlight-color: transparent;
          outline: none;
          user-select: none;
        }

        .interactive-card:focus,
        .interactive-card:focus-visible,
        .interactive-card:active {
          outline: none !important;
        }

        .interactive-card,
        .podium-card,
        .ladder-row,
        .rank-badge {
          -webkit-tap-highlight-color: transparent;
        }

        .leader-name {
          animation: heroNameGlow 3.2s ease-in-out infinite;
          color: #f7fdff;
          text-shadow: 0 0 18px rgba(174,242,255,0.18), 0 0 34px rgba(174,242,255,0.10);
        }

        .metal-name-gold {
          text-shadow: 0 1px 0 rgba(255,255,255,0.12), 0 0 10px rgba(246,213,111,0.08);
        }

        .metal-name-silver {
          text-shadow: 0 1px 0 rgba(255,255,255,0.12), 0 0 10px rgba(221,230,240,0.08);
        }

        .podium-frame-outer {
          position: absolute;
          inset: 0;
          border-radius: 34px;
          pointer-events: none;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.05),
            inset 0 1px 0 rgba(255,255,255,0.14),
            inset 0 -1px 0 rgba(0,0,0,0.24);
        }

        .podium-frame-inner {
          position: absolute;
          inset: 10px;
          border-radius: 26px;
          pointer-events: none;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .podium-bottom-lip {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 10px;
          height: 18px;
          border-radius: 0 0 26px 26px;
          background: linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.18) 100%);
          pointer-events: none;
        }

        .podium-top-highlight {
          position: absolute;
          left: 10px;
          right: 10px;
          top: 0;
          height: 56px;
          border-radius: 34px 34px 22px 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 100%);
          pointer-events: none;
        }

        .podium-hero-breath,
        .podium-soft-breath {
          position: absolute;
          inset: -14px;
          border-radius: 42px;
          filter: blur(22px);
          pointer-events: none;
        }

        .podium-hero-breath {
          background: radial-gradient(circle at center, rgba(174,242,255,0.30) 0%, rgba(174,242,255,0.08) 38%, rgba(174,242,255,0.00) 72%);
          animation: heroBreath 3.2s ease-in-out infinite;
        }

        .podium-soft-breath {
          background: radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.00) 72%);
          animation: softBreath 3.8s ease-in-out infinite;
        }

        .podium-hero-outline {
          position: absolute;
          inset: -1px;
          border-radius: 34px;
          pointer-events: none;
          animation: heroOutlineTrace 3s ease-in-out infinite;
        }

        .hero-spotlight-behind-photo {
          position: absolute;
          top: 34px;
          left: 50%;
          transform: translateX(-50%);
          width: 520px;
          height: 410px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(174,242,255,0.30) 0%, rgba(174,242,255,0.12) 34%, rgba(174,242,255,0.00) 72%);
          filter: blur(38px);
          pointer-events: none;
        }

        .hero-ambient-rise {
          position: absolute;
          left: 6%;
          right: 6%;
          top: 7%;
          bottom: 18%;
          background: linear-gradient(180deg, rgba(174,242,255,0.14) 0%, rgba(174,242,255,0.02) 42%, rgba(174,242,255,0.00) 100%);
          filter: blur(34px);
          pointer-events: none;
        }

        .hero-crown-light {
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 172px;
          height: 86px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(246,213,111,0.26) 0%, rgba(246,213,111,0.08) 40%, rgba(246,213,111,0.00) 76%);
          filter: blur(20px);
          pointer-events: none;
        }

        .hero-card-bloom {
          position: absolute;
          inset: -22px;
          border-radius: 42px;
          background: radial-gradient(circle at 50% 8%, rgba(174,242,255,0.16) 0%, rgba(174,242,255,0.03) 36%, rgba(174,242,255,0.00) 72%);
          filter: blur(28px);
          pointer-events: none;
        }

        .rank-pill-top-sheen {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.40) 0%,
            rgba(255,255,255,0.14) 28%,
            rgba(255,255,255,0.00) 64%
          );
          pointer-events: none;
          z-index: 1;
        }

        .rank-pill-trace {
          position: absolute;
          inset: -1px;
          border-radius: 999px;
          border: 2px solid rgba(174,242,255,0.95);
          box-shadow: 0 0 18px rgba(174,242,255,0.22);
          pointer-events: none;
          animation: rankTrace 2.7s linear infinite;
          z-index: 2;
        }

        .rank-pill-metal-ring-gold {
          position: absolute;
          inset: -1px;
          border-radius: 999px;
          border: 2px solid rgba(246,213,111,0.44);
          box-shadow: 0 0 16px rgba(246,213,111,0.14);
          pointer-events: none;
          z-index: 2;
        }

        .rank-pill-metal-ring-silver {
          position: absolute;
          inset: -1px;
          border-radius: 999px;
          border: 2px solid rgba(221,230,240,0.42);
          box-shadow: 0 0 16px rgba(221,230,240,0.14);
          pointer-events: none;
          z-index: 2;
        }

        .leader-photo-bloom {
          position: absolute;
          inset: -40px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(174,242,255,0.18) 0%, rgba(174,242,255,0.00) 70%);
          filter: blur(24px);
          pointer-events: none;
        }

        .leader-photo-outer-ring {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.56),
            inset 0 -12px 16px rgba(0,0,0,0.16),
            0 0 56px rgba(174,242,255,0.34),
            0 0 10px rgba(255,255,255,0.18);
          pointer-events: none;
        }

        .leader-photo-inner-bevel {
          position: absolute;
          inset: 8px;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.14);
          pointer-events: none;
        }

        .leader-photo-halo {
          position: absolute;
          inset: -16px;
          border-radius: inherit;
          background: radial-gradient(circle at center, rgba(174,242,255,0.28) 0%, rgba(174,242,255,0.08) 38%, rgba(174,242,255,0.00) 76%);
          filter: blur(24px);
          pointer-events: none;
          animation: heroBreath 3.2s ease-in-out infinite;
        }

        .leader-photo-sheen {
          position: absolute;
          top: 6px;
          left: 10px;
          width: 44%;
          height: 22%;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.00) 100%);
          filter: blur(6px);
          pointer-events: none;
        }

        .active-outline-card {
          box-shadow: 0 0 0 1px rgba(255,132,132,0.06), 0 12px 24px rgba(255,132,132,0.08) !important;
        }

        .active-challenge-outline {
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          border: 1px solid rgba(255,132,132,0.30);
          box-shadow: 0 0 18px rgba(255,132,132,0.10);
          pointer-events: none;
          animation: activePulse 3.8s ease-in-out infinite;
        }

        .target-card-highlighted {
          border-color: rgba(255,255,255,0.18) !important;
        }

        .hover-rank-1.target-card-highlighted {
          border-color: rgba(174,242,255,0.58) !important;
          box-shadow:
            0 0 0 1px rgba(174,242,255,0.28),
            0 0 46px rgba(174,242,255,0.40),
            0 0 96px rgba(174,242,255,0.26),
            inset 0 1px 0 rgba(255,255,255,0.20) !important;
        }

        .hover-rank-1.target-card-highlighted::before,
        .hover-rank-1.target-card-highlighted::after {
          content: none !important;
          display: none !important;
        }

        .hover-rank-2.target-card-highlighted {
          border-color: rgba(246,213,111,0.46) !important;
          box-shadow:
            0 0 0 1px rgba(246,213,111,0.20),
            0 0 30px rgba(246,213,111,0.24),
            0 0 58px rgba(246,213,111,0.13),
            inset 0 1px 0 rgba(255,255,255,0.14) !important;
        }

        .hover-rank-3.target-card-highlighted {
          border-color: rgba(221,230,240,0.44) !important;
          box-shadow:
            0 0 0 1px rgba(221,230,240,0.18),
            0 0 28px rgba(221,230,240,0.22),
            0 0 54px rgba(221,230,240,0.12),
            inset 0 1px 0 rgba(255,255,255,0.14) !important;
        }

        .hover-rank-bronze.target-card-highlighted {
          border-color: rgba(210,150,103,0.42) !important;
          box-shadow:
            0 0 0 1px rgba(210,150,103,0.18),
            0 0 22px rgba(210,150,103,0.20),
            0 0 40px rgba(210,150,103,0.10),
            inset 0 1px 0 rgba(255,255,255,0.12) !important;
        }

        .hover-rank-basic.target-card-highlighted {
          border-color: rgba(184,201,230,0.22) !important;
          box-shadow:
            0 0 0 1px rgba(184,201,230,0.10),
            0 0 18px rgba(184,201,230,0.12),
            inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }

        .skeleton-card {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.12) 35%,
            rgba(255,255,255,0.06) 70%
          );
          background-size: 200% 100%;
          animation: shimmer 1.3s linear infinite;
        }

        @media (max-width: 980px) {
          .podium-grid {
            grid-template-columns: 1fr !important;
          }

          .hero-spotlight-behind-photo {
            width: 360px;
            height: 300px;
            top: 34px;
          }

          .hero-crown-light {
            width: 116px;
            height: 58px;
          }

          .hero-ambient-rise {
            left: 4%;
            right: 4%;
            top: 6%;
            bottom: 18%;
          }
        }

        @media (max-width: 700px) {
          .page-title {
            font-size: 34px !important;
          }

          .topbar {
            gap: 14px !important;
          }

          .stats-row {
            grid-template-columns: 1fr 1fr !important;
          }

          .podium-card-1 {
            min-height: 560px !important;
            padding-top: 42px !important;
            border-radius: 30px !important;
          }

          .podium-card-1 .leader-name {
            font-size: 50px !important;
          }

          .hero-spotlight-behind-photo {
            width: 460px !important;
            height: 400px !important;
            top: 8px !important;
            opacity: 1 !important;
            filter: blur(32px) !important;
          }

          .hero-ambient-rise {
            left: -4% !important;
            right: -4% !important;
            top: 0 !important;
            bottom: 12% !important;
            filter: blur(34px) !important;
          }

          .hero-card-bloom {
            inset: -22px !important;
            filter: blur(28px) !important;
          }

          .leader-photo-bloom {
            inset: -54px !important;
            filter: blur(28px) !important;
          }

          .leader-photo-halo {
            inset: -18px !important;
            filter: blur(24px) !important;
          }

          .target-card-highlighted {
            box-shadow: 0 0 0 1px rgba(184,201,230,0.12), 0 0 30px rgba(184,201,230,0.12) !important;
          }

          .hover-rank-1.target-card-highlighted {
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.30),
              0 0 64px rgba(174,242,255,0.34),
              0 0 116px rgba(174,242,255,0.28),
              inset 0 1px 0 rgba(255,255,255,0.18) !important;
          }

          .hover-rank-2.target-card-highlighted {
            box-shadow:
              0 0 0 1px rgba(246,213,111,0.24),
              0 0 42px rgba(246,213,111,0.26),
              0 0 74px rgba(246,213,111,0.16) !important;
          }

          .hover-rank-3.target-card-highlighted {
            box-shadow:
              0 0 0 1px rgba(221,230,240,0.22),
              0 0 40px rgba(221,230,240,0.24),
              0 0 70px rgba(221,230,240,0.14) !important;
          }

          .active-challenge-outline {
            border-color: rgba(255,132,132,0.42) !important;
            box-shadow: 0 0 34px rgba(255,132,132,0.18) !important;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top, #0b2447 0%, #07111f 40%, #02060d 100%)',
          color: 'white',
          padding: '32px 16px 64px',
        }}
      >
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.020) 0%, rgba(255,255,255,0.00) 18%, rgba(255,255,255,0.018) 34%, rgba(255,255,255,0.00) 52%, rgba(255,255,255,0.014) 72%, rgba(255,255,255,0.00) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, rgba(174,242,255,0.035) 0%, rgba(174,242,255,0.00) 26%, rgba(174,242,255,0.028) 52%, rgba(174,242,255,0.00) 78%, rgba(174,242,255,0.020) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -140,
              left: -90,
              width: 380,
              height: 380,
              borderRadius: '50%',
              background: 'rgba(56,189,248,0.12)',
              filter: 'blur(84px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 170,
              right: -100,
              width: 330,
              height: 330,
              borderRadius: '50%',
              background: 'rgba(168,240,255,0.08)',
              filter: 'blur(84px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: 120,
              bottom: 80,
              borderRadius: 40,
              border: '1px solid rgba(255,255,255,0.018)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.008)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '16%',
              right: '16%',
              top: 220,
              bottom: 160,
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.012)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.035,
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '18px 18px',
              mixBlendMode: 'soft-light',
            }}
          />
        </div>

        <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', zIndex: 1 }}>
          <div
            className="topbar fade-in"
            style={{
              animationDelay: '0.02s',
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
                className="page-title"
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  margin: 0,
                  lineHeight: 0.94,
                }}
              >
                Live Rankings
              </h1>
            </div>

            <a
              href="/match-center"
              className="interactive-card"
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
              Match Center →
            </a>
          </div>

          <div
            className="fade-in"
            style={{
              animationDelay: '0.06s',
              height: 1,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(168,240,255,0.18) 22%, rgba(255,255,255,0.08) 50%, rgba(168,240,255,0.18) 78%, rgba(255,255,255,0) 100%)',
              marginBottom: 24,
            }}
          />

          <div
            className="stats-row fade-in"
            style={{
              animationDelay: '0.10s',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 220px))',
              gap: 12,
              marginBottom: 36,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minWidth: 150,
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
                Leader
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#eef6ff',
                  lineHeight: 1.2,
                }}
              >
                {leader}
              </div>
            </div>

            <div
              style={{
                borderRadius: 18,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minWidth: 150,
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
                Biggest Move
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#eef6ff',
                  lineHeight: 1.2,
                }}
              >
                {biggestMove}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 40 }}>
            <section>
              {loading ? (
                <div
                  className="podium-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.15fr 1fr',
                    gap: 18,
                  }}
                >
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </div>
              ) : (
                <div
                  className="podium-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.15fr 1fr',
                    gap: 18,
                    alignItems: 'stretch',
                  }}
                >
                  {topThree[1] ? (
                    <PodiumCard
                      row={topThree[1]}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedCard={highlightedCard}
                      triggerHighlight={triggerHighlight}
                      openPlayer={openPlayer}
                    />
                  ) : (
                    <div />
                  )}

                  {topThree[0] ? (
                    <PodiumCard
                      row={topThree[0]}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedCard={highlightedCard}
                      triggerHighlight={triggerHighlight}
                      openPlayer={openPlayer}
                    />
                  ) : (
                    <div />
                  )}

                  {topThree[2] ? (
                    <PodiumCard
                      row={topThree[2]}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedCard={highlightedCard}
                      triggerHighlight={triggerHighlight}
                      openPlayer={openPlayer}
                    />
                  ) : (
                    <div />
                  )}
                </div>
              )}
            </section>

            <section
              className="fade-in"
              style={{
                animationDelay: '0.46s',
                position: 'relative',
                borderRadius: 28,
                padding: '18px 14px 8px',
                background:
                  'linear-gradient(180deg, rgba(210,150,103,0.08) 0%, rgba(210,150,103,0.02) 48%, rgba(255,255,255,0.00) 100%)',
                border: '1px solid rgba(210,150,103,0.12)',
                boxShadow: '0 18px 34px rgba(210,150,103,0.05)',
              }}
            >
              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : middleTier.length ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {middleTier.map((row, index) => (
                    <LadderRow
                      key={`middle-${index}`}
                      row={row}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedCard={highlightedCard}
                      triggerHighlight={triggerHighlight}
                      openPlayer={openPlayer}
                    />
                  ))}
                </div>
              ) : null}
            </section>

            <section
              className="fade-in"
              style={{
                animationDelay: '0.54s',
                position: 'relative',
                borderRadius: 28,
                padding: '18px 14px 8px',
                background:
                  'linear-gradient(180deg, rgba(221,230,240,0.03) 0%, rgba(255,255,255,0.00) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : fullLadder.length ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {fullLadder.map((row, index) => (
                    <LadderRow
                      key={`full-${index}`}
                      row={row}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedCard={highlightedCard}
                      triggerHighlight={triggerHighlight}
                      openPlayer={openPlayer}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <PlayerDetailDrawer
          player={selectedPlayer}
          rows={rows}
          externalMatches={externalMatches}
          onExternalMatchSaved={loadData}
          onClose={() => setSelectedPlayer(null)}
        />
      </div>
    </>
  )
}
