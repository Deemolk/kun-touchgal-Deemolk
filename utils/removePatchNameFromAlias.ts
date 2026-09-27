// 提交前剔除与游戏名完全相同的别名. 两侧先 trim 再严格比较: 服务端入库前
// 游戏名与别名都会 trim, 按入库值判重
export const removePatchNameFromAlias = (
  alias: readonly string[],
  name: string
): string[] => {
  const trimmedName = name.trim()
  return alias.filter((a) => a.trim() !== trimmedName)
}
