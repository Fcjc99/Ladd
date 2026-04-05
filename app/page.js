
'use client'

import { useEffect, useMemo, useState } from 'react'

const sheetId =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ||
  '1j3VgKy9fBHTTECzmRIYFijMtUAW5A0XdPoSNwdUDWOg'

const rankingUrl = `https://opensheet.elk.sh/${sheetId}/LiveRankingFeed`
const challengeFeedUrl = `https://opensheet.elk.sh/${sheetId}/ChallengeFeed`

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

function getRankTheme(rank) {
  const n = Number(rank)

  if (n === 1) {
    return {
      accent: '#aef2ff',
      accentStrong: '#f5feff',
      border: 'rgba(174,242,255,0.64)',
      glow: 'rgba(174,242,255,0.34)',
      badgeBg:
        'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(222,250,255,1) 54%, rgba(152,234,255,1) 100%)',
      badgeColor: '#102444',
      cardBg:
        'linear-gradient(180deg, rgba(18,52,98,0.996) 0%, rgba(7,20,41,0.998) 100%)',
      platformBg:
        'linear-gradient(180deg, rgba(174,242,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
      rail:
        'linear-gradient(180deg, rgba(174,242,255,1) 0%, rgba(174,242,255,0.22) 100%)',
    }
  }

  if (n === 2) {
    return {
      accent: '#f6d56f',
      accentStrong: '#fff6cf',
      border: 'rgba(246,213,111,0.48)',
      glow: 'rgba(246,213,111,0.22)',
      badgeBg:
        'linear-gradient(180deg, rgba(255,252,240,1) 0%, rgba(250,229,151,1) 58%, rgba(219,171,53,1) 100%)',
      badgeColor: '#3b2a00',
      cardBg:
        'linear-gradient(180deg, rgba(54,41,15,0.992) 0%, rgba(24,18,8,0.998) 100%)',
      platformBg:
        'linear-gradient(180deg, rgba(246,213,111,0.14) 0%, rgba(255,255,255,0.03) 100%)',
      rail:
        'linear-gradient(180deg, rgba(246,213,111,0.94) 0%, rgba(246,213,111,0.18) 100%)',
    }
  }

  if (n === 3) {
    return {
      accent: '#dde6f0',
      accentStrong: '#fcfdff',
      border: 'rgba(221,230,240,0.44)',
      glow: 'rgba(221,230,240,0.18)',
      badgeBg:
        'linear-gradient(180deg, rgba(252,254,255,1) 0%, rgba(230,236,243,1) 58%, rgba(186,198,214,1) 100%)',
      badgeColor: '#263445',
      cardBg:
        'linear-gradient(180deg, rgba(33,40,54,0.992) 0%, rgba(15,19,28,0.998) 100%)',
      platformBg:
        'linear-gradient(180deg, rgba(221,230,240,0.11) 0%, rgba(255,255,255,0.03) 100%)',
      rail:
        'linear-gradient(180deg, rgba(221,230,240,0.92) 0%, rgba(221,230,240,0.18) 100%)',
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
      'linear-gradient(180deg, rgba(14,31,58,0.96) 0%, rgba(10,21,39,0.98) 100%)',
    platformBg:
      'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
    rail:
      'linear-gradient(180deg, rgba(184,201,230,0.55) 0%, rgba(184,201,230,0.10) 100%)',
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
          ? `0 16px 28px rgba(0,0,0,0.24), 0 0 28px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.84), inset 0 -12px 14px rgba(0,0,0,0.16)`
          : `0 12px 22px rgba(0,0,0,0.18), 0 0 16px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.46), inset 0 -8px 10px rgba(0,0,0,0.14)`,
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
          textShadow:
            isLeader
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
              ? `0 18px 40px rgba(0,0,0,0.30), 0 0 30px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.24)`
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

function PodiumCard({
  row,
  place,
  activeChallengesByPlayer,
  highlightedTarget,
  onHighlightTarget,
  targetMap,
}) {
  const rank = toNumber(row.rank)
  const theme = getRankTheme(rank)
  const isLeader = rank === 1
  const activeCount = activeChallengesByPlayer[normalizeUpper(row.player)] || 0
  const isHighlighted =
    highlightedTarget &&
    normalizeUpper(row.player) === normalizeUpper(highlightedTarget)

  const heightMap = {
    1: 500,
    2: 386,
    3: 368,
  }

  return (
    <div
      onMouseEnter={(e) => { onHighlightTarget(row.player || null); e.currentTarget.style.setProperty('--lift','-3px') }}
      onMouseLeave={(e) => { onHighlightTarget(null); e.currentTarget.style.setProperty('--mx','0px'); e.currentTarget.style.setProperty('--my','0px'); e.currentTarget.style.setProperty('--rotX','0deg'); e.currentTarget.style.setProperty('--rotY','0deg'); e.currentTarget.style.setProperty('--lift','0px') }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        e.currentTarget.style.setProperty('--mx', `${px * 20}px`)
        e.currentTarget.style.setProperty('--my', `${py * 20}px`)
        e.currentTarget.style.setProperty('--rotY', `${px * 6}deg`)
        e.currentTarget.style.setProperty('--rotX', `${py * -6}deg`)
      }}
      onTouchStart={(e) => { e.currentTarget.style.setProperty('--lift','-2px'); onHighlightTarget(row.player || null) }}
      onTouchMove={(e) => {
        const touch = e.touches[0]
        if (!touch) return
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (touch.clientX - rect.left) / rect.width - 0.5
        const py = (touch.clientY - rect.top) / rect.height - 0.5
        e.currentTarget.style.setProperty('--mx', `${px * 24}px`)
        e.currentTarget.style.setProperty('--my', `${py * 24}px`)
        e.currentTarget.style.setProperty('--rotY', `${px * 7}deg`)
        e.currentTarget.style.setProperty('--rotX', `${py * -7}deg`)
      }}
      onTouchEnd={(e) => { e.currentTarget.style.setProperty('--mx','0px'); e.currentTarget.style.setProperty('--my','0px'); e.currentTarget.style.setProperty('--rotX','0deg'); e.currentTarget.style.setProperty('--rotY','0deg'); e.currentTarget.style.setProperty('--lift','0px') }}
      className={`interactive-card fade-in podium-card ${isLeader ? 'podium-card-1' : ''} ${rank === 1 ? 'hover-rank-1' : rank === 2 ? 'hover-rank-2' : rank === 3 ? 'hover-rank-3' : rank >= 4 && rank <= 7 ? 'hover-rank-bronze' : 'hover-rank-basic'} podium-${place} ${activeCount ? 'active-outline-card' : ''} ${isHighlighted ? 'target-card-highlighted' : ''}`}
      style={{
        animationDelay: `${place === 1 ? 0.10 : place === 2 ? 0.22 : 0.34}s`,
        position: 'relative',
        minHeight: heightMap[place],
        transform: 'perspective(1400px) rotateX(var(--rotX, 0deg)) rotateY(var(--rotY, 0deg)) translateY(var(--lift, 0px))',
        transformStyle: 'preserve-3d',
        borderRadius: 34,
        padding: place === 1 ? '34px 22px 22px' : '24px 18px 18px',
        background: theme.cardBg,
        border: `1px solid ${activeCount ? 'rgba(255,132,132,0.34)' : theme.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isLeader
          ? `0 52px 112px rgba(0,0,0,0.48), 0 0 84px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -10px 24px rgba(0,0,0,0.20)`
          : `0 26px 58px rgba(0,0,0,0.30), 0 0 34px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -8px 20px rgba(0,0,0,0.18)`,
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

      <div className="podium-frame-outer -frame" />
      <div className="podium-frame-inner -frame" />
      <div className="podium-bottom-lip -frame" />
      <div className="podium-top-highlight -frame" />

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
        <div className="-badge"><div className="-badge"><RankBadge rank={row.rank} /></div></div>
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
            marginBottom: isLeader ? 34 : 22,
          }}
        >
          <div className="-photo"><PlayerPhoto
            name={row.player}
            url={row.photo_url}
            rank={row.rank}
            size={isLeader ? 206 : 116}
          /></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            className={`-name ${isLeader ? 'leader-name' : rank === 2 ? 'metal-name-gold' : rank === 3 ? 'metal-name-silver' : ''}`}
            style={{
              fontSize: isLeader ? 44 : 27,
              fontWeight: isLeader ? 950 : 900,
              color: '#eef6ff',
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              marginBottom: isLeader ? 18 : 12,
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
              marginBottom: 12,
            }}
          >
            {row.flag_url ? (
              <div
                style={{
                  width: 34,
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
          marginTop: 18,
          height: isLeader ? 98 : 66,
          borderRadius: 24,
          background: theme.platformBg,
          border: `1px solid ${theme.border}`,
          display: 'grid',
          placeItems: 'center',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -10px 16px rgba(0,0,0,0.18)',
        }}
      >
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
  highlightedTarget,
  onHighlightTarget,
  targetMap,
}) {
  const theme = getRankTheme(row.rank)
  const activeCount = activeChallengesByPlayer[normalizeUpper(row.player)] || 0
  const isHighlighted =
    highlightedTarget &&
    normalizeUpper(row.player) === normalizeUpper(highlightedTarget)

  return (
    <div
      onMouseEnter={(e) => { onHighlightTarget(row.player || null); e.currentTarget.style.setProperty('--lift','-2px') }}
      onMouseLeave={(e) => { onHighlightTarget(null); e.currentTarget.style.setProperty('--mx','0px'); e.currentTarget.style.setProperty('--my','0px'); e.currentTarget.style.setProperty('--rotX','0deg'); e.currentTarget.style.setProperty('--rotY','0deg'); e.currentTarget.style.setProperty('--lift','0px') }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        e.currentTarget.style.setProperty('--mx', `${px * 12}px`)
        e.currentTarget.style.setProperty('--my', `${py * 12}px`)
        e.currentTarget.style.setProperty('--rotY', `${px * 3}deg`)
        e.currentTarget.style.setProperty('--rotX', `${py * -3}deg`)
      }}
      onTouchStart={(e) => { onHighlightTarget(row.player || null); e.currentTarget.style.setProperty('--lift','-1px') }}
      onTouchMove={(e) => {
        const touch = e.touches[0]
        if (!touch) return
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (touch.clientX - rect.left) / rect.width - 0.5
        const py = (touch.clientY - rect.top) / rect.height - 0.5
        e.currentTarget.style.setProperty('--mx', `${px * 14}px`)
        e.currentTarget.style.setProperty('--my', `${py * 14}px`)
        e.currentTarget.style.setProperty('--rotY', `${px * 4}deg`)
        e.currentTarget.style.setProperty('--rotX', `${py * -4}deg`)
      }}
      onTouchEnd={(e) => { e.currentTarget.style.setProperty('--mx','0px'); e.currentTarget.style.setProperty('--my','0px'); e.currentTarget.style.setProperty('--rotX','0deg'); e.currentTarget.style.setProperty('--rotY','0deg'); e.currentTarget.style.setProperty('--lift','0px') }}
      className={`interactive-card fade-in ladder-row ${toNumber(row.rank) >= 4 && toNumber(row.rank) <= 7 ? 'hover-rank-bronze' : 'hover-rank-basic'} ${activeCount ? 'active-outline-card' : ''} ${isHighlighted ? 'target-card-highlighted' : ''}`}
      style={{
        animationDelay: `${Math.min(Number(row.rank) * 0.05, 0.82)}s`,
        transform: 'perspective(1200px) rotateX(var(--rotX, 0deg)) rotateY(var(--rotY, 0deg)) translateY(var(--lift, 0px))',
        transformStyle: 'preserve-3d',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 16,
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 22,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${activeCount ? 'rgba(255,132,132,0.26)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: activeCount
          ? '0 0 0 1px rgba(255,132,132,0.04), 0 12px 24px rgba(255,132,132,0.06)'
          : `0 0 0 1px rgba(255,255,255,0.01), 0 12px 24px ${theme.glow}`,
        position: 'relative',
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
        <div className="-photo"><PlayerPhoto
          name={row.player}
          url={row.photo_url}
          rank={row.rank}
          size={58}
        /></div>
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
            className="-name"
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
  const [challengeRows, setChallengeRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [highlightedTarget, setHighlightedTarget] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [rankingRes, challengeRes] = await Promise.all([
          fetch(rankingUrl, { cache: 'no-store' }),
          fetch(challengeFeedUrl, { cache: 'no-store' }),
        ])

        const rankingData = await rankingRes.json()
        const challengeData = await challengeRes.json()

        setRows(Array.isArray(rankingData) ? sortRankings(rankingData) : [])
        setChallengeRows(Array.isArray(challengeData) ? challengeData : [])
      } catch (err) {
        console.error('Failed to load rankings:', err)
        setRows([])
        setChallengeRows([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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

  const targetMap = useMemo(() => {
    const sorted = sortRankings(rows)
    const map = {}

    sorted.forEach((row, index) => {
      if (!row?.player) return
      map[normalizeUpper(row.player)] = sorted[index - 1]?.player || ''
    })

    return map
  }, [rows])

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
          0% { opacity: 0.46; transform: scale(0.99); }
          50% { opacity: 1; transform: scale(1.015); }
          100% { opacity: 0.46; transform: scale(0.99); }
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
            opacity: 0.38;
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.00),
              0 0 0 rgba(174,242,255,0.00);
          }
          50% {
            opacity: 1;
            box-shadow:
              0 0 0 1px rgba(174,242,255,0.86),
              0 0 40px rgba(174,242,255,0.28);
          }
          100% {
            opacity: 0.38;
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

        .fade-in {
          animation: cinematicFadeRise 0.85s cubic-bezier(.22,.8,.22,1) both;
        }

        .interactive-card {
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .interactive-card:hover { transform: none; }

        .photo-hover:hover { transform: none; }

        .leader-name {
          animation: heroNameGlow 3.2s ease-in-out infinite;
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
          background: radial-gradient(circle at center, rgba(174,242,255,0.26) 0%, rgba(174,242,255,0.00) 72%);
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
          top: 44px;
          left: 50%;
          transform: translateX(-50%);
          width: 470px;
          height: 370px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(174,242,255,0.24) 0%, rgba(174,242,255,0.00) 72%);
          filter: blur(34px);
          pointer-events: none;
        }

        .hero-ambient-rise {
          position: absolute;
          left: 8%;
          right: 8%;
          top: 10%;
          bottom: 22%;
          background: linear-gradient(180deg, rgba(174,242,255,0.10) 0%, rgba(174,242,255,0.00) 100%);
          filter: blur(30px);
          pointer-events: none;
        }

        .hero-crown-light {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 150px;
          height: 72px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(246,213,111,0.20) 0%, rgba(246,213,111,0.00) 72%);
          filter: blur(18px);
          pointer-events: none;
        }

        .hero-card-bloom {
          position: absolute;
          inset: -18px;
          border-radius: 40px;
          background: radial-gradient(circle at 50% 8%, rgba(174,242,255,0.12) 0%, rgba(174,242,255,0.00) 70%);
          filter: blur(24px);
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
            inset 0 1px 0 rgba(255,255,255,0.50),
            inset 0 -12px 16px rgba(0,0,0,0.16),
            0 0 44px rgba(174,242,255,0.28);
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
          inset: -12px;
          border-radius: inherit;
          background: radial-gradient(circle at center, rgba(174,242,255,0.22) 0%, rgba(174,242,255,0.00) 74%);
          filter: blur(20px);
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
          box-shadow: 0 0 26px rgba(255,132,132,0.12);
          pointer-events: none;
        }

        
        .target-card-highlighted {
          border-color: rgba(255,255,255,0.18) !important;
        }

        .hover-rank-1.target-card-highlighted {
          border-color: rgba(174,242,255,0.50) !important;
          box-shadow:
            0 0 0 1px rgba(174,242,255,0.24),
            0 0 34px rgba(174,242,255,0.34),
            0 0 70px rgba(174,242,255,0.20),
            inset 0 1px 0 rgba(255,255,255,0.18) !important;
        }

        .hover-rank-1.target-card-highlighted::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          pointer-events: none;
          background:
            radial-gradient(circle at 18% 16%, rgba(255,255,255,0.95) 0 1.5px, transparent 3px),
            radial-gradient(circle at 82% 22%, rgba(255,255,255,0.88) 0 1.5px, transparent 3px),
            radial-gradient(circle at 24% 78%, rgba(255,255,255,0.70) 0 1px, transparent 2.5px),
            linear-gradient(180deg, rgba(174,242,255,0.10), rgba(174,242,255,0.00));
          filter: drop-shadow(0 0 8px rgba(174,242,255,0.35));
        }

        .hover-rank-2.target-card-highlighted {
          border-color: rgba(246,213,111,0.44) !important;
          box-shadow:
            0 0 0 1px rgba(246,213,111,0.20),
            0 0 28px rgba(246,213,111,0.24),
            0 0 54px rgba(246,213,111,0.12),
            inset 0 1px 0 rgba(255,255,255,0.14) !important;
        }

        .hover-rank-3.target-card-highlighted {
          border-color: rgba(221,230,240,0.42) !important;
          box-shadow:
            0 0 0 1px rgba(221,230,240,0.18),
            0 0 26px rgba(221,230,240,0.22),
            0 0 50px rgba(221,230,240,0.12),
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


        .-frame {
          transform: translate3d(calc(var(--mx, 0px) * -0.18), calc(var(--my, 0px) * -0.18), 0);
          transition: transform 0.18s ease;
        }

        .-photo {
          transform: translate3d(calc(var(--mx, 0px) * 0.52), calc(var(--my, 0px) * 0.52), 18px);
          transition: transform 0.18s ease;
          will-change: transform;
        }

        .-badge {
          transform: translate3d(calc(var(--mx, 0px) * 0.62), calc(var(--my, 0px) * 0.62), 22px);
          transition: transform 0.18s ease;
          will-change: transform;
        }

        .-name {
          transform: translate3d(calc(var(--mx, 0px) * 0.26), calc(var(--my, 0px) * 0.26), 10px);
          transition: transform 0.18s ease;
          will-change: transform;
        }

        @media (max-width: 980px) {
          .podium-grid {
            grid-template-columns: 1fr !important;
          }

          .podium-1 { order: 1 !important; }
          .podium-2 { order: 2 !important; }
          .podium-3 { order: 3 !important; }

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
            min-height: 540px !important;
            padding-top: 38px !important;
            border-radius: 30px !important;
          }

          .podium-card-1 .leader-name {
            font-size: 46px !important;
          }

          .podium-card-1 .podium-platform {
            height: 104px !important;
          }

          .hero-spotlight-behind-photo {
            width: 420px !important;
            height: 360px !important;
            top: 18px !important;
            opacity: 1 !important;
            filter: blur(30px) !important;
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
            box-shadow: 0 0 0 1px rgba(174,242,255,0.18), 0 0 52px rgba(174,242,255,0.22) !important;
          }

          .active-challenge-outline {
            border-color: rgba(255,132,132,0.42) !important;
            box-shadow: 0 0 34px rgba(255,132,132,0.18) !important;
          }

          .rank-badge-1 {
            transform: scale(1.04);
          }

          .podium-card-1 {
            --mx: 0px;
            --my: 0px;
          }

          .podium-card-1 .-photo {
            transform: translate3d(calc(var(--mx, 0px) * 0.72), calc(var(--my, 0px) * 0.72), 24px) !important;
          }

          .podium-card-1 .-badge {
            transform: translate3d(calc(var(--mx, 0px) * 0.82), calc(var(--my, 0px) * 0.82), 30px) !important;
          }

          .podium-card-1 .-name {
            transform: translate3d(calc(var(--mx, 0px) * 0.34), calc(var(--my, 0px) * 0.34), 12px) !important;
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
            <SmallStat label="Leader" value={leader} />
            <SmallStat label="Biggest Move" value={biggestMove} />
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
                      place={2}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedTarget={highlightedTarget}
                      onHighlightTarget={setHighlightedTarget}
                      targetMap={targetMap}
                    />
                  ) : (
                    <div />
                  )}

                  {topThree[0] ? (
                    <PodiumCard
                      row={topThree[0]}
                      place={1}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedTarget={highlightedTarget}
                      onHighlightTarget={setHighlightedTarget}
                      targetMap={targetMap}
                    />
                  ) : (
                    <div />
                  )}

                  {topThree[2] ? (
                    <PodiumCard
                      row={topThree[2]}
                      place={3}
                      activeChallengesByPlayer={activeChallengesByPlayer}
                      highlightedTarget={highlightedTarget}
                      onHighlightTarget={setHighlightedTarget}
                      targetMap={targetMap}
                    />
                  ) : (
                    <div />
                  )}
                </div>
              )}
            </section>

            <div
              className="fade-in"
              style={{
                animationDelay: '0.40s',
                height: 1,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(174,242,255,0.10) 20%, rgba(255,255,255,0.06) 50%, rgba(246,213,111,0.08) 80%, rgba(255,255,255,0.00) 100%)',
              }}
            />

            <section
              className="fade-in"
              style={{
                animationDelay: '0.46s',
                position: 'relative',
                borderRadius: 28,
                padding: '6px 0',
                background:
                  'linear-gradient(180deg, rgba(246,213,111,0.025) 0%, rgba(255,255,255,0.00) 100%)',
              }}
            >
              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
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
                      highlightedTarget={highlightedTarget}
                      onHighlightTarget={setHighlightedTarget}
                      targetMap={targetMap}
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
                padding: '6px 0',
                background:
                  'linear-gradient(180deg, rgba(221,230,240,0.02) 0%, rgba(255,255,255,0.00) 100%)',
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
                      highlightedTarget={highlightedTarget}
                      onHighlightTarget={setHighlightedTarget}
                      targetMap={targetMap}
                    />
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
