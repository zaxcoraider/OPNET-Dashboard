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
    // Force @btc-vision/walletconnect to use the ESM build output.
    // The package.json "browser" field remaps build/index.js → browser/index.js
    // (a standalone webpack bundle that can't be re-bundled by Next.js).
    config.resolve.alias['@btc-vision/walletconnect'] = walletConnectBuild;

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

    // Transpile ESM packages so Next.js SWC can process them
    config.module.rules.push({
      test: /\.js$/,
      include: [
        path.resolve(__dirname, 'node_modules/@btc-vision/walletconnect/build'),
        path.resolve(__dirname, 'node_modules/@btc-vision/transaction'),
        path.resolve(__dirname, 'node_modules/@btc-vision/bitcoin'),
        path.resolve(__dirname, 'node_modules/opnet'),
      ],
      use: {
        loader: 'next-swc-loader',
        options: { isServer, isPageFile: false },
      },
    });

    return config;
  },
};

export default nextConfig;
