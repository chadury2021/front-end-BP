const path = require('path');

module.exports = {
  entry: {
    main: path.resolve(__dirname, 'src/index.jsx'),
  },
  resolve: {
    extensions: ['.*', '.ts', '.js', '.jsx', '.css'],
    modules: [path.resolve(__dirname, 'node_modules')],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@images': path.resolve(__dirname, 'images'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        type: 'asset',
      },
      {
        test: /\.(png|gif|webp|woff|woff2|eot|ttf|mp3)$/,
        loader: 'file-loader',
      },
    ],
  },
};
