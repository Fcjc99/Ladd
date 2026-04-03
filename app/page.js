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
        throw new Error('LiveRankingFeed did not return an array')
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
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, #0b2447 0%, #07111f 40%, #02060d 100%)',
        color: 'white',
        padding: '32px 16px 60px',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 20 }}>
          Live Ranking
        </h1>

        <div
          style={{
            marginBottom: 24,
            padding: '18px 20px',
            borderRadius: 16,
            background: '#11284a',
            border: '1px solid #234b86',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Sheet ID: {sheetId}
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
          <div style={cardStyle}>Loading rankings...</div>
        ) : rankingRows.length === 0 ? (
          <div style={cardStyle}>No ranking rows found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {rankingRows.map((row, index) => (
              <div key={`rank-${index}`} style={cardStyle}>
                <div style={rowTopStyle}>
                  <div style={rankBadgeStyle}>#{row.rank}</div>

                  <div style={{ flex: 1 }}>
                    <div style={playerNameStyle}>{row.player || 'Unknown'}</div>
                    <div style={metaStyle}>Move: {row.move ?? '-'}</div>
                    <div style={metaStyle}>Status: {row.status || '-'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  background: 'rgba(17, 40, 74, 0.7)',
  border: '1px solid #234b86',
  borderRadius: 18,
  padding: 18,
}

const rowTopStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}

const rankBadgeStyle = {
  minWidth: 72,
  height: 72,
  borderRadius: 18,
  background: '#dbe7f7',
  color: '#182235',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 24,
}

const playerNameStyle = {
  fontSize: 24,
  fontWeight: 800,
  marginBottom: 6,
}

const metaStyle = {
  fontSize: 15,
  opacity: 0.95,
  marginBottom: 4,
}
