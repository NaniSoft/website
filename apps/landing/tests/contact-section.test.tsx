import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContactSection } from '@/components/about/ContactSection';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('ContactSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders name, email, message fields and a honeypot', async () => {
    render(
      <ThemeProvider>
        <ContactSection />
      </ThemeProvider>,
    );
    await flushAntd();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    // Honeypot is present but visually hidden + aria-hidden.
    const hp = document.querySelector('input[name="company"]') as HTMLInputElement;
    expect(hp).not.toBeNull();
    expect(hp.getAttribute('aria-hidden')).toBe('true');
    expect(hp.getAttribute('tabindex')).toBe('-1');
  });

  it('submits a valid form to /api/contact and shows a success message', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ContactSection />
      </ThemeProvider>,
    );
    await flushAntd();
    await user.type(screen.getByLabelText(/name/i), 'Priya Raman');
    await user.type(screen.getByLabelText(/email/i), 'priya@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Can the twin model multi-cloud access?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init?.method).toBe('POST');
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({ name: 'Priya Raman', email: 'priya@example.com', message: 'Can the twin model multi-cloud access?' });
    expect(body.company).toBe('');
    // Success surfaces through BOTH channels: the inline role="status" region
    // (the primary, announced one) and the App.useApp() toast (secondary —
    // queried via its container since the same copy now also appears inline).
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/be in touch shortly/i),
    );
    await waitFor(() =>
      expect(document.querySelector('.ant-message-notice')?.textContent).toMatch(/be in touch shortly/i),
    );
  });

  it('blocks submit when required fields are empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ContactSection />
      </ThemeProvider>,
    );
    await flushAntd();
    await user.click(screen.getByRole('button', { name: /send/i }));
    await flushAntd();
    // antd Form shows validation messages and does not call fetch.
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});