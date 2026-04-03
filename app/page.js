'use client'

import { useEffect, useMemo, useState } from 'react'

const sheetId =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ||
  '1j3VgKy9fBHTTECzmRIYFijMtUAW5A0XdPoSNwdUDWOg'

const rankingUrl = `https://opensheet.elk.sh/${sheetId}/LiveRankingFeed`

function toNumber(value) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : null
}

function getTier(rank) {
  if (rank === 1) return 'diamond'
  if (rank === 2) return 'gold'
  if (rank === 3) return 'silver'
  if (rank >= 4 && rank <= 7) return 'bronze'
  return 'standard'
}

function getMoveDisplay(moveValue) {
  const move = toNumber(moveValue)

  if (move === null) {
    return {
      label: '• 0',
      bg: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.12)',
      color: '#d9e7ff',
    }
  }

  if (move > 0) {
    return {
      label: `▲ ${move}`,
      bg: 'rgba(36, 184, 100, 0.16)',
      border: 'rgba(57, 212, 122, 0.4)',
      color: '#85f0af',
    }
  }

  if (move < 0) {
    return {
      label: `▼ ${Math.abs(move)}`,
      bg: 'rgba(210, 68, 68, 0.16)',
      border: 'rgba(255, 106, 106, 0.35)',
      color: '#ff9f9f',
    }
  }

  return {
    label: '• 0',
    bg: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.12)',
    color: '#d9e7ff',
  }
}

function getTierStyles(rank) {
  const tier = getTier(rank)

  if (tier === 'diamond') {
    return {
      wrapper: {
        position: 'relative',
        padding: 3,
        borderRadius: 38,
        background:
          'linear-gradient(135deg, #fbfeff 0%, #d5f7ff 14%, #ffffff 28%, #91e6ff 48%, #90a8ff 72%, #eefcff 100%)',
        boxShadow:
          '0 0 28px rgba(141,230,255,0.6), 0 0 94px rgba(83,156,255,0.3), inset 0 0 18px rgba(255,255,255,0.22)',
        animation: 'diamondGlow 3.6s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(14,36,72,0.62) 0%, rgba(9,23,47,0.82) 100%)',
        border: '1px solid rgba(255,255,255,0.24)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #ffffff 0%, #dff8ff 42%, #97e7ff 100%)',
        color: '#0f2342',
      },
      accent: '#a8f0ff',
      title: 'Diamond Elite',
    }
  }

  if (tier === 'gold') {
    return {
      wrapper: {
        position: 'relative',
        padding: 3,
        borderRadius: 36,
        background:
          'linear-gradient(135deg, #fff6cb 0%, #f9e38e 16%, #f2c94c 38%, #ca9220 66%, #fff0a3 100%)',
        boxShadow:
          '0 0 26px rgba(248,214,102,0.42), 0 0 74px rgba(202,146,32,0.22), inset 0 0 12px rgba(255,255,255,0.12)',
        animation: 'goldGlow 4.2s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(46,33,12,0.9) 0%, rgba(24,18,9,0.96) 100%)',
        border: '1px solid rgba(255,235,176,0.16)',
        boxShadow:
          'inset 0 1px 0 rgba(255,246,203,0.14), inset 0 -1px 0 rgba(255,255,255,0.03)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #fff7d6 0%, #f4d566 58%, #ddb13d 100%)',
        color: '#3d2c00',
      },
      accent: '#f7d76c',
      title: 'Gold Rank',
    }
  }

  if (tier === 'silver') {
    return {
      wrapper: {
        position: 'relative',
        padding: 3,
        borderRadius: 36,
        background:
          'linear-gradient(135deg, #ffffff 0%, #e4ebf3 18%, #bcc8d8 45%, #8f9db3 70%, #eef2f7 100%)',
        boxShadow:
          '0 0 24px rgba(220,229,239,0.32), 0 0 64px rgba(143,157,179,0.18), inset 0 0 10px rgba(255,255,255,0.12)',
        animation: 'silverGlow 4.4s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(35,41,53,0.92) 0%, rgba(20,24,33,0.96) 100%)',
        border: '1px solid rgba(235,241,248,0.12)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.03)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #f5f8fc 0%, #dbe2ec 55%, #b7c4d6 100%)',
        color: '#253245',
      },
      accent: '#dce5ef',
      title: 'Silver Rank',
    }
  }

  if (tier === 'bronze') {
    return {
      wrapper: {
        position: 'relative',
        padding: 2,
        borderRadius: 28,
        background:
          'linear-gradient(135deg, #f0c8a7 0%, #c78550 32%, #9b5a2e 70%, #e0b08a 100%)',
        boxShadow:
          '0 0 12px rgba(199,133,80,0.2), 0 0 22px rgba(155,90,46,0.12)',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(35,24,19,0.94) 0%, rgba(24,17,14,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #f3d5bf 0%, #d29667 60%, #b56f42 100%)',
        color: '#3f1f0d',
      },
      accent: '#d29667',
      title: 'Bronze Rank',
    }
  }

  return {
    wrapper: {
      position: 'relative',
      padding: 1,
      borderRadius: 24,
      background: 'rgba(35,75,134,0.45)',
    },
    inner: {
      background:
        'linear-gradient(180deg, rgba(17,40,74,0.95) 0%, rgba(12,26,48,0.95) 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
    },
    badge: {
      background: '#dbe7f7',
      color: '#182235',
    },
    accent: '#7fa7dd',
    title: 'Ranked',
  }
}

function CrownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        d="M4 18L2.5 7.5L8 11L12 4L16 11L21.5 7.5L20 18H4Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M5 20H19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlayerPhoto({ photoUrl, player, size = 86 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 22,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={player || 'Player'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : null}
    </div>
  )
}

