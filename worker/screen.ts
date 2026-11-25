// Spam and sales-pitch screening for the water test form.
//
// RULE: this never blocks anything. Every submission with a name and phone
// still reaches Dan. Screening only adds a subject tag and a "why" line, so a
// Gmail filter can move likely spam and sales pitches out of his inbox into a
// folder he can still check. A wrong guess costs a moved email, never a lost
// customer. Kirk's instruction (2026-11-24): don't block or limit any lead.
//
// Two tags, both starting "[Flagged" so one Gmail filter catches both:
//   [Flagged: likely spam]    signs of an automated submission
//   [Flagged: sales pitch]    a person selling something (SEO, marketing...)

export interface ScreenEnv {
  // Cloudflare Turnstile secret key. Optional: without it the bot check is
  // skipped and nothing is flagged for it.
  TURNSTILE_SECRET?: string;
}

export interface Fields {
  honeypot: string;
  startedMs: number;
  turnstileToken: string;
  problems: string[];
  address: string;
  city: string;
  message: string;
}

export interface Verdict {
  tag: '' | '[Flagged: likely spam]' | '[Flagged: sales pitch]';
  reasons: string[];
}

// Phrases that show up in pitches and almost never in a request for a water
// test. Matched as whole words in the message box only, never in the checkbox
// values ("Lead / arsenic / nitrates" must not count).
const PITCH = [
  /\bseo\b/,
  /\bsearch engine/,
  /\bgoogle (ranking|rankings|maps ranking|business profile optimi[sz])/,
  /\b(first|1st) page\b/,
  /\bpage (one|1) of google\b/,
  /\brank(ing)? (higher|on google|#?1)\b/,
  /\bbacklinks?\b/,
  /\b(digital|online|internet|social media) marketing\b/,
  /\bmarketing (agency|services|strategy|campaign)\b/,
  /\blead generation\b/,
  /\b(more|qualified|exclusive) leads\b/,
  /\b(more|new) customers\b/,
  /\bgrow your business\b/,
  /\b(web|website) (design|redesign|development)\b/,
  /\bredesign\b/,
  /\bppc\b|\bpay[- ]per[- ]click\b|\bgoogle ads\b|\badwords\b/,
  /\bguest post/,
  /\bvirtual assistant\b|\boutsourc/,
  /\b(business|merchant) (funding|loan|cash advance)\b|\bcredit card processing\b/,
  /\bbook (a|your) (free )?(call|demo|strategy)/,
];

const LINK = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.|\b[a-z0-9-]+\.(com|net|org|io|co|biz|info)\b/i;

/** Asks Cloudflare whether the Turnstile token came from a real browser. */
async function turnstilePassed(env: ScreenEnv, token: string, ip: string): Promise<boolean | null> {
  if (!env.TURNSTILE_SECRET) return null; // not configured: no opinion
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    const out: any = await res.json();
    // Cloudflare's own error codes only (e.g. invalid-input-secret), never the token.
    if (!out?.success) console.warn('turnstile siteverify failed:', JSON.stringify(out?.['error-codes'] ?? []));
    return Boolean(out?.success);
  } catch {
    return null; // Cloudflare unreachable: no opinion, never a reason to flag
  }
}

export async function screen(f: Fields, env: ScreenEnv, ip: string): Promise<Verdict> {
  const bot: string[] = [];
  if (f.honeypot) bot.push('a hidden field only bots see was filled in');
  if (f.startedMs && Date.now() - f.startedMs < 3000) bot.push('submitted within 3 seconds of the page loading');
  const human = await turnstilePassed(env, f.turnstileToken, ip);
  if (human === false) bot.push("Cloudflare's bot check didn't confirm a real browser");

  // Bot signals only count when the submission also looks like a non-customer.
  // A real person whose browser autofilled the hidden field, or whose bot check
  // failed, usually still ticks a water problem or gives an address, and then
  // they stay untagged.
  const looksLikeCustomer = f.problems.length > 0 || Boolean(f.address || f.city);
  if (bot.length && !looksLikeCustomer) return { tag: '[Flagged: likely spam]', reasons: bot };

  // Pitch signals only count when no water problem is checked: someone who
  // ticks "Hard water" is a customer even if they mention nextdoor.com.
  if (f.problems.length === 0) {
    const text = f.message.toLowerCase();
    const pitch: string[] = [];
    if (PITCH.some((re) => re.test(text))) pitch.push('the message talks about marketing or web services');
    if (LINK.test(f.message)) pitch.push('the message contains a web link');
    if (pitch.length) return { tag: '[Flagged: sales pitch]', reasons: [...pitch, 'no water problem was checked'] };
  }

  return { tag: '', reasons: [] };
}
