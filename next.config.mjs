import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const nm = (pkg) => path.resolve(__dirname, 'node_modules', pkg);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile ESM packages — all btc-vision packages have "type":"module"
  // build/ dirs contain proper ESM that SWC can handle.
  transpilePackages: [
    '@btc-vision/walletconnect',
    '@btc-vision/transaction',
    '@btc-vision/bitcoin',
    'opnet',
  ],

  webpack: (config, { isServer, webpack }) => {
    // All three @btc-vision packages + opnet have a browser field that maps
    //   "./build/index.js" → "./browser/index.js"
    // Those browser/ dirs are pre-built minified bundles that cannot be
    // re-bundled by webpack (variable name collisions, SWC parse errors).
    // Fix: point each package directly to its build/index.js AND disable
    // aliasFields so the browser field can't remap them back.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@btc-vision/walletconnect': nm('@btc-vision/walletconnect/build/index.js'),
      '@btc-vision/transaction':   nm('@btc-vision/transaction/build/index.js'),
      '@btc-vision/bitcoin':       nm('@btc-vision/bitcoin/build/index.js'),
    };

    if (!isServer) {
      // Disable browser field file-aliasing so aliases above aren't remapped
      // back to browser/ bundles. Polyfills are covered by fallback below.
      config.resolve.aliasFields = [];

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
    // They have no runtime content — replace with empty modules.
    config.module.rules.unshift({
      test: /\.d\.ts$/,
      enforce: 'pre',
      use: path.resolve(__dirname, 'lib/empty-loader.js'),
    });

    return config;
  },
};

export default nextConfig;
