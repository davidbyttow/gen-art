/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const template = './src/layout.html'

const pages = [
  { name: 'min-mountains', title: 'Min Mountains' },
]

const buildPages = ({ SRC }) => {
  const entry = pages.reduce((out, { name }) => ({
    ...out,
    [name]: path.join(SRC, name),
  }), {
    index: SRC,
  })

  const plugins = [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      chunks: ['index'],
      inject: false,
      pages,
    }),
  ]

  pages.forEach(({ name, title }) => {
    plugins.push(new HtmlWebpackPlugin({
      title,
      filename: `${name}/index.html`,
      chunks: [name],
      inject: false,
      template,
    }))

    const thumbnail = `${name}/thumbnail.png`

    plugins.push(new CopyWebpackPlugin([
      { from: path.join(SRC, thumbnail), to: thumbnail },
    ]))
  })

  return { entry, plugins }
}

module.exports = buildPages