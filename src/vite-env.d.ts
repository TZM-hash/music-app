/// <reference types="vite/client" />

// 本地钢琴采样：Vite 打包后会内联为 base64 data URL，供离线单文件使用
declare module '*.mp3' {
  const src: string
  export default src
}
