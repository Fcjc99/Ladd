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
      label: '-',
      bg: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.12)',
      color: 'white',
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
        padding: 2,
        borderRadius: 34,
        background:
          'linear-gradient(135deg, rgba(245,252,255,1) 0%, rgba(183,235,255,1) 20%, rgba(255,255,255,1) 36%, rgba(121,214,255,1) 54%, rgba(143,175,255,1) 75%, rgba(236,250,255,1) 100%)',
        boxShadow:
          '0 0 24px rgba(141, 230, 255, 0.45), 0 0 64px rgba(83, 156, 255, 0.22)',
        animation: 'diamondGlow 4s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(16,34,66,0.72) 0%, rgba(9,20,42,0.82) 100%)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      },
      badge: {
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(202,244,255,0.9) 40%, rgba(135,225,255,0.92) 100%)',
        color: '#0f2342',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.8), 0 0 20px rgba(120, 222, 255, 0.35)',
      },
      accent: '#9cecff',
      title: 'Diamond Elite',
    }
  }

  if (tier === 'gold') {
    return {
      wrapper: {
        position: 'relative',
        padding: 2,
        borderRadius: 30,
        background:
          'linear-gradient(135deg, #fff4bf 0%, #f6d86c 24%, #cf9e22 60%, #fff0a1 100%)',
        boxShadow:
          '0 0 16px rgba(246, 216, 108, 0.34), 0 0 34px rgba(207, 158, 34, 0.18)',
        animation: 'goldGlow 3.8s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(33,28,20,0.9) 0%, rgba(21,18,14,0.94) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #fff7d6 0%, #f4d566 60%, #ddb13d 100%)',
        color: '#3d2c00',
      },
      accent: '#f6d86c',
      title: 'Gold Rank',
    }
  }

  if (tier === 'silver') {
    return {
      wrapper: {
        position: 'relative',
        padding: 2,
        borderRadius: 30,
        background:
          'linear-gradient(135deg, #f1f4f8 0%, #cfd7e2 30%, #a6b3c5 68%, #eef2f7 100%)',
        boxShadow:
          '0 0 14px rgba(207, 215, 226, 0.24), 0 0 28px rgba(166, 179, 197, 0.14)',
        animation: 'silverGlow 4.2s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(28,32,41,0.92) 0%, rgba(19,22,29,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #f5f8fc 0%, #dbe2ec 55%, #b7c4d6 100%)',
        color: '#253245',
      },
      accent: '#d7e0ec',
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
          '0 0 12px rgba(199, 133, 80, 0.2), 0 0 22px rgba(155, 90, 46, 0.12)',
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
      borderRadius: 26,
      background: 'rgba(35, 75, 134, 0.7)',
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
      width="22"
      height="22"
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

export default function HomePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rawDebug, setRawDebug] = useState('')

  async function loadRankings() {
    try {
      setLoading(true)
      setError('')
      setRawDebug('')

      const res = await fetch(rankingUrl, { cache: 'no-store' })
      const data = await res.json()

      if (!Array.isArray(data)) {
        setRawDebug(JSON.stringify(data))
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

  return (
    <>
      <style>{`
        @keyframes diamondGlow {
          0% {
            box-shadow: 0 0 20px rgba(141, 230, 255, 0.35), 0 0 48px rgba(83, 156, 255, 0.16);
            transform: translateY(0px);
          }
          50% {
            box-shadow: 0 0 34px rgba(141, 230, 255, 0.7), 0 0 84px rgba(83, 156, 255, 0.28);
            transform: translateY(-2px);
          }
          100% {
            box-shadow: 0 0 20px rgba(141, 230, 255, 0.35), 0 0 48px rgba(83, 156, 255, 0.16);
            transform: translateY(0px);
          }
        }

        @keyframes goldGlow {
          0% {
            box-shadow: 0 0 12px rgba(246, 216, 108, 0.35), 0 0 24px rgba(207, 158, 34, 0.16);
          }
          50% {
            box-shadow: 0 0 22px rgba(246, 216, 108, 0.58), 0 0 40px rgba(207, 158, 34, 0.22);
          }
          100% {
            box-shadow: 0 0 12px rgba(246, 216, 108, 0.35), 0 0 24px rgba(207, 158, 34, 0.16);
          }
        }

        @keyframes silverGlow {
          0% {
            box-shadow: 0 0 10px rgba(207, 215, 226, 0.24), 0 0 18px rgba(166, 179, 197, 0.12);
          }
          50% {
            box-shadow: 0 0 18px rgba(207, 215, 226, 0.4), 0 0 34px rgba(166, 179, 197, 0.18);
          }
          100% {
            box-shadow: 0 0 10px rgba(207, 215, 226, 0.24), 0 0 18px rgba(166, 179, 197, 0.12);
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
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 20,
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

          {rawDebug ? (
            <div
              style={{
                marginBottom: 24,
                padding: '18px 20px',
                borderRadius: 16,
                background: '#2b1e06',
                border: '1px solid #8a6a1f',
                fontSize: 14,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              Raw response: {rawDebug}
            </div>
          ) : null}

          {loading ? (
            <div style={loadingCardStyle}>Loading rankings...</div>
          ) : rankingRows.length === 0 ? (
            <div style={loadingCardStyle}>No ranking rows found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              {rankingRows.map((row, index) => {
                const rank = toNumber(row.rank) ?? index + 1
                const tier = getTier(rank)
                const tierStyles = getTierStyles(rank)
                const moveDisplay = getMoveDisplay(row.move)

                return (
                  <div key={`rank-${index}`} style={tierStyles.wrapper}>
                    <div
                      style={{
                        ...eliteCardStyle,
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
                              width: 280,
                              height: 280,
                              borderRadius: '50%',
                              background:
                                'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(178,240,255,0.5) 65deg, rgba(132,177,255,0.9) 140deg, rgba(255,255,255,0.08) 220deg, rgba(178,240,255,0.4) 300deg, rgba(255,255,255,0) 360deg)',
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
                              borderRadius: 30,
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                width: '34%',
                                background:
                                  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)',
                                animation: 'shimmerSweep 4.5s linear infinite',
                              }}
                            />
                          </div>
                        </>
                      ) : rank <= 3 ? (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            overflow: 'hidden',
                            borderRadius: 28,
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              width: '34%',
                              background:
                                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0) 100%)',
                              animation: 'shimmerSweep 4.5s linear infinite',
                            }}
                          />
                        </div>
                      ) : null}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 18,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            ...rankBadgeStyle,
                            ...tierStyles.badge,
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {tier === 'diamond' ? (
                            <>
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  color: '#14405d',
                                  opacity: 0.9,
                                }}
                              >
                                <CrownIcon />
                              </div>
                              <span style={{ position: 'relative', zIndex: 1 }}>
                                #{rank}
                              </span>
                            </>
                          ) : (
                            `#${rank}`
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              flexWrap: 'wrap',
                              marginBottom: 8,
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
                              <div
                                style={{
                                  width: 58,
                                  height: 58,
                                  borderRadius: 18,
                                  overflow: 'hidden',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  background: 'rgba(255,255,255,0.06)',
                                  boxShadow:
                                    tier === 'diamond'
                                      ? '0 0 20px rgba(156,236,255,0.16)'
                                      : 'none',
                                  flexShrink: 0,
                                }}
                              >
                                {row.photo_url ? (
                                  <img
                                    src={row.photo_url}
                                    alt={row.player || 'Player'}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                ) : null}
                              </div>

                              <div
                                style={{
                                  fontSize: rank <= 3 ? 30 : 26,
                                  fontWeight: 900,
                                  letterSpacing: '-0.02em',
                                  textShadow:
                                    tier === 'diamond'
                                      ? '0 0 16px rgba(156,236,255,0.18)'
                                      : 'none',
                                  minWidth: 0,
                                }}
                              >
                                {row.player || 'Unknown'}
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
                                backdropFilter: 'blur(8px)',
                              }}
                            >
                              {moveDisplay.label}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                              flexWrap: 'wrap',
                              alignItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                padding: '8px 12px',
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 800,
                                background:
                                  tier === 'diamond'
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: tierStyles.accent,
                                backdropFilter: 'blur(10px)',
                              }}
                            >
                              {tierStyles.title}
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
                    </div>
                  </div>
                )
              })}
            </div>
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

const eliteCardStyle = {
  position: 'relative',
  borderRadius: 30,
  padding: 22,
}

const rankBadgeStyle = {
  minWidth: 92,
  height: 92,
  borderRadius: 26,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: 30,
  letterSpacing: '-0.03em',
}
