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
function page(body: string): Response {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f6f5ef"><title>CUE — Campus services, in one place</title><style>
  :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#193e30;background:#f6f5ef}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;flex-direction:column}a{color:inherit}header,footer{display:flex;align-items:center;justify-content:space-between;max-width:1160px;width:100%;margin:auto;padding:28px 32px}header{margin:0 auto}footer{margin:auto auto 0;color:#66766e;font-size:13px}.logo{font-size:30px;font-weight:850;letter-spacing:-.105em;font-style:italic;text-decoration:none;line-height:1}.eyebrow{font-size:12px;font-weight:750;text-transform:uppercase;letter-spacing:.17em;color:#6b7e73}.shell{max-width:1160px;width:100%;margin:auto;padding:50px 32px 100px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:9vw}h1{font-size:clamp(48px,6vw,86px);line-height:.99;letter-spacing:-.07em;margin:20px 0 26px;font-weight:760;max-width:760px}p{font-size:18px;line-height:1.6;color:#607269;max-width:540px}.card{border-radius:28px;background:#fff;box-shadow:0 26px 70px #173d3015;padding:38px;max-width:480px;width:100%;justify-self:end;border:1px solid #e9ece5}h2{font-size:26px;letter-spacing:-.035em;margin:0 0 10px}.card p{font-size:15px;margin:0 0 27px}.button{background:#193e30;color:white;display:inline-flex;align-items:center;justify-content:center;min-height:54px;padding:0 24px;border-radius:14px;text-decoration:none;font-size:15px;font-weight:700;border:0;cursor:pointer;width:100%}.button:hover{background:#276149}.minor{font-size:12px!important;margin:16px 0 0!important;color:#718078!important}.tag{display:inline-flex;padding:9px 13px;background:#e7eee5;border-radius:100px;color:#316148;font-size:12px;font-weight:700}.field{margin:20px 0}.field label{display:block;font-weight:650;font-size:14px;margin-bottom:9px}select{width:100%;height:52px;padding:0 14px;background:#fafbf8;border:1px solid #d6e1d7;border-radius:12px;color:#193e30;font:inherit}.error{background:#fff1ed;color:#8e3e29;padding:12px;border-radius:10px;font-size:13px;margin:18px 0}@media(max-width:800px){.shell{grid-template-columns:1fr;padding:52px 24px 80px;gap:42px}.card{justify-self:start}header,footer{padding:24px}h1{max-width:650px}}
  </style></head><body><header><a class="logo" href="/" aria-label="CUE home">cue</a><span class="eyebrow">Rutgers pilot</span></header>${body}<footer><span>© CUE</span><span>Rutgers University–New Brunswick pilot</span></footer></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
function layout(content: string): Response {
  return page(`<main class="shell"><section><span class="eyebrow">A better way to find campus services</span><h1>Find and book services<br>from students on your campus</h1><p>CUE brings student businesses, freelancers, and bookable services into one place. The pilot starts at Rutgers–New Brunswick.</p></section><section class="card">${content}</section></main>`);
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
    if (url.pathname === '/health') return new Response('ok');
    if (!secretReady(env)) return layout('<h2>Waitlist opens soon</h2><p>We’re setting up verified Rutgers sign-in. Check back shortly.</p>');
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
    if (!user) return layout(`<span class="tag">Early access</span><h2>Join the Rutgers waitlist</h2><p>Sign in with your Rutgers Google account to join. Your email stays private.</p>${url.searchParams.has('error') ? '<div class="error">Use your verified Rutgers Google account to continue.</div>' : ''}<a class="button" href="/auth/google">Continue with Rutgers Google</a><p class="minor">Only Rutgers-managed Google accounts can join.</p>`);
    const record = await env.DB.prepare('SELECT interest FROM waitlist WHERE google_sub = ?').bind(user.sub).first<{ interest: string }>().catch(() => null);
    if (record || url.searchParams.has('joined')) return layout(`<span class="tag">You're on the list</span><h2>You're in, ${htmlEscape(user.name.split(' ')[0])}</h2><p>We’ll email your Rutgers address when CUE opens to students at New Brunswick.</p><form action="/logout" method="post"><button class="button" type="submit">Sign out</button></form>`);
    return layout(`<span class="tag">Rutgers account verified</span><h2>Join the waitlist</h2><p>Signed in as ${htmlEscape(user.email)}. What brings you to CUE?</p>${url.searchParams.has('error') ? '<div class="error">Couldn’t save your place. Please try again.</div>' : ''}<form action="/join" method="post"><div class="field"><label for="interest">I want to</label><select id="interest" name="interest" required><option value="browse">Find services</option><option value="offer">Offer services</option><option value="both">Both</option></select></div><button class="button" type="submit">Join the waitlist</button></form><p class="minor">Your Rutgers email is used for verification and launch updates only.</p>`);
  }
} satisfies ExportedHandler<Env>;