function FlagMedia({ flagUrl, player, width = 124, height = 72 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}
    >
      {flagUrl ? (
        <img
          src={flagUrl}
          alt={`${player || 'Player'} flag`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : null}
    </div>
  )
}

function FeaturedCard({ row, rank }) {
  const tier = getTier(rank)
  const tierStyles = getTierStyles(rank)
  const moveDisplay = getMoveDisplay(row.move)

  return (
    <div style={tierStyles.wrapper}>
      <div
        style={{
          ...featuredCardStyle,
          ...tierStyles.inner,
          overflow: 'hidden',
        }}
      >
        {tier === 'diamond' ? (
          <>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 360,
                height: 360,
                borderRadius: '50%',
                background:
                  'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(178,240,255,0.52) 70deg, rgba(132,177,255,0.95) 150deg, rgba(255,255,255,0.08) 220deg, rgba(178,240,255,0.4) 310deg, rgba(255,255,255,0) 360deg)',
                animation:
                  'auraSpin 11s linear infinite, auraPulse 3.2s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                borderRadius: 34,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '28%',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)',
                  animation: 'shimmerSweep 4.2s linear infinite',
                }}
              />
            </div>
          </>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '110px minmax(260px, 1fr) 140px',
            gap: 24,
            alignItems: 'start',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <div
              style={{
                ...featuredBadgeStyle,
                ...tierStyles.badge,
                position: 'relative',
              }}
            >
              {tier === 'diamond' ? (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      color: '#14405d',
                      opacity: 0.9,
                    }}
                  >
                    <CrownIcon />
                  </div>
                  #{rank}
                </>
              ) : (
                `#${rank}`
              )}
            </div>

            <div
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.02em',
                background: moveDisplay.bg,
                border: `1px solid ${moveDisplay.border}`,
                color: moveDisplay.color,
                whiteSpace: 'nowrap',
              }}
            >
              {moveDisplay.label}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                marginBottom: 16,
              }}
            >
              {row.player || 'Unknown'}
            </div>

            <PlayerPhoto photoUrl={row.photo_url} player={row.player} size={86} />

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 16,
              }}
            >
              <div
                style={{
                  width: 170,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: tierStyles.accent,
                }}
              >
                {tierStyles.title}
              </div>

              <div
                style={{
                  width: 170,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#dce8ff',
                }}
              >
                Status: {row.status || '-'}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
            }}
          >
            <FlagMedia flagUrl={row.flag_url} player={row.player} width={124} height={72} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BronzeCard({ row, rank }) {
  const tierStyles = getTierStyles(rank)
  const moveDisplay = getMoveDisplay(row.move)

  return (
    <div style={tierStyles.wrapper}>
      <div style={{ ...bronzeCardStyle, ...tierStyles.inner }}>
        <div style={compactBadgeStyle}>#{rank}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800 }}>{row.player || 'Unknown'}</div>
            <FlagMedia flagUrl={row.flag_url} player={row.player} width={96} height={58} />
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <PlayerPhoto photoUrl={row.photo_url} player={row.player} size={72} />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: tierStyles.accent,
                }}
              >
                Bronze Rank
              </div>

              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#dce8ff',
                }}
              >
                Status: {row.status || '-'}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.02em',
            background: moveDisplay.bg,
            border: `1px solid ${moveDisplay.border}`,
            color: moveDisplay.color,
            whiteSpace: 'nowrap',
          }}
        >
          {moveDisplay.label}
        </div>
      </div>
    </div>
  )
}

