/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Отключаем API routes для статического экспорта
  skipTrailingSlashRedirect: true,
}

export default nextConfig
