// GET /api/reviews: Dan's Google rating, review count and recent reviews.
//
// Same approach as the MyCleaners site. Asks the Google Places API (New) for
// the listing, keeps the 4 and 5 star reviews with real text, and caches the
// answer at the edge for 6 hours, so new Google reviews show up the same day
// without calling Google on every visit. The page keeps its built-in reviews
// if this returns nothing.
//
// Setup: a Google Maps Platform API key with "Places API (New)" enabled, set as
// a secret (never in this file):
//   Cloudflare -> american-soft-water -> Settings -> Runtime variables and
//   secrets -> Add -> Secret GOOGLE_PLACES_KEY
// PLACE_ID is optional; without it the Worker looks the listing up by name and
// address once per cache period.
//
// Google's terms: show the reviewer's name, link to their profile when given,
// credit Google, and don't keep review content longer than 30 days. The 6-hour
// edge cache stays well inside that. Google returns at most 5 reviews.

export interface ReviewsEnv {
  GOOGLE_PLACES_KEY?: string;
  PLACE_ID?: string;
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

const CACHE_SECONDS = 60 * 60 * 6;
const MIN_LENGTH = 40; // skip one-line "Great!" reviews
const LISTING_QUERY = 'American Soft Water LLC, 8180 Old Mill Dr, Pinckney, MI 48169';

export async function reviews(request: Request, env: ReviewsEnv, ctx: Ctx): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(new URL('/api/reviews', request.url).toString());
  const hit = await cache.match(cacheKey);
  // Only trust a cached reviews answer, never some other response cached under this URL.
  if (hit && hit.status === 200 && (hit.headers.get('content-type') ?? '').includes('application/json')) return hit;

  if (!env.GOOGLE_PLACES_KEY) return json({ reviews: [] }, 60);

  try {
    const placeId = env.PLACE_ID || (await findPlace(env.GOOGLE_PLACES_KEY));
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en`, {
      headers: {
        'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,googleMapsLinks,reviews',
      },
    });
    if (!res.ok) throw new Error(`Places ${res.status}`);
    const place: any = await res.json();

    const body = {
      rating: place.rating,
      count: place.userRatingCount,
      mapsUri: place.googleMapsUri,
      writeReviewUri: place.googleMapsLinks?.writeAReviewUri,
      reviews: (place.reviews ?? [])
        .filter((r: any) => r.rating >= 4)
        .sort((a: any, b: any) => (b.publishTime ?? '').localeCompare(a.publishTime ?? '')) // newest first
        .map((r: any) => ({
          rating: r.rating,
          name: r.authorAttribution?.displayName ?? 'Google user',
          uri: r.authorAttribution?.uri,
          text: ((r.originalText ?? r.text)?.text ?? '').trim(),
          when: r.relativePublishTimeDescription ?? '',
        }))
        .filter((r: { text: string }) => r.text.length >= MIN_LENGTH),
      fetchedAt: new Date().toISOString(),
    };

    const response = json(body, CACHE_SECONDS);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error('reviews:', (err as Error)?.message);
    // Short cache on failure so a Google hiccup doesn't hammer the API.
    return json({ reviews: [] }, 300);
  }
}

async function findPlace(key: string): Promise<string> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id' },
    body: JSON.stringify({ textQuery: LISTING_QUERY }),
  });
  if (!res.ok) throw new Error(`searchText ${res.status}`);
  const id = (await res.json() as any).places?.[0]?.id;
  if (!id) throw new Error('listing not found');
  return id;
}

function json(body: unknown, maxAge: number): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}` },
  });
}
