import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import application from 'src/application-config';

const { config } = application;

describe('marketplace listing metadata', () => {
  it('declares the support and listing fields', () => {
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
});
