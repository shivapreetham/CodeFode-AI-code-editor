/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    
    // Security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'geolocation=(), microphone=(), camera=()'
                    }
                ]
            }
        ];
    },

    // Environment variables validation
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },

    // Image optimization
    images: {
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 86400, // 1 day
    },

    // Performance optimizations (disabled experimental optimizeCss due to critters module issue)
    // experimental: {
    //     optimizeCss: true,
    // },

    // Bundle analyzer (uncomment for analysis)
    // webpack: (config, { isServer }) => {
    //     if (!isServer) {
    //         config.resolve.fallback = {
    //             fs: false,
    //             net: false,
    //             tls: false,
    //         };
    //     }
    //     return config;
    // },
};

export default nextConfig;
