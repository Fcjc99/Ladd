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

function getRankTheme(rank) {
  const n = Number(rank)

  if (n === 1) {
    return {
      accent: '#aef2ff',
      accentSoft: 'rgba(174,242,255,0.18)',
      accentBorder: 'rgba(174,242,255,0.34)',
      badgeBg: 'linear-gradient(135deg, #ffffff 0%, #e2f9ff 45%, #a3ebff 100%)',
      badgeColor: '#102444',
      glow: 'rgba(174,242,255,0.16)',
    }
  }

  if (n === 2) {
    return {
      accent: '#f6d56f',
      accentSoft: 'rgba(246,213,111,0.16)',
      accentBorder: 'rgba(246,213,111,0.28)',
      badgeBg: 'linear-gradient(135deg, #fff7d6 0%, #f4d566 58%, #ddb13d 100%)',
      badgeColor: '#3d2c00',
      glow: 'rgba(246,213,111,0.14)',
    }
  }

  if (n === 3) {
    return {
      accent: '#dde6f0',
      accentSoft: 'rgba(221,230,240,0.14)',
      accentBorder: 'rgba(221,230,240,0.24)',
      badgeBg: 'linear-gradient(135deg, #f5f8fc 0%, #dbe2ec 55%, #b7c4d6 100%)',
      badgeColor: '#253245',
      glow: 'rgba(221,230,240,0.10)',
    }
  }

  if (n >= 4 && n <= 8) {
    return {
      accent: '#d29667',
      accentSoft: 'rgba(210,150,103,0.12)',
      accentBorder: 'rgba(210,150,103,0.24)',
      badgeBg: 'linear-gradient(135deg, #f3d5bf 0%, #d29667 60%, #b56f42 100%)',
      badgeColor: '#3f1f0d',
      glow: 'rgba(210,150,103,0.08)',
    }
  }

  return {
    accent: '#b8c9e6',
    accentSoft: 'rgba(184,201,230,0.10)',
    accentBorder: 'rgba(184,201,230,0.16)',
    badgeBg: 'linear-gradient(135deg, #eff5ff 0%, #dbe7f7 100%)',
    badgeColor: '#182235',
    glow: 'rgba(184,201,230,0.06)',
  }
}

function getMoveInfo(moveValue) {
  const raw = normalizeText(moveValue)
  const upper = normalizeUpper(moveValue)

  if (!raw || upper === '—' || upper === '-') {
    return {
      label: '—',
      type: 'neutral',
      color: 'rgba(220,232,255,0.72)',
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.08)',
    }
  }

  if (upper === 'NEW') {
    return {
      label: 'NEW',
      type: 'up',
      color: '#bff7d2',
      bg: 'rgba(110,255,190,0.12)',
      border: 'rgba(110,255,190,0.18)',
    }
  }

  const n = Number(raw.replace(/[^\d-+]/g, ''))
  if (Number.isFinite(n)) {
    if (n > 0) {
      return {
        label: `↑ ${n}`,
        type: 'up',
        color: '#bff7d2',
        bg: 'rgba(110,255,190,0.12)',
        border: 'rgba(110,255,190,0.18)',
      }
    }

    if (n < 0) {
      return {
        label: `↓ ${Math.abs(n)}`,
        type: 'down',
        color: '#ffd0d0',
        bg: 'rgba(255,132,132,0.12)',
        border: 'rgba(255,132,132,0.18)',
      }
    }
  }

  return {
    label: raw,
    type: 'neutral',
    color: 'rgba(220,232,255,0.72)',
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
  }
}

function sortRankings(rows) {
  return [...rows].sort((a, b) => toNumber(a.rank) - toNumber(b.rank))
}

function Photo({ name, url, size = 76, borderColor = 'rgba(255,255,255,0.14)' }) {
  return (
    <div
      className="photo-hover"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
        boxShadow: `0 14px 30px rgba(0,0,0,0.22), 0 0 20px ${borderColor}`,
        flexShrink: 0,
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
  )
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
  const theme = getRankTheme(rank)

  return (
    <div
      style={{
        minWidth: 36,
        height: 36,
        padding: '0 10px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.badgeBg,
        color: theme.badgeColor,
        fontSize: 13,
        fontWeight: 900,
        boxShadow: '0 10px 18px rgba(0,0,0,0.14)',
      }}
    >
      #{rank}
    </div>
  )
}

