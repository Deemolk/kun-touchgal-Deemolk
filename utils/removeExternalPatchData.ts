import type { PatchFormDataShape } from '~/components/edit/types'

// 编辑页的外部标签/会社按 trim 后的名字跨来源去重展示, 移除须从所有来源一并剔除,
// 否则同名项会以下一个来源的身份重新出现并照常提交
export const removeExternalTag = <T extends PatchFormDataShape>(
  data: T,
  name: string
): T => {
  const target = name.trim()
  const keep = (n: string) => n.trim() !== target
  return {
    ...data,
    vndbTags: data.vndbTags.filter(keep),
    bangumiTags: data.bangumiTags.filter(keep),
    steamTags: data.steamTags.filter(keep),
    dlsiteTags: data.dlsiteTags.filter(keep)
  }
}

export const removeExternalCompany = <T extends PatchFormDataShape>(
  data: T,
  name: string
): T => {
  const target = name.trim()
  const keep = (n: string) => n.trim() !== target
  return {
    ...data,
    vndbDevelopers: data.vndbDevelopers.filter(keep),
    bangumiDevelopers: data.bangumiDevelopers.filter(keep),
    steamDevelopers: data.steamDevelopers.filter(keep),
    // 社团链接只用作新建会社的官网, 社团名移除后一并清空
    ...(data.dlsiteCircleName?.trim() === target
      ? { dlsiteCircleName: '', dlsiteCircleLink: '' }
      : {})
  }
}
