// 乐理主题深化内容：为每个主题提供 detail（深入讲解）与手写真题库。
// 由内容创作阶段逐批写入；THEORY_CONTENT[topicId] 缺失时主题保持原有 concept + 基础题。
import type { MiniQuestion } from './theoryCatalog'

export interface TheoryTopicContent {
  /** 2-3 段深入讲解：概念展开、谱例/声音例子、课堂应用、常见误区 */
  detail: string
  /** 手写真题（含解析），合并时若数量足够将整体替换模板题 */
  quiz: MiniQuestion[]
}

export const THEORY_CONTENT: Record<string, TheoryTopicContent> = {
  // —— 批 1：音高与唱名 / 节奏与节拍 / 记谱与读谱 ——
  // —— 批 2：调式与音阶 / 音程与和声 / 速度力度与表情 ——
  // —— 批 3：曲式结构 / 创作与编配 / 民族与音乐场景 ——
  // —— 批 4-5：扩展主题（theoryExpansion 的 54 个 id）——
}
