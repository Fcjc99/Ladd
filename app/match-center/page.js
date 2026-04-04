'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
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
    const da = safeDateValue(a.match_date)
    const db = safeDateValue(b.match_date)
    if (da && db) return da - db
    if (da) return -1
    if (db) return 1
    return 0
  })
}

function sortCompletedRows(rows) {
  return [...rows].sort((a, b) => {
    const da = safeDateValue(a.match_date)
    const db = safeDateValue(b.match_date)
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
    sets: [
      { ...EMPTY_SET },
      { ...EMPTY_SET },
      { ...EMPTY_SET },
    ],
    useThirdSet: false,
  }
}

function applyPresetToScoreForm(preset, currentWinner) {
  const sets = [
    preset[0] ? { winner: String(preset[0][0]), loser: String(preset[0][1]) } : { ...EMPTY_SET },
    preset[1] ? { winner: String(preset[1][0]), loser: String(preset[1][1]) } : { ...EMPTY_SET },
    preset[2] ? { winner: String(preset[2][0]), loser: String(preset[2][1]) } : { ...EMPTY_SET },
  ]

  return {
    winner: currentWinner || '',
    sets,
    useThirdSet: Boolean(preset[2]),
  }
}

function Pill({
  children,
  accent = '#dce8ff',
  muted = false,
  background,
  borderColor,
}) {
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
        background:
          background || (muted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'),
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

function SectionCard({ title, subtitle, children, right, accent = 'rgba(91,171,255,0.12)' }) {
  return (
    <section
      className="glass-section fade-in"
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
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 850,
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: 'rgba(220,232,255,0.66)',
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function PlayerPhoto({
  name,
  photoUrl,
  size = 74,
  borderColor = 'rgba(255,255,255,0.14)',
}) {
  return (
    <div
      className="photo-hover"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
        boxShadow: `0 14px 30px rgba(0,0,0,0.22), 0 0 20px ${borderColor}`,
        flexShrink: 0,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
      <div className="completed-score-panel" style={scorePanelOuterStyle}>
        <div style={scorePanelInnerStyle}>
          <div style={scoreTitleStyle}>Reported Score</div>
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
    <div className="completed-score-panel" style={scorePanelOuterStyle}>
      <div style={scorePanelInnerStyle}>
        <div style={scoreTitleStyle}>Reported Score</div>

        <div
          style={{
            display: 'grid',
            gap: 10,
          }}
        >
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

function ActiveMatchCard({ row, onClick, getPlayerPhotoUrl }) {
  const challengerRank = row.challenger_rank || rankByName(row.challenger)
  const opponentRank = row.opponent_rank || rankByName(row.opponent)
  const challengerTheme = getRankTheme(challengerRank)
  const opponentTheme = getRankTheme(opponentRank)

  return (
    <div
      onClick={onClick}
      className="interactive-card active-card fade-in"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,48,88,0.97) 0%, rgba(11,28,54,0.98) 100%)',
        border: '1px solid rgba(91,171,255,0.24)',
        borderRadius: 28,
        padding: 20,
        boxShadow: '0 12px 32px rgba(0,0,0,0.20), 0 0 22px rgba(56,189,248,0.06)',
        cursor: 'pointer',
      }}
    >
      <div
        className="active-match-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 18,
          alignItems: 'center',
          marginBottom: 18,
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
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Pill
            accent="#bdefff"
            background="rgba(174,242,255,0.10)"
            borderColor="rgba(174,242,255,0.18)"
          >
            {row.status || 'Active'}
          </Pill>

          {row.approval ? <Pill muted>Approval: {row.approval}</Pill> : null}

          <Pill muted>Match Date: {formatDate(row.match_date) || '-'}</Pill>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="interactive-card"
          style={{
            minHeight: 46,
            padding: '0 18px',
            borderRadius: 14,
            border: '1px solid rgba(174,242,255,0.22)',
            background:
              'linear-gradient(180deg, rgba(174,242,255,0.14) 0%, rgba(174,242,255,0.06) 100%)',
            color: '#c9f7ff',
            fontSize: 14,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap',
          }}
        >
          Enter Result
        </button>
      </div>
    </div>
  )
}

function CompletedMatchCard({ row, getPlayerPhotoUrl }) {
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
          gridTemplateColumns: '190px minmax(260px, 1fr) 320px',
          gap: 24,
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
            size={150}
            borderColor={winnerTheme.accentBorder}
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
            minHeight: 150,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: '#eef6ff',
                lineHeight: 1.02,
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
              fontSize: 30,
              fontWeight: 850,
              color: '#dce8ff',
              lineHeight: 1.04,
              marginBottom: 14,
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
            <Pill muted>Match Date: {formatDate(row.match_date) || '-'}</Pill>
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
          ? '1px solid rgba(110, 255, 190, 0.24)'
          : '1px solid rgba(255, 132, 132, 0.24)',
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
    <div ref={ref} style={{ position: 'relative' }}>
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
            zIndex: 30,
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
    match_date: match.match_date,
  }

  return (
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

      <CompletedMatchCard row={previewRow} getPlayerPhotoUrl={getPlayerPhotoUrl} />
    </div>
  )
}

export default function MatchCenterPage() {
  const [feedRows, setFeedRows] = useState([])
  const [rankingRows, setRankingRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [submittingChallenge, setSubmittingChallenge] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [resultForm, setResultForm] = useState(getDefaultScoreForm())
  const [submittingResult, setSubmittingResult] = useState(false)
  const [toast, setToast] = useState(null)

  const [challengeForm, setChallengeForm] = useState({
    challenger: '',
    challenger_rank: '',
    opponent: '',
    opponent_rank: '',
    match_date: '',
  })

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

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
      showToast('Failed to load Match Center data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeChallenges = useMemo(() => {
    return sortActiveRows(feedRows.filter(isActive))
  }, [feedRows])

  const completedChallenges = useMemo(() => {
    return sortCompletedRows(feedRows.filter((row) => isCompleted(row) || isArchived(row)))
  }, [feedRows])

  const latestCompletedSummary = useMemo(() => {
    const latest = completedChallenges[0]
    if (!latest) return 'No recent result yet'
    return `${latest.winner || 'Winner'} def. ${getLoserName(latest)}`
  }, [completedChallenges])

  const builtScore = useMemo(() => {
    const relevantSets = resultForm.useThirdSet ? resultForm.sets : resultForm.sets.slice(0, 2)
    return buildScoreFromSets(relevantSets)
  }, [resultForm])

  function updateChallengeField(name, value) {
    if (name === 'challenger') {
      const player = PLAYERS.find((p) => p.name === value)
      setChallengeForm((prev) => ({
        ...prev,
        challenger: value,
        challenger_rank: player ? String(player.rank) : '',
        opponent: prev.opponent === value ? '' : prev.opponent,
        opponent_rank: prev.opponent === value ? '' : prev.opponent_rank,
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

  function updateSetValue(index, field, value) {
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
  }

  function applyScorePreset(preset) {
    setResultForm((prev) => applyPresetToScoreForm(preset, prev.winner))
  }

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
      if (!selectedMatch.source_row) {
        throw new Error('Missing source_row from ChallengeFeed')
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
        action: 'complete_match',
        source_row: Number(selectedMatch.source_row),
        winner: resultForm.winner,
        score,
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

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes modalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalScale {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .fade-in {
          animation: fadeInUp 0.28s ease;
        }

        .interactive-card {
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .interactive-card:hover {
          transform: translateY(-3px);
        }

        .active-card:hover {
          border-color: rgba(132, 216, 255, 0.34) !important;
          box-shadow: 0 18px 36px rgba(0,0,0,0.24), 0 0 28px rgba(56,189,248,0.10) !important;
        }

        .completed-card:hover {
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 16px 32px rgba(0,0,0,0.22) !important;
        }

        .photo-hover:hover {
          transform: scale(1.02);
        }

        .glass-section {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .glass-section:hover {
          border-color: rgba(255,255,255,0.12);
        }

        .skeleton-card,
        .skeleton-block,
        .skeleton-line,
        .skeleton-pill {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.12) 35%,
            rgba(255,255,255,0.06) 70%
          );
          background-size: 200% 100%;
          animation: shimmer 1.3s linear infinite;
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
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
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

          <div
            className="fade-in"
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
            <SectionCard
              title="Submit Challenge"
              subtitle="Select challenger, opponent, and scheduled date."
              accent="rgba(168,240,255,0.10)"
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
                    onChange={(value) => updateChallengeField('challenger', value)}
                    players={PLAYERS}
                    getPlayerPhotoUrl={getPlayerPhotoUrl}
                    excludeName={challengeForm.opponent}
                  />

                  <PlayerPicker
                    label="Opponent"
                    value={challengeForm.opponent}
                    onChange={(value) => updateChallengeField('opponent', value)}
                    players={PLAYERS}
                    getPlayerPhotoUrl={getPlayerPhotoUrl}
                    excludeName={challengeForm.challenger}
                  />

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
                  className="interactive-card"
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
              subtitle={
                activeChallenges.length
                  ? `${activeChallenges.length} pending result${activeChallenges.length === 1 ? '' : 's'}`
                  : 'No pending results'
              }
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
                <div style={listStyle}>
                  {[1, 2].map((i) => (
                    <ChallengeSkeleton key={i} />
                  ))}
                </div>
              ) : activeChallenges.length === 0 ? (
                <EmptyState
                  title="No active challenges"
                  subtitle="New matchups will appear here once a challenge is submitted."
                />
              ) : (
                <div style={listStyle}>
                  {activeChallenges.map((row, index) => (
                    <ActiveMatchCard
                      key={`active-${index}`}
                      row={row}
                      onClick={() => {
                        setSelectedMatch(row)
                        setResultForm(getDefaultScoreForm())
                      }}
                      getPlayerPhotoUrl={getPlayerPhotoUrl}
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
              right={
                <Pill muted>
                  {loading ? 'Loading...' : `${completedChallenges.length} Completed`}
                </Pill>
              }
            >
              {loading ? (
                <div style={listStyle}>
                  {[1, 2].map((i) => (
                    <CompletedSkeleton key={i} />
                  ))}
                </div>
              ) : completedChallenges.length === 0 ? (
                <EmptyState
                  title="No completed challenges"
                  subtitle="Finished match results will appear here after they are reported."
                />
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
          <div className="modal-overlay-anim" style={modalOverlayStyle}>
            <div
              className="modal-card-anim"
              style={{
                ...modalStyle,
                maxWidth: 980,
              }}
            >
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
                <div
                  className="score-entry-layout"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)',
                    gap: 18,
                  }}
                >
                  <div style={{ display: 'grid', gap: 16 }}>
                    <PlayerPicker
                      label="Winner"
                      value={resultForm.winner}
                      onChange={(value) =>
                        setResultForm((prev) => ({ ...prev, winner: value }))
                      }
                      players={[
                        {
                          name: selectedMatch.challenger,
                          rank: rankByName(selectedMatch.challenger),
                        },
                        {
                          name: selectedMatch.opponent,
                          rank: rankByName(selectedMatch.opponent),
                        },
                      ]}
                      getPlayerPhotoUrl={getPlayerPhotoUrl}
                    />

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
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'rgba(220,232,255,0.58)',
                          marginBottom: 12,
                        }}
                      >
                        Quick Score Presets
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <ScorePresetButton onClick={() => applyScorePreset([[6, 0], [6, 0]])}>
                          6-0, 6-0
                        </ScorePresetButton>
                        <ScorePresetButton onClick={() => applyScorePreset([[6, 3], [6, 4]])}>
                          6-3, 6-4
                        </ScorePresetButton>
                        <ScorePresetButton onClick={() => applyScorePreset([[7, 5], [6, 4]])}>
                          7-5, 6-4
                        </ScorePresetButton>
                        <ScorePresetButton onClick={() => applyScorePreset([[6, 4], [3, 6], [6, 2]])}>
                          6-4, 3-6, 6-2
                        </ScorePresetButton>
                      </div>
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
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'rgba(220,232,255,0.58)',
                          marginBottom: 12,
                        }}
                      >
                        Set-by-Set Score
                      </div>

                      <div style={{ display: 'grid', gap: 12 }}>
                        <ScoreSetInput
                          label="Set 1"
                          setData={resultForm.sets[0]}
                          onChange={(field, value) => updateSetValue(0, field, value)}
                        />

                        <ScoreSetInput
                          label="Set 2"
                          setData={resultForm.sets[1]}
                          onChange={(field, value) => updateSetValue(1, field, value)}
                        />

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginTop: 2,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'rgba(220,232,255,0.76)',
                            }}
                          >
                            Add third set
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setResultForm((prev) => ({
                                ...prev,
                                useThirdSet: !prev.useThirdSet,
                                sets: !prev.useThirdSet
                                  ? prev.sets
                                  : [prev.sets[0], prev.sets[1], { ...EMPTY_SET }],
                              }))
                            }
                            className="interactive-card"
                            style={{
                              minWidth: 86,
                              height: 38,
                              borderRadius: 999,
                              border: '1px solid rgba(255,255,255,0.12)',
                              background: resultForm.useThirdSet
                                ? 'rgba(174,242,255,0.14)'
                                : 'rgba(255,255,255,0.05)',
                              color: resultForm.useThirdSet ? '#c9f7ff' : '#dce8ff',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {resultForm.useThirdSet ? 'On' : 'Off'}
                          </button>
                        </div>

                        <ScoreSetInput
                          label="Set 3"
                          setData={resultForm.sets[2]}
                          onChange={(field, value) => updateSetValue(2, field, value)}
                          disabled={!resultForm.useThirdSet}
                        />
                      </div>
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
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'rgba(220,232,255,0.58)',
                          marginBottom: 10,
                        }}
                      >
                        Final Score String
                      </div>

                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 850,
                          color: '#eef6ff',
                        }}
                      >
                        {builtScore || '—'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                      <button
                        type="submit"
                        style={buttonStyle}
                        disabled={submittingResult}
                        className="interactive-card"
                      >
                        {submittingResult ? 'Saving...' : 'Save Result'}
                      </button>

                      <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={() => {
                          setSelectedMatch(null)
                          setResultForm(getDefaultScoreForm())
                        }}
                        className="interactive-card"
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
      </div>
    </>
  )
}

const scorePanelOuterStyle = {
  minWidth: 260,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const scorePanelInnerStyle = {
  width: '100%',
  maxWidth: 300,
  borderRadius: 20,
  padding: '16px 18px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
}

const scoreTitleStyle = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(220,232,255,0.56)',
  marginBottom: 12,
  textAlign: 'center',
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

const scoreInputStyle = {
  width: '100%',
  height: 48,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  outline: 'none',
  textAlign: 'center',
  fontSize: 20,
  fontWeight: 900,
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
  background:
    'linear-gradient(180deg, rgba(15,34,63,0.96) 0%, rgba(10,23,43,0.98) 100%)',
  border: '1px solid rgba(91,171,255,0.24)',
  borderRadius: 26,
  padding: 24,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
}
