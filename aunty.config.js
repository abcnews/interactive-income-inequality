module.exports = {
  type: 'react',
  webpack: config => {
    // Polyfill some node.js APIs via module resolution fallbacks
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      querystring: require.resolve('querystring-es3'),
      url: require.resolve('url/')
    };

    return config;
  }
};
