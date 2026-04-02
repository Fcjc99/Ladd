import { getChallengeMatches } from '@/lib/sheets'

export default async function Page() {
  const matches = await getChallengeMatches()

  return (
    <div style={{ padding: 20, color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1>Match Center</h1>
      <p>Total matches: {matches.length}</p>
      <pre>{JSON.stringify(matches, null, 2)}</pre>
    </div>
  )
}
