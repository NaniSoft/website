import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopNav } from '@/components/TopNav';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function renderNav() {
  return render(
    <ThemeProvider>
      <TopNav />
    </ThemeProvider>,
  );
}

describe('TopNav', () => {
  it('renders the Product and Docs dropdown triggers and the three plain links', async () => {
    renderNav();
    await flushAntd();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
    for (const label of ['Blog', 'About us', 'Contact us']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('points About us at /about-us and Contact us at /about-us#contact', async () => {
    renderNav();
    await flushAntd();
    expect(screen.getByText('About us').closest('a')?.getAttribute('href')).toBe('/about-us');
    expect(screen.getByText('Contact us').closest('a')?.getAttribute('href')).toBe('/about-us#contact');
  });

  it('opens external nav links (Blog) in a new tab with noopener', async () => {
    renderNav();
    await flushAntd();
    const blog = screen.getByText('Blog').closest('a') as HTMLAnchorElement;
    expect(blog.getAttribute('href')).toBe('https://blog.nanisoft.com');
    expect(blog.getAttribute('target')).toBe('_blank');
    expect(blog.getAttribute('rel')).toContain('noopener');
  });

  it('no longer renders a playground pill in the header', async () => {
    renderNav();
    await flushAntd();
    expect(screen.queryByRole('link', { name: /open the playground/i })).toBeNull();
  });

  it('keeps the in-page Product anchors (no bare href="#")', async () => {
    const { container } = renderNav();
    await flushAntd();
    const nav = container.querySelector('.top-nav-links') as HTMLElement;
    expect(nav.querySelectorAll('a[href="#"]')).toHaveLength(0);
  });

  it('opens the Docs dropdown and renders external Documentation link in a new tab', async () => {
    renderNav();
    await flushAntd();
    // antd Dropdown menus are portaled/lazy — not in the DOM at rest. Click the
    // "Docs" trigger to mount the menu, then wait for the Documentation link.
    const docsTrigger = screen.getByText('Docs');
    await act(async () => {
      fireEvent.click(docsTrigger);
    });
    const docLink = await waitFor(() =>
      screen.getByRole('link', { name: 'Documentation' }),
    );
    expect(docLink.getAttribute('href')).toBe('https://docs.nanisoft.com');
    expect(docLink.getAttribute('target')).toBe('_blank');
    expect(docLink.getAttribute('rel')).toContain('noopener');
  });
});
