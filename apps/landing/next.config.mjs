/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next/image` optimization on Cloudflare Workers needs the IMAGES binding
  // (paid). Disable it so the worker runs with no extra bindings; revisit
  // when we want Cloudflare Images.
  images: {
    unoptimized: true,
  },
  // antd 6 and @ant-design/icons 6 ship ESM, so Next 16/Turbopack bundles them
  // natively. The old antd-5-era `transpilePackages` list (and its rc-* entries)
  // is no longer needed and, under Turbopack, actually breaks React resolution
  // inside those packages (createContext is not a function). Removed.
};

export default nextConfig;