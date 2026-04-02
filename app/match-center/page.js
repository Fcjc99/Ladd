'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID

    if (!sheetId) {
      setError('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID')
      setLoading(false)
      return
    }

    const url = `https://opensheet.elk.sh/${sheetId}/ChallengeFeed`

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch ChallengeFeed (${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        setMatches(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Unknown error')
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: 20, color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1>Match Center</h1>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <>
          <h2>Match Center Error</h2>
          <pre>{error}</pre>
        </>
      )}

      {!loading && !error && (
        <>
          <p>Total matches: {matches.length}</p>
          <pre>{JSON.stringify(matches, null, 2)}</pre>
        </>
      )}
    </div>
  )
}
