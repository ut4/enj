const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        app: './src/main.tsx',
        test: './tests/main.ts'
    },
    output: {
        path: __dirname + '/public',
        filename: '[name].bundle.js'
    },
    // Importit jotka tarjoillaan globaaleista muuttujista webpackin sijaan.
    // key === import string, value === globaalin muttujan nimi
    externals: {
        // -- Yhteiset --------------------------
        inferno: 'Inferno',
        history: 'History',
        'inferno-component': 'Inferno.Component',
        'inferno-router': 'Inferno.Router',
        dexie: 'Dexie',
        sw: 'SWManager',
        // -- Testiriippuvuudet -----------------
        qunitjs: 'QUnit',
        sinon: 'sinon',
        'inferno-test-utils': 'Inferno.TestUtils'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        alias: {
            'src': path.resolve(__dirname, 'src/'),
            'tests': path.resolve(__dirname, 'tests/')
        }
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,                          // All ts and tsx files will be process by
                loaders: ['babel-loader', 'ts-loader'], // first babel-loader, then ts-loader
                exclude: /node_modules|public|typings/    // ignore these
            }
        ]
    },
    devServer: {
        contentBase: 'public/',
        proxy: {
            // A request to /api/users will now proxy the request to http://localhost:4567/api/users.
            "/api": "http://localhost:4567"
        },
        historyApiFallback: true
    },
    watchOptions: {
        ignored: /node_modules|public|typings/
    },
    plugins: [
        // By default, webpack does `n=>n` compilation with entry files. This concatenates
        // them into a single chunk.
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        })
    ]
};
