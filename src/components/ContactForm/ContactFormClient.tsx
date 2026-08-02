'use client'

import type { ContactInput } from '@/lib/contact-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buildMailtoHref, contactSchema } from '@/lib/contact-schema'
import { cn } from '@/lib/utils'

const CTA_GRADIENT = 'bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'

interface ContactFormClientProps {
  /** Same-origin contact route (`/api/contact-us`). Empty = mailto: fallback. */
  endpoint: string
  /** Cloudflare Turnstile sitekey. Empty = widget not rendered (form still posts). */
  sitekey: string
  /** Public recipient for the mailto: fallback. Empty = no recipient. */
  contactTo: string
}

/**
 * The contact form. react-hook-form + the pinned zod schema on existing Shadcn
 * primitives (Input/Label/Textarea/Button). Raw Cloudflare Turnstile widget
 * (script loaded once, token read at submit). POSTs the unified
 * `{ name, email, notes, 'cf-turnstile-response' }` payload; the server returns
 * `{ status, message }` which drives toasts + inline states. Degrades to a
 * prefilled `mailto:` when the endpoint is unset or the POST errors.
 */
export function ContactFormClient({ endpoint, sitekey, contactTo }: ContactFormClientProps) {
  const [submitting, setSubmitting] = useState(false)
  const [mailtoFallback, setMailtoFallback] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', notes: '' },
  })

  // Load the Turnstile script once, only when a sitekey is provisioned. The
  // widget renders into the `.cf-turnstile` div and injects a hidden
  // `cf-turnstile-response` input, which we read at submit.
  useEffect(() => {
    if (!sitekey) {
      return
    }
    const src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    if (document.querySelector(`script[src="${src}"]`)) {
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [sitekey])

  async function onSubmit(values: ContactInput) {
    setSubmitting(true)
    setMailtoFallback(null)

    // Endpoint unset → degrade straight to a prefilled mailto.
    if (!endpoint) {
      window.location.href = buildMailtoHref(values, contactTo)
      toast.success('Opening your email client — send the prefilled message and we will take it from there.')
      setSubmitting(false)
      return
    }

    const token
      = turnstileRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? ''

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, 'cf-turnstile-response': token }),
      })
      const data = (await res.json().catch(() => null)) as { status?: string, message?: string } | null
      const message = data?.message

      if (res.ok && data?.status === 'success') {
        toast.success(message ?? 'Thanks — we will reach out within a business day.')
        reset()
      }
      else {
        const msg = message ?? 'Something went wrong sending your message.'
        toast.error(msg)
        setMailtoFallback(buildMailtoHref(values, contactTo))
      }
    }
    catch {
      toast.error('Could not reach the server. Try again, or email us directly.')
      setMailtoFallback(buildMailtoHref(values, contactTo))
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          autoComplete="name"
          placeholder="Your name"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">Work email</Label>
        <Input
          id="contact-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-notes">What are you trying to see?</Label>
        <Textarea
          id="contact-notes"
          rows={4}
          placeholder="A short note on your environment and the blind spots you suspect."
          aria-invalid={!!errors.notes}
          {...register('notes')}
        />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
      </div>

      {sitekey && (
        <div ref={turnstileRef} className="cf-turnstile" data-sitekey={sitekey} data-theme="dark" />
      )}

      <Button type="submit" disabled={submitting} className={cn('self-start text-white', CTA_GRADIENT)}>
        {submitting ? 'Sending…' : 'Send'}
      </Button>

      {mailtoFallback && (
        <p className="text-sm text-zinc-400">
          Or
          {' '}
          <a className="underline underline-offset-2 hover:text-zinc-200" href={mailtoFallback}>email us directly</a>
          {' '}
          with your details prefilled.
        </p>
      )}
    </form>
  )
}
