'use client'

import { useEffect, useMemo, useState } from 'react'

const sheetId =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ||
  '1j3VgKy9fBHTTECzmRIYFijMtUAW5A0XdPoSNwdUDWOg'

const rankingUrl = `https://opensheet.elk.sh/${sheetId}/LiveRankingFeed`

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

function sortRankings(rows) {
  return [...rows].sort((a, b) => toNumber(a.rank) - toNumber(b.rank))
}

function getRankTheme(rank) {
  const n = Number(rank)

  if (n === 1) {
    return {
      accent: '#aef2ff',
      accentStrong: '#e7fdff',
      border: 'rgba(174,242,255,0.56)',
      borderSoft: 'rgba(174,242,255,0.18)',
      glow: 'rgba(174,242,255,0.24)',
      pillBg:
        'linear-gradient(180deg, rgba(250,255,255,1) 0%, rgba(214,249,255,1) 56%, rgba(154,235,255,1) 100%)',
      pillColor: '#102444',
      cardBg:
        'linear-gradient(180deg, rgba(17,46,88,0.99) 0%, rgba(7,22,43,0.995) 100%)',
      baseBg:
        'linear-gradient(180deg, rgba(174,242,255,0.13) 0%, rgba(255,255,255,0.04) 100%)',
      nameGlow: 'rgba(174,242,255,0.22)',
      spotlight: 'rgba(174,242,255,0.12)',
    }
  }

  if (n === 2) {
    return {
      accent: '#f6d56f',
      accentStrong: '#fff1b7',
      border: 'rgba(246,213,111,0.42)',
      borderSoft: 'rgba(246,213,111,0.15)',
      glow: 'rgba(246,213,111,0.18)',
      pillBg:
        'linear-gradient(180deg, rgba(255,251,232,1) 0%, rgba(249,226,143,1) 58%, rgba(219,170,50,1) 100%)',
      pillColor: '#3b2a00',
      cardBg:
        'linear-gradient(180deg, rgba(49,38,16,0.98) 0%, rgba(24,18,9,0.99) 100%)',
      baseBg:
        'linear-gradient(180deg, rgba(246,213,111,0.11) 0%, rgba(255,255,255,0.03) 100%)',
      nameGlow: 'rgba(246,213,111,0.08)',
      spotlight: 'rgba(246,213,111,0.06)',
    }
  }

  if (n === 3) {
    return {
      accent: '#dde6f0',
      accentStrong: '#f8fbff',
      border: 'rgba(221,230,240,0.38)',
      borderSoft: 'rgba(221,230,240,0.14)',
      glow: 'rgba(221,230,240,0.14)',
      pillBg:
        'linear-gradient(180deg, rgba(250,252,255,1) 0%, rgba(226,234,242,1) 58%, rgba(184,197,214,1) 100%)',
      pillColor: '#263445',
      cardBg:
        'linear-gradient(180deg, rgba(32,39,52,0.98) 0%, rgba(16,20,28,0.99) 100%)',
      baseBg:
        'linear-gradient(180deg, rgba(221,230,240,0.10) 0%, rgba(255,255,255,0.03) 100%)',
      nameGlow: 'rgba(221,230,240,0.08)',
      spotlight: 'rgba(221,230,240,0.05)',
    }
  }

  if (n >= 4 && n <= 7) {
    return {
      accent: '#d29667',
      accentStrong: '#f3d5bf',
      border: 'rgba(210,150,103,0.24)',
      borderSoft: 'rgba(210,150,103,0.08)',
      glow: 'rgba(210,150,103,0.08)',
      pillBg:
        'linear-gradient(180deg, rgba(243,213,191,1) 0%, rgba(210,150,103,1) 58%, rgba(181,111,66,1) 100%)',
      pillColor: '#3f1f0d',
      cardBg:
        'linear-gradient(180deg, rgba(14,31,58,0.96) 0%, rgba(10,21,39,0.98) 100%)',
      baseBg:
        'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
      nameGlow: 'rgba(255,255,255,0.00)',
      spotlight: 'rgba(255,255,255,0.00)',
    }
  }

  return {
    accent: '#b8c9e6',
    accentStrong: '#eff5ff',
    border: 'rgba(184,201,230,0.16)',
    borderSoft: 'rgba(184,201,230,0.06)',
    glow: 'rgba(184,201,230,0.06)',
    pillBg: 'linear-gradient(180deg, #eff5ff 0%, #dbe7f7 100%)',
    pillColor: '#182235',
    cardBg:
      'linear-gradient(180deg, rgba(14,31,58,0.96) 0%, rgba(10,21,39,0.98) 100%)',
    baseBg:
      'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
    nameGlow: 'rgba(255,255,255,0.00)',
    spotlight: 'rgba(255,255,255,0.00)',
  }
}

