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
    // Añadir un alias para 'novel/styles.css'
    config.resolve.alias['novel/styles.css'] = path.resolve(__dirname, 'node_modules/novel/dist/index.css');
    return config;
  },
};

export default nextConfig;