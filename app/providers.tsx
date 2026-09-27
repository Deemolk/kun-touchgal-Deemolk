'use client'

import { ProgressProvider } from '@bprogress/next/app'
import { HeroUIProvider } from '@heroui/system'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/navigation'
import { KunRouterProvider } from '~/components/kun/KunRouterProvider'
import { KunNowProvider } from '~/components/kun/KunNowProvider'

export const Providers = ({
  children,
  now
}: {
  children: React.ReactNode
  now: number
}) => {
  const router = useRouter()
  return (
    <ProgressProvider
      shallowRouting
      color="#006FEE"
      height="4px"
      options={{ showSpinner: false }}
    >
      <KunRouterProvider>
        {/* react-aria 家族单实例后弹层读屏文案随 HeroUIProvider 的 locale（默认 en-US），显式固定中文 */}
        <HeroUIProvider locale="zh-CN" navigate={router.push}>
          <ThemeProvider attribute="class">
            <KunNowProvider now={now}>{children}</KunNowProvider>
          </ThemeProvider>
        </HeroUIProvider>
      </KunRouterProvider>
    </ProgressProvider>
  )
}
