export const landingScript = `(() => {
  const links = document.querySelectorAll('a[href="#join"]');
  links.forEach(link => link.addEventListener('click', () => {
    const panel = document.querySelector('#join');
    panel?.classList.remove('attention');
    requestAnimationFrame(() => panel?.classList.add('attention'));
  }));
})();`;

export function landingPage(content: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#95bac7">
  <meta name="description" content="Join CUE, the student services marketplace. Founding providers at Rutgers University–New Brunswick get their first semester free.">
  <title>Join CUE — Student services on campus</title>
  <style>
    :root{font-family:Inter,Arial,Helvetica,sans-serif;color:#10272b;background:#95bac7;--blue:#95bac7;--ink:#10272b;--pale:#d9e9ec;--white:#f7f9f8;--line:#436b7480}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;min-width:320px}
    a{color:inherit}
    button,select{font:inherit}
    button{cursor:pointer}
    .shell{width:min(100% - 88px,1500px);margin-inline:auto}
    .top{height:92px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:22px}
    .brand{display:block;overflow:hidden;width:115px;height:60px;flex:none;mix-blend-mode:multiply}
    .brand img{width:127px;height:80px;display:block;transform:translate(-6px,-13px)}
    .top-right{display:flex;align-items:center;gap:30px}
    .launch{font-size:12px;letter-spacing:.12em;font-weight:800;text-transform:uppercase}
    .top-link{border:1px solid var(--ink);border-radius:100px;padding:13px 21px;text-decoration:none;font-size:13px;font-weight:800;white-space:nowrap;transition:background .2s,color .2s}
    .top-link:hover{background:var(--ink);color:var(--white)}
    .hero{padding-top:42px;padding-bottom:72px}
    .kicker{display:flex;align-items:center;gap:12px;font-size:12px;font-weight:800;letter-spacing:.17em;text-transform:uppercase}
    .kicker:before{content:'';width:26px;height:2px;background:currentColor}
    h1{font-family:Arial,Helvetica,sans-serif;font-size:clamp(105px,18.5vw,300px);font-weight:900;line-height:.8;letter-spacing:-.105em;margin:40px 0 35px;white-space:nowrap}
    .hero-lower{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.72fr);gap:clamp(32px,5vw,92px);align-items:start}
    .hero-copy h2{font-size:clamp(38px,4.4vw,67px);line-height:1.04;letter-spacing:-.06em;font-weight:800;max-width:800px;margin:0 0 24px}
    .hero-copy h2 span{display:block}
    .hero-copy p{font-size:clamp(17px,1.5vw,21px);line-height:1.43;max-width:560px;margin:0;color:#21444b}
    .hero-copy p strong{color:var(--ink)}
    .audience{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:40px;font-size:15px}
    .audience a{font-weight:800;text-decoration-thickness:1px;text-underline-offset:5px}
    .audience span{color:#2d5057}
    .invite{background:var(--white);color:var(--ink);border:1px solid #132d3066;box-shadow:10px 10px 0 #173941;position:relative;padding:clamp(26px,3.1vw,45px);scroll-margin-top:25px}
    .invite:before,.invite:after{content:'';position:absolute;width:20px;height:20px;border-radius:50%;background:var(--blue);left:-11px;top:59%;border-right:1px solid #132d3066}
    .invite:after{left:auto;right:-11px;border-right:0;border-left:1px solid #132d3066}
    .offer-label{font-size:12px;font-weight:850;letter-spacing:.16em;text-transform:uppercase;border-bottom:1px solid #b7c9ca;padding-bottom:16px}
    .offer-head{font-size:clamp(45px,4.2vw,67px);font-weight:850;letter-spacing:-.07em;line-height:.98;margin:24px 0 14px}
    .offer-head em{font-style:normal;color:#4a7b88}
    .offer-explain{font-size:15px;line-height:1.48;color:#426168;margin:0 0 27px}
    .join-card{border-top:1px solid #b7c9ca;padding-top:25px}
    .join-card .tag{display:none}
    .join-card h3{font-size:22px;letter-spacing:-.04em;margin:0 0 8px}
    .join-card p{color:#4c666b;line-height:1.42;font-size:14px;margin:0 0 18px}
    .button{background:var(--ink);color:white;border:1px solid var(--ink);min-height:56px;width:100%;display:flex;align-items:center;justify-content:center;padding:14px 19px;text-decoration:none;font-size:15px;font-weight:800;transition:background .2s,transform .2s}
    .button:hover:not(:disabled){background:#285864;transform:translateY(-2px)}
    .button:disabled{background:#688b93;border-color:#688b93;color:white;cursor:not-allowed}
    .minor{font-size:12px!important;margin:13px 0 0!important;color:#566e72!important}
    .field{margin:17px 0}.field label{font-size:14px;font-weight:750;display:block;margin-bottom:8px}
    select{width:100%;height:52px;padding:0 16px;border:1px solid #93aeb1;background:white;color:var(--ink);border-radius:0;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='none' stroke='%2310272b' stroke-width='2' d='m5 7 5 5 5-5'/%3E%3C/svg%3E");background-size:20px;background-position:right 14px center;background-repeat:no-repeat}
    .error{background:#ffede9;color:#7a3028;padding:12px;font-size:14px;margin:12px 0}
    .proof{border-top:1px solid var(--line);background:#eaf1f1;padding:48px 0 54px}
    .proof-grid{display:grid;grid-template-columns:minmax(230px,.8fr) repeat(3,1fr);gap:clamp(20px,3.2vw,50px);align-items:start}
    .proof-title{font-size:28px;font-weight:800;line-height:1.1;letter-spacing:-.045em;margin:0}
    .proof-item{border-left:1px solid #a8bec0;padding-left:20px}
    .proof-item b{display:block;font-size:16px;letter-spacing:-.02em;margin-bottom:8px}
    .proof-item p{font-size:14px;line-height:1.45;color:#426168;margin:0}
    .bottom{background:var(--ink);color:#d9e9ec;padding:27px 0}
    .bottom-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;font-size:13px}
    .bottom a{text-decoration-thickness:1px;text-underline-offset:4px}
    .attention{animation:attention .65s ease-out}
    @keyframes attention{50%{box-shadow:10px 10px 0 #173941,0 0 0 10px #f7f9f880}}
    a:focus-visible,button:focus-visible,select:focus-visible{outline:3px solid #10272b;outline-offset:4px}
    @media(max-width:1100px){.hero-lower{grid-template-columns:1fr minmax(330px,.8fr);gap:28px}.proof-grid{grid-template-columns:1fr 1fr}.proof-title{grid-column:1/-1}.hero-copy h2{font-size:clamp(37px,4.5vw,55px)}}
    @media(max-width:760px){.shell{width:min(100% - 42px,650px)}.top{height:77px}.top-right{gap:8px}.launch{display:none}.brand{width:92px;height:50px}.brand img{width:102px;height:64px;transform:translate(-5px,-11px)}.top-link{padding:10px 14px}.hero{padding-top:42px;padding-bottom:56px}.kicker{font-size:11px}h1{font-size:clamp(70px,19.5vw,150px);margin:40px 0 34px}.hero-lower{grid-template-columns:1fr;gap:42px}.hero-copy h2{font-size:clamp(38px,8vw,62px)}.hero-copy p{font-size:17px}.audience{margin-top:24px}.invite{max-width:580px}.proof{padding:40px 0}.proof-grid{gap:24px}.proof-title{font-size:25px}}
    @media(max-width:500px){.shell{width:calc(100% - 36px)}.top-link{font-size:12px}.hero{padding-top:30px}.kicker{letter-spacing:.1em}h1{font-size:19.3vw;margin:35px 0 35px}.hero-copy h2{font-size:40px}.invite{box-shadow:6px 6px 0 #173941;padding:25px}.offer-head{font-size:48px}.proof-grid{grid-template-columns:1fr;gap:19px}.proof-title{grid-column:auto}.proof-item{padding-left:16px}.bottom-inner{align-items:start;flex-direction:column}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation:none!important;transition:none!important}}
  </style>
  <script defer src="/site.js"></script>
</head>
<body>
  <header class="top shell"><a class="brand" href="/" aria-label="CUE home"><img src="/logo.png" alt="CUE"></a><div class="top-right"><span class="launch">Rutgers University–New Brunswick</span><a class="top-link" href="#join">Get early access</a></div></header>
  <main>
    <section class="hero shell" aria-labelledby="hero-title">
      <div class="kicker">Student services · Rutgers launch</div>
      <h1 id="hero-title">JOIN CUE</h1>
      <div class="hero-lower"><div class="hero-copy"><h2><span>For the business</span> you're building on campus.</h2><p>Put your services, work, and availability in one place. Students can find your profile and request a booking.</p><div class="audience"><a href="#join">Get founding access</a><span>Looking for a service? You can join too.</span></div></div>
        <div class="invite" id="join"><div class="offer-label">Founding provider offer</div><div class="offer-head">First semester <em>free.</em></div><p class="offer-explain">Join as a provider before launch. No payment today. We’ll share pricing before your free semester ends.</p><div class="join-card">${content}</div></div>
      </div>
    </section>
    <section class="proof" aria-label="What CUE will offer"><div class="shell proof-grid"><h2 class="proof-title">One place for student services.</h2><div class="proof-item"><b>Get discovered</b><p>Students search for services at their university.</p></div><div class="proof-item"><b>Show your work</b><p>Put your portfolio, pricing, and availability on one profile.</p></div><div class="proof-item"><b>Take bookings</b><p>Students request appointments directly from your profile.</p></div></div></section>
  </main>
  <footer class="bottom"><div class="shell bottom-inner"><span>© CUE · Rutgers University–New Brunswick launch</span><a href="#join">Join CUE</a></div></footer>
</body>
</html>`;
}
