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

function getTierStyles(rank) {
  const tier = getTier(rank)

  if (tier === 'diamond') {
    return {
      wrapper: {
        position: 'relative',
        padding: 2,
        borderRadius: 28,
        background:
          'linear-gradient(135deg, rgba(195,245,255,1) 0%, rgba(126,212,255,1) 18%, rgba(255,255,255,1) 34%, rgba(142,234,255,1) 52%, rgba(123,150,255,1) 72%, rgba(225,247,255,1) 100%)',
        boxShadow:
          '0 0 18px rgba(147, 233, 255, 0.65), 0 0 36px rgba(88, 166, 255, 0.35)',
        animation: 'diamondGlow 3.2s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(13,34,63,0.98) 0%, rgba(9,22,44,0.98) 100%)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #f8feff 0%, #c9f4ff 35%, #8fdfff 70%, #dff8ff 100%)',
        color: '#0f2342',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.85), 0 0 18px rgba(116, 227, 255, 0.45)',
      },
      title: 'Diamond Rank',
      accent: '#93e9ff',
    }
  }

  if (tier === 'gold') {
    return {
      wrapper: {
        position: 'relative',
        padding: 2,
        borderRadius: 28,
        background:
          'linear-gradient(135deg, #fff2ba 0%, #f6d86c 24%, #d5a928 58%, #fff0a3 100%)',
        boxShadow:
          '0 0 14px rgba(246, 216, 108, 0.45), 0 0 28px rgba(213, 169, 40, 0.25)',
        animation: 'goldGlow 3.6s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(24,27,42,0.98) 0%, rgba(18,20,33,0.98) 100%)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #fff7d6 0%, #f4d566 60%, #ddb13d 100%)',
        color: '#3d2c00',
      },
      title: 'Gold Rank',
      accent: '#f6d86c',
    }
  }

  if (tier === 'silver') {
    return {
      wrapper: {
        position: 'relative',
        padding: 2,
        borderRadius: 28,
        background:
          'linear-gradient(135deg, #f1f4f8 0%, #cfd7e2 30%, #a6b3c5 68%, #eef2f7 100%)',
        boxShadow:
          '0 0 12px rgba(207, 215, 226, 0.35), 0 0 22px rgba(166, 179, 197, 0.2)',
        animation: 'silverGlow 4s ease-in-out infinite',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(22,29,45,0.98) 0%, rgba(15,21,34,0.98) 100%)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #f5f8fc 0%, #dbe2ec 55%, #b7c4d6 100%)',
        color: '#253245',
      },
      title: 'Silver Rank',
      accent: '#d7e0ec',
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
          '0 0 12px rgba(199, 133, 80, 0.26), 0 0 22px rgba(155, 90, 46, 0.18)',
      },
      inner: {
        background:
          'linear-gradient(180deg, rgba(28,23,24,0.98) 0%, rgba(22,18,19,0.98) 100%)',
      },
      badge: {
        background:
          'linear-gradient(135deg, #f3d5bf 0%, #d29667 60%, #b56f42 100%)',
        color: '#3f1f0d',
      },
      title: 'Bronze Rank',
      accent: '#d29667',
    }
  }

  return {
    wrapper: {
      position: 'relative',
      padding: 1,
      borderRadius: 28,
      background: 'rgba(35, 75, 134, 0.7)',
    },
    inner: {
      background:
        'linear-gradient(180deg, rgba(17,40,74,0.95) 0%, rgba(12,26,48,0.95) 100%)',
    },
    badge: {
      background: '#dbe7f7',
      color: '#182235',
    },
    title: 'Ranked',
    accent: '#7fa7dd',
  }
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
            box-shadow: 0 0 18px rgba(147, 233, 255, 0.45), 0 0 36px rgba(88, 166, 255, 0.18);
            transform: translateY(0px);
          }
          50% {
            box-shadow: 0 0 28px rgba(147, 233, 255, 0.8), 0 0 54px rgba(88, 166, 255, 0.32);
            transform: translateY(-2px);
          }
          100% {
            box-shadow: 0 0 18px rgba(147, 233, 255, 0.45), 0 0 36px rgba(88, 166, 255, 0.18);
            transform: translateY(0px);
          }
        }

        @keyframes goldGlow {
          0% {
            box-shadow: 0 0 12px rgba(246, 216, 108, 0.35), 0 0 24px rgba(213, 169, 40, 0.16);
          }
          50% {
            box-shadow: 0 0 22px rgba(246, 216, 108, 0.6), 0 0 38px rgba(213, 169, 40, 0.26);
          }
          100% {
            box-shadow: 0 0 12px rgba(246, 216, 108, 0.35), 0 0 24px rgba(213, 169, 40, 0.16);
          }
        }

        @keyframes silverGlow {
          0% {
            box-shadow: 0 0 10px rgba(207, 215, 226, 0.25), 0 0 18px rgba(166, 179, 197, 0.12);
          }
          50% {
            box-shadow: 0 0 18px rgba(207, 215, 226, 0.42), 0 0 30px rgba(166, 179, 197, 0.18);
          }
          100% {
            box-shadow: 0 0 10px rgba(207, 215, 226, 0.25), 0 0 18px rgba(166, 179, 197, 0.12);
          }
        }

        @keyframes shimmerSweep {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }
          20% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.45;
          }
          100% {
            transform: translateX(140%);
            opacity: 0;
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
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              marginBottom: 20,
              letterSpacing: '-0.03em',
            }}
          >
            Live Ranking
          </h1>

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
                      {rank <= 3 ? (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            overflow: 'hidden',
                            borderRadius: 26,
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              width: '38%',
                              background:
                                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)',
                              animation: 'shimmerSweep 3.8s linear infinite',
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
                          }}
                        >
                          #{rank}
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
                                fontSize: rank <= 3 ? 30 : 26,
                                fontWeight: 900,
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {row.player || 'Unknown'}
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
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: tierStyles.accent,
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
  borderRadius: 26,
  padding: 22,
  border: '1px solid rgba(255,255,255,0.06)',
  backdropFilter: 'blur(6px)',
}

const rankBadgeStyle = {
  minWidth: 88,
  height: 88,
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: 30,
  letterSpacing: '-0.03em',
}
