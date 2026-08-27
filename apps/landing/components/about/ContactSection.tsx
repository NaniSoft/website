'use client';

import { useState } from 'react';
import { App, Button, Form, Input } from 'antd';
import { contactSchema, submitContact, type ContactInput } from '@/lib/contact';

function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: ContactInput) => {
    setSubmitting(true);
    try {
      // safeParse (not parse) so a client/server rule divergence never throws
      // and leaves the button stuck loading. It still normalizes the honeypot
      // (antd returns undefined for the untouched field; the schema's
      // .optional().default('') yields '' so the server sees company: '').
      const parsed = contactSchema.safeParse(values);
      if (!parsed.success) {
        message.error('Please check your input and try again.');
        return;
      }
      const result = await submitContact(parsed.data);
      if (result.ok) message.success('Thanks — we’ll be in touch shortly.');
      else message.error(result.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<ContactInput> layout="vertical" onFinish={onFinish} autoComplete="off">
      {/* Honeypot — hidden from users and AT; a non-empty value trips the trap. */}
      <div aria-hidden style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <Form.Item name="company" style={{ margin: 0 }}>
          <Input name="company" tabIndex={-1} aria-hidden autoComplete="off" />
        </Form.Item>
      </div>
      <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
        <Input autoComplete="name" />
      </Form.Item>
      <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Required' }, { type: 'email', message: 'Enter a valid email' }]}>
        <Input type="email" autoComplete="email" />
      </Form.Item>
      <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Required' }]}>
        <Input.TextArea rows={5} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={submitting}>Send</Button>
    </Form>
  );
}

export function ContactSection() {
  return (
    <App>
      <section id="contact" style={{ padding: '96px 24px', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 8px' }}>
          Contact us
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', margin: '0 0 24px' }}>
          Want to work with nanisoft, validate an API strategy, or just ask a question about the twin? Send a note.
        </p>
        <ContactForm />
      </section>
    </App>
  );
}