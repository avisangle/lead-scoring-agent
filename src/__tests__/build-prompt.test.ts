import {
  buildOpportunityScoringPrompt,
  buildPersonScoringPrompt,
} from 'src/lib/build-prompt';
import { describe, expect, it } from 'vitest';

describe('buildPersonScoringPrompt', () => {
  it('should include the key person signals (title and company)', () => {
    const prompt = buildPersonScoringPrompt({
      name: 'Ada Lovelace',
      jobTitle: 'VP of Engineering',
      company: 'Analytical Engines Inc',
    });

    expect(prompt).toContain('VP of Engineering');
    expect(prompt).toContain('Analytical Engines Inc');
    expect(prompt).toContain('person');
  });

  it('should omit missing fields without emitting empty labels', () => {
    const prompt = buildPersonScoringPrompt({ name: 'Grace Hopper' });

    expect(prompt).toContain('Grace Hopper');
    expect(prompt).not.toContain('Company:');
  });
});

describe('buildOpportunityScoringPrompt', () => {
  it('should include the key opportunity signals (amount and stage)', () => {
    const prompt = buildOpportunityScoringPrompt({
      name: 'Enterprise rollout',
      amount: 50000,
      stage: 'Proposal',
    });

    expect(prompt).toContain('50000');
    expect(prompt).toContain('Proposal');
    expect(prompt).toContain('opportunity');
  });
});
