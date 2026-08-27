'use client';

import { useState } from 'react';
import { App, Button, Form, Input } from 'antd';
import { contactSchema, submitContact, type ContactInput } from '@/lib/contact';

function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: ContactInput) => {
    setSubmitting(true);
    // Run the form values through the shared schema before posting: this is
    // the client-side pre-submit guard. It also normalizes the honeypot
    // (antd returns undefined for the untouched field; the schema's
    // .optional().default('') yields '' so the server sees company: '').
    const parsed = contactSchema.parse(values);
    const result = await submitContact(parsed);
    setSubmitting(false);
    if (result.ok) {
      message.success('Thanks — we’ll be in touch shortly.');
    } else {
      message.error(result.error);
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