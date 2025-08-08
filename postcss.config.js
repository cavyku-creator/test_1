// postcss.config.js  —— 最稳的方式：用插件名字符串，让 PostCSS 自行解析模块
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
