import { NextResponse } from 'next/server'
import { kunMoyuMoe } from '~/config/moyu-moe'

export type EmailChangeRevertPayload = {
  uid: number
  oldEmail: string
  newEmail: string
  createdAt: string
}

export const EMAIL_CHANGE_REVERT_TTL_SECONDS = 24 * 60 * 60

export const createEmailChangeRevertKey = (token: string) =>
  `email-change-revert:${token}`

const getSiteAddress = () => {
  const envAddress =
    process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_DEV
      : process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_PROD

  return envAddress || kunMoyuMoe.domain.main
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const createEmailChangeRevertLink = (token: string) => {
  return `${getSiteAddress()}/api/user/setting/email/revert?token=${encodeURIComponent(token)}`
}

const createEmailChangeNotificationTemplate = (
  oldEmail: string,
  newEmail: string,
  revertLink: string
) => {
  const safeOldEmail = escapeHtml(oldEmail)
  const safeNewEmail = escapeHtml(newEmail)
  const safeRevertLink = escapeHtml(revertLink)
  const iconImage = `${getSiteAddress()}/logo.webp`

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${kunMoyuMoe.titleShort} 邮箱变更通知</title>
  </head>
  <body style="background-color: #e4e4e7; margin: 0; padding: 40px 0">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden">
      <div style="background: #e6f1fe; padding: 24px; text-align: center">
        <img src="${iconImage}" alt="${kunMoyuMoe.titleShort}" style="height: 48px" />
        <h1 style="color: #27272a; font-size: 24px; margin: 12px 0 0 0">
          邮箱变更通知
        </h1>
      </div>
      <div style="padding: 32px; color: #374151; font-size: 16px; line-height: 24px">
        <p style="margin: 0 0 16px 0">
          您的账号邮箱已从 ${safeOldEmail} 变更为 ${safeNewEmail}。
        </p>
        <p style="margin: 0 0 24px 0">
          如果这不是您本人的操作，请立即点击下方按钮撤销此次变更。此链接将在 24 小时后失效。
        </p>
        <p style="text-align: center; margin: 0 0 24px 0">
          <a
            href="${safeRevertLink}"
            style="display: inline-block; background: #006fee; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px"
          >
            撤销邮箱变更
          </a>
        </p>
        <p style="color: #71717a; font-size: 14px; margin: 0">
          此链接有效期为 24 小时。如果您没有进行此操作，请忽略此邮件并考虑启用两步验证 (2FA) 以保护您的账号安全。
        </p>
      </div>
    </div>
  </body>
</html>
  `
}

export const sendEmailChangeNotification = async (
  oldEmail: string,
  newEmail: string,
  token: string
) => {
  const revertLink = createEmailChangeRevertLink(token)
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
        to: [oldEmail],
        subject: `${kunMoyuMoe.titleShort} - 邮箱变更通知`,
        html: createEmailChangeNotificationTemplate(
          oldEmail,
          newEmail,
          revertLink
        ),
        text: `您的账号邮箱已从 ${oldEmail} 变更为 ${newEmail}。如非本人操作，请在 24 小时内点击链接撤销: ${revertLink}`
      })
    }
  )

  if (!res.ok) {
    return '邮件发送失败，请稍后重试'
  }
}

export const createEmailChangeRevertConfirmResponse = (
  token: string,
  oldEmail: string
) => {
  const safeToken = escapeHtml(token)
  const safeOldEmail = escapeHtml(oldEmail)

  return new NextResponse(
    `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>确认撤销邮箱变更</title>
  </head>
  <body style="font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f4f4f5; color: #27272a">
    <main style="max-width: 560px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 8px">
      <h1 style="font-size: 24px; margin: 0 0 16px 0">确认撤销邮箱变更</h1>
      <p style="line-height: 24px; margin: 0 0 24px 0">
        您确定要撤销此次邮箱变更，并将账号邮箱恢复为 ${safeOldEmail} 吗？
      </p>
      <form method="post" action="/api/user/setting/email/revert">
        <input type="hidden" name="token" value="${safeToken}" />
        <button
          type="submit"
          style="background: #006fee; border: 0; color: #ffffff; cursor: pointer; padding: 12px 20px; border-radius: 8px; font-size: 16px"
        >
          确认撤销
        </button>
      </form>
    </main>
  </body>
</html>
    `,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    }
  )
}

export const createEmailChangeRevertResponse = (
  title: string,
  message: string,
  status = 200
) => {
  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message)

  return new NextResponse(
    `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f4f4f5; color: #27272a">
    <main style="max-width: 560px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 8px">
      <h1 style="font-size: 24px; margin: 0 0 16px 0">${safeTitle}</h1>
      <p style="line-height: 24px; margin: 0">${safeMessage}</p>
    </main>
  </body>
</html>
    `,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    }
  )
}