function MoveChip({ move }) {
  const info = getMoveInfo(move)

  return (
    <div
      style={{
        minWidth: 64,
        height: 34,
        padding: '0 12px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: info.bg,
        border: `1px solid ${info.border}`,
        color: info.color,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {info.label}
    </div>
  )
}

function PodiumCard({ row, place }) {
  const rank = toNumber(row.rank)
  const theme = getRankTheme(rank)
  const isLeader = rank === 1

  const heights = {
    1: 390,
    2: 340,
    3: 320,
  }

  return (
    <div
      className={`interactive-card podium-card podium-${place}`}
      style={{
        position: 'relative',
        minHeight: heights[place],
        borderRadius: 30,
        padding: place === 1 ? '24px 22px 22px' : '20px 18px 18px',
        background:
          rank === 1
            ? 'linear-gradient(180deg, rgba(18,42,78,0.98) 0%, rgba(9,22,41,0.99) 100%)'
            : 'linear-gradient(180deg, rgba(14,31,58,0.96) 0%, rgba(10,21,39,0.98) 100%)',
        border: `1px solid ${theme.accentBorder}`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.24), 0 0 34px ${theme.glow}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            rank === 1
              ? 'linear-gradient(180deg, rgba(174,242,255,0.08) 0%, rgba(255,255,255,0.00) 30%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.00) 28%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: -50,
          right: -30,
          width: 170,
          height: 170,
          borderRadius: '50%',
          background: theme.accentSoft,
          filter: 'blur(46px)',
          pointerEvents: 'none',
        }}
      />

      {isLeader ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 30,
            boxShadow: 'inset 0 0 0 1px rgba(174,242,255,0.08)',
          }}
        />
      ) : null}

      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <RankBadge rank={row.rank} />
          <MoveChip move={row.move} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Photo
            name={row.player}
            url={row.photo_url}
            size={place === 1 ? 116 : 98}
            borderColor={theme.accentBorder}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: place === 1 ? 31 : 26,
              fontWeight: 900,
              color: '#eef6ff',
              lineHeight: 1.03,
              letterSpacing: '-0.03em',
              marginBottom: 10,
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
        style={{
          position: 'relative',
          marginTop: 18,
          height: place === 1 ? 78 : 58,
          borderRadius: 22,
          background:
            place === 1
              ? 'linear-gradient(180deg, rgba(174,242,255,0.10) 0%, rgba(255,255,255,0.03) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: place === 1 ? 14 : 13,
            fontWeight: 900,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(220,232,255,0.64)',
          }}
        >
          Rank {row.rank}
        </div>
      </div>
    </div>
  )
}

function LadderRow({ row }) {
  const rank = toNumber(row.rank)
  const theme = getRankTheme(rank)

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
        }}
      >
        <RankBadge rank={row.rank} />
        <Photo
          name={row.player}
          url={row.photo_url}
          size={58}
          borderColor={theme.accentBorder}
        />
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

      const n = Number(raw.replace(/[^\d-+]/g, ''))
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
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        .podium-card:hover {
          border-color: rgba(255,255,255,0.16) !important;
          box-shadow: 0 26px 56px rgba(0,0,0,0.26), 0 0 36px rgba(174,242,255,0.08) !important;
        }

        .ladder-row:hover {
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 18px 30px rgba(0,0,0,0.20) !important;
        }

        .photo-hover:hover {
          transform: scale(1.02);
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

          .podium-1,
          .podium-2,
          .podium-3 {
            order: initial !important;
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
                    alignItems: 'end',
                  }}
                >
                  {topThree[1] ? <PodiumCard row={topThree[1]} place={2} /> : <div />}
                  {topThree[0] ? <PodiumCard row={topThree[0]} place={1} /> : <div />}
                  {topThree[2] ? <PodiumCard row={topThree[2]} place={3} /> : <div />}
                </div>
              )}
            </section>

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
