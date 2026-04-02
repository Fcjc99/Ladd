import { getChallengeMatches } from '../../lib/sheets'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    const matches = await getChallengeMatches()

    return (
      <div style={{ padding: 20, color: 'white', background: 'black', minHeight: '100vh' }}>
        <h1>Match Center</h1>
        <p>Total matches: {matches.length}</p>
        <pre>{JSON.stringify(matches, null, 2)}</pre>
      </div>
    )
  } catch (error) {
    return (
      <div style={{ padding: 20, color: 'white', background: 'black', minHeight: '100vh' }}>
        <h1>Match Center Error</h1>
        <pre>
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    )
  }
}
