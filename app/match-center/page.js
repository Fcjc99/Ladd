'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MetaBox, Pill, PlayerPhoto } from '../components/ui-kit'

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

const EMPTY_SET = { winner: '', loser: '' }

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeUpper(value) {
  return normalizeText(value).toUpperCase()
}

function isArchived(row) {
  const archived = normalizeUpper(row?.archived)
  return archived === 'YES' || archived === 'TRUE'
}

function isCompleted(row) {
  const status = normalizeUpper(row?.status)
  return status === 'COMPLETE' || status === 'COMPLETED' || status === 'CANCELLED'
}

function isActive(row) {
  if (!row) return false
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
      badgeBg: 'linear-gradient(135deg, #ffffff 0%, #e2f9ff 45%, #a3ebff 100%)',
      badgeColor: '#102444',
    }
  }

  if (n === 2) {
    return {
      accent: '#f6d56f',
      accentSoft: 'rgba(246,213,111,0.14)',
      accentBorder: 'rgba(246,213,111,0.28)',
      badgeBg: 'linear-gradient(135deg, #fff7d6 0%, #f4d566 58%, #ddb13d 100%)',
      badgeColor: '#3d2c00',
    }
  }

  if (n === 3) {
    return {
      accent: '#dde6f0',
      accentSoft: 'rgba(221,230,240,0.13)',
      accentBorder: 'rgba(221,230,240,0.26)',
      badgeBg: 'linear-gradient(135deg, #f5f8fc 0%, #dbe2ec 55%, #b7c4d6 100%)',
      badgeColor: '#253245',
    }
  }

  if (n >= 4 && n <= 7) {
    return {
      accent: '#d29667',
      accentSoft: 'rgba(210,150,103,0.14)',
      accentBorder: 'rgba(210,150,103,0.28)',
      badgeBg: 'linear-gradient(135deg, #f3d5bf 0%, #d29667 60%, #b56f42 100%)',
      badgeColor: '#3f1f0d',
    }
  }

  return {
    accent: '#b8c9e6',
    accentSoft: 'rgba(184,201,230,0.10)',
    accentBorder: 'rgba(184,201,230,0.18)',
    badgeBg: 'linear-gradient(135deg, #eff5ff 0%, #dbe7f7 100%)',
    badgeColor: '#182235',
  }
}

function safeDateValue(value) {
  if (!value) return null

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed

  const num = Number(value)
  if (!Number.isNaN(num) && num > 30000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + num)
    return excelEpoch
  }

  return null
}

