import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

const root = process.cwd()
const src = path.join(root, 'src')

const clientSrc = path.join(src, 'client')
const universalSrc = path.join(src, 'universal')

const clientInclude = [clientSrc, universalSrc]

const postcssLoader = {
  loader: 'postcss-loader',
  options: {
    config: {
      path: path.join(__dirname, './postcss.config.js')
    }
  }
}
const cssLoader = {
  loader: 'css-loader',
  options: {
    root: src,
    modules: true,
    importLoaders: 1,
    localIdentName: '[name]_[local]_[hash:base64:5]'
  }}

const extractStyles = loaders => {
  if (process.env.NODE_ENV === 'production') {
    return ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: loaders
    })
  }
  return ['style-loader', ...loaders]
}

module.exports = {
  context: src,
  resolve: {
    extensions: ['.js'],
    modules: [src, 'node_modules'],
    unsafeCache: true
  },
  module: {
    loaders: [
      {test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }
      },

      // JavaScript
      {test: /\.js$/,
        loader: 'babel-loader',
        include: clientInclude
      },

      {
        test: /\.s[ac]ss$/,
        exclude: /node_modules/,
        use: extractStyles([
          cssLoader,
          postcssLoader,
          { loader: 'sass-loader', query: { sourceMap: false } }
        ]
        )
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: extractStyles([
          cssLoader,
          postcssLoader
        ]
        )
      }

    ]
  }
}
