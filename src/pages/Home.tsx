import { useApp, Route } from '../state/appState'
import { loadProgress, BADGE_INFO } from '../state/progress'
import { getCurrentStudent } from '../state/students'
import { classOverview } from '../state/stats'
import { allSongs } from '../music/songLibrary'

interface Tile {
  route: Route
  emoji: string
  title: string
  desc: string
  color: string
}

const INSTRUMENTS: Tile[] = [
  {
    route: 'piano',
    emoji: '🎹',
    title: '虚拟钢琴',
    desc: '点击/键盘弹奏 · 节拍器 · 音阶高亮 · 录制回放',
    color: 'linear-gradient(135deg,#ff6b6b,#ffa94d)',
  },
  {
    route: 'drums',
    emoji: '🥁',
    title: '架子鼓',
    desc: '敲出节奏 · 节奏循环机',
    color: 'linear-gradient(135deg,#4dabf7,#3b5bdb)',
  },
  {
    route: 'recorder',
    emoji: '🎵',
    title: '竖笛',
    desc: '吹奏+指法图 · 小学必修乐器',
    color: 'linear-gradient(135deg,#20c997,#0ca678)',
  },
  {
    route: 'mixer',
    emoji: '🎛️',
    title: '混音器',
    desc: '多轨编曲 · 自选乐器 · 做自己的音乐',
    color: 'linear-gradient(135deg,#22b8cf,#0c8599)',
  },
]

const GAMES: Tile[] = [
  {
    route: 'game-taiko',
    emoji: '🥁',
    title: '咚咔鼓手',
    desc: '咚咔节奏 · 魂值气槽 · 连击',
    color: 'linear-gradient(135deg,#ff8787,#e03131)',
  },
  {
    route: 'game-sing',
    emoji: '🎤',
    title: '唱歌评分',
    desc: '对麦克风跟唱 · 实时音准评分',
    color: 'linear-gradient(135deg,#f783ac,#d6336c)',
  },
  {
    route: 'game-rhythm',
    emoji: '🕺',
    title: '节奏回响',
    desc: '听一遍·拍一遍·单键跟拍',
    color: 'linear-gradient(135deg,#f783ac,#e64980)',
  },
  {
    route: 'game-read',
    emoji: '🎼',
    title: '识谱训练',
    desc: '看五线谱认音 · 高低音谱号',
    color: 'linear-gradient(135deg,#ffd43b,#f59f00)',
  },
  {
    route: 'game-ear',
    emoji: '👂',
    title: '听音辨调',
    desc: '听一个音，猜猜它是哪个键',
    color: 'linear-gradient(135deg,#51cf66,#2f9e44)',
  },
]

const TOOLS: Tile[] = [
  {
    route: 'library',
    emoji: '🎵',
    title: '曲库',
    desc: '分类浏览 · 试听 · 看乐谱',
    color: 'linear-gradient(135deg,#22b8cf,#1098ad)',
  },
  {
    route: 'theory',
    emoji: '📖',
    title: '乐理知识',
    desc: '知识卡片 + 乐理小测验',
    color: 'linear-gradient(135deg,#845ef7,#5f3dc4)',
  },
]

export default function Home() {
  const { navigate, mode } = useApp()
  const progress = loadProgress()
  const student = getCurrentStudent()
  const overview = classOverview()
  const songCount = allSongs().length

  return (
    <div>
      <div className="home-hero">
        <h1>🎵 乐动课堂</h1>
        <p>
          {mode === 'teacher'
            ? '课堂投屏工作台 · 选择下方模块开始教学'
            : '快来玩音乐吧！选一个开始练习'}
        </p>
      </div>

      {/* 当前状态条 */}
      <div className="home-status">
        <div className="status-chip">
          <span className="chip-icon">{student ? student.avatar : '👤'}</span>
          <span>
            当前学生：<b>{student ? student.name : '匿名（成绩不计入统计）'}</b>
          </span>
          <button className="chip-link" onClick={() => navigate('class')}>
            切换
          </button>
        </div>
        <div className="status-chip">🎼 曲库 <b>{songCount}</b> 首</div>
        <div className="status-chip">🎮 累计练习 <b>{overview.totalSessions}</b> 次</div>
        <div className="status-chip">⭐ 全班星星 <b>{overview.totalStars}</b></div>
      </div>

      <div className="section-label">🎸 虚拟乐器</div>
      <div className="tile-grid" style={{ marginBottom: 28 }}>
        {INSTRUMENTS.map((t) => (
          <TileCard key={t.route} tile={t} onClick={() => navigate(t.route)} />
        ))}
      </div>

      <div className="section-label">🎮 音乐游戏</div>
      <div className="tile-grid" style={{ marginBottom: 28 }}>
        {GAMES.map((t) => {
          const best = progress.bestScores[t.route] ?? 0
          return (
            <TileCard
              key={t.route}
              tile={t}
              onClick={() => navigate(t.route)}
              footer={best > 0 ? `最高分 ${best}` : undefined}
            />
          )
        })}
      </div>

      <div className="section-label">🛠️ 曲目工具</div>
      <div className="tile-grid">
        {TOOLS.map((t) => (
          <TileCard key={t.route} tile={t} onClick={() => navigate(t.route)} />
        ))}
      </div>

      {progress.badges.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 28 }}>
            🏅 我的徽章
          </div>
          <div className="badge-shelf">
            {progress.badges.map((b) => (
              <div key={b} className="card badge-tile">
                <div style={{ fontSize: '2rem' }}>{BADGE_INFO[b]?.icon ?? '🎖️'}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  {BADGE_INFO[b]?.name ?? b}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TileCard({
  tile,
  onClick,
  footer,
}: {
  tile: Tile
  onClick: () => void
  footer?: string
}) {
  return (
    <button className="tile" style={{ background: tile.color }} onClick={onClick}>
      <span className="emoji">{tile.emoji}</span>
      <h3>{tile.title}</h3>
      <p>{tile.desc}</p>
      {footer && <p style={{ fontWeight: 700 }}>{footer}</p>}
    </button>
  )
}
