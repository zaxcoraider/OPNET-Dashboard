import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const walletConnectBuild = path.resolve(
  __dirname,
  'node_modules/@btc-vision/walletconnect/build/index.js'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias['@btc-vision/walletconnect'] = walletConnectBuild;

    // Convert pre-minified browser bundles from ESM to CommonJS via babel.
    // These bundles use single-letter top-level variable names (const e, etc.).
    // When webpack scope-hoists ESM modules into one scope those names collide.
    // CJS modules are NEVER scope-hoisted, so converting them eliminates the
    // "Identifier 'e' already declared" production crash entirely.
    config.module.rules.unshift({
      test: /node_modules[\\/](@btc-vision[\\/](transaction|bitcoin)|opnet)[\\/]browser[\\/].*\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: ['@babel/plugin-transform-modules-commonjs'],
          compact: false,
          sourceType: 'module',
        },
      },
    });

    // .d.ts files end in ".ts" so they match Next.js's SWC rule.
    // They have no runtime value — stub them out before any loader runs.
    config.module.rules.unshift({
      test: /\.d\.ts$/,
      enforce: 'pre',
      use: path.resolve(__dirname, 'lib/empty-loader.js'),
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        process: false,
        fs: false,
        path: false,
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }

    return config;
  },
};

export default nextConfig;
