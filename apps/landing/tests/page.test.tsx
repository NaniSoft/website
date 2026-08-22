import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from '@/app/page';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// antd's <Menu> schedules an async state update after mount that lands outside
// RTL's initial act() wrapper in jsdom. Flushing the macrotask queue settles it
// before assertions, silencing the "not wrapped in act(...)" warning.
async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('Page', () => {
  it('renders the brand in the top nav and footer', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    expect(screen.getAllByText('Sentinel Lake').length).toBeGreaterThan(0);
  });

  it('has a skip link', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders the main landmark', async () => {
    render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    );
    await flushAntd();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
