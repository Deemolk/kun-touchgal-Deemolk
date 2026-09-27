import { describe, expect, it } from 'vitest'
import {
  removeExternalCompany,
  removeExternalTag
} from '~/utils/removeExternalPatchData'
import type { PatchFormDataShape } from '~/components/edit/types'

const base: PatchFormDataShape = {
  name: '游戏名',
  vndbId: '',
  vndbRelationId: '',
  bangumiId: '',
  steamId: '',
  dlsiteCode: '',
  dlsiteCircleName: '',
  dlsiteCircleLink: '',
  vndbTags: [],
  vndbDevelopers: [],
  bangumiTags: [],
  bangumiDevelopers: [],
  steamTags: [],
  steamDevelopers: [],
  dlsiteTags: [],
  alias: [],
  tag: [],
  released: ''
}

describe('removeExternalTag', () => {
  it('从所有来源剔除同名标签, 其余保持原顺序', () => {
    const result = removeExternalTag(
      {
        ...base,
        vndbTags: ['A', '纯爱', 'B'],
        bangumiTags: ['纯爱'],
        steamTags: ['C', '纯爱'],
        dlsiteTags: ['纯爱', 'D']
      },
      '纯爱'
    )
    expect(result.vndbTags).toEqual(['A', 'B'])
    expect(result.bangumiTags).toEqual([])
    expect(result.steamTags).toEqual(['C'])
    expect(result.dlsiteTags).toEqual(['D'])
  })

  it('按 trim 后的名字匹配', () => {
    const result = removeExternalTag(
      { ...base, vndbTags: [' 纯爱 ', 'A'], steamTags: ['纯爱'] },
      '纯爱'
    )
    expect(result.vndbTags).toEqual(['A'])
    expect(result.steamTags).toEqual([])
  })

  it('不动手动标签与会社', () => {
    const result = removeExternalTag(
      {
        ...base,
        vndbTags: ['纯爱'],
        tag: ['纯爱'],
        vndbDevelopers: ['纯爱']
      },
      '纯爱'
    )
    expect(result.tag).toEqual(['纯爱'])
    expect(result.vndbDevelopers).toEqual(['纯爱'])
  })
})

describe('removeExternalCompany', () => {
  it('从所有来源剔除同名会社并清空同名 DLsite 社团及其链接', () => {
    const result = removeExternalCompany(
      {
        ...base,
        vndbDevelopers: ['Key', 'A'],
        bangumiDevelopers: [' Key '],
        steamDevelopers: ['Key', 'B'],
        dlsiteCircleName: 'Key ',
        dlsiteCircleLink:
          'https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG00000.html'
      },
      'Key'
    )
    expect(result.vndbDevelopers).toEqual(['A'])
    expect(result.bangumiDevelopers).toEqual([])
    expect(result.steamDevelopers).toEqual(['B'])
    expect(result.dlsiteCircleName).toBe('')
    expect(result.dlsiteCircleLink).toBe('')
  })

  it('DLsite 社团名不同名时保留社团及其链接', () => {
    const result = removeExternalCompany(
      {
        ...base,
        vndbDevelopers: ['Key'],
        dlsiteCircleName: '社团',
        dlsiteCircleLink: 'https://example.com'
      },
      'Key'
    )
    expect(result.vndbDevelopers).toEqual([])
    expect(result.dlsiteCircleName).toBe('社团')
    expect(result.dlsiteCircleLink).toBe('https://example.com')
  })

  it('不动外部标签', () => {
    const result = removeExternalCompany(
      { ...base, vndbDevelopers: ['Key'], vndbTags: ['Key'] },
      'Key'
    )
    expect(result.vndbTags).toEqual(['Key'])
  })
})
