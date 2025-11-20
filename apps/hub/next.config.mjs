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
    // Se eliminó el alias de Webpack para 'novel/dist/styles.css' ya que la ruta de importación se corrigió.
    config.resolve.alias = {
      ...config.resolve.alias,
      'novel/dist/styles.css': path.resolve(__dirname, 'node_modules/novel/dist/styles.css'),
    };

    return config;
  },
};

export default nextConfig;