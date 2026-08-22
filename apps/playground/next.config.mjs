/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next/image` optimization on Cloudflare Workers needs the IMAGES binding
  // (paid). Disable it so the worker runs with no extra bindings; revisit
  // when we want Cloudflare Images.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;