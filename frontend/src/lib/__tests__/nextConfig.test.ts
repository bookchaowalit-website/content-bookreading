import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';

describe('next.config', () => {
  it('allows the novel cover host through remotePatterns (images.domains is deprecated in Next 16)', () => {
    expect((nextConfig.images as { domains?: string[] } | undefined)?.domains).toBeUndefined();
    expect(nextConfig.images?.remotePatterns).toContainEqual(
      expect.objectContaining({ protocol: 'https', hostname: 'www.piaotia.com' }),
    );
  });

  it('does not suppress TypeScript build errors', () => {
    expect(nextConfig.typescript?.ignoreBuildErrors).not.toBe(true);
  });

  it('proxies /api/* to the backend', async () => {
    const rewrites = await nextConfig.rewrites?.();
    expect(rewrites).toEqual([{ source: '/api/:path*', destination: 'http://backend:8080/api/:path*' }]);
  });
});
