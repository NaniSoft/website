import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnnouncementPill } from '@/components/AnnouncementPill';
import { Integrations } from '@/components/Integrations';
import { Platform } from '@/components/Platform';
import { ANNOUNCEMENT, PLATFORM_PILLARS, PLATFORM_SPECS } from '@/lib/data';

// antd components used by these sections schedule async state updates after
// mount that land outside RTL's initial act() wrapper in jsdom. Flushing the
// macrotask queue settles those updates before assertions.
async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('AnnouncementPill (hero surveyor’s plate)', () => {
  it('links to the real field note on the blog, in a new tab', () => {
    render(<AnnouncementPill />);
    const link = screen.getByRole('link', { name: new RegExp(ANNOUNCEMENT.label) });
    expect(link).toHaveAttribute('href', ANNOUNCEMENT.href);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('carries the tag and a decorative dot, never a product CTA label', () => {
    const { container } = render(<AnnouncementPill />);
    expect(screen.getByText(ANNOUNCEMENT.tag)).toBeInTheDocument();
    // The teal dot is presentation only.
    expect(container.querySelector('.announcement-dot')).toHaveAttribute('aria-hidden', 'true');
    // The playground ask must never appear in the hero pill.
    const link = screen.getByRole('link', { name: new RegExp(ANNOUNCEMENT.label) });
    expect(link.textContent).not.toContain('playground');
  });
});

describe('Platform pillars (tabbed showcase)', () => {
  it('renders three pillar tabs and the first pillar’s panel by default', async () => {
    render(<Platform />);
    await flushAntd();
    const tabs = screen.getByRole('radiogroup', { name: 'Platform pillars' });
    expect(tabs).toBeInTheDocument();
    // The default panel shows its two capability entries and its components line.
    expect(screen.getByText(PLATFORM_PILLARS[0].features[0].title)).toBeInTheDocument();
    expect(screen.getByText(PLATFORM_PILLARS[0].components)).toBeInTheDocument();
    // Inactive pillar copy is not rendered until selected.
    expect(screen.queryByText(PLATFORM_PILLARS[2].features[0].title)).not.toBeInTheDocument();
  });
});

describe('Survey plate (Integrations specs band)', () => {
  it('renders every platform reading once, value fused with label', async () => {
    const { container } = render(<Integrations />);
    await flushAntd();
    const band = screen.getByRole('group', { name: 'Platform specifications' });
    expect(band).toBeInTheDocument();
    for (const spec of PLATFORM_SPECS) {
      // The visually-hidden value is part of the reading's accessible name.
      expect(band.textContent).toContain(`${spec.value} ${spec.label}`);
      // The figure renders in its own mono value element.
      const values = Array.from(container.querySelectorAll('.spec-value')).map((v) => v.textContent);
      expect(values).toContain(spec.value);
    }
  });
});
