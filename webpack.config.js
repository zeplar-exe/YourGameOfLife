const path = require('path');
const Copy = require("copy-webpack-plugin");

module.exports = {
    mode: "development",
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/dist/"
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /(\.vert)|(\.frag)/,
                type: "asset/source"
            }
        ],
    },
    plugins: [
        new Copy({
            patterns: [
                { from: "src/index.html", to: "index.html" }
            ]
        })
    ]
};