import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const walletConnectBuild = path.resolve(
  __dirname,
  'node_modules/@btc-vision/walletconnect/build/index.js'
);

// Point @btc-vision/transaction and opnet to their build/ (TypeScript-compiled)
// directories instead of browser/ (pre-minified bundles).
// The browser/ bundles contain single-letter variable names (const e, const k0…)
// that collide when webpack scope-hoists multiple ESM modules into one scope,
// producing "Identifier 'e' already declared" in production.
// The build/ files use descriptive names and import individual npm packages,
// so webpack can handle them without name collisions even with scope hoisting.
const transactionBuild = path.resolve(
  __dirname,
  'node_modules/@btc-vision/transaction/build/index.js'
);
const opnetBuild = path.resolve(
  __dirname,
  'node_modules/opnet/build/index.js'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias['@btc-vision/walletconnect'] = walletConnectBuild;
    config.resolve.alias['@btc-vision/transaction'] = transactionBuild;
    config.resolve.alias['opnet'] = opnetBuild;

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
