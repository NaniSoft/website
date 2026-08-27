import { z } from 'zod';

// Shared by the client form (pre-submit guard) and the server route handler
// (authoritative validation). The honeypot `company` must stay empty — a
// non-empty value means a bot filled the hidden field; the server pretends
// success and discards.
export const contactSchema = z.object({
  name: z.string().min(1, 'Required').max(120),
  email: z.string().email('Enter a valid email').max(320),
  message: z.string().min(1, 'Required').max(5000),
  company: z.string().max(200).optional().default(''),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitContact(payload: ContactInput): Promise<ContactResult> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true };
  let error = 'Something went wrong. Please try again.';
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) error = data.error;
  } catch {
    /* keep default */
  }
  return { ok: false, error };
}