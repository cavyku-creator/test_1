import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import './index.css'   // Tailwind 指令 + 主题变量
import './app.css'     // 你的自定义增强样式（光晕背景、hover 阴影等）

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
