module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        // Iterate through the rules and exclude mapbox-gl from babel transforms
        webpackConfig.module.rules.forEach((rule) => {
          if (rule.oneOf) {
            rule.oneOf.forEach((subRule) => {
              if (
                subRule.loader &&
                subRule.loader.includes('babel-loader')
              ) {
                subRule.exclude = Array.isArray(subRule.exclude)
                  ? [...subRule.exclude, /node_modules\/mapbox-gl/]
                  : [subRule.exclude, /node_modules\/mapbox-gl/].filter(Boolean);
              }
            });
          }
        });
        return webpackConfig;
      },
    },
  };
  