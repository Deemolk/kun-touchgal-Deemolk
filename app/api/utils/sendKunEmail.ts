const SEND_EMAIL_TIMEOUT_MS = 15 * 1000
const SEND_EMAIL_ERROR = '邮件发送失败，请稍后重试'

interface KunEmailPayload {
  to: string[]
  subject: string
  tag: string
  html_body: string
  plain_body: string
}

export const sendKunEmail = async (payload: KunEmailPayload) => {
  try {
    const res = await fetch(
      `${process.env.KUN_VISUAL_NOVEL_EMAIL_HOST}/emails`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.KUN_VISUAL_NOVEL_EMAIL_PASSWORD}`
        },
        body: JSON.stringify({
          from: `${process.env.KUN_VISUAL_NOVEL_EMAIL_FROM} <${process.env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT}>`,
          to: payload.to,
          subject: payload.subject,
          html: payload.html_body,
          text: payload.plain_body
        }),
        signal: AbortSignal.timeout(SEND_EMAIL_TIMEOUT_MS)
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error('Failed to send email:', {
        tag: payload.tag,
        status: res.status,
        body: text
      })
      return SEND_EMAIL_ERROR
    }
  } catch (error) {
    console.error('Failed to send email:', { tag: payload.tag, error })
    return SEND_EMAIL_ERROR
  }
}