function formatDate(value) {
  const d = safeDateValue(value)
  if (!d) return value || '-'
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function parseScore(scoreText) {
  const text = String(scoreText || '').trim()
  if (!text) return []

  const normalized = text.replace(/\s+/g, ' ').replace(/,/g, ' ').trim()
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

function getLoserName(row) {
  if (!row?.winner) return '-'
  return normalizeText(row.winner) === normalizeText(row.challenger)
    ? row.opponent
    : row.challenger
}

function sortActiveRows(rows) {
  return [...rows].sort((a, b) => {
    const da = safeDateValue(a.match_date || a.scheduled_date)
    const db = safeDateValue(b.match_date || b.scheduled_date)
    if (da && db) return da - db
    if (da) return -1
    if (db) return 1
    return 0
  })
}

function sortCompletedRows(rows) {
  return [...rows].sort((a, b) => {
    const da = safeDateValue(a.match_date || a.scheduled_date)
    const db = safeDateValue(b.match_date || b.scheduled_date)
    if (da && db) return db - da
    if (da) return -1
    if (db) return 1
    return 0
  })
}

function buildScoreFromSets(sets) {
  return sets
    .filter((set) => set.winner !== '' && set.loser !== '')
    .map((set) => `${set.winner}-${set.loser}`)
    .join(', ')
}

function sanitizeGameValue(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  const n = Math.max(0, Math.min(7, Number(digits)))
  return String(n)
}

function getDefaultScoreForm() {
  return {
    winner: '',
    sets: [{ ...EMPTY_SET }, { ...EMPTY_SET }, { ...EMPTY_SET }],
    useThirdSet: false,
  }
}

function matchesSearch(row, query) {
  const q = normalizeUpper(query)
  if (!q) return true

  const haystack = [
    row.challenge_id,
    row.challenger,
    row.opponent,
    row.winner,
    row.status,
    row.approval,
    row.score,
    formatDate(row.match_date),
    formatDate(row.scheduled_date),
  ]
    .map((v) => normalizeUpper(v))
    .join(' ')

  return haystack.includes(q)
}

function getLatestWinnerText(completedChallenges) {
  const latest = completedChallenges[0]
  if (!latest?.winner) return 'No result yet'
  return `${latest.winner} def. ${getLoserName(latest)}`
}

function getPlayerFormString(playerName, recentMatches) {
  const relevant = recentMatches
    .filter((row) => row.winner)
    .slice(0, 5)
    .map((row) => (normalizeUpper(row.winner) === normalizeUpper(playerName) ? 'W' : 'L'))

  return relevant.length ? relevant.join(' ') : '—'
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
  accent = 'rgba(91,171,255,0.12)',
  zIndex = 1,
}) {
  return (
    <section
      className="glass-section fade-in"
      style={{
        position: 'relative',
        zIndex,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.035) 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 30,
        padding: 24,
        boxShadow: `0 0 46px ${accent}, 0 16px 44px rgba(0,0,0,0.18)`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: accent,
          filter: 'blur(60px)',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 31,
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: 'rgba(220,232,255,0.58)',
                maxWidth: 720,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {right}
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </section>
  )
}

function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <div
      style={{
        position: 'relative',
        minWidth: 220,
        flex: 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(220,232,255,0.46)',
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        ⌕
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 46,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.04)',
          color: '#eef6ff',
          padding: '0 14px 0 38px',
          outline: 'none',
          fontSize: 14,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: 6,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
      }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="interactive-card"
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 12,
              border: active
                ? '1px solid rgba(174,242,255,0.22)'
                : '1px solid rgba(255,255,255,0.02)',
              background: active
                ? 'linear-gradient(180deg, rgba(174,242,255,0.14) 0%, rgba(174,242,255,0.07) 100%)'
                : 'transparent',
              color: active ? '#c9f7ff' : 'rgba(220,232,255,0.72)',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function RankChip({ rank }) {
  const theme = getRankTheme(rank)
  return (
    <div
      style={{
        minWidth: 28,
        height: 28,
        padding: '0 8px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.badgeBg,
        color: theme.badgeColor,
        fontSize: 12,
        fontWeight: 900,
        boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
      }}
    >
      #{rank}
    </div>
  )
}

function ScoreDisplayPro({ row }) {
  const sets = parseScore(row.score)
  const winnerIsChall = winnerIsChallenger(row)

  if (!sets.length) {
    return (
      <div className="completed-score-panel" style={{ display: 'flex', justifyContent: 'stretch', width: '100%' }}>
        <div
          style={{
            width: '100%',
            borderRadius: 20,
            padding: 16,
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
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            Final Score
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 850,
              color: '#eef6ff',
              textAlign: 'center',
            }}
          >
            {row.score || '-'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="completed-score-panel" style={{ display: 'flex', justifyContent: 'stretch', width: '100%' }}>
      <div
        style={{
          width: '100%',
          borderRadius: 20,
          padding: 16,
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
            marginBottom: 14,
            textAlign: 'center',
          }}
        >
          Final Score
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {sets.map((set, index) => {
            const winnerScore = winnerIsChall ? set.a : set.b
            const loserScore = winnerIsChall ? set.b : set.a

            return (
              <div
                key={index}
                style={{
                  borderRadius: 16,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(220,232,255,0.52)',
                    }}
                  >
                    Set {index + 1}
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 21,
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
                      fontSize: 21,
                      fontWeight: 900,
                      color: '#eef6ff',
                      minWidth: 18,
                      textAlign: 'center',
                    }}
                  >
                    {loserScore}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ActiveLiveDot() {
  return (
    <span
      className="pulse-dot"
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#9eefff',
        boxShadow: '0 0 14px rgba(158,239,255,0.85)',
        display: 'inline-block',
      }}
    />
  )
}

function ActiveMatchCard({
  row,
  onClick,
  onCancel,
  cancelling,
  getPlayerPhotoUrl,
  onPlayerClick,
}) {
  const challengerRank = row.challenger_rank || rankByName(row.challenger)
  const opponentRank = row.opponent_rank || rankByName(row.opponent)
  const challengerTheme = getRankTheme(challengerRank)
  const opponentTheme = getRankTheme(opponentRank)

  return (
    <div
      className="interactive-card active-card fade-in"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,48,88,0.97) 0%, rgba(11,28,54,0.98) 100%)',
        border: '1px solid rgba(91,171,255,0.24)',
        borderRadius: 28,
        padding: 20,
        boxShadow: '0 12px 32px rgba(0,0,0,0.20), 0 0 22px rgba(56,189,248,0.06)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(174,242,255,0.03) 0%, rgba(255,255,255,0.00) 30%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="active-match-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 18,
          alignItems: 'center',
          marginBottom: 18,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            minWidth: 0,
          }}
        >
          <PlayerPhoto
            name={row.challenger}
            photoUrl={getPlayerPhotoUrl(row.challenger)}
            size={76}
            borderColor={challengerTheme.accentBorder}
            onClick={(e) => {
              e.stopPropagation()
              onPlayerClick(row.challenger)
            }}
          />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(220,232,255,0.52)',
                marginBottom: 8,
              }}
            >
              Challenger
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#eef6ff',
                  lineHeight: 1.05,
                  wordBreak: 'break-word',
                }}
              >
                {row.challenger}
              </div>
              <RankChip rank={challengerRank} />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            justifyItems: 'center',
            alignItems: 'center',
            gap: 10,
            minWidth: 110,
          }}
        >
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              border: '1px solid rgba(255,255,255,0.10)',
              background:
                'radial-gradient(circle at center, rgba(174,242,255,0.12) 0%, rgba(255,255,255,0.03) 68%, rgba(255,255,255,0.02) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(220,232,255,0.72)',
              }}
            >
              VS
            </div>
          </div>

          <div
            style={{
              width: 90,
              height: 1,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(174,242,255,0.25) 50%, rgba(255,255,255,0.00) 100%)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            justifyContent: 'flex-end',
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0, textAlign: 'right' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(220,232,255,0.52)',
                marginBottom: 8,
              }}
            >
              Opponent
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                marginBottom: 6,
              }}
            >
              <RankChip rank={opponentRank} />
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#eef6ff',
                  lineHeight: 1.05,
                  wordBreak: 'break-word',
                }}
              >
                {row.opponent}
              </div>
            </div>
          </div>

          <PlayerPhoto
            name={row.opponent}
            photoUrl={getPlayerPhotoUrl(row.opponent)}
            size={76}
            borderColor={opponentTheme.accentBorder}
            onClick={(e) => {
              e.stopPropagation()
              onPlayerClick(row.opponent)
            }}
          />
        </div>
      </div>

      <div
        className="active-meta-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Pill
            accent="#bdefff"
            background="rgba(174,242,255,0.10)"
            borderColor="rgba(174,242,255,0.18)"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ActiveLiveDot />
              {row.status || 'Active'}
            </span>
          </Pill>

          {row.approval ? <Pill muted>Approval: {row.approval}</Pill> : null}

          <Pill muted>📅 {formatDate(row.match_date || row.scheduled_date) || '-'}</Pill>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="interactive-card"
            style={{
              minHeight: 48,
              padding: '0 18px',
              borderRadius: 14,
              border: '1px solid rgba(174,242,255,0.24)',
              background:
                'linear-gradient(180deg, rgba(174,242,255,0.16) 0%, rgba(174,242,255,0.07) 100%)',
              color: '#c9f7ff',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 12px 28px rgba(0,0,0,0.18), 0 0 18px rgba(174,242,255,0.08)',
              whiteSpace: 'nowrap',
            }}
          >
            Enter Result
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
            disabled={cancelling}
            className="interactive-card"
            style={{
              minHeight: 48,
              padding: '0 18px',
              borderRadius: 14,
              border: '1px solid rgba(255,132,132,0.22)',
              background:
                'linear-gradient(180deg, rgba(92,38,38,0.92) 0%, rgba(48,20,20,0.98) 100%)',
              color: '#ffd8d8',
              fontSize: 14,
              fontWeight: 900,
              cursor: cancelling ? 'not-allowed' : 'pointer',
              opacity: cancelling ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Challenge'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CompletedMatchCard({ row, getPlayerPhotoUrl, onPlayerClick }) {
  const winnerName = row.winner || '-'
  const loserName = getLoserName(row)
  const winnerRank = rankByName(winnerName)
  const winnerTheme = getRankTheme(winnerRank)

  return (
    <div
      className="interactive-card completed-card fade-in"
      style={{
        background:
          'linear-gradient(180deg, rgba(14,26,47,0.94) 0%, rgba(10,20,36,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 18,
        boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
      }}
    >
      <div
        className="completed-card-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '178px minmax(250px, 1fr) 300px',
          gap: 22,
          alignItems: 'center',
        }}
      >
        <div
          className="completed-photo-wrap"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <PlayerPhoto
            name={winnerName}
            photoUrl={getPlayerPhotoUrl(winnerName)}
            size={142}
            borderColor={winnerTheme.accentBorder}
            onClick={() => onPlayerClick(winnerName)}
          />
        </div>

        <div
          className="completed-text-wrap"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            minHeight: 142,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontSize: 33,
                fontWeight: 900,
                color: '#eef6ff',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
              }}
            >
              {winnerName}
            </div>
            <RankChip rank={winnerRank} />
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(190,220,255,0.70)',
              marginBottom: 8,
            }}
          >
            Defeats
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 840,
              color: '#dce8ff',
              lineHeight: 1.04,
              marginBottom: 14,
              letterSpacing: '-0.02em',
            }}
          >
            {loserName || '-'}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Pill accent="#bdefff">Completed</Pill>
            <Pill muted>📅 {formatDate(row.match_date || row.scheduled_date) || '-'}</Pill>
          </div>
        </div>

        <ScoreDisplayPro row={row} />
      </div>
    </div>
  )
}

