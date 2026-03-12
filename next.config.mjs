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
  transpilePackages: ['@btc-vision/walletconnect'],

  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias['@btc-vision/walletconnect'] = walletConnectBuild;

    // @btc-vision/transaction, @btc-vision/bitcoin and opnet all have
    // "type":"module" in their package.json.  webpack therefore treats their
    // pre-built browser/ bundles as ESM and tries to scope-hoist them together,
    // producing "Identifier 'e3' already declared" because the minified files
    // share short variable names.
    //
    // Forcing `javascript/commonjs` on those browser/ directories tells webpack
    // they are CommonJS.  CJS modules are NEVER scope-hoisted, so their local
    // variables stay inside their own function wrapper and never collide.
    config.module.rules.unshift({
      test: /node_modules[\\/](@btc-vision[\\/](transaction|bitcoin)|opnet)[\\/]browser[\\/]/,
      type: 'javascript/auto',
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
