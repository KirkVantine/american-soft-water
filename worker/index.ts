// Cloudflare Worker: serves the site from ./public and answers /api/inquiry.
//
// Static files (and public/_redirects, public/_headers) are matched first, so
// this script only runs for requests with no matching file, which in practice
// means /api/inquiry.

import { inquiry, json, type Env } from './inquiry';

interface WorkerEnv extends Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/inquiry') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
      return inquiry(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
