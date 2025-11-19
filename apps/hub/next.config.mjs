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
    // Usar null-loader para 'novel/styles.css' para evitar que Webpack intente resolverlo
    config.module.rules.push({
      test: /novel\/styles\.css$/,
      use: 'null-loader',
    });

    // Eliminar el alias anterior, ya no es necesario
    if (config.resolve.alias['novel/styles.css']) {
      delete config.resolve.alias['novel/styles.css'];
    }

    return config;
  },
};

export default nextConfig;