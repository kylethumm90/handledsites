/** @type {import('next').NextConfig} */

// Allow next/image to optimize Supabase Storage URLs (used by the
// public gallery on /[slug]). The Supabase project URL is the same
// env var the SDK reads, so we derive the hostname from it.
const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
