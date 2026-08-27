import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the OpenNext Cloudflare context so the handler never loads the real
// adapter (which needs the Workers runtime). The mock is reset per test so
// inserted rows / fetch calls don't leak.
const insertMock = vi.fn();
const fetchMock = vi.fn();
const env = {
  CONTACT_DB: {
    prepare: () => ({
      bind: (...args: unknown[]) => ({ run: async () => { insertMock(...args); return {}; } }),
    }),
  },
  RESEND_API_KEY: 'test-key',
  CONTACT_NOTIFY_FROM: 'contact@nanisoft.com',
  CONTACT_NOTIFY_TO: 'hello@nanisoft.com',
};

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({ env }),
}));

// `globalThis.fetch` is the Resend call. Default to a success response.
beforeEach(() => {
  insertMock.mockClear();
  fetchMock.mockClear();
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

async function post(body: unknown) {
  const { POST } = await import('@/app/api/contact/route');
  const request = new Request('https://nanisoft.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(request);
}

describe('POST /api/contact', () => {
  it('stores a valid submission in D1 and emails it via Resend', async () => {
    const res = await post({ name: 'Priya Raman', email: 'priya@example.com', message: 'Hello', company: '' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledWith('Priya Raman', 'priya@example.com', 'Hello', expect.any(String));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    const payload = JSON.parse(init.body as string);
    expect(payload.from).toBe('contact@nanisoft.com');
    expect(payload.to).toEqual(['hello@nanisoft.com']);
    expect(payload.text).toContain('Priya Raman');
  });

  it('pretends success for a honeypot-tripped submission without storing or emailing', async () => {
    const res = await post({ name: 'Bot', email: 'bot@example.com', message: 'spam', company: 'SEO Co' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insertMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid input with 422', async () => {
    const res = await post({ name: '', email: 'not-an-email', message: '', company: '' });
    expect(res.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('rejects unparseable JSON with 400', async () => {
    const request = new Request('https://nanisoft.com/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const { POST } = await import('@/app/api/contact/route');
    const res = await POST(request);
    expect(res.status).toBe(400);
  });
});