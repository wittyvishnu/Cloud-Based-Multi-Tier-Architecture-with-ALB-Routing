const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'devopsconnectimages.s3.amazonaws.com',
      },
    ],
  },
}

export default nextConfig;
