
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Add Firebase Storage domain (kept in case some old URLs exist or for other uses)
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      { // Add Supabase Storage domain
        protocol: 'https',
        hostname: 'sanuircjakuogmzeujnj.supabase.co', // Replace YOUR_PROJECT_ID with your actual Supabase project ID
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
      // Removed Google Drive domains as we are switching to Supabase Storage
      // {
      //   protocol: 'https',
      //   hostname: 'drive.google.com',
      //   port: '',
      //   pathname: '/**',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'lh3.googleusercontent.com',
      //   port: '',
      //   pathname: '/**',
      // }
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748922306655.cluster-iktsryn7xnhpexlu6255bftka4.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
