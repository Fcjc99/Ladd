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

function ExternalMatchCard({ item }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
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
          {formatDate(item.match_date)}
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
          {item.set_score || '—'}
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          color: 'rgba(220,232,255,0.76)',
          marginBottom: 6,
        }}
      >
        <strong style={{ color: '#eef6ff' }}>Team:</strong> {item.team_name || '—'}
      </div>

      <div
        style={{
          fontSize: 14,
          color: 'rgba(220,232,255,0.76)',
        }}
      >
        <strong style={{ color: '#eef6ff' }}>Opponent:</strong> {item.opponent_name || '—'}
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

function RankBadge({ rank }) {
  const n = Number(rank)
  const theme = getRankTheme(rank)
  const isLeader = n === 1
  const isSecond = n === 2
  const isThird = n === 3

  return (
    <div
      className={`rank-badge ${isLeader ? 'rank-badge-1' : ''} ${isSecond ? 'rank-badge-2' : ''} ${isThird ? 'rank-badge-3' : ''}`}
      style={{
        minWidth: isLeader ? 64 : 44,
        height: isLeader ? 64 : 44,
        padding: isLeader ? '0 18px' : '0 12px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: theme.badgeBg,
        color: theme.badgeColor,
        border: `1px solid ${theme.border}`,
        boxShadow: isLeader
          ? `0 16px 28px rgba(0,0,0,0.24), 0 0 30px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.84), inset 0 -12px 14px rgba(0,0,0,0.16)`
          : `0 12px 22px rgba(0,0,0,0.18), 0 0 18px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.46), inset 0 -8px 10px rgba(0,0,0,0.14)`,
        overflow: 'visible',
      }}
    >
      {isLeader ? (
        <div
          style={{
            position: 'absolute',
            top: -13,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 15,
            filter: 'drop-shadow(0 0 10px rgba(246,213,111,0.34))',
            zIndex: 4,
            lineHeight: 1,
          }}
        >
          👑
        </div>
      ) : null}

      <div className="rank-pill-top-sheen" />
      {isLeader ? <div className="rank-pill-trace" /> : null}
      {isSecond ? <div className="rank-pill-metal-ring-gold" /> : null}
      {isThird ? <div className="rank-pill-metal-ring-silver" /> : null}

      <span
        style={{
          position: 'relative',
          zIndex: 3,
          fontSize: isLeader ? 16 : 13,
          fontWeight: 950,
          letterSpacing: '-0.02em',
          textShadow: isLeader
            ? '0 1px 0 rgba(255,255,255,0.50), 0 -1px 0 rgba(0,0,0,0.08)'
            : '0 1px 0 rgba(255,255,255,0.24)',
        }}
      >
        #{rank}
      </span>
    </div>
  )
}

function MoveChip({ move }) {
  const info = getMoveInfo(move)

  return (
    <div
      style={{
        minWidth: 70,
        height: 38,
        padding: '0 12px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: info.bg,
        border: `1px solid ${info.border}`,
        color: info.color,
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        boxShadow:
          info.type === 'up'
            ? '0 10px 20px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.10)'
            : '0 8px 16px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {info.icon ? <span style={{ fontSize: 12 }}>{info.icon}</span> : null}
      <span>{info.label}</span>
    </div>
  )
}

function PlayerPhoto({ name, url, rank, size = 100 }) {
  const theme = getRankTheme(rank)
  const isLeader = Number(rank) === 1

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: Math.round(size * 0.28),
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {isLeader ? <div className="leader-photo-bloom" /> : null}

      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          padding: isLeader ? 8 : 0,
          background: isLeader
            ? `linear-gradient(145deg, ${theme.accentStrong} 0%, ${theme.border} 42%, rgba(255,255,255,0.08) 100%)`
            : 'transparent',
          boxShadow: isLeader
            ? `0 30px 58px rgba(0,0,0,0.36), 0 0 46px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.40)`
            : 'none',
        }}
      >
        {isLeader ? <div className="leader-photo-outer-ring" /> : null}
        {isLeader ? <div className="leader-photo-inner-bevel" /> : null}
        {isLeader ? <div className="leader-photo-halo" /> : null}
        {isLeader ? <div className="leader-photo-sheen" /> : null}

        <div
          style={{
            width: isLeader ? size - 16 : size,
            height: isLeader ? size - 16 : size,
            borderRadius: Math.round(size * 0.22),
            overflow: 'hidden',
            border: `2px solid ${theme.border}`,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
            boxShadow: isLeader
              ? `0 18px 40px rgba(0,0,0,0.30), 0 0 30px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.24)`
              : `0 14px 30px rgba(0,0,0,0.22), 0 0 18px ${theme.glow}`,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {url ? (
            <img
              draggable={false}
              src={url}
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
                color: 'rgba(255,255,255,0.78)',
                fontWeight: 900,
                fontSize: Math.max(18, size * 0.22),
                letterSpacing: '-0.03em',
              }}
            >
              {(name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </div>
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
  const theme = getRankTheme(rank)

  const canChallenge = [sorted[index - 1], sorted[index - 2]].filter(Boolean)
  const canBeChallengedBy = [sorted[index + 1], sorted[index + 2]].filter(Boolean)

  const playerExternalMatches = [...(externalMatches || [])]
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
        throw new Error('Please complete all fields')
      }

      setSaving(true)

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'external_match_log',
          player: row.player,
          match_date: form.match_date,
          team_name: form.team_name,
          opponent_name: form.opponent_name,
          set_score: form.set_score,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.raw || 'Failed to save outside match')
      }

      setForm({
        match_date: '',
        team_name: '',
        opponent_name: '',
        set_score: '',
      })

      if (onExternalMatchSaved) await onExternalMatchSaved()
    } catch (err) {
      alert(err.message || 'Failed to save outside match')
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

        <div style={{ display: 'grid', gap: 14, marginBottom: 16 }}>
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
              {playerExternalMatches.map((item, index) => (
                <ExternalMatchCard
                  key={`${item.player}-${item.match_date}-${item.opponent_name}-${index}`}
                  item={item}
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
        <PlayerPhoto
          name={row.player}
          url={row.photo_url}
          rank={row.rank}
          size={58}
        />
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
