const browserList = [
  '>1%',
  'last 4 versions',
  'Firefox ESR'
]
module.exports = ({ file, options, env }) => ({
  parser: file.extname === '.sss' ? 'sugarss' : false,
  plugins: {
    'postcss-import': { root: file.dirname },
    'postcss-cssnext': options.cssnext ? options.cssnext : false,
    'autoprefixer': env === 'production' ? {
      browsers: browserList
    } : false,
    'cssnano': env === 'production' ? {
      preset: 'default'
    } : false
  }
})
