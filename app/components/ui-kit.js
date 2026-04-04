'use client'

export function Pill({
  children,
  accent = '#dce8ff',
  muted = false,
  background,
  borderColor,
  compact = false,
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '7px 12px' : '8px 12px',
        borderRadius: 999,
        fontSize: compact ? 12 : 12,
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

export function MetaBox({ label, value, accent = 'rgba(168,240,255,0.08)' }) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: '14px 16px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.035))',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 0 24px ${accent}, inset 0 1px 0 rgba(255,255,255,0.04)`,
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

export function PlayerPhoto({
  name,
  player,
  photoUrl,
  size = 74,
  radius,
  borderColor = 'rgba(255,255,255,0.14)',
  champion = false,
  onClick,
}) {
  const label = name || player || 'Player'
  const actualRadius = radius ?? Math.round(size * 0.22)

  return (
    <div
      className="photo-hover"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: actualRadius,
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
        boxShadow: champion
          ? `0 0 0 3px rgba(255,255,255,0.06), 0 18px 40px rgba(0,0,0,0.30), 0 0 30px ${borderColor}`
          : `0 14px 30px rgba(0,0,0,0.22), 0 0 20px ${borderColor}`,
        flexShrink: 0,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={label}
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
          {label.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  )
}

export function FlagInline({
  flagUrl,
  player,
  width = 30,
  height = 20,
  radius = 6,
}) {
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
