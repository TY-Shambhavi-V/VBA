module.exports = {
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg')

    svgRule.uses.clear()

    svgRule
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
    config.module
      .rule('storysource')
      .test(/\.stories\.js?$/)
      .post()
      .use('storysource')
      .loader(require.resolve('@storybook/addon-storysource/loader'))
  }
}
