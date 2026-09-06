import { createHash } from 'node:crypto'
import { createReadStream, promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const GRADE_FOLDERS = new Map([
  ['一上', { grade: 1, semester: 1 }],
  ['二上', { grade: 2, semester: 1 }],
  ['三上', { grade: 3, semester: 1 }],
])

const KIND_BY_EXTENSION = new Map([
  ['.mp3', 'audio'],
  ['.wav', 'audio'],
  ['.m4a', 'audio'],
  ['.ogg', 'audio'],
  ['.jpg', 'image'],
  ['.jpeg', 'image'],
  ['.png', 'image'],
  ['.gif', 'image'],
  ['.svg', 'image'],
  ['.mp4', 'video'],
  ['.webm', 'video'],
  ['.html', 'html'],
  ['.htm', 'html'],
  ['.js', 'script'],
  ['.css', 'style'],
  ['.doc', 'document'],
  ['.docx', 'document'],
  ['.pdf', 'document'],
])

const EXCLUDED_SEGMENTS = ['__macosx', '.ds_store', 'backup', '备份', '副本']

const CANDIDATE_USE_RULES = [
  { terms: ['乐器', '木鱼', '响板', '碰钟', '钢琴', '小提琴', '笛子'], use: 'instrument-detective' },
  { terms: ['长短', '长音', '短音'], use: 'long-short-sort' },
  { terms: ['强弱', '力度', '渐强', '渐弱'], use: 'listen-and-choose' },
  { terms: ['节奏', '时值', '拍子', '拍号'], use: 'rhythm-builder' },
  { terms: ['情绪', '故事', '劳动号子'], use: 'listen-and-choose' },
  { terms: ['演唱', '齐唱', '合唱', '轮唱', '声部'], use: 'voice-form-guess' },
]

function normalizePath(value) {
  return String(value).replaceAll('\\', '/').replace(/^\.\//, '')
}

function parseCourseInfo(relativePath) {
  const [folder] = normalizePath(relativePath).split('/')
  return GRADE_FOLDERS.get(folder) ?? { grade: null, semester: null }
}

function isExcludedPath(relativePath) {
  const normalized = normalizePath(relativePath).toLowerCase()
  return EXCLUDED_SEGMENTS.some((segment) => normalized.includes(segment.toLowerCase()))
}

function getCandidateUses(relativePath) {
  const normalized = normalizePath(relativePath)
  return CANDIDATE_USE_RULES.filter(({ terms }) => terms.some((term) => normalized.includes(term))).map(
    ({ use }) => use
  )
}

function getHash(bytes) {
  const input = Buffer.isBuffer(bytes) ? bytes : Buffer.from(String(bytes ?? ''))
  return createHash('sha256').update(input).digest('hex')
}

export function classifyReferenceFile(relativePath) {
  const normalized = normalizePath(relativePath)
  const info = parseCourseInfo(normalized)
  const extension = path.extname(normalized).toLowerCase()
  const kind = KIND_BY_EXTENSION.get(extension) ?? 'unknown'

  return {
    grade: info.grade,
    semester: info.semester,
    kind,
    status: isExcludedPath(normalized) ? 'excluded' : kind === 'unknown' ? 'review' : 'selected',
  }
}

export function buildReferenceInventory(entries) {
  const selectedByHash = new Map()
  const sortedEntries = [...entries].sort((a, b) => normalizePath(a.path).localeCompare(normalizePath(b.path), 'zh-CN'))

  return sortedEntries.map((entry) => {
    const relativePath = normalizePath(entry.path)
    const classification = classifyReferenceFile(relativePath)
    const extension = path.extname(relativePath).toLowerCase()
    const sha256 = entry.sha256 ?? getHash(entry.bytes)
    const base = {
      relativePath,
      grade: classification.grade,
      semester: classification.semester,
      extension,
      kind: classification.kind,
      size: Number.isFinite(entry.size) ? Number(entry.size) : 0,
      sha256,
      status: classification.status,
      duplicateOf: null,
      candidateUses: classification.status === 'selected' ? getCandidateUses(relativePath) : [],
    }

    if (classification.status === 'selected') {
      const previous = selectedByHash.get(sha256)
      if (previous) {
        return { ...base, status: 'excluded', duplicateOf: previous }
      }
      selectedByHash.set(sha256, relativePath)
    }

    return base
  })
}

async function collectFiles(root) {
  const result = []

  async function visit(directory) {
    const children = await fs.readdir(directory, { withFileTypes: true })
    for (const child of children) {
      const absolutePath = path.join(directory, child.name)
      if (child.isDirectory()) {
        await visit(absolutePath)
        continue
      }
      if (!child.isFile()) continue
      const stats = await fs.stat(absolutePath)
      result.push({
        path: path.relative(root, absolutePath),
        size: stats.size,
        sha256: await hashFile(absolutePath),
      })
    }
  }

  await visit(root)
  return result
}

async function hashFile(filePath) {
  const hash = createHash('sha256')
  const stream = createReadStream(filePath)
  for await (const chunk of stream) hash.update(chunk)
  return hash.digest('hex')
}

async function writeInventory(root, outputDirectory) {
  const entries = buildReferenceInventory(await collectFiles(root))
  await fs.mkdir(outputDirectory, { recursive: true })
  await fs.writeFile(
    path.join(outputDirectory, 'asset-manifest.json'),
    `${JSON.stringify(entries, null, 2)}\n`,
    'utf8'
  )
  return entries
}

function parseArgument(args, name) {
  const index = args.indexOf(name)
  const value = index >= 0 ? args[index + 1] : undefined
  if (!value || value.startsWith('--')) throw new Error(`缺少参数 ${name} 的值`)
  return value
}

export async function main(args = process.argv.slice(2)) {
  const root = path.resolve(parseArgument(args, '--root'))
  const outputDirectory = path.resolve(parseArgument(args, '--out'))
  let rootStats
  try {
    rootStats = await fs.stat(root)
  } catch {
    throw new Error(`参考目录不存在：${root}`)
  }
  if (!rootStats.isDirectory()) throw new Error(`参考路径不是目录：${root}`)

  const entries = await writeInventory(root, outputDirectory)
  const selected = entries.filter((entry) => entry.status === 'selected').length
  const excluded = entries.filter((entry) => entry.status === 'excluded').length
  const review = entries.filter((entry) => entry.status === 'review').length
  console.log(`已生成 ${path.join(outputDirectory, 'asset-manifest.json')}`)
  console.log(`资源：保留 ${selected}，排除 ${excluded}，待审 ${review}`)
}

const currentFile = pathToFileURL(fileURLToPath(import.meta.url)).href
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === currentFile) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
