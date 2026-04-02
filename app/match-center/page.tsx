import { getChallengeMatches } from '@/lib/sheets'

export default async function MatchCenterPage() {
  const matches = await getChallengeMatches()

  const clean = (value: string | undefined) => (value ?? '').trim().toLowerCase()

  const activeMatches = matches.filter((m) => {
    const archived = clean(m.archived)
    const active = clean(m.active)
    const status = clean(m.status)

    return archived !== 'yes' && (active === 'active' || status === 'scheduled')
  })

  const completedMatches = matches.filter((m) => clean(m.status) === 'completed')

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', color: '#111' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        Match Center
      </h1>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
          Active Challenges
        </h2>

        {activeMatches.length === 0 ? (
          <p>No active challenges yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {activeMatches.map((match) => (
              <div
                key={match.match_id}
                style={{
                  border: '1px solid #333',
                  borderRadius: '16px',
                  padding: '20px',
                  background: '#111',
                  color: '#fff',
                }}
              >
                <div style={{ marginBottom: '12px', color: '#aaa', fontSize: '14px' }}>
                  {match.status} · {match.match_date}
                </div>

                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>
                  {match.challenger} vs {match.opponent}
                </div>

                <div style={{ color: '#bbb', fontSize: '14px' }}>
                  Rank #{match.challenger_rank} vs Rank #{match.opponent_rank}
                </div>

                <div style={{ color: '#bbb', fontSize: '14px', marginTop: '8px' }}>
                  Deadline: {match.deadline} · Days left: {match.days_left}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
          Completed Matches
        </h2>

        {completedMatches.length === 0 ? (
          <p>No completed matches yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {completedMatches.map((match) => (
              <div
                key={match.match_id}
                style={{
                  border: '1px solid #333',
                  borderRadius: '16px',
                  padding: '20px',
                  background: '#111',
                  color: '#fff',
                }}
              >
                <div style={{ marginBottom: '12px', color: '#aaa', fontSize: '14px' }}>
                  {match.status} · {match.match_date}
                </div>

                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>
                  {match.challenger} vs {match.opponent}
                </div>

                <div style={{ color: '#bbb', fontSize: '14px' }}>
                  Winner: {match.winner || '—'}
                </div>

                <div style={{ color: '#bbb', fontSize: '14px', marginTop: '8px' }}>
                  Score: {match.score || '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
