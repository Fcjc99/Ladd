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

    console.log('Submit URL:', submitUrl)
    console.log('Submit body:', body)

    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    console.log('Apps Script raw response:', text)

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
          error: data.error || 'Apps Script returned failure',
          appsScript: data,
        },
        { status: 500 }
      )
    }

    return Response.json(
      {
        success: true,
        message: data.message || 'Challenge submitted',
        appsScript: data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Submit route error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
