import path from 'path';
import { fileURLToPath } = from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  experimental: {
    // Otras configuraciones experimentales si las hubiera
  },
  webpack: (config, { isServer }) => {
    // Eliminado: Usar null-loader para 'novel/styles.css' para evitar que Webpack intente resolverlo
    // Eliminado: config.module.rules.push({
    // Eliminado:   test: /novel\/styles\.css$/,
    // Eliminado:   use: 'null-loader',
    // Eliminado: });

    // Eliminado: Eliminar el alias anterior, ya no es necesario
    // Eliminado: if (config.resolve.alias['novel/styles.css']) {
    // Eliminado:   delete config.resolve.alias['novel/styles.css'];
    // Eliminado: }

    return config;
  },
};

export default nextConfig;