import { contactSchema } from '@/lib/contact';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid' }, { status: 422 });
  }

  // Honeypot: a non-empty `company` means a bot filled the hidden field.
  // Pretend success and discard — do not reveal the trap.
  if (parsed.data.company) {
    return Response.json({ ok: true });
  }

  const { env } = getCloudflareContext();
  const { name, email, message } = parsed.data;
  const createdAt = new Date().toISOString();

  await env.CONTACT_DB.prepare(
    'INSERT INTO submissions (name, email, message, created_at) VALUES (?, ?, ?, ?)',
  )
    .bind(name, email, message, createdAt)
    .run();

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_NOTIFY_FROM,
      to: [env.CONTACT_NOTIFY_TO],
      subject: `New contact submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    }),
  });

  return Response.json({ ok: true });
}