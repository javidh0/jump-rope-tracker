import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Lets a phone on the same LAN load dev-mode resources (HMR, etc.) when
  // testing the /remote page from its own IP instead of localhost — dev
  // only, has no effect on a production build. Next only matches exact
  // hostnames or "**.domain" wildcards here (no CIDR/IP-range support), so
  // this has to be the laptop's *current* LAN IP — update it if your
  // router reassigns a different address (check with `ipconfig getifaddr
  // en0` on macOS).
  allowedDevOrigins: ["192.168.29.82"],
};

export default nextConfig;
