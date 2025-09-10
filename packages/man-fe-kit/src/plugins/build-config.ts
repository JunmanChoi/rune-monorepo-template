import webpack, { type Configuration } from "webpack";

export const setClientConfig =
  (option: { project: string; alias?: Record<string, string> }) =>
  (config: Configuration, is_dev: boolean) => {
    config.output = {
      ...config.output,
      devtoolModuleFilenameTemplate: (info) => {
        return `${info.absoluteResourcePath.replace(/\\/g, "/")}`;
      },
    };

    if (config.module?.rules) {
      config.module.rules.unshift({
        test: /\.(ts)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: [
          {
            loader: "@man/fe-kit/plugins/remove-get-server-side-props-loader",
          },
        ],
      });
    }

    config.resolve = {
      ...config.resolve,
      fallback: {
        ["crypto"]: false,
        ["node:crypto"]: false,
        ["fs"]: false,
        ["path"]: false,
        ["os"]: false,
      },
      alias: {
        ...option.alias,
      },
    };

    config.plugins = [
      ...(config.plugins ?? []),
      new webpack.DefinePlugin({
        "process.env.npm_package_name": JSON.stringify(
          (process.env.npm_package_name ?? "")?.replace("/", "-")
        ),
        "process.env.npm_package_version": JSON.stringify(
          process.env.npm_package_version
        ),
        "process.env.RUNTIME_ENV": JSON.stringify(process.env.RUNTIME_ENV),
        "process.env.BE__AWS_SOCKET_HOST": JSON.stringify(
          process.env.BE__AWS_SOCKET_HOST
        ),
        "process.env.AWS_STATIC_ASSET_HOST": JSON.stringify(
          process.env.AWS_STATIC_ASSET_HOST
        ),
      }),
    ];

    config.optimization = {
      ...config.optimization,
      innerGraph: true,
      splitChunks: {
        cacheGroups: {
          bundle: {
            name: "main",
            test: /[\\/]src[\\/]/,
            chunks: "async",
            reuseExistingChunk: true,
          },
          vendors: {
            name: "vendors",
            test: /[\\/]node_modules[\\/]/,
            chunks: "initial",
            enforce: true,
            minSize: 0,
            reuseExistingChunk: true,
          },
          module: {
            name: "main",
            test: /\.module\.(sa|sc|c)ss$/i,
            chunks: "all",
            enforce: true,
            priority: 10,
            minSize: 0,
          },
          common: {
            name: "common",
            test: /^(?!.*\.module\.scss$).*\.scss$/,
            chunks: "all",
            enforce: true,
            priority: 10,
            minSize: 0,
          },
          packages: {
            name: "packages",
            test: /[\\/]packages[\\/]/,
            chunks: "all",
            enforce: true,
            minSize: 0,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // RPOD 환경에서 필요한 로직 실행 ex) sentry
    if (!is_dev) {
    }

    return config;
  };

export const setServerConfig =
  (option: { project: string; alias?: Record<string, string> }) =>
  (config: Configuration, is_dev: boolean) => {
    config.output = {
      ...config.output,
      devtoolModuleFilenameTemplate: (info) => {
        return `${info.absoluteResourcePath.replace(/\\/g, "/")}`;
      },
    };

    config.resolve = {
      ...config.resolve,
      alias: {
        ...option.alias,
        // 서버 사이드에서는 로드 X
        swiper: false,
      },
    };

    // RPOD 환경에서 필요한 로직 실행 ex) sentry
    if (!is_dev) {
    }

    return config;
  };
