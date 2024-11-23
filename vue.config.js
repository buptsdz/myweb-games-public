const { defineConfig } = require('@vue/cli-service')
module.exports = {
  // 基本路径
  publicPath: process.env.NODE_ENV === 'production' ? '/tools/' : '/',

  // 输出文件目录
  outputDir: 'dist',

  // 静态资源目录
  assetsDir: 'static',

  // 是否在保存时使用eslint-loader检查
  lintOnSave: process.env.NODE_ENV !== 'production',

  // webpack配置
  configureWebpack: {
    // 其他配置
  },

  // 开发服务器配置
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL,
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },

  // 其他配置
};
