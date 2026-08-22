import { describe, expect, it } from 'vitest';
import { INTEGRATIONS, USE_CASES, HERO, FOOTER_LINKS } from '@/lib/data';
import { CHAT_TRANSCRIPTS } from '@/lib/chat-transcripts';

describe('data module', () => {
  it('has 16 named integrations plus the "and 40 more" slot is rendered in the component', () => {
    expect(INTEGRATIONS).toHaveLength(16);
  });

  it('has 3 use cases', () => {
    expect(USE_CASES).toHaveLength(3);
  });

  it('hero has both CTAs', () => {
    expect(HERO.primaryCta.label).toBeTruthy();
    expect(HERO.secondaryCta.label).toBeTruthy();
  });

  it('has 3 chat transcripts', () => {
    expect(CHAT_TRANSCRIPTS).toHaveLength(3);
  });

  it('footer has 4 link columns', () => {
    expect(Object.keys(FOOTER_LINKS)).toHaveLength(4);
  });
});
