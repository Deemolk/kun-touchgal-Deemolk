import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('useCreatePatchStore 草稿恢复', () => {
  // 草稿按整份 data 持久化, 新增字段之前存下的旧草稿缺这些键; 默认浅合并会让它们
  // 变成 undefined, BatchTag 遍历 dlsiteTags 时整页崩溃
  it('旧草稿缺少的字段回落为初始值, 已有字段照常恢复', async () => {
    const entries: Record<string, string> = {}
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => entries[key] ?? null,
        setItem: (key: string, value: string) => {
          entries[key] = value
        },
        removeItem: (key: string) => {
          delete entries[key]
        }
      }
    })
    const { useCreatePatchStore, createPatchEditStoreKey } =
      await import('~/store/editStore')
    entries[createPatchEditStoreKey] = JSON.stringify({
      state: { data: { name: '旧草稿', tag: ['纯爱'] } },
      version: 0
    })

    await useCreatePatchStore.persist.rehydrate()

    const { data } = useCreatePatchStore.getState()
    expect(data.name).toBe('旧草稿')
    expect(data.tag).toEqual(['纯爱'])
    expect(data.dlsiteTags).toEqual([])
    expect(data.contentLimit).toBe('sfw')
  })
})
