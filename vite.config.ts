import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  // 用相对路径，保证打包后的单文件可用 file:// 直接双击打开
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    // 全部内联进单个 HTML
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  server: {
    host: true,
    port: 5173,
  },
})
