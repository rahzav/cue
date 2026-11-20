import { logoBase64 } from "./logo";
import { landingPage, landingScript } from "./landing";
interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  DB: D1Database;
}

type Identity = { sub: string; email: string; name: string; picture?: string };
const encoder = new TextEncoder();
const googleIssuer = 'https://accounts.google.com';
const maxAge = 60 * 60 * 24 * 7;

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeBase64url(value: string): Uint8Array {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function random(): string { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
function cookie(name: string, value: string, seconds: number): string {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${seconds}`;
}
function getCookie(req: Request, name: string): string | undefined {
  return req.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1);
}
function redirect(url: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: url, 'Cache-Control': 'no-store' });
  cookies.forEach(c => headers.append('Set-Cookie', c));
  return new Response(null, { status: 303, headers });
}
function secretReady(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSION_SECRET && env.DB);
}
async function mac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data))));
}
async function seal(value: object, secret: string): Promise<string> {
  const data = base64url(encoder.encode(JSON.stringify(value)));
  return `${data}.${await mac(data, secret)}`;
}
async function unseal<T>(value: string | undefined, secret: string): Promise<T | null> {
  if (!value) return null;
  const [data, signature, extra] = value.split('.');
  if (!data || !signature || extra) return null;
  const expected = await mac(data, secret);
  if (expected.length !== signature.length) return null;
  let difference = 0;
  for (let i = 0; i < signature.length; i++) difference |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (difference) return null;
  try { return JSON.parse(new TextDecoder().decode(decodeBase64url(data))) as T; } catch { return null; }
}
function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}
function layout(content: string): Response {
  return new Response(landingPage(content), { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  } });
}
async function identity(req: Request, env: Env): Promise<Identity | null> {
  const session = await unseal<{ user: Identity; exp: number }>(getCookie(req, 'cue_session'), env.SESSION_SECRET);
  return session && session.exp > Date.now() ? session.user : null;
}
async function verifyGoogleToken(token: string, clientId: string, nonce: string): Promise<Identity> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const header = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[0])));
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Invalid signature algorithm');
  const keysResponse = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!keysResponse.ok) throw new Error('Google keys unavailable');
  const keys = await keysResponse.json() as { keys: Array<JsonWebKey & { kid?: string; use?: string; alg?: string }> };
  const jwk = keys.keys.find(k => k.kid === header.kid && k.kty === 'RSA' && k.use === 'sig');
  if (!jwk) throw new Error('Unknown key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64url(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`))) throw new Error('Invalid signature');
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1])));
  if (![googleIssuer, 'accounts.google.com'].includes(claims.iss) || claims.aud !== clientId || claims.exp * 1000 < Date.now() || claims.iat * 1000 > Date.now() + 60000 || claims.nonce !== nonce) throw new Error('Invalid token claims');
  if (claims.email_verified !== true || !['rutgers.edu', 'scarletmail.rutgers.edu'].includes(claims.hd) || !/^[^@]+@(rutgers\.edu|scarletmail\.rutgers\.edu)$/i.test(claims.email)) throw new Error('Rutgers Google account required');
  return { sub: claims.sub, email: claims.email, name: claims.name || claims.email.split('@')[0], picture: claims.picture };
}
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return new Response('HTTPS required', { status: 400 });
    if (url.pathname === '/logo.png') return new Response(decodeBase64url(logoBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
    if (url.pathname === '/site.js') return new Response(landingScript, { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
    if (url.pathname === '/health') return new Response('ok');
    if (!secretReady(env)) return layout('<span class="tag">Waitlist</span><h3>Join the waitlist</h3><p>Rutgers Google sign-in is being configured. Check back here to join once it is available.</p><button class="button" type="button" disabled>Sign-in setup in progress</button>');
    if (url.pathname === '/auth/google' && req.method === 'GET') {
      const state = random(), nonce = random();
      const verifier = random();
      const pkce = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
      const redirectUri = `${url.origin}/auth/callback`;
      const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, nonce, code_challenge: pkce, code_challenge_method: 'S256', hd: 'rutgers.edu', prompt: 'select_account' });
      return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, [cookie('cue_oauth', await seal({ state, nonce, verifier, exp: Date.now() + 600000 }, env.SESSION_SECRET), 600)]);
    }
    if (url.pathname === '/auth/callback' && req.method === 'GET') {
      const flow = await unseal<{ state: string; nonce: string; verifier: string; exp: number }>(getCookie(req, 'cue_oauth'), env.SESSION_SECRET);
      if (!flow || flow.exp < Date.now() || !url.searchParams.get('state') || flow.state !== url.searchParams.get('state') || !url.searchParams.get('code')) return redirect('/?error=signin', [cookie('cue_oauth', '', 0)]);
      try {
        const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: url.searchParams.get('code')!, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${url.origin}/auth/callback`, grant_type: 'authorization_code', code_verifier: flow.verifier }) });
        if (!response.ok) throw new Error('Token exchange failed');
        const tokens = await response.json() as { id_token: string };
        const user = await verifyGoogleToken(tokens.id_token, env.GOOGLE_CLIENT_ID, flow.nonce);
        return redirect('/', [cookie('cue_oauth', '', 0), cookie('cue_session', await seal({ user, exp: Date.now() + maxAge * 1000 }, env.SESSION_SECRET), maxAge)]);
      } catch { return redirect('/?error=university', [cookie('cue_oauth', '', 0)]); }
    }
    if (url.pathname === '/logout' && req.method === 'POST') return redirect('/', [cookie('cue_session', '', 0)]);
    if (url.pathname === '/join' && req.method === 'POST') {
      const user = await identity(req, env);
      if (!user) return redirect('/auth/google');
      if (req.headers.get('Origin') !== url.origin) return new Response('Invalid origin', { status: 403 });
      const form = await req.formData();
      const interest = form.get('interest');
      if (!['browse', 'offer', 'both'].includes(String(interest))) return redirect('/?error=interest');
      try {
        await env.DB.prepare('INSERT INTO waitlist (google_sub,email,name,university,interest) VALUES (?,?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET interest=excluded.interest').bind(user.sub, user.email, user.name, 'Rutgers University–New Brunswick', interest).run();
        return redirect('/?joined=1');
      } catch { return redirect('/?error=save'); }
    }
    if (url.pathname !== '/' || req.method !== 'GET') return new Response('Not found', { status: 404 });
    const user = await identity(req, env);
    if (!user) return layout(`<span class="tag">Early access</span><h3>Join the CUE waitlist</h3><p>Join as a provider, a customer, or both. Use your Rutgers Google account to verify your university.</p>${url.searchParams.has('error') ? '<div class="error">Use your verified Rutgers Google account to continue.</div>' : ''}<a class="button" href="/auth/google">Join with Rutgers Google</a><p class="minor">Your university email is never shown publicly.</p>`);
    const record = await env.DB.prepare('SELECT interest FROM waitlist WHERE google_sub = ?').bind(user.sub).first<{ interest: string }>().catch(() => null);
    if (record || url.searchParams.has('joined')) return layout(`<span class="tag">You're on the list</span><h3>You're on the list, ${htmlEscape(user.name.split(' ')[0])}</h3><p>We’ll email you when CUE opens at Rutgers–New Brunswick.</p><form action="/logout" method="post"><button class="button" type="submit">Sign out</button></form>`);
    return layout(`<span class="tag">Rutgers account verified</span><h3>One last step</h3><p>You're verified as ${htmlEscape(user.email)}. Tell us how you'll use CUE.</p>${url.searchParams.has('error') ? '<div class="error">Couldn’t save your place. Please try again.</div>' : ''}<form action="/join" method="post"><div class="field"><label for="interest">I want to</label><select id="interest" name="interest" required><option value="browse">Find services</option><option value="offer">Offer services</option><option value="both">Both</option></select></div><button class="button" type="submit">Join the waitlist</button></form><p class="minor">Your Rutgers email is used for verification and launch updates only. Joining does not enroll you in a paid plan.</p>`);
  }
} satisfies ExportedHandler<Env>;
