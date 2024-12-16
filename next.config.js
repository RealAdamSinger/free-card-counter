/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      })
    }
    
    // Fix a bug with worker-loader
    config.output.globalObject = 'self'

    return config
  },
}

module.exports = nextConfig
