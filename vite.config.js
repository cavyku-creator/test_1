// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// !!! 将 test_1 改成你的仓库名（保持完全一致） !!!
export default defineConfig({
  plugins: [react()],
  base: '/test_1/',   // <- 关键
})
