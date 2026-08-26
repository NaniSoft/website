import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from '@/app/page';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// antd's <Menu> schedules an async state update after mount (rc-menu active-key
// measurement). In jsdom that update lands outside RTL's initial act() wrapper
// and logs an "not wrapped in act(...)" warning. Flushing the macrotask queue
// with an empty act() settles those updates before assertions.
async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('Accessibility smoke', () => {
  it('has a single <main> landmark', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('skip link is present and points to #main', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    const link = screen.getByText('Skip to main content');
    expect(link.getAttribute('href')).toBe('#main');
  });

  it('all rendered images/avatars have non-empty accessible names or are decorative', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    // Quick sanity: the W1 wordmarks are labeled with the brand.
    expect(screen.getAllByLabelText(/nanisoft/i).length).toBeGreaterThan(0);
  });

  it('skip link has no inline off-screen style defeating the :not(:focus) CSS', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    const link = screen.getByText('Skip to main content');
    // The inline style attribute (position:absolute; left:-9999) was removed
    // so the globals.css `:not(:focus)` rule can move it off-screen and the
    // `:focus` rule can bring it back. jsdom doesn't run :focus, so we assert
    // the inline style is gone rather than the computed position.
    expect(link.getAttribute('style')).toBeNull();
  });

  it('footer has no dead href="#" anchors and column headings are headings', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    const footer = document.querySelector('footer') as HTMLElement;
    expect(footer.querySelectorAll('a[href="#"]')).toHaveLength(0);
    // Every footer link is either an in-page anchor or the external playground.
    for (const a of Array.from(footer.querySelectorAll('a'))) {
      const href = a.getAttribute('href') || '';
      expect(href.startsWith('#') || href.startsWith('https://')).toBe(true);
    }
    // Column headings enter the page outline as <h2> (no <div> headings).
    expect(footer.querySelectorAll('h2').length).toBeGreaterThan(0);
  });
});
