const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        app: './src/index.tsx',
        test: './tests/index.ts'
    },
    output: {
        path: __dirname + '/public',
        filename: '[name].bundle.js'
    },
    externals: {
        qunitjs: 'QUnit',
        sinon: 'sinon'
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ],
        alias: {
            'src': path.resolve(__dirname, 'src/'),
            'tests': path.resolve(__dirname, 'tests/')
        }
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,                          // All ts and tsx files will be process by
                loaders: [ 'babel-loader', 'ts-loader' ], // first babel-loader, then ts-loader
                exclude: /node_modules/                   // ignore node_modules
            }
        ]
    },
    devServer: {
        contentBase: 'public/',
        historyApiFallback: true
    },
    watchOptions: {
        ignored: /node_modules|public/
    },
    plugins: [
        // By default, webpack does `n=>n` compilation with entry files. This concatenates
        // them into a single chunk.
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        })
    ]
};
