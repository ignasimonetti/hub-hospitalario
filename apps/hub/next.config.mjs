import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: path.resolve(__dirname, '../../'),
  },
};

export default nextConfig;