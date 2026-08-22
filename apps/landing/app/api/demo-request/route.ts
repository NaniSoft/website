import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Placeholder: in production this would forward to CRM, queue, etc.
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ ok: true, receivedAt: new Date().toISOString(), echo: body });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
