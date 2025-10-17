/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Важно: экспорт статических файлов
  trailingSlash: true,
  images: {
    unoptimized: true, // Для статического экспорта
  },
  // Убедитесь, что basePath правильный, если приложение не в корне
  // basePath: '/your-app-path',
}

module.exports = nextConfig