function EmptyState({ title, subtitle }) {
  return (
    <div
      className="fade-in"
      style={{
        borderRadius: 22,
        padding: 26,
        background: 'rgba(17,40,74,0.68)',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          margin: '0 auto 14px',
          borderRadius: 18,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          fontSize: 24,
        }}
      >
        🎾
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 850,
          color: '#eef6ff',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 15,
          color: 'rgba(220,232,255,0.70)',
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}

function ChallengeSkeleton() {
  return (
    <div
      className="skeleton-card"
      style={{
        borderRadius: 24,
        padding: 18,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton-line" style={{ width: '72%', height: 18, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton-pill" />
            <div className="skeleton-pill" />
            <div className="skeleton-pill" />
          </div>
        </div>
        <div className="skeleton-pill" style={{ width: 150 }} />
      </div>
      <div className="skeleton-line" style={{ width: '38%', height: 16 }} />
    </div>
  )
}

function CompletedSkeleton() {
  return (
    <div
      className="skeleton-card"
      style={{
        borderRadius: 24,
        padding: 18,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '190px minmax(260px, 1fr) 320px',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div
          className="skeleton-block"
          style={{
            width: 150,
            height: 150,
            borderRadius: 32,
            margin: '0 auto',
          }}
        />
        <div>
          <div className="skeleton-line" style={{ width: '52%', height: 24, margin: '0 auto 10px' }} />
          <div className="skeleton-line" style={{ width: '28%', height: 12, margin: '0 auto 10px' }} />
          <div className="skeleton-line" style={{ width: '42%', height: 22, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <div className="skeleton-pill" style={{ width: 100 }} />
            <div className="skeleton-pill" style={{ width: 160 }} />
          </div>
        </div>
        <div
          className="skeleton-block"
          style={{
            width: '100%',
            height: 120,
            borderRadius: 20,
          }}
        />
      </div>
    </div>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 1100,
        minWidth: 260,
        maxWidth: 360,
        borderRadius: 18,
        padding: '14px 16px',
        background: isSuccess
          ? 'linear-gradient(180deg, rgba(16,72,56,0.96) 0%, rgba(9,43,34,0.98) 100%)'
          : 'linear-gradient(180deg, rgba(89,25,25,0.96) 0%, rgba(53,14,14,0.98) 100%)',
        border: isSuccess
          ? '1px solid rgba(110,255,190,0.24)'
          : '1px solid rgba(255,132,132,0.24)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.26)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 6,
          color: isSuccess ? '#aef2cf' : '#ffb6b6',
        }}
      >
        {isSuccess ? 'Success' : 'Error'}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#eef6ff',
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </div>
    </div>
  )
}

function PlayerPicker({
  label,
  value,
  onChange,
  players,
  getPlayerPhotoUrl,
  excludeName,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const selected = players.find((p) => p.name === value)

  const visiblePlayers = players.filter((p) => {
    if (excludeName && p.name === excludeName) return false
    if (!query.trim()) return true
    return p.name.toLowerCase().includes(query.trim().toLowerCase())
  })

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: open ? 5000 : 1 }}>
      <label style={labelStyle}>{label}</label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="interactive-card"
        style={{
          width: '100%',
          minHeight: 58,
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '10px 14px',
          background: 'rgba(243,244,246,0.96)',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <PlayerPhoto
              name={selected.name}
              photoUrl={getPlayerPhotoUrl(selected.name)}
              size={38}
              borderColor="rgba(0,0,0,0.08)"
            />
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#111827',
                }}
              >
                {selected.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#4b5563',
                  marginTop: 2,
                }}
              >
                Rank #{selected.rank}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 16,
              color: '#6b7280',
            }}
          >
            Select {label.toLowerCase()}
          </div>
        )}

        <div
          style={{
            fontSize: 18,
            color: '#4b5563',
            lineHeight: 1,
          }}
        >
          ▾
        </div>
      </button>

      {open ? (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 6000,
            borderRadius: 18,
            background:
              'linear-gradient(180deg, rgba(15,34,63,0.98) 0%, rgba(10,23,43,0.99) 100%)',
            border: '1px solid rgba(91,171,255,0.22)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.30)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player"
              style={{
                width: '100%',
                height: 42,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                padding: '0 12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              maxHeight: 280,
              overflowY: 'auto',
              padding: 8,
              display: 'grid',
              gap: 6,
            }}
          >
            {visiblePlayers.length === 0 ? (
              <div
                style={{
                  padding: 14,
                  color: 'rgba(220,232,255,0.68)',
                  fontSize: 14,
                }}
              >
                No players found.
              </div>
            ) : (
              visiblePlayers.map((player) => (
                <button
                  key={player.name}
                  type="button"
                  onClick={() => {
                    onChange(player.name)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="interactive-card"
                  style={{
                    width: '100%',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 14,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <PlayerPhoto
                    name={player.name}
                    photoUrl={getPlayerPhotoUrl(player.name)}
                    size={40}
                    borderColor="rgba(255,255,255,0.14)"
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#eef6ff',
                      }}
                    >
                      {player.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'rgba(220,232,255,0.62)',
                        marginTop: 2,
                      }}
                    >
                      Rank #{player.rank}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ScoreSetInput({ label, setData, onChange, disabled = false }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        opacity: disabled ? 0.55 : 1,
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
        {label}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          value={setData.winner}
          onChange={(e) => onChange('winner', sanitizeGameValue(e.target.value))}
          disabled={disabled}
          placeholder="W"
          style={scoreInputStyle}
        />

        <div
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: 'rgba(220,232,255,0.70)',
          }}
        >
          -
        </div>

        <input
          type="text"
          inputMode="numeric"
          value={setData.loser}
          onChange={(e) => onChange('loser', sanitizeGameValue(e.target.value))}
          disabled={disabled}
          placeholder="L"
          style={scoreInputStyle}
        />
      </div>
    </div>
  )
}

function ScorePresetButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="interactive-card"
      style={{
        minHeight: 40,
        padding: '0 12px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
        color: '#dce8ff',
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function ScorePreviewCard({ match, winner, score, getPlayerPhotoUrl }) {
  if (!match || !winner) return null

  const previewRow = {
    challenger: match.challenger,
    opponent: match.opponent,
    winner,
    score,
    match_date: match.match_date || match.scheduled_date,
  }

  return (
    <div
      style={{
        borderRadius: 22,
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
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
        }}
      >
        Live Preview
      </div>

      <CompletedMatchCard
        row={previewRow}
        getPlayerPhotoUrl={getPlayerPhotoUrl}
        onPlayerClick={() => {}}
      />
    </div>
  )
}

function PlayerProfileDrawer({
  playerName,
  profile,
  stats,
  recentMatches,
  onClose,
}) {
  if (!playerName) return null

  const rank = rankByName(playerName)
  const theme = getRankTheme(rank)
  const formString = getPlayerFormString(playerName, recentMatches)

  return (
    <div
      className="profile-drawer-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.54)',
        zIndex: 1200,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
    >
      <div
        className="profile-drawer-panel fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 430,
          height: '100%',
          overflowY: 'auto',
          background:
            'linear-gradient(180deg, rgba(10,23,43,0.98) 0%, rgba(7,17,32,0.99) 100%)',
          borderLeft: '1px solid rgba(174,242,255,0.16)',
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
            Player Profile
          </div>

          <button
            type="button"
            onClick={onClose}
            className="interactive-card"
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
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -20,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: theme.accentSoft,
              filter: 'blur(46px)',
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              marginBottom: 16,
              position: 'relative',
            }}
          >
            <PlayerPhoto
              name={playerName}
              photoUrl={profile?.photo_url || ''}
              size={96}
              borderColor={theme.accentBorder}
            />

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#eef6ff',
                  lineHeight: 1.02,
                  marginBottom: 8,
                }}
              >
                {playerName}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <RankChip rank={rank} />
                <Pill muted>Form: {formString}</Pill>
              </div>
            </div>
          </div>

          <div
            className="hero-stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
              position: 'relative',
            }}
          >
            <MetaBox label="Current Rank" value={`#${rank}`} />
            <MetaBox label="Wins" value={String(stats.wins)} />
            <MetaBox label="Active" value={String(stats.active)} />
            <MetaBox label="Completed" value={String(stats.completed)} />
          </div>
        </div>

        <div
          style={{
            borderRadius: 22,
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
              color: 'rgba(220,232,255,0.60)',
              marginBottom: 14,
            }}
          >
            Recent Match History
          </div>

          {recentMatches.length === 0 ? (
            <div
              style={{
                fontSize: 14,
                color: 'rgba(220,232,255,0.70)',
              }}
            >
              No recent matches found.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentMatches.map((row, index) => {
                const isWinner = normalizeText(row.winner) === normalizeText(playerName)
                const opponent =
                  normalizeText(row.challenger) === normalizeText(playerName)
                    ? row.opponent
                    : row.challenger

                return (
                  <div
                    key={`${playerName}-${index}`}
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
                        marginBottom: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Pill
                          accent={isWinner ? '#bff7d2' : '#ffd0d0'}
                          background={
                            isWinner
                              ? 'rgba(110,255,190,0.10)'
                              : 'rgba(255,132,132,0.10)'
                          }
                          borderColor={
                            isWinner
                              ? 'rgba(110,255,190,0.20)'
                              : 'rgba(255,132,132,0.20)'
                          }
                        >
                          {isWinner ? 'Win' : 'Loss'}
                        </Pill>
                        <Pill muted>vs {opponent}</Pill>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: 'rgba(220,232,255,0.56)',
                        }}
                      >
                        {formatDate(row.match_date || row.scheduled_date)}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#eef6ff',
                      }}
                    >
                      {row.score || '-'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(220,232,255,0.60)',
  marginBottom: 10,
}

const inputStyle = {
  width: '100%',
  height: 52,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(243,244,246,0.96)',
  color: '#111827',
  padding: '0 14px',
  outline: 'none',
  fontSize: 15,
  boxSizing: 'border-box',
}

const buttonStyle = {
  minHeight: 52,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(174,242,255,0.24)',
  background:
    'linear-gradient(180deg, rgba(174,242,255,0.16) 0%, rgba(174,242,255,0.07) 100%)',
  color: '#c9f7ff',
  fontSize: 15,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 12px 28px rgba(0,0,0,0.18), 0 0 18px rgba(174,242,255,0.08)',
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.62)',
  zIndex: 1000,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)',
}

