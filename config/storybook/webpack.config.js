const path = require('path')
module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.vue$/,
    loader: 'storybook-addon-vue-info/loader',
    enforce: 'post'
  })
  config.module.rules.push({
    test: /\.md$/,
    loader: ['html-loader', 'markdown-loader']
  })
  config.module.rules.push({
    test: /\.scss$/,
    loaders: ['style-loader', 'css-loader', 'sass-loader'],
    include: path.resolve(__dirname, "../")
  });
  return config
}
