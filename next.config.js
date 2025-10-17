/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Отключаем инлайнинг данных для статического экспорта
  experimental: {
    inlineCss: false
  },
  // Компиляторные настройки
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
