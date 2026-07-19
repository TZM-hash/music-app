// 顶层错误边界：任何页面崩溃时显示友好提示而不是白屏，方便课堂现场恢复
import { Component, ErrorInfo, ReactNode } from 'react'
import { stopAllAudio } from '../music/audioEngine'

interface Props {
  children: ReactNode
  /** 出错后点「回到首页」时调用，用于重置路由，避免重新渲染同一个崩溃页面 */
  onReset?: () => void
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 出错时停掉一切后台音频，避免残留
    try {
      stopAllAudio()
    } catch {
      /* ignore */
    }
    console.error('应用出错：', error, info.componentStack)
  }

  recover = (): void => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48 }}>🎵</div>
          <h2 style={{ margin: 0 }}>哎呀，这个页面出了点小问题</h2>
          <p style={{ color: '#666', maxWidth: 420 }}>
            别担心，你的练习记录都还在。点下面的按钮回到首页重新开始吧。
          </p>
          <button
            onClick={this.recover}
            style={{
              padding: '10px 28px',
              fontSize: 16,
              borderRadius: 12,
              border: 'none',
              background: '#4dabf7',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            🏠 回到首页
          </button>
          <small style={{ color: '#aaa' }}>{this.state.error.message}</small>
        </div>
      )
    }
    return this.props.children
  }
}
