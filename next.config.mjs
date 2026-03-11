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
  // Transpile ESM-only packages so Next.js SWC handles them correctly.
  // @btc-vision/walletconnect has "type":"module" — without transpilePackages
  // webpack wraps ESM content in CommonJS wrappers and Terser fails.
  transpilePackages: [
    '@btc-vision/walletconnect',
    '@btc-vision/transaction',
    '@btc-vision/bitcoin',
    'opnet',
  ],

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
