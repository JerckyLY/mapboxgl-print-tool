'use strict'

const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const resolve = dir => path.join(__dirname, '.', dir)

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
    entry: {
        index: './src/index.js'
    },
    externals: { // npm原则，const FileSaver = require('file-saver'); 不同模块 使用不同依赖，root为浏览器环境下
        "file-saver":{
            commonjs:"file-saver",
            commonjs2:'file-saver',
            amd:"file-saver",
            root:'FileSaver'
        },
        "mapbox-gl":{
            commonjs:"mapbox-gl",
            commonjs2:'mapbox-gl',
            amd:"mapbox-gl",
            root:"mapboxgl"
        }
    },
    output: {
        path: resolve('dist'), // 输出目录
        filename: 'index.js', // 输出文件
        libraryTarget: 'umd', // 采用通用模块定义
        library: 'MapPrintTool', // 库名称
        libraryExport: 'default', // 兼容 ES6(ES2015) 的模块系统、CommonJS 和 AMD 模块规范
        globalObject: 'this' // 兼容node和浏览器运行，避免window is not undefined情况
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: [resolve('src')],
                exclude:/node_modules/
            }
        ]
    },
    plugins: isProd
        ? [
            new UglifyJsPlugin({
                parallel: true,
                uglifyOptions: {
                    compress: {
                        warnings: false
                    },
                    mangle: true
                },
                sourceMap: true
            })
        ]
        : [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            new webpack.NoEmitOnErrorsPlugin()
        ]
}
