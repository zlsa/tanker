
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
  entry: './src/main.js',
  devtool: 'source-map',
  target: 'web',
  
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: "/build/",
    filename: 'bundle.js'
  },

  node: {
    fs: "empty"
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.html$/,
        loader: 'file?name=[name].[ext]'
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: 'url-loader'
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192'
      }
    ]
  },

  plugins: [
    new CopyWebpackPlugin([
      {
        'from': 'src/models/',
        to: 'models/'
      }

    ], {
      ignore: [
        '*.blend*',
      ]
    })
  ],
  
  resolve: {
    extensions: ['', '.js', '.css'],
    
    root: [
      path.resolve(path.join(__dirname, 'src'))
    ]
  }
};
