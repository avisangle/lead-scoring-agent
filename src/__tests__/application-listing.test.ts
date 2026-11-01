import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import application from 'src/application-config';

const { config } = application;

describe('marketplace listing metadata', () => {
  it('declares the support and listing fields', () => {
    expect(config.author).toBe('ReportStack');
    expect(config.category).toBe('Sales');
    expect(config.emailSupport).toBe('support@reportstack.app');
    expect(config.websiteUrl).toBe(
      'https://github.com/avisangle/lead-scoring-agent',
    );
    expect(config.issueReportUrl).toBe(
      'https://github.com/avisangle/lead-scoring-agent/issues',
    );
  });

  it('points the logo at an animated SVG in public/', () => {
    expect(config.logo).toBe('public/logo.svg');
    expect(existsSync(config.logo as string)).toBe(true);

    const svg = readFileSync(config.logo as string, 'utf8');
    // Twenty's DOMPurify pass strips SMIL, so animation must be CSS.
    expect(svg).toContain('@keyframes');
    expect(svg).toContain('prefers-reduced-motion');
    expect(svg).not.toMatch(/<animate/i);
  });

  it('ships 8:5 gallery images from public/ (1600x1000, under 10 MB)', () => {
    const images = config.galleryImages ?? [];
    expect(images.length).toBeGreaterThanOrEqual(3);

    for (const path of images) {
      expect(path).toMatch(/^public\/gallery\/.+\.png$/);
      const png = readFileSync(path);
      // PNG IHDR: width and height are big-endian uint32 at bytes 16 and 20.
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1600, 1000]);
      expect(png.length).toBeLessThan(10 * 1024 * 1024);
    }
  });
});
