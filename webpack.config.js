const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'atlaskit-bundle.js',
    library: {
      name: 'AtlasKit',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "process": false
    },
    alias: {
      '@atlaskit/adf-schema': path.resolve(__dirname, 'node_modules/@atlaskit/adf-schema'),
      '@atlaskit/adf-schema/schema-default': path.resolve(__dirname, 'node_modules/@atlaskit/adf-schema/schema-default'),
      '@atlaskit/adf-schema/schema-jira': path.resolve(__dirname, 'node_modules/@atlaskit/adf-schema/schema-jira'),
      '@atlaskit/editor-prosemirror': path.resolve(__dirname, 'node_modules/@atlaskit/editor-prosemirror'),
      '@atlaskit/editor-prosemirror/model': path.resolve(__dirname, 'node_modules/@atlaskit/editor-prosemirror/model'),
      '@atlaskit/adf-utils': path.resolve(__dirname, 'node_modules/@atlaskit/adf-utils'),
      '@atlaskit/adf-utils/transforms': path.resolve(__dirname, 'node_modules/@atlaskit/adf-utils/transforms'),
      '@atlaskit/adf-utils/traverse': path.resolve(__dirname, 'node_modules/@atlaskit/adf-utils/traverse'),
      '@atlaskit/feature-gate-js-client': path.resolve(__dirname, 'node_modules/@atlaskit/feature-gate-js-client'),
      'collapse-whitespace': path.resolve(__dirname, 'node_modules/collapse-whitespace')
    }
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          mangle: true
        },
        extractComments: false
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
