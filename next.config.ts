import type {NextConfig} from 'next';

// Conditionally apply PWA only if not on Vercel (PWA can cause deployment issues)
let withPWA: any = (config: NextConfig) => config;
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    withPWA = require('next-pwa')({
      dest: 'public',
      disable: process.env.NODE_ENV === 'development',
    });
  } catch (e) {
    console.warn('PWA plugin not available, skipping...');
  }
}

const baseConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  reactStrictMode: true,
  // Environment variables
  env: {
    WEATHER_MAP_API_KEY: process.env.WEATHER_MAP_API_KEY || 'c7836e6f71da09d60e0a00f506446f5d',
    NEXT_PUBLIC_WEATHER_MAP_API_KEY: process.env.NEXT_PUBLIC_WEATHER_MAP_API_KEY || 'c7836e6f71da09d60e0a00f506446f5d',
  },
  // Performance optimizations
  poweredByHeader: false,
  // Server external packages (moved from experimental in Next.js 15)
  serverExternalPackages: ['firebase', 'genkit', '@genkit-ai/googleai'],
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default withPWA(baseConfig);
