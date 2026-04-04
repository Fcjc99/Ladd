'use client'

import { useEffect, useMemo, useState } from 'react'
import { FlagInline, MetaBox, Pill, PlayerPhoto } from './components/ui-kit'

const sheetId =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ||
  '1j3VgKy9fBHTTECzmRIYFijMtUAW5A0XdPoSNwdUDWOg'

const rankingUrl = `https://opensheet.elk.sh/${sheetId}/LiveRankingFeed`

function toNumber(value) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : null
}

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeUpper(value) {
  return normalizeText(value).toUpperCase()
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

function getStatusTone(status) {
  const s = normalizeUpper(status)

  if (s === 'ACTIVE') {
    return {
      edge: 'rgba(94, 234, 212, 0.20)',
      glow: 'rgba(94, 234, 212, 0.08)',
      badgeBg: 'rgba(94, 234, 212, 0.10)',
      badgeBorder: 'rgba(94, 234, 212, 0.20)',
      badgeColor: '#9ff7ea',
    }
  }

  if (s === 'INACTIVE') {
    return {
      edge: 'rgba(219,231,247,0.14)',
      glow: 'rgba(219,231,247,0.05)',
      badgeBg: 'rgba(219,231,247,0.08)',
      badgeBorder: 'rgba(219,231,247,0.16)',
      badgeColor: '#dce8ff',
    }
  }

  return {
    edge: 'rgba(255,255,255,0.12)',
    glow: 'rgba(255,255,255,0.04)',
    badgeBg: 'rgba(255,255,255,0.08)',
    badgeBorder: 'rgba(255,255,255,0.14)',
    badgeColor: '#dce8ff',
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
          'radial-gradient(circle at 50% 38%, rgba(145,220,255,0.22) 0%, rgba(92,154,255,0.16) 24%, rgba(255,255,255,0.02) 56%, rgba(255,255,255,0) 74%), linear-gradient(180deg, rgba(18,42,80,0.84) 0%, rgba(9,22,44,0.95) 100%)',
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
      background: 'rgba(255,255,255,0.08)',
    },
    frame: {
      borderRadius: 22,
      background: 'rgba(10,18,32,0.72)',
      border: '1px solid rgba(255,255,255,0.14)',
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
        player={row.player}
        photoUrl={row.photo_url}
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

function SearchInput({ value, onChange, placeholder = 'Search player or status' }) {
  return (
    <div
      style={{
        position: 'relative',
        minWidth: 240,
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

function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(174,242,255,0.72)',
            marginBottom: 8,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#eef6ff',
            lineHeight: 1.02,
          }}
        >
          {title}
        </div>
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
  )
}

function EmptyFilterState({ hasRows }) {
  return (
    <div
      className="fade-in"
      style={{
        borderRadius: 24,
        padding: 28,
        background: 'rgba(17,40,74,0.68)',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          margin: '0 auto 14px',
          borderRadius: 18,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          fontSize: 22,
        }}
      >
        ⌕
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#eef6ff',
          marginBottom: 8,
        }}
      >
        {hasRows ? 'No players match this view' : 'No ranking rows found'}
      </div>

      <div
        style={{
          fontSize: 15,
          color: 'rgba(220,232,255,0.70)',
          maxWidth: 520,
          margin: '0 auto',
          lineHeight: 1.5,
        }}
      >
        {hasRows
          ? 'Try a different search term or switch the status filter to see more players.'
          : 'The live ranking feed is currently empty.'}
      </div>
    </div>
  )
}

function TopRankCard({ row, rank, delay = 0, variant = 'standard' }) {
  const tierStyles = getTierStyles(rank)
  const moveDisplay = getMoveDisplay(row.move)
  const isFirst = rank === 1
  const statusTone = getStatusTone(row.status)
  const isSidePodium = variant === 'side'

  const height = isFirst ? 520 : isSidePodium ? 430 : 395
  const photoSize = isFirst ? 190 : isSidePodium ? 132 : 138
  const titleSize = isFirst ? 64 : isSidePodium ? 36 : 44

  return (
    <div
      className={`fade-in ${isFirst ? 'top-card-premium' : 'top-card-standard'}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        ...tierStyles.shell,
      }}
    >
      <div
        className="interactive-card"
        style={{
          ...tierStyles.frame,
          position: 'relative',
          overflow: 'hidden',
          padding: isFirst ? '26px 28px 24px' : '20px 22px 18px',
          minHeight: height,
          boxShadow: `inset 0 0 0 1px ${statusTone.edge}, inset 0 0 26px ${statusTone.glow}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.00) 28%)',
            pointerEvents: 'none',
          }}
        />

        {isFirst ? (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 35,
                pointerEvents: 'none',
                boxShadow:
                  'inset 0 0 0 1px rgba(196,247,255,0.18), inset 0 0 34px rgba(168,240,255,0.08)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 35,
                pointerEvents: 'none',
                WebkitMask:
                  'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                padding: 3,
                background:
                  'conic-gradient(from 0deg, rgba(158,239,255,0) 0deg, rgba(158,239,255,0.0) 35deg, rgba(158,239,255,0.92) 85deg, rgba(115,196,255,0.98) 110deg, rgba(158,239,255,0.0) 150deg, rgba(158,239,255,0.0) 220deg, rgba(158,239,255,0.92) 280deg, rgba(115,196,255,0.98) 306deg, rgba(158,239,255,0.0) 340deg, rgba(158,239,255,0) 360deg)',
                animation: 'championAuraTrace 2.4s linear infinite',
                filter: 'drop-shadow(0 0 10px rgba(158,239,255,0.85)) drop-shadow(0 0 18px rgba(115,196,255,0.55))',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 8,
                borderRadius: 28,
                border: '1px solid rgba(188,244,255,0.18)',
                pointerEvents: 'none',
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
            minHeight: isFirst ? 462 : isSidePodium ? 390 : 350,
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
              marginTop: isFirst ? 6 : 0,
              marginBottom: 10,
            }}
          >
            <CenterIdentity
              row={row}
              titleSize={titleSize}
              photoSize={photoSize}
              flagWidth={isFirst ? 44 : 36}
              flagHeight={isFirst ? 28 : 22}
              photoBorderColor={tierStyles.accent}
              champion={isFirst}
            />
          </div>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 4,
            }}
          >
            <Pill accent={tierStyles.accent}>{tierStyles.title}</Pill>
            <Pill
              accent={statusTone.badgeColor}
              background={statusTone.badgeBg}
              borderColor={statusTone.badgeBorder}
            >
              Status: {row.status || '-'}
            </Pill>
          </div>
        </div>
      </div>
    </div>
  )
}

