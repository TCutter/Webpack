const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin') // 根据模版生成 HTML 文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin') // 将 css 单独打包成文件
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin') // 压缩 css

module.exports = {
    entry: {
        app: './src/index.js'
    },
    output: {
        publicPath: './', // js 引用的路径或者 CDN 地址(当前工作环境的根目录)
        path: path.resolve(__dirname, 'dist'), // 打包文件的输出目录
        filename: '[name].bundle.js', // 代码打包后的文件名
        chunkFilename: '[name].js' // 代码拆分后的文件名
    },
    optimization: {
        /**
         * 代码分割
         * webpack4 以下使用 webpack.optimize.CommonsChunkPlugin
         */
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                lodash: {
                  name: 'lodash',
                  test: /[\\/]node_modules[\\/]lodash[\\/]/,
                  priority: 5  // 优先级要大于 vendors 不然会被打包进 vendors
                },
                commons: {
                    name: 'commons',
                    minSize: 0, //表示在压缩前的最小模块大小,默认值是 30kb
                    minChunks: 2, // 最小公用次数
                    priority: 5, // 优先级
                    reuseExistingChunk: true // 公共模块必开启
                },
                vendors: {
                  test: /[\\/]node_modules[\\/]/, // 只有 node_modules 引入的第三方库会被分割, 所有  node_modules 文件夹下的文件都会被打包到 vendor.js 文件中去
                  priority: -10
                },
                default: {
                  minChunks: 2,
                  priority: -20,
                  reuseExistingChunk: true
                }
              }
        }
    },
    plugins: [
        new CleanWebpackPlugin(), // 默认情况下，此插件将删除 webpack output.path目录中的所有文件，以及每次成功重建后所有未使用的 webpack 资产
        new HtmlWebpackPlugin({
            title: '自动生成 HTML', // 打包后生成 html 的 title
            minify: {
                // 压缩 HTML 文件
                removeComments: true, // 移除 HTML 中的注释
                collapseWhitespace: true, // 删除空白符与换行符
                minifyCSS: true // 压缩内联 css
            },
            filename: 'index.html', // 生成后的文件名
            template: 'index.html' // 根据此模版生成 HTML 文件(根目录下的 index.html)
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        }),
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano'), //用于优化\最小化 CSS 的 CSS处理器，默认为 cssnano
            cssProcessorOptions: {
                safe: true,
                discardComments: {
                    removeAll: true
                }
            }, //传递给 cssProcessor 的选项，默认为{}
            canPrint: true //布尔值，指示插件是否可以将消息打印到控制台，默认为 true
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/, // 使用正则来匹配 js 文件
                exclude: /node_modules/, // 排除依赖包文件夹
                use: {
                  loader: 'babel-loader', // 使用 babel-loader
                  options: {//如果有这个设置则不用再添加.babelrc文件进行配置
                        "babelrc": false,// 不采用.babelrc的配置
                        "plugins": [
                            "dynamic-import-webpack" // 允许使用 import() 语法动态导入 js 文件
                        ]
                    }
                }
            },
            {
                test: /\.css$/, // 针对 .css 后缀的文件设置 loader
                use: [ // 右边和下面先执行
                    {
                        loader: MiniCssExtractPlugin.loader
                    }, 
                    {
                        loader: 'css-loader', // 主要用于处理 css 文件中 @import 和 url() 等声明
                        options: {
                          importLoaders: 2 // 在一个 css 中引入了另一个 css，也会执行之前两个 loader
                        }
                    },
                    // 使用 postcss 为 css 加上浏览器前缀
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [require('autoprefixer')] // 为 CSS 加上浏览器前缀
                        }
                    },
                    // 使用 sass-loader 将 scss 转为 css
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|jpe?g|gif)$/,
                use: [
                    {
                        loader: 'url-loader', // url-loader 依赖 file-loader，url-loader 可以看作是增强版的 file-loader
                        options: {
                            name: '[name]-[hash:5].min.[ext]',
                            output: 'images/',
                            limit: 20000 //把小于 20kb 的文件转成 Base64 的格式
                        }
                    },
                    // img-loader for zip img
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            // 压缩 jpg/jpeg 图片
                            mozjpeg: {
                                progressive: true,
                                quality: 65 // 压缩率
                            },
                            // 压缩 png 图片
                            pngquant: {
                                quality: '65-90',
                                speed: 4
                            }
                        }
                    }
                ]
            }
        ]
    }
}