function getMoveInfo(moveValue) {
  const raw = normalizeText(moveValue)
  const upper = normalizeUpper(moveValue)

  if (!raw || upper === '—' || upper === '-') {
    return {
      label: '—',
      color: 'rgba(220,232,255,0.68)',
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.08)',
      icon: '',
    }
  }

  if (upper === 'NEW') {
    return {
      label: 'NEW',
      color: '#bff7d2',
      bg: 'linear-gradient(180deg, rgba(92,180,122,0.22) 0%, rgba(47,91,60,0.24) 100%)',
      border: 'rgba(110,255,190,0.20)',
      icon: '✦',
    }
  }

  const n = Number(raw.replace(/[^\d+-]/g, ''))
  if (Number.isFinite(n)) {
    if (n > 0) {
      return {
        label: String(n),
        color: '#d4ffe2',
        bg: 'linear-gradient(180deg, rgba(79,154,94,0.28) 0%, rgba(45,88,56,0.30) 100%)',
        border: 'rgba(110,255,190,0.24)',
        icon: '↑',
      }
    }

    if (n < 0) {
      return {
        label: String(Math.abs(n)),
        color: '#ffd7d7',
        bg: 'linear-gradient(180deg, rgba(151,77,77,0.24) 0%, rgba(84,41,41,0.28) 100%)',
        border: 'rgba(255,132,132,0.22)',
        icon: '↓',
      }
    }
  }

  return {
    label: raw,
    color: 'rgba(220,232,255,0.72)',
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    icon: '',
  }
}

