const { defineConfig } = require('@vue/cli-service')
const path = require('path');
var JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = defineConfig({
  // 基本路径
  publicPath: process.env.NODE_ENV === 'production' ? '/tools/' : '/',

  // 防止源码泄露
  productionSourceMap: false,

  // 输出文件目录
  outputDir: 'dist',

  // 静态资源目录
  assetsDir: 'static',

  // 是否在保存时使用eslint-loader检查
  lintOnSave: process.env.NODE_ENV !== 'production',

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
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      return {
        plugins: [
          new JavaScriptObfuscator({
            // 压缩代码
            compact: true,
            // 随机的死代码块(增加了混淆代码的大小)
            deadCodeInjection: true,
            // 死代码块的影响概率
            deadCodeInjectionThreshold: 0.3,
            // 通过用空函数替换它们来禁用console.log，console.info，console.error和console.warn。这使得调试器的使用更加困难。
            disableConsoleOutput: true,
            debugProtection: true,
            // 标识符的混淆方式 hexadecimal(十六进制) mangled(短标识符)
            identifierNamesGenerator: 'mangled',
            log: false,
            debugProtection: true,
            // 如果选中，则会在“控制台”选项卡上使用间隔强制调试模式，从而更难使用“开发人员工具”的其他功能。
            debugProtectionInterval: 1500,
            // 是否启用全局变量和函数名称的混淆
            renameGlobals: true,
            // 通过固定和随机（在代码混淆时生成）的位置移动数组。这使得将删除的字符串的顺序与其原始位置相匹配变得更加困难。如果原始源代码不小，建议使用此选项，因为辅助函数可以引起注意。
            rotateStringArray: true,
            // 混淆后的代码,不能使用代码美化,同时需要配置 cpmpat:true;
            selfDefending: true,
            // 删除字符串文字并将它们放在一个特殊的数组中
            stringArray: true,
            // 允许启用/禁用字符串转换为unicode转义序列。Unicode转义序列大大增加了代码大小，并且可以轻松地将字符串恢复为原始视图。建议仅对小型源代码启用此选项。
            unicodeEscapeSequence: false
          }, [])
        ]
      }
    }
  },
  chainWebpack(config) {
    if (process.env.NODE_ENV === 'production') {
      config.optimization.splitChunks({
        cacheGroups: {
          common: {//commons 一般是是个人定义的
            name: 'chunk-common', // 打包后的文件名
            chunks: 'initial',
            minChunks: 1,
            maxInitialRequests: 5,
            minSize: 0,
            priority: 1,
            reuseExistingChunk: true
          },
          vendors: {//vendor 是导入的 npm 包
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'initial',
            maxSize: 600000,
            maxInitialRequests: 20,
            priority: 2,
            reuseExistingChunk: true,
            enforce: true
          },
          antDesignVue: {//把antDesignVue从chunk-vendors.js提取出来。当然我们也可以把mixins，vue.min.js等等也按照类似配置提取出来
            name: 'chunk-ant-design-vue',
            test: /[\\/]node_modules[\\/]ant-design-vue[\\/]/,
            chunks: 'initial',
            priority: 3,
            maxSize: 600000,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      })
    }
  }
});