/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Если у вас есть basePath (например, если приложение не в корне домена)
  // basePath: '/your-app-path',
  
  // Опционально: настройки для компрессии
  compress: true,
  
  // Опционально: настройки для улучшения производительности
  poweredByHeader: false,
  
  // Для статических экспортов отключаем API routes
  experimental: {
    appDir: true
  }
}

export default nextConfig