function SmallStat({ label, value }) {
  return (
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
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#eef6ff',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function MoveChip({ move }) {
  const info = getMoveInfo(move)

  return (
    <div
      style={{
        minWidth: 72,
        height: 36,
        padding: '0 12px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: info.bg,
        border: `1px solid ${info.border}`,
        color: info.color,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
      }}
    >
      {info.icon ? <span style={{ fontSize: 12, lineHeight: 1 }}>{info.icon}</span> : null}
      <span>{info.label}</span>
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
        minWidth: isLeader ? 58 : 44,
        height: isLeader ? 58 : 44,
        padding: isLeader ? '0 16px' : '0 12px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: theme.pillBg,
        color: theme.pillColor,
        border: `1px solid ${theme.border}`,
        overflow: 'visible',
        boxShadow: isLeader
          ? `0 16px 28px rgba(0,0,0,0.24), 0 0 24px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.78), inset 0 -10px 14px rgba(0,0,0,0.16)`
          : `0 12px 20px rgba(0,0,0,0.18), 0 0 14px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -8px 10px rgba(0,0,0,0.14)`,
      }}
    >
      {isLeader ? (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 14,
            filter: 'drop-shadow(0 0 8px rgba(246,213,111,0.34))',
            zIndex: 5,
            lineHeight: 1,
          }}
        >
          👑
        </div>
      ) : null}

      <div className="rank-pill-top-sheen" />
      <div className="rank-pill-bottom-shadow" />
      {isLeader ? <div className="rank-pill-trace" /> : null}

      <span
        style={{
          position: 'relative',
          zIndex: 3,
          fontSize: isLeader ? 15 : 13,
          fontWeight: 950,
          textShadow: '0 1px 0 rgba(255,255,255,0.22)',
        }}
      >
        #{rank}
      </span>
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
            ? `0 24px 50px rgba(0,0,0,0.32), 0 0 34px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.38)`
            : 'none',
        }}
      >
        {isLeader ? <div className="leader-photo-outer-ring" /> : null}
        {isLeader ? <div className="leader-photo-inner-bevel" /> : null}
        {isLeader ? <div className="leader-photo-halo" /> : null}
        {isLeader ? <div className="leader-photo-sheen" /> : null}

        <div
          className="photo-hover"
          style={{
            width: isLeader ? size - 16 : size,
            height: isLeader ? size - 16 : size,
            borderRadius: Math.round(size * 0.22),
            overflow: 'hidden',
            border: `2px solid ${theme.border}`,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
            boxShadow: isLeader
              ? `0 18px 34px rgba(0,0,0,0.28), 0 0 22px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.24)`
              : `0 14px 30px rgba(0,0,0,0.22), 0 0 18px ${theme.glow}`,
            position: 'relative',
            zIndex: 2,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {url ? (
            <img
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

function PodiumCard({ row }) {
  const rank = toNumber(row.rank)
  const theme = getRankTheme(rank)
  const isLeader = rank === 1
  const isSecond = rank === 2
  const isThird = rank === 3

  return (
    <div
      className={`interactive-card podium-card ${isLeader ? 'podium-card-1' : ''} ${isSecond ? 'podium-card-2' : ''} ${isThird ? 'podium-card-3' : ''}`}
      style={{
        position: 'relative',
        minHeight: 430,
        borderRadius: 34,
        padding: isLeader ? '30px 22px 22px' : '22px 18px 18px',
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isLeader
          ? `0 38px 86px rgba(0,0,0,0.40), 0 0 54px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -10px 24px rgba(0,0,0,0.20)`
          : `0 22px 52px rgba(0,0,0,0.28), 0 0 24px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -8px 20px rgba(0,0,0,0.18)`,
      }}
    >
      <div className="podium-frame-outer" />
      <div className="podium-frame-inner" />
      <div className="podium-bottom-lip" />
      <div className="podium-top-highlight" />

      {isLeader ? <div className="podium-hero-breath" /> : null}
      {isSecond ? <div className="podium-breath-gold" /> : null}
      {isThird ? <div className="podium-breath-silver" /> : null}
      {isLeader ? <div className="podium-hero-outline" /> : null}

      {isLeader ? (
        <>
          <div className="leader-hero-spotlight" />
          <div className="leader-upward-ambient" />
        </>
      ) : null}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: isLeader ? 22 : 18,
          zIndex: 3,
        }}
      >
        <RankBadge rank={row.rank} />
        <MoveChip move={row.move} />
      </div>

      <div style={{ position: 'relative', zIndex: 3 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: isLeader ? 24 : 18,
          }}
        >
          <PlayerPhoto
            name={row.player}
            url={row.photo_url}
            rank={row.rank}
            size={isLeader ? 172 : 108}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            className={
              isLeader
                ? 'leader-name'
                : isSecond
                  ? 'metal-name-gold'
                  : isThird
                    ? 'metal-name-silver'
                    : ''
            }
            style={{
              fontSize: isLeader ? 38 : 27,
              fontWeight: isLeader ? 950 : 900,
              color: '#eef6ff',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              marginBottom: 14,
            }}
          >
            {row.player || '—'}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            {row.status ? (
              <div
                style={{
                  minHeight: 32,
                  padding: '0 12px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(220,232,255,0.82)',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {row.status}
              </div>
            ) : null}

            {row.flag_url ? (
              <div
                style={{
                  width: 32,
                  height: 22,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.16)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.14)',
                }}
              >
                <img
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
      </div>

      <div
        className="podium-platform"
        style={{
          position: 'relative',
          zIndex: 3,
          marginTop: 20,
          height: isLeader ? 90 : 64,
          borderRadius: 24,
          background: theme.baseBg,
          border: `1px solid ${theme.borderSoft}`,
          display: 'grid',
          placeItems: 'center',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -10px 16px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            fontSize: isLeader ? 14 : 13,
            fontWeight: 900,
            letterSpacing: isLeader ? '0.22em' : '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(220,232,255,0.72)',
            textShadow: isLeader ? '0 1px 0 rgba(255,255,255,0.16)' : 'none',
          }}
        >
          Rank {row.rank}
        </div>
      </div>
    </div>
  )
}

function LadderRow({ row }) {
  const theme = getRankTheme(row.rank)

  return (
    <div
      className="interactive-card ladder-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 16,
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 22,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.01), 0 12px 24px ${theme.glow}`,
      }}
    >
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
            marginBottom: 6,
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

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(220,232,255,0.62)',
          }}
        >
          {row.status || 'Active'}
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const res = await fetch(rankingUrl, { cache: 'no-store' })
        const data = await res.json()
        setRows(Array.isArray(data) ? sortRankings(data) : [])
      } catch (err) {
        console.error('Failed to load rankings:', err)
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const topThree = useMemo(() => rows.slice(0, 3), [rows])
  const middleTier = useMemo(() => rows.slice(3, 8), [rows])
  const fullLadder = useMemo(() => rows.slice(8), [rows])

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

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes heroBreath {
          0% { opacity: 0.40; transform: scale(0.995); }
          50% { opacity: 0.76; transform: scale(1.008); }
          100% { opacity: 0.40; transform: scale(0.995); }
        }

        @keyframes softGoldBreath {
          0% { opacity: 0.30; transform: scale(0.998); }
          50% { opacity: 0.52; transform: scale(1.004); }
          100% { opacity: 0.30; transform: scale(0.998); }
        }

        @keyframes softSilverBreath {
          0% { opacity: 0.28; transform: scale(0.998); }
          50% { opacity: 0.46; transform: scale(1.004); }
          100% { opacity: 0.28; transform: scale(0.998); }
        }

        @keyframes heroNameGlow {
          0% { text-shadow: 0 0 12px rgba(174,242,255,0.16), 0 0 26px rgba(174,242,255,0.10); }
          50% { text-shadow: 0 0 18px rgba(174,242,255,0.28), 0 0 38px rgba(174,242,255,0.14); }
          100% { text-shadow: 0 0 12px rgba(174,242,255,0.16), 0 0 26px rgba(174,242,255,0.10); }
        }

        @keyframes heroOutlineTrace {
          0% {
            opacity: 0.35;
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.00),
              0 0 0 rgba(174,242,255,0.00);
          }
          50% {
            opacity: 1;
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.82),
              0 0 28px rgba(174,242,255,0.20);
          }
          100% {
            opacity: 0.35;
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

        .fade-in { animation: fadeInUp 0.28s ease; }

        .interactive-card {
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .interactive-card:hover { transform: translateY(-2px); }

        .photo-hover:hover { transform: scale(1.015); }

        .leader-name { animation: heroNameGlow 2.8s ease-in-out infinite; }

        .metal-name-gold {
          text-shadow: 0 1px 0 rgba(255,255,255,0.10), 0 0 10px rgba(246,213,111,0.06);
        }

        .metal-name-silver {
          text-shadow: 0 1px 0 rgba(255,255,255,0.10), 0 0 10px rgba(221,230,240,0.06);
        }

        .rank-badge-2 { animation: softGoldBreath 3.6s ease-in-out infinite; }
        .rank-badge-3 { animation: softSilverBreath 3.6s ease-in-out infinite; }

        .rank-pill-top-sheen {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.38) 0%,
            rgba(255,255,255,0.14) 28%,
            rgba(255,255,255,0.00) 64%
          );
          pointer-events: none;
          z-index: 1;
        }

        .rank-pill-bottom-shadow {
          position: absolute;
          left: 14%;
          right: 14%;
          bottom: 6px;
          height: 1px;
          border-radius: 999px;
          background: rgba(0,0,0,0.16);
          pointer-events: none;
          z-index: 1;
        }

        .rank-pill-trace {
          position: absolute;
          inset: -1px;
          border-radius: 999px;
          border: 2px solid rgba(174,242,255,0.95);
          box-shadow: 0 0 16px rgba(174,242,255,0.20);
          pointer-events: none;
          animation: rankTrace 2.6s linear infinite;
          z-index: 2;
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
        .podium-breath-gold,
        .podium-breath-silver {
          position: absolute;
          inset: -8px;
          border-radius: 40px;
          filter: blur(18px);
          pointer-events: none;
        }

        .podium-hero-breath {
          background: radial-gradient(circle at center, rgba(174,242,255,0.18) 0%, rgba(174,242,255,0.00) 72%);
          animation: heroBreath 3.2s ease-in-out infinite;
        }

        .podium-breath-gold {
          background: radial-gradient(circle at center, rgba(246,213,111,0.10) 0%, rgba(246,213,111,0.00) 72%);
          animation: softGoldBreath 3.8s ease-in-out infinite;
        }

        .podium-breath-silver {
          background: radial-gradient(circle at center, rgba(221,230,240,0.09) 0%, rgba(221,230,240,0.00) 72%);
          animation: softSilverBreath 3.8s ease-in-out infinite;
        }

        .podium-hero-outline {
          position: absolute;
          inset: -1px;
          border-radius: 34px;
          pointer-events: none;
          animation: heroOutlineTrace 2.8s ease-in-out infinite;
        }

        .leader-hero-spotlight {
          position: absolute;
          left: 50%;
          top: 86px;
          transform: translateX(-50%);
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(174,242,255,0.12) 0%, rgba(174,242,255,0.00) 72%);
          filter: blur(18px);
          pointer-events: none;
        }

        .leader-upward-ambient {
          position: absolute;
          left: 14%;
          right: 14%;
          bottom: 110px;
          height: 140px;
          background: linear-gradient(180deg, rgba(174,242,255,0.00) 0%, rgba(174,242,255,0.08) 100%);
          filter: blur(26px);
          pointer-events: none;
        }

        .leader-photo-bloom {
          position: absolute;
          inset: -36px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(174,242,255,0.12) 0%, rgba(174,242,255,0.00) 70%);
          filter: blur(22px);
          pointer-events: none;
        }

        .leader-photo-outer-ring {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.46),
            inset 0 -12px 16px rgba(0,0,0,0.16),
            0 0 30px rgba(174,242,255,0.20);
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
          inset: -10px;
          border-radius: inherit;
          background: radial-gradient(circle at center, rgba(174,242,255,0.14) 0%, rgba(174,242,255,0.00) 74%);
          filter: blur(18px);
          pointer-events: none;
          animation: heroBreath 3s ease-in-out infinite;
        }

        .leader-photo-sheen {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.28) 0%,
            rgba(255,255,255,0.10) 18%,
            rgba(255,255,255,0.00) 36%
          );
          pointer-events: none;
        }

        .podium-platform::before {
          content: '';
          position: absolute;
          left: 14px;
          right: 14px;
          top: 0;
          height: 1px;
          background: rgba(255,255,255,0.18);
          border-radius: 999px;
        }

        .podium-platform::after {
          content: '';
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 10px;
          height: 12px;
          border-radius: 0 0 20px 20px;
          background: linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.18) 100%);
        }

        .section-transition {
          height: 1px;
          margin: 6px 0 2px;
          background:
            linear-gradient(
              90deg,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,0.08) 20%,
              rgba(174,242,255,0.12) 50%,
              rgba(255,255,255,0.08) 80%,
              rgba(255,255,255,0) 100%
            );
        }

        .ladder-row:hover {
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 18px 30px rgba(0,0,0,0.20) !important;
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

          .podium-card-1 { order: 1 !important; }
          .podium-card-2 { order: 2 !important; }
          .podium-card-3 { order: 3 !important; }
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
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: `
            radial-gradient(circle at top, #0b2447 0%, #07111f 40%, #02060d 100%),
            repeating-linear-gradient(
              135deg,
              rgba(255,255,255,0.012) 0px,
              rgba(255,255,255,0.012) 1px,
              transparent 1px,
              transparent 18px
            ),
            linear-gradient(
              180deg,
              rgba(255,255,255,0.02) 0%,
              rgba(255,255,255,0.00) 100%
            )
          `,
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
            background: `
              radial-gradient(circle at 20% 10%, rgba(174,242,255,0.05) 0%, transparent 30%),
              radial-gradient(circle at 80% 14%, rgba(255,255,255,0.035) 0%, transparent 24%),
              linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 48%, transparent 52%, transparent 100%)
            `,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -140,
              left: -90,
              width: 380,
              height: 380,
              borderRadius: '50%',
              background: 'rgba(56,189,248,0.10)',
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
              background: 'rgba(168,240,255,0.06)',
              filter: 'blur(84px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '8% 6%',
              borderRadius: 32,
              border: '1px solid rgba(255,255,255,0.02)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.01)',
            }}
          />
        </div>

        <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', zIndex: 1 }}>
          <div
            className="topbar fade-in"
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
            style={{
              height: 1,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(168,240,255,0.18) 22%, rgba(255,255,255,0.08) 50%, rgba(168,240,255,0.18) 78%, rgba(255,255,255,0) 100%)',
              marginBottom: 24,
            }}
          />

          <div
            className="stats-row fade-in"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 220px))',
              gap: 12,
              marginBottom: 30,
            }}
          >
            <SmallStat label="Leader" value={leader} />
            <SmallStat label="Biggest Move" value={biggestMove} />
          </div>

          <div style={{ display: 'grid', gap: 34 }}>
            <section className="fade-in">
              {loading ? (
                <div
                  className="podium-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
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
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 18,
                    alignItems: 'stretch',
                  }}
                >
                  {topThree[0] ? <PodiumCard row={topThree[0]} /> : <div />}
                  {topThree[1] ? <PodiumCard row={topThree[1]} /> : <div />}
                  {topThree[2] ? <PodiumCard row={topThree[2]} /> : <div />}
                </div>
              )}
            </section>

            <div className="section-transition" />

            <section className="fade-in">
              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : middleTier.length ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {middleTier.map((row, index) => (
                    <LadderRow key={`middle-${index}`} row={row} />
                  ))}
                </div>
              ) : null}
            </section>

            <section className="fade-in">
              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <LoadingCard key={i} />
                  ))}
                </div>
              ) : fullLadder.length ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {fullLadder.map((row, index) => (
                    <LadderRow key={`full-${index}`} row={row} />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </>
  )
              }
