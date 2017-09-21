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
        'inferno-component': 'Inferno.Component',
        'inferno-router': 'Inferno.Router',
        history: 'History',
        dexie: 'Dexie',
        pikaday: 'Pikaday',
        chartist: 'Chartist',
        sw: 'SWManager',
        // -- Testiriippuvuudet -----------------
        'inferno-test-utils': 'Inferno.TestUtils',
        qunitjs: 'QUnit',
        sinon: 'sinon'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules|public|typings/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            'src': __dirname + '/src/',
            'tests': __dirname + '/tests/'
        }
    },
    devServer: {
        contentBase: './public/',
        hot: false,
        inline: false,
        proxy: {
            // A request to /api/users will now proxy the request to http://localhost:4567/api/users.
            "/api": "http://localhost:4567"
        }
    }
};
