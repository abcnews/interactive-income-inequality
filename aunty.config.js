const path = require('path');

module.exports = {
  type: 'react',
  webpack: config => {
    // Polyfill some node.js APIs via module resolution fallbacks
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      querystring: require.resolve('querystring-es3'),
      url: require.resolve('url/')
    };

    return {
      ...config,
      resolve: {
        alias: {
          react: path.resolve(__dirname, 'node_modules/react')
        }
      }
    };
  }
};
