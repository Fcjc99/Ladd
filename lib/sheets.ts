const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID

async function getSheet(tab: string) {
  if (!SHEET_ID) {
    throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID')
  }

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(tab)}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${tab} (${res.status})`)
  }

  return res.json()
}

export async function getChallengeMatches() {
  return getSheet('ChallengeFeed')
}
