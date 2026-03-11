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
  // Only walletconnect needs transpilation: its browser field does NOT remap
  // the entry point, so webpack correctly loads build/index.js (ESM) which
  // needs SWC to convert for Next.js.
  //
  // @btc-vision/transaction, @btc-vision/bitcoin, opnet all have a browser
  // field that maps build/index.js → browser/index.js (pre-built minified CJS
  // bundles). transpilePackages would cause SWC to parse those minified bundles
  // and fail with "duplicate private name #_" (SWC bug on minified class fields).
  // webpack handles pre-built CJS bundles fine WITHOUT SWC — so leave them out.
  transpilePackages: ['@btc-vision/walletconnect'],

  webpack: (config, { isServer, webpack }) => {
    // Point @btc-vision/walletconnect to the ESM build (not the pre-bundled browser build).
    config.resolve.alias['@btc-vision/walletconnect'] = walletConnectBuild;

    // TypeScript declaration files (.d.ts) match Next.js's /\.(ts|tsx)$/ SWC rule
    // because they end in ".ts". They have no runtime content but confuse Terser
    // when included in chunks. Replace them with empty modules before any other
    // loader runs (enforce:'pre' + pitch short-circuit).
    config.module.rules.unshift({
      test: /\.d\.ts$/,
      enforce: 'pre',
      use: path.resolve(__dirname, 'lib/empty-loader.js'),
    });

    if (!isServer) {
      // Browser polyfills required by @btc-vision packages
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

      // Inject Buffer and process as globals (used by @btc-vision/transaction)
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
