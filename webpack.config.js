const path = require('path');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: `./src/index.ts`,
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        fallback: {
            buffer: require.resolve("buffer/"),
            string_decoder: require.resolve('string_decoder')
        }
    },
    output: {
        filename: "bundle.js",
        path: path.join(__dirname, 'docs')
    }
};
