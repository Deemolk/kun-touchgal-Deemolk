import { createRequire } from 'module'
import { readFileSync, realpathSync } from 'fs'
import { join, sep } from 'path'
import { describe, expect, it } from 'vitest'

// HeroUI 2.8.1 精确钉 2025-06 的 react-aria 拆包, 拆包之间的 caret 会被 pnpm (尤其 dedupe) 解析到
// 2026 年再导出 react-aria / react-stately 单包的壳, 同一模块于是有两份实例、两份全局状态:
// FocusScope 树分裂时 @heroui/use-aria-overlay 认不出 portal 出去的子弹层, 头像菜单里的
// 「网站内容显示」子菜单一打开父菜单就按失焦关闭. pnpm-workspace.yaml 用 overrides 把家族钉成单版本
const root = process.cwd()
const lockfile = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')
const snapshots = lockfile.slice(lockfile.indexOf('\nsnapshots:'))

// react-aria 拆包的 exports 不含 ./package.json, 从主入口 realpath 截出 pnpm 实例目录
const packageRoot = (fromDir: string, name: string) => {
  const entry = realpathSync(
    createRequire(join(fromDir, 'package.json')).resolve(name)
  )
  const marker = `${sep}node_modules${sep}${name.split('/').join(sep)}${sep}`
  return entry.slice(0, entry.lastIndexOf(marker) + marker.length - 1)
}

describe('react-aria 家族只有一份实例', () => {
  it('每个 @react-aria / @react-stately / @react-types 包在锁文件里只有一个快照', () => {
    const keys = new Map<string, Set<string>>()
    for (const [, name, key] of snapshots.matchAll(
      /^ {2}'?(@react-(?:aria|stately|types)\/[a-z-]+)@([^:\s']+)'?:/gm
    )) {
      keys.set(name, (keys.get(name) ?? new Set()).add(key))
    }
    const duplicated = [...keys].filter(([, set]) => set.size > 1)
    expect(keys.size).toBeGreaterThan(0)
    expect(duplicated.map(([name]) => name)).toEqual([])
  })

  it('不存在单包壳的实现包', () => {
    expect(snapshots).not.toMatch(
      /^ {2}'?(react-aria|react-stately|react-aria-components|@adobe\/react-spectrum)@/m
    )
  })

  it('use-aria-overlay 与 <Overlay> 共用同一份 FocusScope', () => {
    const popover = packageRoot(root, '@heroui/popover')
    const overlay = packageRoot(popover, '@heroui/use-aria-overlay')
    const overlays = packageRoot(popover, '@react-aria/overlays')
    expect(packageRoot(overlays, '@react-aria/focus')).toBe(
      packageRoot(overlay, '@react-aria/focus')
    )
  })

  it('useDialog 与 <Overlay> 共用同一份 OverlayContext', () => {
    const popover = packageRoot(root, '@heroui/popover')
    const dialog = packageRoot(popover, '@react-aria/dialog')
    expect(packageRoot(dialog, '@react-aria/overlays')).toBe(
      packageRoot(popover, '@react-aria/overlays')
    )
  })

  it('overrides 与 HeroUI 2.8.1 绑定', () => {
    const { dependencies } = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8')
    )
    // 升级 HeroUI 时这里变红: 删掉 pnpm-workspace.yaml 里的整段钉版本, 按新版本发布日期重算
    expect(dependencies['@heroui/react']).toBe('2.8.1')
  })

  it('HeroUIProvider 显式传 locale="zh-CN"', () => {
    // 单实例后弹层 DismissButton 等读屏文案取 HeroUIProvider 的 locale (默认 en-US), 不再退回浏览器语言
    const source = readFileSync(join(root, 'app/providers.tsx'), 'utf8')
    expect(source).toMatch(/<HeroUIProvider\s[^>]*locale="zh-CN"/)
  })
})
