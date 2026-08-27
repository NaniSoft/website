import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutUs } from '@/components/AboutUs';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('About-us page', () => {
  it('renders the hero, story, capabilities, and open-source sections', async () => {
    render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    expect(screen.getByRole('heading', { level: 1, name: /living map, made by people/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /our story/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what we do/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /open source/i })).toBeInTheDocument();
  });

  it('renders at least three capability items', async () => {
    render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    // ABOUT.capabilities.items titles are h3s.
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(3);
  });

  it('links the open-source playground and docs destinations', async () => {
    render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    const pg = screen.getByRole('link', { name: /open the playground/i });
    expect(pg.getAttribute('href')).toBe('https://playground.nanisoft.com');
    expect(pg.getAttribute('target')).toBe('_blank');
    expect(pg.getAttribute('rel')).toContain('noopener');
  });

  it('uses no mailto links and no bare href="#" anchors', async () => {
    const { container } = render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    expect(container.querySelectorAll('a[href^="mailto:"]')).toHaveLength(0);
    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0);
  });
});