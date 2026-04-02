import { getChallengeMatches } from '@/lib/sheets'

export default async function MatchCenterPage() {
  const matches = await getChallengeMatches()

  return (
    <main style={{ padding: '32px', color: 'white' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        Match Center
      </h1>

      <p style={{ marginBottom: '24px' }}>
        Total matches: {matches.length}
      </p>

      <div style={{ display: 'grid', gap: '16px' }}>
        {matches.map((match, index) => (
          <div
            key={match.match_id || index}
            style={{
              border: '1px solid #333',
              borderRadius: '16px',
              padding: '20px',
              background: '#111',
            }}
          >
            <div><strong>Challenger:</strong> {match.challenger}</div>
            <div><strong>Opponent:</strong> {match.opponent}</div>
            <div><strong>Status:</strong> {match.status}</div>
            <div><strong>Winner:</strong> {match.winner || '—'}</div>
            <div><strong>Score:</strong> {match.score || '—'}</div>
            <div><strong>Active:</strong> {match.active || '—'}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
