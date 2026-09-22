/** @type {import('next').NextConfig} */
const nextConfig = {
  // Статический экспорт: обязателен для Capacitor — приложение упаковывается
  // как офлайн WebView без Node-сервера. Результат собирается в папку `out/`.
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
