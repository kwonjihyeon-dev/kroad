import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // next turbopack이 root를 해당 프로젝트로 인식하도록 설정
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
