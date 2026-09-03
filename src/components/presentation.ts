/**
 * 教学展示视口共用的分页纯函数。
 * 页面组件只负责保存当前页，边界和列表切片统一在这里处理，
 * 这样桌面投屏与移动端使用同一套可预测的切换规则。
 */
export function clampPageIndex(index: number, pageCount: number): number {
  const count = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0
  if (count <= 1) return 0

  const value = Number.isFinite(index) ? Math.floor(index) : 0
  return Math.min(count - 1, Math.max(0, value))
}

export function getPageSlice<T>(items: readonly T[], pageIndex: number, pageSize: number): {
  items: T[]
  pageCount: number
  pageIndex: number
} {
  const size = Number.isFinite(pageSize) ? Math.floor(pageSize) : 0
  if (size <= 0 || items.length === 0) {
    return { items: [...items], pageCount: 1, pageIndex: 0 }
  }

  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const safeIndex = clampPageIndex(pageIndex, pageCount)
  const start = safeIndex * size
  return {
    items: items.slice(start, start + size),
    pageCount,
    pageIndex: safeIndex,
  }
}
