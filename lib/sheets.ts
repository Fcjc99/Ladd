const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID

async function getSheet<T>(tab: string): Promise<T[]> {
  if (!SHEET_ID) {
    throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID')
  }

  const res = await fetch(
    `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(tab)}`,
    {
      next: { revalidate: 30 },
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${tab}`)
  }

  return res.json()
}

export type ChallengeFeedRow = {
  match_id: string
  challenger: string
  challenger_rank: string
  challenger_photo: string
  challenger_flag: string
  opponent: string
  opponent_rank: string
  opponent_photo: string
  opponent_flag: string
  eligible: string
  approval: string
  status: string
  match_date: string
  match_time: string
  deadline: string
  days_left: string
  winner: string
  score: string
  active: string
  archived: string
}

export async function getChallengeMatches() {
  return getSheet<ChallengeFeedRow>('ChallengeFeed')
}
