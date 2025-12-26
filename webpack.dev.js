const path = require('path');
const webpack = require('webpack');
// eslint-disable-next-line import/no-extraneous-dependencies
const { merge } = require('webpack-merge');
// eslint-disable-next-line import/no-extraneous-dependencies
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.common');

module.exports = merge(common, {
  devtool: 'cheap-module-source-map',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../core/static/react_frontend/build'),
    publicPath: '/',
    filename: '[name].[contenthash].js',
    chunkFilename: '[id]-[chunkhash].js', // DO have Webpack hash chunk filename, see below
    clean: true,
  },
  plugins: [
    // Don't output new files if there is an error
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      inject: 'body',
      templateContent:
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/><title>Tread App</title></head><body><div id="root"></div></body></html>',
    }),
  ],
  devServer: {
    server: 'https',
    port: 3000,
    historyApiFallback: true,
    hot: true,
    allowedHosts: 'all',
    client: {
      webSocketURL: {
        hostname: 'localhost',
        port: 3000,
        protocol: 'wss',
        pathname: '/ws',
      },
    },
    proxy: [
      {
        context: ['/api', '/internal', '/account', '/dicy', '/static/libs'],
        target: 'https://dev.app.tread.fi',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: '',
      },
      {
        context: ['/ws/prices'],
        target: 'wss://dev.app.tread.fi',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    ],
  },
});
