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
  // Only walletconnect needs SWC transpilation.
  // Its browser field does NOT remap the entry point, so webpack correctly
  // loads build/index.js (proper ESM).
  //
  // @btc-vision/transaction, @btc-vision/bitcoin, opnet all have browser fields
  // that map build/index.js → browser/index.js (pre-built bundles).
  // Their build/ dirs are broken (import opnetTestnet/toHex from @btc-vision/bitcoin
  // which that package doesn't export). We MUST use their browser/ bundles.
  // Those bundles are not SWC-processed — they're loaded as-is by webpack.
  transpilePackages: ['@btc-vision/walletconnect'],

  webpack: (config, { isServer, webpack }) => {
    // Alias walletconnect to its ESM build.
    // browser field for this package only remaps Buffer/crypto/stream/zlib
    // (not the entry point), so this alias is respected.
    config.resolve.alias['@btc-vision/walletconnect'] = walletConnectBuild;

    if (!isServer) {
      // Disable module concatenation (scope hoisting).
      // @btc-vision/transaction's browser/ bundle + btc-vision-bitcoin.js are
      // pre-built minified files that use short var names (e3, etc.).
      // When webpack scope-hoists them into the same function, those names
      // collide → "Identifier 'e3' already declared" at runtime.
      // Disabling concatenation keeps each module in its own function scope.
      config.optimization = {
        ...config.optimization,
        concatenateModules: false,
      };

      // Browser polyfills for node built-ins used by @btc-vision packages
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

      // Inject Buffer and process as globals
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }

    // .d.ts files match Next.js's /\.(ts|tsx)$/ SWC rule (they end in .ts).
    // They have no runtime content — stub them out before any loader runs.
    config.module.rules.unshift({
      test: /\.d\.ts$/,
      enforce: 'pre',
      use: path.resolve(__dirname, 'lib/empty-loader.js'),
    });

    return config;
  },
};

export default nextConfig;
