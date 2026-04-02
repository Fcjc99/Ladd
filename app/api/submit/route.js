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

    return Response.json({
      success: res.ok,
      status: res.status,
      raw: text,
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || 'Submit failed' },
      { status: 500 }
    )
  }
}
