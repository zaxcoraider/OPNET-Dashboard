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

    // .d.ts files end in ".ts" so they match Next.js's SWC rule.
    // They have no runtime value — stub them out before any loader runs.
    config.module.rules.unshift({
      test: /\.d\.ts$/,
      enforce: 'pre',
      use: path.resolve(__dirname, 'lib/empty-loader.js'),
    });

    if (!isServer) {
      // Disable scope hoisting (module concatenation) for the client bundle.
      // @btc-vision browser bundles use top-level ESM imports; webpack detects
      // them as ESM and concatenates them into one scope, causing
      // "Identifier 'e3' already declared" collisions in minified output.
      // WalletProvider already loads them in a separate async chunk via
      // next/dynamic, but disabling concatenation is the belt-and-suspenders fix.
      config.optimization.concatenateModules = false;

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
