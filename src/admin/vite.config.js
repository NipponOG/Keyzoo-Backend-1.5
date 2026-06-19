const { mergeConfig } = require('vite');

module.exports = (config) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    // for domain connection this is required block. if any error occurs, please remove this block and try again.
    // and aslo make sure file name || vite.config.example.js || is renamed to vite.config.js.
    server: {
      allowedHosts: true,
    },
  });
};
