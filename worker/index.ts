// Cloudflare Worker: serves the site from ./public and answers two API routes.
//
//   POST /api/inquiry  water test form -> email to Dan (worker/inquiry.ts)
//   GET  /api/reviews  Google rating and reviews, cached 6h (worker/reviews.ts)
//
// Static files (and public/_redirects, public/_headers) are matched first, so
// this script only runs for requests with no matching file.

import { inquiry, json, type Env } from './inquiry';
import { reviews, type ReviewsEnv } from './reviews';

interface WorkerEnv extends Env, ReviewsEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/inquiry') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
      return inquiry(request, env);
    }

    if (url.pathname === '/api/reviews') {
      if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405);
      return reviews(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};
