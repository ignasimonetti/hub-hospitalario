import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  experimental: {
    // Otras configuraciones experimentales si las hubiera
  },
  webpack: (config, { isServer }) => {
    // Add an alias to directly map the problematic CSS import
    config.resolve.alias = {
      ...config.resolve.alias,
      'novel/dist/styles.css': path.resolve(__dirname, 'node_modules/novel/dist/styles.css'),
    };

    return config;
  },
};

export default nextConfig;