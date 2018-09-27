const merge = require('webpack-merge');
const webpackBase = require('./webpack.base.additions.js');

module.exports = merge(webpackBase, {
  module: {
    rules: [
      {
        test: /\.styl(us)$/,
        loader: 'style-loader!css-loader!stylus-loader',
      },
    ],
  },
});
