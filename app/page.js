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
      border: 'rgba(57, 212, 122, 0.40)',
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
      shell: {
        position: 'relative',
        padding: 7,
        borderRadius: 42,
        background:
          'linear-gradient(135deg, #fbffff 0%, #d6f7ff 12%, #ffffff 26%, #8fe6ff 48%, #8ea9ff 72%, #ecfcff 100%)',
        boxShadow:
          '0 0 26px rgba(149,236,255,0.42), 0 0 90px rgba(76,138,255,0.26), 0 18px 48px rgba(0,0,0,0.30)',
        animation: 'diamondPulse 3.4s ease-in-out infinite',
      },
      frame: {
        borderRadius: 35,
        background:
          'radial-gradient(circle at 50% 38%, rgba(145,220,255,0.22) 0%, rgba(92,154,255,0.16) 24%, rgba(255,255,255,0.02) 56%, rgba(255,255,255,0) 74%), linear-gradient(180deg, rgba(18,42,80,0.82) 0%, rgba(9,22,44,0.94) 100%)',
        border: '3px solid rgba(225,251,255,0.62)',
      },
      accent: '#aef2ff',
      badge: {
        background:
          'linear-gradient(135deg, #ffffff 0%, #e2f9ff 45%, #a3ebff 100%)',
        color: '#102444',
      },
      title: 'Diamond Elite',
      glow: 'rgba(168,240,255,0.55)',
    }
  }

  if (tier === 'gold') {
    return {
      shell: {
        position: 'relative',
        padding: 6,
        borderRadius: 38,
        background:
          'linear-gradient(135deg, #fff2c8 0%, #f7df8a 16%, #e6b547 42%, #ba7b1c 72%, #ffe4a4 100%)',
        boxShadow:
          '0 0 20px rgba(247,215,108,0.28), 0 0 58px rgba(202,146,32,0.16), 0 16px 40px rgba(0,0,0,0.24)',
        animation: 'goldPulse 4.1s ease-in-out infinite',
      },
      frame: {
        borderRadius: 31,
        background:
          'linear-gradient(180deg, rgba(48,33,11,0.92) 0%, rgba(22,16,7,0.98) 100%)',
        border: '3px solid rgba(255,231,162,0.44)',
      },
      accent: '#f6d56f',
      badge: {
        background:
          'linear-gradient(135deg, #fff7d6 0%, #f4d566 58%, #ddb13d 100%)',
        color: '#3d2c00',
      },
      title: 'Gold Rank',
      glow: 'rgba(247,215,108,0.22)',
    }
  }

  if (tier === 'silver') {
    return {
      shell: {
        position: 'relative',
        padding: 6,
        borderRadius: 38,
        background:
          'linear-gradient(135deg, #ffffff 0%, #e8eef6 18%, #c2ccda 46%, #8f9bb0 72%, #f4f7fb 100%)',
        boxShadow:
          '0 0 20px rgba(220,229,239,0.22), 0 0 52px rgba(143,157,179,0.16), 0 16px 40px rgba(0,0,0,0.22)',
        animation: 'silverPulse 4.3s ease-in-out infinite',
      },
      frame: {
        borderRadius: 31,
        background:
          'linear-gradient(180deg, rgba(36,42,54,0.95) 0%, rgba(20,24,33,0.98) 100%)',
        border: '3px solid rgba(233,240,247,0.36)',
      },
      accent: '#dde6f0',
      badge: {
        background:
          'linear-gradient(135deg, #f5f8fc 0%, #dbe2ec 55%, #b7c4d6 100%)',
        color: '#253245',
      },
      title: 'Silver Rank',
      glow: 'rgba(220,229,239,0.18)',
    }
  }

  if (tier === 'bronze') {
    return {
      shell: {
        position: 'relative',
        padding: 3,
        borderRadius: 30,
        background:
          'linear-gradient(135deg, #f0c8a7 0%, #c78550 32%, #9b5a2e 70%, #e0b08a 100%)',
        boxShadow:
          '0 0 12px rgba(199,133,80,0.18), 0 10px 26px rgba(0,0,0,0.20)',
      },
      frame: {
        borderRadius: 26,
        background:
          'linear-gradient(180deg, rgba(35,24,19,0.94) 0%, rgba(24,17,14,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      },
      accent: '#d29667',
      badge: {
        background:
          'linear-gradient(135deg, #f3d5bf 0%, #d29667 60%, #b56f42 100%)',
        color: '#3f1f0d',
      },
      title: 'Bronze Rank',
      glow: 'rgba(210,150,103,0.18)',
    }
  }

  return {
    shell: {
      position: 'relative',
      padding: 1,
      borderRadius: 22,
      background: 'rgba(35,75,134,0.40)',
    },
    frame: {
      borderRadius: 22,
      background:
        'linear-gradient(180deg, rgba(17,40,74,0.95) 0%, rgba(12,26,48,0.95) 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
    },
    accent: '#7fa7dd',
    badge: {
      background: '#dbe7f7',
      color: '#182235',
    },
    title: 'Ranked',
    glow: 'rgba(127,167,221,0.16)',
  }
}

function CrownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
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

function PlayerPhoto({
  photoUrl,
  player,
  size = 86,
  radius = 26,
  borderColor = 'rgba(255,255,255,0.14)',
  champion = false,
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
        boxShadow: champion
          ? `0 0 0 3px rgba(255,255,255,0.06), 0 18px 40px rgba(0,0,0,0.30), 0 0 30px ${borderColor}`
          : '0 16px 34px rgba(0,0,0,0.24)',
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
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: 'rgba(255,255,255,0.72)',
            fontWeight: 800,
            fontSize: Math.max(18, size * 0.22),
            letterSpacing: '-0.03em',
          }}
        >
          {(player || '?').slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function FlagInline({ flagUrl, player, width = 30, height = 20, radius = 6 }) {
  if (!flagUrl) return null

  return (
    <img
      src={flagUrl}
      alt={`${player || 'Player'} flag`}
      style={{
        width,
        height,
        objectFit: 'cover',
        borderRadius: radius,
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}
    />
  )
}

function Pill({ children, accent, muted = false, compact = false }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '7px 12px' : '10px 16px',
        borderRadius: 999,
        fontSize: compact ? 12 : 14,
        fontWeight: 800,
        background: muted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: accent || '#dce8ff',
        whiteSpace: 'nowrap',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>
  )
}

function RankBadge({ rank, styles, small = false, champion = false }) {
  return (
    <div
      style={{
        minWidth: small ? 50 : 84,
        height: small ? 50 : 84,
        borderRadius: small ? 16 : 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: small ? 24 : 38,
        letterSpacing: '-0.04em',
        position: 'relative',
        ...styles.badge,
        boxShadow: champion
          ? `0 16px 34px rgba(0,0,0,0.22), 0 0 28px ${styles.glow || 'rgba(255,255,255,0.12)'}`
          : `0 12px 24px rgba(0,0,0,0.18), 0 0 18px ${styles.glow || 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {champion ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              color: '#1a4765',
              opacity: 0.96,
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
  )
}

function CenterIdentity({
  row,
  titleSize = 26,
  photoSize = 74,
  flagWidth = 34,
  flagHeight = 22,
  photoBorderColor,
  champion = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <PlayerPhoto
        photoUrl={row.photo_url}
        player={row.player}
        size={photoSize}
        borderColor={photoBorderColor}
        champion={champion}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          minWidth: 0,
          marginTop: 18,
        }}
      >
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            wordBreak: 'break-word',
          }}
        >
          {row.player || 'Unknown'}
        </div>

        <FlagInline
          flagUrl={row.flag_url}
          player={row.player}
          width={flagWidth}
          height={flagHeight}
        />
      </div>
    </div>
  )
}

function TopRankCard({ row, rank }) {
  const tierStyles = getTierStyles(rank)
  const moveDisplay = getMoveDisplay(row.move)
  const isFirst = rank === 1

  return (
    <div style={tierStyles.shell}>
      <div
        style={{
          ...tierStyles.frame,
          position: 'relative',
          overflow: 'hidden',
          padding: isFirst ? '24px 26px 22px' : '22px 24px 20px',
          minHeight: isFirst ? 500 : 395,
        }}
      >
        {isFirst ? (
          <>
            <div
              style={{
                position: 'absolute',
                inset: -20,
                pointerEvents: 'none',
                background:
                  'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(185,246,255,0.06) 55deg, rgba(110,195,255,0.26) 110deg, rgba(255,255,255,0) 170deg, rgba(180,240,255,0.08) 240deg, rgba(108,176,255,0.26) 300deg, rgba(255,255,255,0) 360deg)',
                animation: 'championBorderSpin 5.2s linear infinite',
                opacity: 0.95,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 8,
                borderRadius: 28,
                border: '1px solid rgba(188,244,255,0.22)',
                boxShadow:
                  'inset 0 0 30px rgba(168,240,255,0.10), 0 0 26px rgba(120,210,255,0.08)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(189,245,255,0.08) 14%, rgba(255,255,255,0) 28%, rgba(160,208,255,0.16) 48%, rgba(255,255,255,0) 66%, rgba(189,245,255,0.10) 86%, rgba(255,255,255,0) 100%)',
                animation: 'championSweep 3.2s linear infinite',
                mixBlendMode: 'screen',
              }}
            />
          </>
        ) : null}

        <div
          className="top-rank-content"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: isFirst ? 448 : 350,
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <RankBadge rank={rank} styles={tierStyles} small={false} champion={isFirst} />

            <div
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                background: moveDisplay.bg,
                border: `1px solid ${moveDisplay.border}`,
                color: moveDisplay.color,
                whiteSpace: 'nowrap',
              }}
            >
              {moveDisplay.label}
            </div>
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: isFirst ? 8 : 2,
              marginBottom: 8,
            }}
          >
            <CenterIdentity
              row={row}
              titleSize={isFirst ? 64 : 44}
              photoSize={isFirst ? 190 : 138}
              flagWidth={isFirst ? 44 : 38}
              flagHeight={isFirst ? 28 : 24}
              photoBorderColor={tierStyles.accent}
              champion={isFirst}
            />
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 4,
            }}
          >
            <Pill accent={tierStyles.accent}>{tierStyles.title}</Pill>
            <Pill muted>Status: {row.status || '-'}</Pill>
          </div>
        </div>
      </div>
    </div>
  )
}

function MidRankCard({ row, rank }) {
  const tierStyles = getTierStyles(rank)
  const moveDisplay = getMoveDisplay(row.move)

  return (
    <div style={tierStyles.shell}>
      <div
        style={{
          ...tierStyles.frame,
          position: 'relative',
          overflow: 'hidden',
          padding: '18px 20px 18px',
          minHeight: 285,
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 245,
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <RankBadge rank={rank} styles={tierStyles} small />

            <div
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                background: moveDisplay.bg,
                border: `1px solid ${moveDisplay.border}`,
                color: moveDisplay.color,
                whiteSpace: 'nowrap',
              }}
            >
              {moveDisplay.label}
            </div>
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: -2,
              marginBottom: 6,
            }}
          >
            <CenterIdentity
              row={row}
              titleSize={30}
              photoSize={124}
              flagWidth={34}
              flagHeight={22}
              photoBorderColor={tierStyles.accent}
            />
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Pill compact accent={tierStyles.accent}>#{rank}</Pill>
            <Pill compact muted>Status: {row.status || '-'}</Pill>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactCard({ row, rank }) {
  const moveDisplay = getMoveDisplay(row.move)

  return (
    <div style={compactCardShellStyle}>
      <div
        style={{
          ...compactCardStyle,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 230,
          padding: '16px 18px 18px',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 194,
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                minWidth: 46,
                height: 46,
                borderRadius: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 22,
                background: '#dbe7f7',
                color: '#182235',
                boxShadow: '0 8px 18px rgba(0,0,0,0.16)',
              }}
            >
              #{rank}
            </div>

            <div
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                background: moveDisplay.bg,
                border: `1px solid ${moveDisplay.border}`,
                color: moveDisplay.color,
                whiteSpace: 'nowrap',
              }}
            >
              {moveDisplay.label}
            </div>
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: -4,
              marginBottom: 6,
            }}
          >
            <CenterIdentity
              row={row}
              titleSize={26}
              photoSize={112}
              flagWidth={32}
              flagHeight={20}
            />
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Pill compact accent="#dce8ff">#{rank}</Pill>
            <Pill compact muted>Status: {row.status || '-'}</Pill>
          </div>
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
        @keyframes diamondPulse {
          0% {
            box-shadow: 0 0 24px rgba(149,236,255,0.34), 0 0 64px rgba(76,138,255,0.18), 0 18px 48px rgba(0,0,0,0.30);
          }
          50% {
            box-shadow: 0 0 40px rgba(149,236,255,0.62), 0 0 118px rgba(76,138,255,0.36), 0 18px 48px rgba(0,0,0,0.34);
          }
          100% {
            box-shadow: 0 0 24px rgba(149,236,255,0.34), 0 0 64px rgba(76,138,255,0.18), 0 18px 48px rgba(0,0,0,0.30);
          }
        }

        @keyframes goldPulse {
          0% {
            box-shadow: 0 0 18px rgba(247,215,108,0.22), 0 0 48px rgba(202,146,32,0.12), 0 16px 40px rgba(0,0,0,0.24);
          }
          50% {
            box-shadow: 0 0 28px rgba(247,215,108,0.34), 0 0 68px rgba(202,146,32,0.20), 0 16px 40px rgba(0,0,0,0.24);
          }
          100% {
            box-shadow: 0 0 18px rgba(247,215,108,0.22), 0 0 48px rgba(202,146,32,0.12), 0 16px 40px rgba(0,0,0,0.24);
          }
        }

        @keyframes silverPulse {
          0% {
            box-shadow: 0 0 18px rgba(220,229,239,0.18), 0 0 42px rgba(143,157,179,0.12), 0 16px 40px rgba(0,0,0,0.22);
          }
          50% {
            box-shadow: 0 0 24px rgba(220,229,239,0.28), 0 0 58px rgba(143,157,179,0.18), 0 16px 40px rgba(0,0,0,0.22);
          }
          100% {
            box-shadow: 0 0 18px rgba(220,229,239,0.18), 0 0 42px rgba(143,157,179,0.12), 0 16px 40px rgba(0,0,0,0.22);
          }
        }

        @keyframes championSweep {
          0% {
            transform: translateX(-38%);
            opacity: 0;
          }
          12% {
            opacity: 0.14;
          }
          32% {
            opacity: 0.34;
          }
          54% {
            opacity: 0.52;
          }
          100% {
            transform: translateX(38%);
            opacity: 0;
          }
        }

        @keyframes championBorderSpin {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.02);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        @media (max-width: 900px) {
          .ranking-page-title {
            font-size: 44px !important;
          }
        }

        @media (max-width: 680px) {
          .bronze-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .top-rank-content {
            min-height: auto !important;
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
              marginBottom: 14,
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
                Elite Ladder
              </div>

              <h1
                className="ranking-page-title"
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  lineHeight: 0.95,
                }}
              >
                Live Ranking
              </h1>

              <div
                style={{
                  marginTop: 10,
                  color: 'rgba(220,232,255,0.72)',
                  fontSize: 15,
                  lineHeight: 1.5,
                }}
              >
                Premium standings view with stronger podium treatment.
              </div>
            </div>

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

          <div
            style={{
              height: 1,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(168,240,255,0.18) 22%, rgba(255,255,255,0.08) 50%, rgba(168,240,255,0.18) 78%, rgba(255,255,255,0) 100%)',
              marginBottom: 26,
            }}
          />

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
                  return <TopRankCard key={`top-${rank}`} row={row} rank={rank} />
                })}
              </div>

              <div
                className="bronze-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                {bronzeRows.map((row) => {
                  const rank = toNumber(row.rank) ?? 0
                  return <MidRankCard key={`bronze-${rank}`} row={row} rank={rank} />
                })}
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
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

const compactCardShellStyle = {
  position: 'relative',
  padding: 1,
  borderRadius: 24,
  background: 'rgba(35,75,134,0.4)',
}

const compactCardStyle = {
  borderRadius: 24,
  background:
    'linear-gradient(180deg, rgba(17,40,74,0.95) 0%, rgba(12,26,48,0.95) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
}
