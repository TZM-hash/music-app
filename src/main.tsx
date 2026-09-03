import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
// 全站多分辨率适配补丁：必须在页面样式之后导入。
import './responsive.css'
import './navigation.css'
// 音乐手作乐园视觉层：放在历史样式之后，逐步统一颜色、表面与响应式行为。
import './playful.css'
// 教学展示视口与分页控件：必须最后导入以覆盖历史页面的滚动兜底规则。
import './presentation.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
