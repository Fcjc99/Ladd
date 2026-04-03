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
          '0 0 24px rgba(149,236,255,0.42), 0 0 84px rgba(76,138,255,0.24), 0 18px 48px rgba(0,0,0,0.30)',
        animation: 'diamondPulse 3.6s ease-in-out infinite',
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
      glow: 'rgba(168,240,255,0.50)',
      corner: '#a8f2ff',
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
      corner: '#f6d56f',
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
      corner: '#dfe7f0',
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
      corner: '#d29667',
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
    corner: '#7fa7dd',
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

function CornerShard({ color, top, left, right, bottom, rotate = 0, size = 28, opacity = 0.9 }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        pointerEvents: 'none',
        filter: `drop-shadow(0 0 8px ${color})`,
        opacity,
      }}
    >
      <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" aria-hidden="true">
        <path
          d="M5 34L5 10L12 15L17 8L22 13L34 5L28 19L35 23L20 23L13 30L5 34Z"
          fill={color}
          fillOpacity="0.42"
        />
        <path
          d="M7 31L7 12L12 16L17 10L22 14L31 8L27 19L31 22L20 22L13 28L7 31Z"
          stroke={color}
          strokeWidth="2.2"
        />
      </svg>
    </div>
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
          ? `0 0 0 3px rgba(255,255,255,0.06), 0 16px 36px rgba(0,0,0,0.28), 0 0 26px ${borderColor}`
          : '0 14px 34px rgba(0,0,0,0.24)',
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
        padding: compact ? '8px 14px' : '10px 16px',
        borderRadius: 999,
        fontSize: compact ? 13 : 14,
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

function CompactIdentity({
  row,
  titleSize = 26,
  subtitle = '',
  photoSize = 74,
  flagWidth = 34,
  flagHeight = 22,
  photoBorderColor,
  centered = false,
  champion = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        textAlign: centered ? 'center' : 'left',
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
          justifyContent: centered ? 'center' : 'flex-start',
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

      {subtitle ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(220,232,255,0.72)',
          }}
        >
          {subtitle}
        </div>
      ) : null}
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
          minHeight: isFirst ? 520 : 420,
        }}
      >
        {isFirst ? (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'radial-gradient(circle at 50% 45%, rgba(164,240,255,0.18) 0%, rgba(114,176,255,0.14) 28%, rgba(255,255,255,0.02) 54%, rgba(255,255,255,0) 78%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(189,245,255,0.12) 16%, rgba(255,255,255,0) 36%, rgba(160,208,255,0.10) 55%, rgba(255,255,255,0) 78%, rgba(189,245,255,0.12) 100%)',
                animation: 'championSweep 6s linear infinite',
                mixBlendMode: 'screen',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 6,
                borderRadius: 30,
                border: '1px solid rgba(188,244,255,0.20)',
                boxShadow: 'inset 0 0 24px rgba(168,240,255,0.10)',
                pointerEvents: 'none',
              }}
            />
          </>
        ) : null}

        <CornerShard top={10} left={10} color={tierStyles.corner} size={isFirst ? 34 : 26} />
        <CornerShard top={10} right={10} color={tierStyles.corner} rotate={90} size={isFirst ? 34 : 26} />
        <CornerShard bottom={10} left={10} color={tierStyles.corner} rotate={270} size={isFirst ? 34 : 26} />
        <CornerShard bottom={10} right={10} color={tierStyles.corner} rotate={180} size={isFirst ? 34 : 26} />

        {isFirst ? (
          <>
            <CornerShard top={24} left={32} color={tierStyles.corner} rotate={16} size={18} opacity={0.86} />
            <CornerShard top={24} right={32} color={tierStyles.corner} rotate={105} size={18} opacity={0.86} />
            <CornerShard bottom={24} left={32} color={tierStyles.corner} rotate={255} size={18} opacity={0.86} />
            <CornerShard bottom={24} right={32} color={tierStyles.corner} rotate={195} size={18} opacity={0.86} />
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
            minHeight: isFirst ? 470 : 372,
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
            <div
              style={{
                minWidth: isFirst ? 88 : 78,
                height: isFirst ? 88 : 78,
                borderRadius: isFirst ? 24 : 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: isFirst ? 40 : 32,
                letterSpacing: '-0.04em',
                position: 'relative',
                ...tierStyles.badge,
                boxShadow: `0 14px 30px rgba(0,0,0,0.22), 0 0 22px ${tierStyles.glow || 'rgba(255,255,255,0.12)'}`,
              }}
            >
              {isFirst ? (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
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

            <Pill compact accent={moveDisplay.color}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0',
                  borderRadius: 999,
                  background: 'transparent',
                  color: moveDisplay.color,
                }}
              >
                {moveDisplay.label}
              </span>
            </Pill>
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: isFirst ? 10 : 4,
              marginBottom: 10,
            }}
          >
            <CompactIdentity
              row={row}
              titleSize={isFirst ? 64 : 44}
              subtitle={tierStyles.title}
              photoSize={isFirst ? 190 : 138}
              flagWidth={isFirst ? 44 : 38}
              flagHeight={isFirst ? 28 : 24}
              photoBorderColor={tierStyles.accent}
              centered
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

function BronzeCard({ row, rank }) {
  const tierStyles = getTierStyles(rank)
  const moveDisplay = getMoveDisplay(row.move)

  return (
    <div style={tierStyles.shell}>
      <div style={{ ...bronzeCardStyle, ...tierStyles.frame }}>
        <div
          style={{
            ...compactBadgeStyle,
            ...tierStyles.badge,
            minWidth: 78,
            height: 78,
            borderRadius: 24,
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
          }}
        >
          #{rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <CompactIdentity
            row={row}
            titleSize={24}
            subtitle=""
            photoSize={74}
            flagWidth={32}
            flagHeight={20}
            photoBorderColor={tierStyles.accent}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <Pill muted>Status: {row.status || '-'}</Pill>
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
            alignSelf: 'center',
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
          <CompactIdentity
            row={row}
            titleSize={22}
            subtitle=""
            photoSize={62}
            flagWidth={30}
            flagHeight={19}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                opacity: 0.9,
                color: '#dce8ff',
              }}
            >
              Status: {row.status || '-'}
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
            box-shadow: 0 0 38px rgba(149,236,255,0.56), 0 0 98px rgba(76,138,255,0.30), 0 18px 48px rgba(0,0,0,0.32);
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
            transform: translateX(-30%);
            opacity: 0;
          }
          18% {
            opacity: 0.16;
          }
          45% {
            opacity: 0.40;
          }
          100% {
            transform: translateX(30%);
            opacity: 0;
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
