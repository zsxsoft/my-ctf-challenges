import path from 'path'
import webpack from 'webpack'
import AssetsPlugin from 'assets-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import merge from 'webpack-merge'

const root = process.cwd()
const src = path.join(root, 'src')
const build = path.join(root, 'build')
const global = require('./webpack.config.global')

// Cache vendor && client javascript on CDN...
const vendor = [
  'react',
  'react-dom',
  'react-router',
  'react-redux',
  'redux'
]

module.exports = merge(global, {
  context: src,
  entry: {
    app: [
      '@babel/polyfill/dist/polyfill.js',
      './client/client.js'
    ],
    vendor
  },
  output: {
    filename: '[name]_[chunkhash].js',
    chunkFilename: '[name]_[chunkhash].js',
    path: build,
    publicPath: 'http://localhost:8664/'
  },
  resolve: {
    extensions: ['.js'],
    modules: [src, 'node_modules'],
    unsafeCache: true
  },
  node: {
    dns: 'mock',
    net: 'mock'
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new ExtractTextPlugin('[name].css'),
    new webpack.NormalModuleReplacementPlugin(/\.\.\/routes\/static/, '../routes/async'),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor', 'manifest'],
      minChunks: Infinity
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    /* minChunkSize should be 50000 for production apps
    * 10 is for this example */
    new webpack.optimize.MinChunkSizePlugin({minChunkSize: 10}),
    new webpack.optimize.UglifyJsPlugin({compressor: {warnings: false}}),
    new AssetsPlugin({path: build, filename: 'assets.json'}),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      '__PRODUCTION__': true,
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
})