const scoreInputStyle = {
  width: '100%',
  height: 46,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(243,244,246,0.96)',
  color: '#111827',
  padding: '0 12px',
  outline: 'none',
  fontSize: 18,
  fontWeight: 800,
  textAlign: 'center',
  boxSizing: 'border-box',
}

export default function MatchCenterPage() {
  const [feedRows, setFeedRows] = useState([])
  const [rankingRows, setRankingRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [challengeForm, setChallengeForm] = useState({
    challenger: '',
    challenger_rank: '',
    opponent: '',
    opponent_rank: '',
    match_date: '',
  })

  const [submittingChallenge, setSubmittingChallenge] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [resultForm, setResultForm] = useState(getDefaultScoreForm())
  const [submittingResult, setSubmittingResult] = useState(false)
  const [cancellingChallengeId, setCancellingChallengeId] = useState(null)

  const [activeQuery, setActiveQuery] = useState('')
  const [completedQuery, setCompletedQuery] = useState('')
  const [activeView, setActiveView] = useState('all')
  const [completedView, setCompletedView] = useState('all')

  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

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
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function getPlayerPhotoUrl(playerName) {
    const row = rankingRows.find((item) => normalizeUpper(item.player) === normalizeUpper(playerName))
    return row?.photo_url || ''
  }

  const activeChallenges = useMemo(
    () => sortActiveRows(feedRows.filter(isActive)),
    [feedRows]
  )

  const completedChallenges = useMemo(
    () =>
      sortCompletedRows(
        feedRows
          .filter((row) => isArchived(row) || isCompleted(row))
          .filter((row) => row.winner || row.score)
      ),
    [feedRows]
  )

  const filteredActiveChallenges = useMemo(() => {
    return activeChallenges.filter((row) => {
      if (!matchesSearch(row, activeQuery)) return false
      if (activeView === 'scheduled') return Boolean(normalizeText(row.match_date || row.scheduled_date))
      if (activeView === 'pending') return normalizeUpper(row.approval || row.status) === 'PENDING'
      return true
    })
  }, [activeChallenges, activeQuery, activeView])

  const filteredCompletedChallenges = useMemo(() => {
    const base = completedChallenges.filter((row) => matchesSearch(row, completedQuery))
    if (completedView === 'recent') return base.slice(0, 5)
    return base
  }, [completedChallenges, completedQuery, completedView])

  const latestCompletedSummary = useMemo(
    () => getLatestWinnerText(completedChallenges),
    [completedChallenges]
  )

  const playerStatsMap = useMemo(() => {
    const map = {}
    PLAYERS.forEach((p) => {
      map[p.name] = { wins: 0, active: 0, completed: 0 }
    })

    feedRows.forEach((row) => {
      const challenger = row.challenger
      const opponent = row.opponent

      if (challenger && !map[challenger]) map[challenger] = { wins: 0, active: 0, completed: 0 }
      if (opponent && !map[opponent]) map[opponent] = { wins: 0, active: 0, completed: 0 }

      if (isActive(row)) {
        if (challenger) map[challenger].active += 1
        if (opponent) map[opponent].active += 1
      }

      if (row.winner) {
        if (row.winner && map[row.winner]) map[row.winner].wins += 1
        if (challenger) map[challenger].completed += 1
        if (opponent) map[opponent].completed += 1
      }
    })

    return map
  }, [feedRows])

  const selectedPlayerProfile = useMemo(() => {
    if (!selectedPlayer) return null
    return rankingRows.find((row) => normalizeUpper(row.player) === normalizeUpper(selectedPlayer)) || null
  }, [rankingRows, selectedPlayer])

  const selectedPlayerRecentMatches = useMemo(() => {
    if (!selectedPlayer) return []
    return completedChallenges.filter(
      (row) =>
        normalizeUpper(row.challenger) === normalizeUpper(selectedPlayer) ||
        normalizeUpper(row.opponent) === normalizeUpper(selectedPlayer)
    )
  }, [completedChallenges, selectedPlayer])

  const builtScore = useMemo(() => buildScoreFromSets(resultForm.sets), [resultForm.sets])

  async function handleChallengeSubmit(e) {
    e.preventDefault()
    setSubmittingChallenge(true)

    try {
      if (!challengeForm.challenger || !challengeForm.opponent) {
        throw new Error('Please select both challenger and opponent')
      }

      if (challengeForm.challenger === challengeForm.opponent) {
        throw new Error('Challenger and opponent must be different')
      }

      const payload = {
        action: 'submit_challenge',
        challenge_id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `challenge-${Date.now()}`,
        challenger: challengeForm.challenger,
        challenger_rank: challengeForm.challenger_rank,
        opponent: challengeForm.opponent,
        opponent_rank: challengeForm.opponent_rank,
        scheduled_date: challengeForm.match_date,
        match_date: challengeForm.match_date,
        approval: 'PENDING',
        status: 'ACTIVE',
        winner: '',
        score: '',
        active: 'YES',
        archived: 'NO',
        notes: '',
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

      setChallengeForm({
        challenger: '',
        challenger_rank: '',
        opponent: '',
        opponent_rank: '',
        match_date: '',
      })

      showToast('Challenge submitted successfully', 'success')
      setTimeout(() => {
        loadData()
      }, 250)
    } catch (err) {
      console.error('Challenge submit failed:', err)
      showToast(err.message || 'Challenge submit failed', 'error')
    } finally {
      setSubmittingChallenge(false)
    }
  }

  async function handleResultSubmit(e) {
    e.preventDefault()
    if (!selectedMatch) return

    setSubmittingResult(true)

    try {
      if (!selectedMatch.challenge_id) {
        throw new Error('Missing challenge_id from ChallengeFeed')
      }

      if (!resultForm.winner) {
        throw new Error('Please select winner')
      }

      if (!resultForm.sets[0].winner || !resultForm.sets[0].loser) {
        throw new Error('Please enter Set 1')
      }

      if (!resultForm.sets[1].winner || !resultForm.sets[1].loser) {
        throw new Error('Please enter Set 2')
      }

      if (resultForm.useThirdSet) {
        if (!resultForm.sets[2].winner || !resultForm.sets[2].loser) {
          throw new Error('Please complete Set 3 or turn it off')
        }
      }

      const score = builtScore
      if (!score) {
        throw new Error('Please enter a valid score')
      }

      const payload = {
        action: 'update_challenge_result',
        challenge_id: String(selectedMatch.challenge_id),
        winner: resultForm.winner,
        score,
        status: 'COMPLETE',
        active: 'NO',
        archived: 'YES',
        match_date: selectedMatch.match_date || selectedMatch.scheduled_date || '',
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || data.raw || 'Failed to submit result')
      }

      setSelectedMatch(null)
      setResultForm(getDefaultScoreForm())

      showToast('Match result saved successfully', 'success')

      setTimeout(() => {
        loadData()
      }, 300)
    } catch (err) {
      console.error('Result submit failed:', err)
      showToast(err.message || 'Failed to submit result', 'error')
    } finally {
      setSubmittingResult(false)
    }
  }

  async function handleCancelChallenge(row) {
    try {
      if (!row?.challenge_id) {
        throw new Error('Missing challenge_id from ChallengeFeed')
      }

      const confirmed = window.confirm(
        `Cancel the active challenge:\n\n${row.challenger} vs ${row.opponent}?`
      )

      if (!confirmed) return

      setCancellingChallengeId(String(row.challenge_id))

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_challenge',
          challenge_id: String(row.challenge_id),
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || data.raw || 'Failed to cancel challenge')
      }

      if (selectedMatch && String(selectedMatch.challenge_id) === String(row.challenge_id)) {
        setSelectedMatch(null)
        setResultForm(getDefaultScoreForm())
      }

      showToast('Challenge cancelled successfully', 'success')

      setTimeout(() => {
        loadData()
      }, 250)
    } catch (err) {
      console.error('Cancel challenge failed:', err)
      showToast(err.message || 'Failed to cancel challenge', 'error')
    } finally {
      setCancellingChallengeId(null)
    }
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeRise {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes modalFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes modalScale {
          0% { opacity: 0; transform: translateY(12px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes drawerSlide {
          0% { opacity: 0; transform: translateX(24px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulseDot {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }

        .fade-in {
          animation: fadeRise 0.55s ease both;
        }

        .interactive-card {
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .interactive-card:hover {
          transform: translateY(-1px);
        }

        .skeleton-card,
        .skeleton-line,
        .skeleton-pill,
        .skeleton-block {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.05) 0%,
            rgba(255,255,255,0.10) 50%,
            rgba(255,255,255,0.05) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.25s linear infinite;
        }

        .skeleton-line {
          border-radius: 999px;
        }

        .skeleton-pill {
          width: 88px;
          height: 34px;
          border-radius: 999px;
        }

        .modal-overlay-anim {
          animation: modalFade 0.18s ease;
        }

        .modal-card-anim {
          animation: modalScale 0.2s ease;
        }

        .profile-drawer-panel {
          animation: drawerSlide 0.22s ease;
        }

        .pulse-dot {
          animation: pulseDot 1.8s ease-in-out infinite;
        }

        @media (max-width: 980px) {
          .completed-card-layout {
            grid-template-columns: 1fr !important;
            justify-items: center;
          }

          .completed-photo-wrap,
          .completed-text-wrap,
          .completed-score-panel {
            width: 100%;
          }

          .completed-text-wrap {
            text-align: center !important;
            align-items: center !important;
          }
        }

        @media (max-width: 860px) {
          .active-match-layout {
            grid-template-columns: 1fr !important;
            justify-items: center;
            gap: 16px !important;
          }

          .active-meta-row {
            justify-content: center !important;
          }

          .score-entry-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 700px) {
          .match-center-title {
            font-size: 34px !important;
          }

          .profile-drawer-panel {
            max-width: 100% !important;
          }

          .toolbar-stack {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .hero-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Toast toast={toast} />

      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top, #0b2447 0%, #07111f 40%, #02060d 100%)',
          color: 'white',
          padding: '32px 16px 60px',
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
              top: -120,
              left: -80,
              width: 360,
              height: 360,
              borderRadius: '50%',
              background: 'rgba(56,189,248,0.12)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 180,
              right: -90,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(168,240,255,0.08)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', zIndex: 1 }}>
          <div
            className="fade-in"
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
                  fontSize: 52,
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  margin: 0,
                  lineHeight: 0.94,
                }}
              >
                Match Center
              </h1>
            </div>

            <a
              href="/"
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
              Live Rankings →
            </a>
          </div>

          <div
            style={{
              height: 1,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(168,240,255,0.18) 22%, rgba(255,255,255,0.08) 50%, rgba(168,240,255,0.18) 78%, rgba(255,255,255,0) 100%)',
              marginBottom: 26,
            }}
          />

          <div
            className="hero-stats-grid fade-in"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.35fr 1fr',
              gap: 16,
              marginBottom: 26,
            }}
          >
            <div
              style={{
                borderRadius: 28,
                padding: 22,
                background:
                  'linear-gradient(180deg, rgba(18,42,78,0.86) 0%, rgba(10,22,41,0.92) 100%)',
                border: '1px solid rgba(168,240,255,0.12)',
                boxShadow: '0 18px 44px rgba(0,0,0,0.18), 0 0 36px rgba(56,189,248,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(174,242,255,0.74)',
                  marginBottom: 10,
                }}
              >
                Center Court Overview
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  color: '#eef6ff',
                  marginBottom: 10,
                  letterSpacing: '-0.03em',
                }}
              >
                Active challenges: {activeChallenges.length}
              </div>

              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: 'rgba(220,232,255,0.72)',
                }}
              >
                Submit challenges, enter results, and cancel active matchups if someone accidentally entered the wrong players.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              <MetaBox label="Players" value={String(PLAYERS.length)} />
              <MetaBox label="Active" value={String(activeChallenges.length)} />
              <MetaBox label="Completed" value={String(completedChallenges.length)} />
              <MetaBox label="Latest Winner" value={completedChallenges[0]?.winner || '—'} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 24 }}>
            <SectionCard
              title="Submit Challenge"
              subtitle="Create a new ladder challenge matchup."
              accent="rgba(174,242,255,0.08)"
              zIndex={12}
            >
              <form onSubmit={handleChallengeSubmit}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <PlayerPicker
                    label="Challenger"
                    value={challengeForm.challenger}
                    onChange={(value) => {
                      const player = PLAYERS.find((p) => p.name === value)
                      setChallengeForm((prev) => ({
                        ...prev,
                        challenger: value,
                        challenger_rank: player ? String(player.rank) : '',
                        opponent: prev.opponent === value ? '' : prev.opponent,
                        opponent_rank: prev.opponent === value ? '' : prev.opponent_rank,
                      }))
                    }}
                    players={PLAYERS}
                    getPlayerPhotoUrl={getPlayerPhotoUrl}
                    excludeName={challengeForm.opponent}
                  />

                  <PlayerPicker
                    label="Opponent"
                    value={challengeForm.opponent}
                    onChange={(value) => {
                      const player = PLAYERS.find((p) => p.name === value)
                      setChallengeForm((prev) => ({
                        ...prev,
                        opponent: value,
                        opponent_rank: player ? String(player.rank) : '',
                      }))
                    }}
                    players={PLAYERS}
                    getPlayerPhotoUrl={getPlayerPhotoUrl}
                    excludeName={challengeForm.challenger}
                  />

                  <div>
                    <label style={labelStyle}>Match Date</label>
                    <input
                      type="date"
                      value={challengeForm.match_date}
                      onChange={(e) =>
                        setChallengeForm((prev) => ({
                          ...prev,
                          match_date: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="submit"
                    disabled={submittingChallenge}
                    className="interactive-card"
                    style={{
                      ...buttonStyle,
                      width: 'auto',
                      minWidth: 220,
                      opacity: submittingChallenge ? 0.7 : 1,
                      cursor: submittingChallenge ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submittingChallenge ? 'Submitting...' : 'Submit Challenge'}
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard
              title="Active Challenges"
              subtitle={
                activeChallenges.length
                  ? `${activeChallenges.length} pending result${activeChallenges.length === 1 ? '' : 's'}`
                  : 'No pending results'
              }
              accent="rgba(168,240,255,0.08)"
              zIndex={10}
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
              <div
                className="toolbar-stack"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <SearchInput
                  value={activeQuery}
                  onChange={setActiveQuery}
                  placeholder="Search by player, status, or date"
                />

                <SegmentedControl
                  value={activeView}
                  onChange={setActiveView}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'pending', label: 'Pending' },
                  ]}
                />
              </div>

              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2].map((i) => (
                    <ChallengeSkeleton key={i} />
                  ))}
                </div>
              ) : filteredActiveChallenges.length === 0 ? (
                <EmptyState
                  title={activeChallenges.length ? 'No matching active challenges' : 'No active challenges'}
                  subtitle={
                    activeChallenges.length
                      ? 'Try another search or filter.'
                      : 'New matchups will appear here once a challenge is submitted.'
                  }
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {filteredActiveChallenges.map((row, index) => (
                    <ActiveMatchCard
                      key={`active-${row.challenge_id || index}`}
                      row={row}
                      onClick={() => {
                        setSelectedMatch(row)
                        setResultForm(getDefaultScoreForm())
                      }}
                      onCancel={() => handleCancelChallenge(row)}
                      cancelling={cancellingChallengeId === String(row.challenge_id)}
                      getPlayerPhotoUrl={getPlayerPhotoUrl}
                      onPlayerClick={setSelectedPlayer}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Completed Challenges"
              subtitle={
                completedChallenges.length
                  ? `Latest result: ${latestCompletedSummary}`
                  : 'No reported results yet'
              }
              accent="rgba(255,255,255,0.05)"
              zIndex={5}
              right={
                <Pill muted>
                  {loading ? 'Loading...' : `${completedChallenges.length} Completed`}
                </Pill>
              }
            >
              <div
                className="toolbar-stack"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <SearchInput
                  value={completedQuery}
                  onChange={setCompletedQuery}
                  placeholder="Search winner, opponent, score, or date"
                />

                <SegmentedControl
                  value={completedView}
                  onChange={setCompletedView}
                  options={[
                    { value: 'all', label: 'All Results' },
                    { value: 'recent', label: 'Recent 5' },
                  ]}
                />
              </div>

              {loading ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[1, 2].map((i) => (
                    <CompletedSkeleton key={i} />
                  ))}
                </div>
              ) : filteredCompletedChallenges.length === 0 ? (
                <EmptyState
                  title={completedChallenges.length ? 'No matching completed challenges' : 'No completed challenges'}
                  subtitle={
                    completedChallenges.length
                      ? 'Try another search or filter.'
                      : 'Finished match results will appear here after they are reported.'
                  }
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {filteredCompletedChallenges.map((row, index) => (
                    <CompletedMatchCard
                      key={`completed-${row.challenge_id || index}`}
                      row={row}
                      getPlayerPhotoUrl={getPlayerPhotoUrl}
                      onPlayerClick={setSelectedPlayer}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {selectedMatch ? (
          <div className="modal-overlay-anim" style={modalOverlayStyle}>
            <div
              className="modal-card-anim"
              style={{
                width: '100%',
                maxWidth: 1020,
                background:
                  'linear-gradient(180deg, rgba(10,23,43,0.985) 0%, rgba(7,17,32,0.995) 100%)',
                border: '1px solid rgba(174,242,255,0.16)',
                borderRadius: 30,
                boxShadow: '0 20px 60px rgba(0,0,0,0.38)',
                padding: 20,
                maxHeight: '90vh',
                overflowY: 'auto',
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
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'rgba(174,242,255,0.70)',
                      marginBottom: 8,
                    }}
                  >
                    Enter Result
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      color: '#eef6ff',
                      lineHeight: 1.02,
                    }}
                  >
                    {selectedMatch.challenger} vs {selectedMatch.opponent}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMatch(null)
                    setResultForm(getDefaultScoreForm())
                  }}
                  className="interactive-card"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#eef6ff',
                    cursor: 'pointer',
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleResultSubmit}>
                <div
                  className="score-entry-layout"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 0.9fr',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 24,
                      padding: 18,
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
                        color: 'rgba(220,232,255,0.60)',
                        marginBottom: 14,
                      }}
                    >
                      Winner
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                      {[selectedMatch.challenger, selectedMatch.opponent].map((name) => {
                        const active = resultForm.winner === name
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() =>
                              setResultForm((prev) => ({
                                ...prev,
                                winner: name,
                              }))
                            }
                            className="interactive-card"
                            style={{
                              minHeight: 44,
                              padding: '0 14px',
                              borderRadius: 999,
                              border: active
                                ? '1px solid rgba(174,242,255,0.24)'
                                : '1px solid rgba(255,255,255,0.12)',
                              background: active
                                ? 'linear-gradient(180deg, rgba(174,242,255,0.16) 0%, rgba(174,242,255,0.07) 100%)'
                                : 'rgba(255,255,255,0.04)',
                              color: '#eef6ff',
                              fontSize: 14,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {name}
                          </button>
                        )
                      })}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'rgba(220,232,255,0.60)',
                        marginBottom: 14,
                      }}
                    >
                      Score by Set
                    </div>

                    <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                      {[0, 1, 2].map((index) => (
                        <ScoreSetInput
                          key={index}
                          label={`Set ${index + 1}`}
                          setData={resultForm.sets[index]}
                          disabled={index === 2 && !resultForm.useThirdSet}
                          onChange={(field, value) => {
                            setResultForm((prev) => {
                              const nextSets = [...prev.sets]
                              nextSets[index] = {
                                ...nextSets[index],
                                [field]: value,
                              }
                              return {
                                ...prev,
                                sets: nextSets,
                              }
                            })
                          }}
                        />
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginBottom: 16,
                      }}
                    >
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#eef6ff',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={resultForm.useThirdSet}
                          onChange={(e) =>
                            setResultForm((prev) => ({
                              ...prev,
                              useThirdSet: e.target.checked,
                              sets: e.target.checked
                                ? prev.sets
                                : [prev.sets[0], prev.sets[1], { ...EMPTY_SET }],
                            }))
                          }
                        />
                        Use Third Set
                      </label>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <ScorePresetButton
                          onClick={() =>
                            setResultForm((prev) => ({
                              ...prev,
                              sets: [
                                { winner: '6', loser: '0' },
                                { winner: '6', loser: '0' },
                                { ...EMPTY_SET },
                              ],
                              useThirdSet: false,
                            }))
                          }
                        >
                          6-0, 6-0
                        </ScorePresetButton>

                        <ScorePresetButton
                          onClick={() =>
                            setResultForm((prev) => ({
                              ...prev,
                              sets: [
                                { winner: '6', loser: '4' },
                                { winner: '6', loser: '4' },
                                { ...EMPTY_SET },
                              ],
                              useThirdSet: false,
                            }))
                          }
                        >
                          6-4, 6-4
                        </ScorePresetButton>

                        <ScorePresetButton
                          onClick={() =>
                            setResultForm((prev) => ({
                              ...prev,
                              sets: [
                                { winner: '6', loser: '4' },
                                { winner: '4', loser: '6' },
                                { winner: '6', loser: '3' },
                              ],
                              useThirdSet: true,
                            }))
                          }
                        >
                          3 Sets
                        </ScorePresetButton>
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 16,
                        padding: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        marginBottom: 16,
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
                        Score String
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 850,
                          color: '#eef6ff',
                        }}
                      >
                        {builtScore || '-'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        type="submit"
                        disabled={submittingResult}
                        className="interactive-card"
                        style={{
                          ...buttonStyle,
                          opacity: submittingResult ? 0.7 : 1,
                          cursor: submittingResult ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {submittingResult ? 'Saving...' : 'Save Result'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMatch(null)
                          setResultForm(getDefaultScoreForm())
                        }}
                        className="interactive-card"
                        style={{
                          minHeight: 52,
                          padding: '0 18px',
                          borderRadius: 16,
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#eef6ff',
                          fontSize: 15,
                          fontWeight: 900,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div>
                    <ScorePreviewCard
                      match={selectedMatch}
                      winner={resultForm.winner}
                      score={builtScore}
                      getPlayerPhotoUrl={getPlayerPhotoUrl}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <PlayerProfileDrawer
          playerName={selectedPlayer}
          profile={selectedPlayerProfile}
          stats={playerStatsMap[selectedPlayer] || { wins: 0, active: 0, completed: 0 }}
          recentMatches={selectedPlayerRecentMatches}
          onClose={() => setSelectedPlayer(null)}
        />
      </div>
    </>
  )
}
