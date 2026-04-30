module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        'plotly.js/dist/plotly': 'plotly.js-basic-dist-min',
      };

      // Exclude the GL map renderer from Babel transforms.
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((subRule) => {
            if (subRule.loader && subRule.loader.includes('babel-loader')) {
              subRule.exclude = Array.isArray(subRule.exclude)
                ? [...subRule.exclude, /node_modules\/maplibre-gl/]
                : [subRule.exclude, /node_modules\/maplibre-gl/].filter(
                    Boolean
                  );
            }
          });
        }
      });

      // Suppress source map warnings for Plotly.js
      webpackConfig.ignoreWarnings = [
        (warning) =>
          warning.module?.resource?.includes('node_modules/plotly.js') &&
          warning.details?.includes('Failed to parse source map'),
      ];

      return webpackConfig;
    },
  },
};
