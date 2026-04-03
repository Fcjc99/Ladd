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

    return Response.json(data, { status: res.ok ? 200 : 500 })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
