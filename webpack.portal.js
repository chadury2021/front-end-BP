const path = require('path');
const webpack = require('webpack');
const common = require('./webpack.common');
const { merge } = require('webpack-merge');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');

module.exports = merge(common, {
  devtool: 'cheap-module-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['./dev-portal-plugin'],
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'portalbuild'),
    publicPath: 'http://localhost:3000/',
    crossOriginLoading: 'anonymous',
    filename: '[name].js',
    chunkFilename: '[id]-[chunkhash].js',
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'portal-index.html',
      template: 'index.html',
      inject: 'body',
    }),
    // eslint-disable-next-line new-cap
    new htmlWebpackInjectAttributesPlugin({
      crossorigin: 'anonymous',
    }),
  ],
  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': 'https://dev.app.tread.fi',
    },
    allowedHosts: 'all',
    client: {
      webSocketURL: {
        hostname: 'localhost',
        port: 3000,
        protocol: 'ws',
        pathname: '/ws',
      },
    },
  },
});
