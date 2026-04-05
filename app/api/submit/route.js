export async function POST(req) {
  try {
    const body = await req.json()
    const submitUrl = process.env.NEXT_PUBLIC_MATCH_SUBMIT_URL

    if (!submitUrl) {
      return Response.json(
        { success: false, error: 'Missing NEXT_PUBLIC_MATCH_SUBMIT_URL' },
        { status: 500 }
      )
    }

    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const text = await res.text()

    try {
      const data = JSON.parse(text)
      return Response.json(data, { status: res.status })
    } catch {
      return Response.json(
        {
          success: false,
          error: 'Apps Script returned non-JSON response',
          raw: text,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error?.message || 'Unknown server error',
      },
      { status: 500 }
    )
  }
}
