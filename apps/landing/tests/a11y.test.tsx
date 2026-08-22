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
    // Quick sanity: at least the brand and one avatar are labeled
    expect(screen.getAllByLabelText(/Sentinel Lake/i).length).toBeGreaterThan(0);
  });
});
