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

    // Prevent webpack from parsing TypeScript declaration files (.d.ts) as JS.
    // @btc-vision/walletconnect's browser bundle accidentally pulls in .d.ts
    // files via require.context, causing "Module parse failed: Unexpected token"
    // errors on syntax like `import { type X }`.
    const existingNoParse = config.module.noParse;
    config.module.noParse = (resourcePath) => {
      if (resourcePath.endsWith('.d.ts')) return true;
      if (typeof existingNoParse === 'function') return existingNoParse(resourcePath);
      if (existingNoParse instanceof RegExp) return existingNoParse.test(resourcePath);
      return false;
    };

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
        path.resolve(__dirname, 'node_modules/@btc-vision/walletconnect/browser'),
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
