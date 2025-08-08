// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  base: '/test_1/', // 仓库名
  plugins: [react()],
});
