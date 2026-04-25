import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok tunnels to access the dev server (HMR websocket + assets)
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok-free.dev', '*.ngrok.io'],
};

export default nextConfig;