function MidRankCard({ row, rank, delay = 0 }) {
  const tierStyles = getTierStyles(rank)
  const moveDisplay = getMoveDisplay(row.move)
  const statusTone = getStatusTone(row.status)

  return (
    <div
      className="fade-in"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        ...tierStyles.shell,
      }}
    >
      <div
        className="interactive-card"
        style={{
          ...tierStyles.frame,
          position: 'relative',
          overflow: 'hidden',
          padding: '18px 20px 18px',
          minHeight: 285,
          boxShadow: `inset 0 0 0 1px ${statusTone.edge}, inset 0 0 20px ${statusTone.glow}`,
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
            <Pill compact accent={tierStyles.accent}>{tierStyles.title}</Pill>
            <Pill
              compact
              accent={statusTone.badgeColor}
              background={statusTone.badgeBg}
              borderColor={statusTone.badgeBorder}
            >
              Status: {row.status || '-'}
            </Pill>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactCard({ row, rank, delay = 0 }) {
  const moveDisplay = getMoveDisplay(row.move)
  const statusTone = getStatusTone(row.status)

  return (
    <div
      className="fade-in"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        ...compactCardShellStyle,
      }}
    >
      <div
        className="interactive-card compact-card"
        style={{
          ...compactCardStyle,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 168,
          padding: '16px',
          boxShadow: `0 10px 22px rgba(0,0,0,0.16), inset 0 0 0 1px ${statusTone.edge}, inset 0 0 18px ${statusTone.glow}`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1fr) auto',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 10,
              justifyItems: 'center',
            }}
          >
            <div
              style={{
                minWidth: 52,
                height: 52,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 23,
                background: '#dbe7f7',
                color: '#182235',
                boxShadow: '0 8px 18px rgba(0,0,0,0.16)',
              }}
            >
              #{rank}
            </div>

            <div
              style={{
                padding: '7px 11px',
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
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              minWidth: 0,
            }}
          >
            <PlayerPhoto
              player={row.player}
              photoUrl={row.photo_url}
              size={88}
              borderColor="rgba(255,255,255,0.16)"
            />

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
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: '#eef6ff',
                    wordBreak: 'break-word',
                  }}
                >
                  {row.player || 'Unknown'}
                </div>

                <FlagInline
                  flagUrl={row.flag_url}
                  player={row.player}
                  width={30}
                  height={20}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <Pill compact accent="#dce8ff">Rank #{rank}</Pill>
                <Pill
                  compact
                  accent={statusTone.badgeColor}
                  background={statusTone.badgeBg}
                  borderColor={statusTone.badgeBorder}
                >
                  {row.status || '-'}
                </Pill>
              </div>
            </div>
          </div>

          <div
            style={{
              width: 8,
              alignSelf: 'stretch',
              borderRadius: 999,
              background:
                rank <= 10
                  ? 'linear-gradient(180deg, rgba(168,240,255,0.40) 0%, rgba(168,240,255,0.06) 100%)'
                  : rank <= 13
                  ? 'linear-gradient(180deg, rgba(219,231,247,0.32) 0%, rgba(219,231,247,0.06) 100%)'
                  : 'linear-gradient(180deg, rgba(210,150,103,0.28) 0%, rgba(210,150,103,0.05) 100%)',
              boxShadow: '0 0 12px rgba(255,255,255,0.06)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const filteredRankingRows = useMemo(() => {
    return rankingRows.filter((row) => {
      const query = normalizeUpper(searchQuery)
      const matchesQuery =
        !query ||
        normalizeUpper(row.player).includes(query) ||
        normalizeUpper(row.status).includes(query) ||
        String(row.rank || '').includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        normalizeUpper(row.status) === normalizeUpper(statusFilter)

      return matchesQuery && matchesStatus
    })
  }, [rankingRows, searchQuery, statusFilter])

  const topThree = filteredRankingRows.filter((row) => {
    const rank = toNumber(row.rank)
    return rank && rank <= 3
  })

  const bronzeRows = filteredRankingRows.filter((row) => {
    const rank = toNumber(row.rank)
    return rank && rank >= 4 && rank <= 7
  })

  const restRows = filteredRankingRows.filter((row) => {
    const rank = toNumber(row.rank)
    return rank && rank >= 8
  })

  const topOne = topThree.find((row) => toNumber(row.rank) === 1) || null
  const topTwo = topThree.find((row) => toNumber(row.rank) === 2) || null
  const topThreeThird = topThree.find((row) => toNumber(row.rank) === 3) || null

  const totalPlayers = rankingRows.length
  const activePlayers = rankingRows.filter(
    (row) => normalizeUpper(row.status) === 'ACTIVE'
  ).length
  const leader = rankingRows[0]?.player || '—'
  const biggestMover = useMemo(() => {
    const sorted = [...rankingRows]
      .map((row) => ({ ...row, moveNum: toNumber(row.move) ?? 0 }))
      .sort((a, b) => b.moveNum - a.moveNum)

    const best = sorted[0]
    if (!best || best.moveNum <= 0) return 'No upward movement yet'
    return `${best.player} ▲ ${best.moveNum}`
  }, [rankingRows])

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

        @keyframes championAuraTrace {
          0% {
            transform: rotate(0deg);
            opacity: 0.88;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg);
            opacity: 0.88;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeInUp 0.42s cubic-bezier(.22,.61,.36,1);
        }

        .interactive-card {
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, filter 0.18s ease;
        }

        .interactive-card:hover {
          transform: translateY(-3px);
        }

        .compact-card:hover {
          border-color: rgba(255,255,255,0.20) !important;
          box-shadow: 0 16px 34px rgba(0,0,0,0.24) !important;
        }

        .top-card-premium:hover {
          filter: brightness(1.02);
        }

        .top-card-premium:hover .interactive-card {
          transform: translateY(-5px);
          box-shadow: 0 22px 52px rgba(0,0,0,0.28), 0 0 36px rgba(168,240,255,0.12);
        }

        .top-card-standard:hover .interactive-card {
          transform: translateY(-4px);
          box-shadow: 0 18px 38px rgba(0,0,0,0.24);
        }

        @media (max-width: 1100px) {
          .podium-grid {
            grid-template-columns: 1fr !important;
          }

          .podium-center {
            order: 1;
          }

          .podium-left {
            order: 2;
          }

          .podium-right {
            order: 3;
          }
        }

        @media (max-width: 980px) {
          .ranking-page-title {
            font-size: 44px !important;
          }

          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 900px) {
          .top-rank-content {
            min-height: auto !important;
          }
        }

        @media (max-width: 780px) {
          .compact-grid-mobile {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 680px) {
          .bronze-grid {
            grid-template-columns: 1fr !important;
          }

          .toolbar-stack {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }

        @media (max-width: 640px) {
          .ranking-page-title {
            font-size: 36px !important;
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
              top: 160,
              right: -90,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(168,240,255,0.08)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', zIndex: 1 }}>
          <div
            className="fade-in"
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
                NDA 2026 Tennis
              </div>

              <h1
                className="ranking-page-title"
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  margin: 0,
                  lineHeight: 0.95,
                }}
              >
                Live Ranking
              </h1>

              <div
                style={{
                  marginTop: 12,
                  maxWidth: 720,
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: 'rgba(220,232,255,0.72)',
                }}
              >
                Elite ladder standings with premium player presentation, movement tracking, and Match Center access.
              </div>
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
                fontSize: 16,
                color: '#eef6ff',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                border: '2px solid rgba(219,231,247,0.38)',
                boxShadow:
                  '0 12px 30px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
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
              marginBottom: 22,
            }}
          />

          <div
            className="fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(220,232,255,0.78)',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 22,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9eefff', boxShadow: '0 0 14px rgba(158,239,255,0.8)' }} />
            Live from ranking feed
          </div>

          <div
            className="hero-grid fade-in"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: 16,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                borderRadius: 30,
                padding: 24,
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
                  marginBottom: 12,
                }}
              >
                Center Court Overview
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(220,232,255,0.62)',
                  marginBottom: 6,
                }}
              >
                Current leader
              </div>

              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  lineHeight: 1.02,
                  color: '#eef6ff',
                  marginBottom: 12,
                  letterSpacing: '-0.04em',
                }}
              >
                {leader}
              </div>

              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.58,
                  color: 'rgba(220,232,255,0.72)',
                  maxWidth: 650,
                }}
              >
                The rankings page now emphasizes the top of the ladder with a true podium composition, richer lower-card structure, and more distinct visual grouping across the field.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              <MetaBox label="Players" value={String(totalPlayers)} />
              <MetaBox label="Active" value={String(activePlayers)} accent="rgba(94,234,212,0.08)" />
              <MetaBox label="Leader" value={leader} />
              <MetaBox label="Biggest Move" value={biggestMover} accent="rgba(168,240,255,0.10)" />
            </div>
          </div>

          <div
            className="toolbar-stack fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              marginBottom: 28,
            }}
          >
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search player, status, or rank"
            />

            <SegmentedControl
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
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
          ) : filteredRankingRows.length === 0 ? (
            <EmptyFilterState hasRows={rankingRows.length > 0} />
          ) : (
            <>
              {(topOne || topTwo || topThreeThird) ? (
                <div style={{ marginBottom: 34 }}>
                  <SectionHeader
                    eyebrow="Featured"
                    title="Elite Tier"
                    subtitle="The three benchmark positions in the current ladder."
                    right={<Pill muted>Top 3</Pill>}
                  />

                  <div
                    className="podium-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.18fr 1fr',
                      gap: 18,
                      alignItems: 'end',
                    }}
                  >
                    <div className="podium-left">
                      {topTwo ? (
                        <TopRankCard
                          row={topTwo}
                          rank={2}
                          delay={60}
                          variant="side"
                        />
                      ) : null}
                    </div>

                    <div className="podium-center">
                      {topOne ? (
                        <TopRankCard
                          row={topOne}
                          rank={1}
                          delay={0}
                          variant="center"
                        />
                      ) : null}
                    </div>

                    <div className="podium-right">
                      {topThreeThird ? (
                        <TopRankCard
                          row={topThreeThird}
                          rank={3}
                          delay={120}
                          variant="side"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {bronzeRows.length ? (
                <div style={{ marginBottom: 34 }}>
                  <SectionHeader
                    eyebrow="Middle Tier"
                    title="Contenders"
                    subtitle="Strong positions with realistic upward pressure on the elite ranks."
                    right={<Pill muted>Ranks 4–7</Pill>}
                  />

                  <div
                    className="bronze-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {bronzeRows.map((row, index) => {
                      const rank = toNumber(row.rank) ?? 0
                      return (
                        <MidRankCard
                          key={`bronze-${rank}`}
                          row={row}
                          rank={rank}
                          delay={index * 70}
                        />
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {restRows.length ? (
                <div>
                  <SectionHeader
                    eyebrow="Full Ladder"
                    title="Ranked Field"
                    subtitle="The wider competitive field with cleaner density and faster scanability."
                    right={<Pill muted>Ranks 8+</Pill>}
                  />

                  <div
                    className="compact-grid-mobile"
                    style={{
                      display: 'grid',
                      gap: 14,
                    }}
                  >
                    {restRows.map((row, index) => {
                      const rank = toNumber(row.rank) ?? 0
                      return (
                        <CompactCard
                          key={`rest-${rank}`}
                          row={row}
                          rank={rank}
                          delay={index * 45}
                        />
                      )
                    })}
                  </div>
                </div>
              ) : null}
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
  background: 'rgba(255,255,255,0.08)',
}

const compactCardStyle = {
  borderRadius: 24,
  background: 'rgba(10,18,32,0.72)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 10px 22px rgba(0,0,0,0.16)',
}