function CompactCard({ row, rank }) {
  const moveDisplay = getMoveDisplay(row.move)

  return (
    <div style={compactCardShellStyle}>
      <div style={compactCardStyle}>
        <div style={compactBadgeStyle}>#{rank}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800 }}>{row.player || 'Unknown'}</div>
            <FlagMedia flagUrl={row.flag_url} player={row.player} width={90} height={54} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PlayerPhoto photoUrl={row.photo_url} player={row.player} size={62} />
            <div style={{ fontSize: 13, opacity: 0.9 }}>Status: {row.status || '-'}</div>
          </div>
        </div>

        <div
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.02em',
            background: moveDisplay.bg,
            border: `1px solid ${moveDisplay.border}`,
            color: moveDisplay.color,
            whiteSpace: 'nowrap',
          }}
        >
          {moveDisplay.label}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadRankings() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(rankingUrl, { cache: 'no-store' })
      const data = await res.json()

      if (!Array.isArray(data)) {
        throw new Error('Live Ranking did not return an array')
      }

      setRows(data)
    } catch (err) {
      console.error('Failed to load rankings:', err)
      setError(err.message || 'Failed to load rankings')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRankings()
  }, [])

  const rankingRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const rankA = toNumber(a.rank) ?? 9999
      const rankB = toNumber(b.rank) ?? 9999
      return rankA - rankB
    })
  }, [rows])

  const topThree = rankingRows.filter((row) => {
    const rank = toNumber(row.rank)
    return rank && rank <= 3
  })

  const bronzeRows = rankingRows.filter((row) => {
    const rank = toNumber(row.rank)
    return rank && rank >= 4 && rank <= 7
  })

  const restRows = rankingRows.filter((row) => {
    const rank = toNumber(row.rank)
    return rank && rank >= 8
  })

  return (
    <>
      <style>{`
        @keyframes diamondGlow {
          0% {
            box-shadow: 0 0 20px rgba(141,230,255,0.35), 0 0 48px rgba(83,156,255,0.16);
            transform: translateY(0px);
          }
          50% {
            box-shadow: 0 0 34px rgba(141,230,255,0.7), 0 0 84px rgba(83,156,255,0.28);
            transform: translateY(-2px);
          }
          100% {
            box-shadow: 0 0 20px rgba(141,230,255,0.35), 0 0 48px rgba(83,156,255,0.16);
            transform: translateY(0px);
          }
        }

        @keyframes auraSpin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes auraPulse {
          0% {
            opacity: 0.55;
            filter: blur(10px);
          }
          50% {
            opacity: 0.95;
            filter: blur(14px);
          }
          100% {
            opacity: 0.55;
            filter: blur(10px);
          }
        }

        @keyframes shimmerSweep {
          0% {
            transform: translateX(-130%);
            opacity: 0;
          }
          20% {
            opacity: 0.18;
          }
          50% {
            opacity: 0.44;
          }
          100% {
            transform: translateX(150%);
            opacity: 0;
          }
        }

        @keyframes goldGlow {
          0% {
            box-shadow: 0 0 18px rgba(247,215,108,0.28), 0 0 42px rgba(202,146,32,0.12);
          }
          50% {
            box-shadow: 0 0 30px rgba(247,215,108,0.5), 0 0 64px rgba(202,146,32,0.22);
          }
          100% {
            box-shadow: 0 0 18px rgba(247,215,108,0.28), 0 0 42px rgba(202,146,32,0.12);
          }
        }

        @keyframes silverGlow {
          0% {
            box-shadow: 0 0 16px rgba(220,229,239,0.22), 0 0 36px rgba(143,157,179,0.1);
          }
          50% {
            box-shadow: 0 0 28px rgba(220,229,239,0.42), 0 0 58px rgba(143,157,179,0.18);
          }
          100% {
            box-shadow: 0 0 16px rgba(220,229,239,0.22), 0 0 36px rgba(143,157,179,0.1);
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
        <div style={{ maxWidth: 1150, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            <h1
              style={{
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              Live Ranking
            </h1>

            <a
              href="/match-center"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
                padding: '0 18px',
                borderRadius: 16,
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 16,
                color: '#182235',
                background: '#dbe7f7',
                boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
              }}
            >
              Go to Match Center
            </a>
          </div>

          {error ? (
            <div
              style={{
                marginBottom: 24,
                padding: '18px 20px',
                borderRadius: 16,
                background: '#4a1120',
                border: '1px solid #86234b',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <div style={loadingCardStyle}>Loading rankings...</div>
          ) : rankingRows.length === 0 ? (
            <div style={loadingCardStyle}>No ranking rows found.</div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 18, marginBottom: 28 }}>
                {topThree.map((row) => {
                  const rank = toNumber(row.rank) ?? 0
                  return <FeaturedCard key={`top-${rank}`} row={row} rank={rank} />
                })}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                {bronzeRows.map((row) => {
                  const rank = toNumber(row.rank) ?? 0
                  return <BronzeCard key={`bronze-${rank}`} row={row} rank={rank} />
                })}
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {restRows.map((row) => {
                  const rank = toNumber(row.rank) ?? 0
                  return <CompactCard key={`rest-${rank}`} row={row} rank={rank} />
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

const loadingCardStyle = {
  background: 'rgba(17, 40, 74, 0.7)',
  border: '1px solid #234b86',
  borderRadius: 18,
  padding: 18,
}

const featuredCardStyle = {
  position: 'relative',
  borderRadius: 34,
  padding: 24,
}

const bronzeCardStyle = {
  position: 'relative',
  borderRadius: 26,
  padding: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
}

const compactCardShellStyle = {
  position: 'relative',
  padding: 1,
  borderRadius: 22,
  background: 'rgba(35,75,134,0.4)',
}

const compactCardStyle = {
  borderRadius: 22,
  padding: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  background:
    'linear-gradient(180deg, rgba(17,40,74,0.95) 0%, rgba(12,26,48,0.95) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const featuredBadgeStyle = {
  minWidth: 72,
  height: 72,
  borderRadius: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: 28,
  letterSpacing: '-0.03em',
}

const compactBadgeStyle = {
  minWidth: 72,
  height: 72,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: 26,
  background: '#dbe7f7',
  color: '#182235',
  flexShrink: 0,
}
