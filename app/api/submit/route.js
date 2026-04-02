export async function POST(request) {
  try {
    const body = await request.json()
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
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { success: res.ok, raw: text }
    }

    return Response.json(data, { status: 200 })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || 'Submit failed' },
      { status: 500 }
    )
  }
}
