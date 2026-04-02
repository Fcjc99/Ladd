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
      redirect: 'follow',
      cache: 'no-store',
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      return Response.json(
        {
          success: false,
          error: 'Apps Script did not return JSON',
          raw: text,
        },
        { status: 500 }
      )
    }

    if (!data.success) {
      return Response.json(
        {
          success: false,
          error: data.error || 'Apps Script rejected request',
          raw: data,
        },
        { status: 400 }
      )
    }

    return Response.json(data)
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || 'Submit failed' },
      { status: 500 }
    )
  }
}
