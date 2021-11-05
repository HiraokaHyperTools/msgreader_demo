const path = require('path');

module.exports = {
    mode: 'development',
    entry: `./src/index.js`,
    output: {
        filename: "bundle.js",
        path: path.join(__dirname, 'docs')
    },
    resolve: {
        fallback: {
            buffer: require.resolve("buffer/"),
            string_decoder: require.resolve('string_decoder')
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    },
    devtool: 'source-map'
};
