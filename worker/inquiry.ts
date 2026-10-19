// The free water test form's backend. worker/index.ts routes POST /api/inquiry here.
//
// POST /api/inquiry  ->  { ok: true } | { ok: false, error: <code> }
//
// Same design as the New Beginnings site: stores nothing, never echoes the
// submission back, and if delivery is not configured or fails, the page opens
// the visitor's email app with everything they typed, so no request is lost.
//
// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------
// Set in Cloudflare (Workers & Pages -> american-soft-water -> Settings ->
// Variables and Secrets), or with `npx wrangler secret put RESEND_API_KEY`:
//
//   RESEND_API_KEY   required, as a secret. Without it this returns 503 and the
//                    form falls back to a pre-filled email.
//   INQUIRY_TO       optional, comma-separated. Defaults to Dan's Gmail.
//   INQUIRY_FROM     optional. Defaults to website@americansoftwater.com, which
//                    only works once that domain is verified in Resend.
//                    resend.dev only delivers to the Resend account owner, so it
//                    must never be the fallback here.

export interface Env {
  RESEND_API_KEY?: string;
  INQUIRY_TO?: string;
  INQUIRY_FROM?: string;
}

const DEFAULT_TO = ['Dan, American Soft Water <americansoftwater@gmail.com>'];
const DEFAULT_FROM = 'American Soft Water Website <website@americansoftwater.com>';

/** Caps that are generous for a real person and useless for a spam run. */
const LIMITS = { name: 80, phone: 40, email: 200, address: 200, city: 80, source: 40, current: 200, problem: 60, message: 2000 };

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Single-line fields: strip control characters so nothing can forge headers. */
const clean = (v: FormDataEntryValue | null, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

/** The message box keeps its line breaks; everything else control-ish goes. */
const cleanText = (v: FormDataEntryValue | null, max: number) =>
  typeof v === 'string'
    ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max)
    : '';

export async function inquiry(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Honeypot. Real people never see this field, so anything in it is a bot.
  // Answer 200 so the bot believes it succeeded and does not retry.
  if (clean(form.get('company'), 100)) return json({ ok: true });

  // Bots submit instantly. Nobody fills in a name and phone in under 3 seconds.
  const started = Number(form.get('t') || 0);
  if (started && Date.now() - started < 3000) return json({ ok: true });

  const first = clean(form.get('first'), LIMITS.name);
  const last = clean(form.get('last'), LIMITS.name);
  const phone = clean(form.get('phone'), LIMITS.phone);
  const email = clean(form.get('email'), LIMITS.email);
  const address = clean(form.get('address'), LIMITS.address);
  const city = clean(form.get('city'), LIMITS.city);
  const source = clean(form.get('source'), LIMITS.source);
  const current = clean(form.get('current'), LIMITS.current);
  const problems = form
    .getAll('problems')
    .map((p) => clean(p, LIMITS.problem))
    .filter(Boolean)
    .slice(0, 12);
  const message = cleanText(form.get('message'), LIMITS.message);

  const missing = [!first && 'first', !phone && 'phone'].filter(Boolean);
  if (missing.length) return json({ ok: false, error: 'missing_fields', fields: missing }, 422);

  if (phone.replace(/\D/g, '').length < 10) {
    return json({ ok: false, error: 'bad_phone', fields: ['phone'] }, 422);
  }
  // Email is optional. When given, check it loosely: rejecting an unusual but
  // real address costs a customer; a bounced reply costs almost nothing.
  if (email && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: 'bad_email', fields: ['email'] }, 422);
  }

  if (!env.RESEND_API_KEY) {
    // Not the visitor's fault. The page catches this and opens a pre-filled
    // email instead, so the request still reaches Dan.
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const name = [first, last].filter(Boolean).join(' ');
  const where = [address, city].filter(Boolean).join(', ');

  const body = [
    'A free water test was requested through the website.',
    '',
    `Name:     ${name}`,
    `Phone:    ${phone}`,
    `Email:    ${email || '(not given)'}`,
    `Address:  ${where || '(not given)'}`,
    `Water:    ${source || 'Not sure'}`,
    `Current treatment: ${current || '(not given)'}`,
    `Problems: ${problems.length ? problems.join(', ') : '(none checked)'}`,
    '',
    message ? `Message:\n${message}` : 'Message: (none)',
    '',
    '—',
    'Sent from the form at americansoftwater.com.',
    email ? 'Reply to this email to reach them, or call/text the number above.' : 'No email given. Call or text the number above.',
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.INQUIRY_FROM || DEFAULT_FROM,
        to: env.INQUIRY_TO
          ? env.INQUIRY_TO.split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : DEFAULT_TO,
        ...(email ? { reply_to: email } : {}),
        subject: `Water test request: ${name}${city ? ` (${city})` : ''}`,
        text: body,
      }),
    });

    if (!res.ok) {
      // Log Resend's status and its own error text only, never the submission.
      const why = await res.json().then((j: any) => String(j?.message ?? '')).catch(() => '');
      console.error('resend rejected the message', res.status, why.slice(0, 200));
      return json({ ok: false, error: 'send_failed' }, 502);
    }
  } catch (err) {
    console.error('resend request threw', (err as Error)?.name);
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true });
}
