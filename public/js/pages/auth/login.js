import { setCurrentUser } from '../../state.js';
import { getUserByEmail, getPendingUsers } from '../../data/store.js';

export function render(container) {
  container.innerHTML = `
    <style>
      /* Login-page-only visual system — scoped to .login-screen */
      .login-screen, .login-screen * { box-sizing: border-box; }
      .login-screen {
        --login-bg: #080810;
        --login-panel: #0d0d20;
        --login-ink: #f0f0ff;
        --login-muted: #7070a0;
        --login-stroke: #1e1e3a;
        --login-violet: #6c63ff;
        --login-lilac: #a78bfa;
        min-height: 100dvh;
        display: grid;
        grid-template-columns: minmax(0, 55fr) minmax(480px, 45fr);
        overflow: hidden;
        color: var(--login-ink);
        background: var(--login-bg);
        font-family:var(--font-sans);
      }
      .login-hero {
        position: relative;
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: center;
        padding: clamp(2.5rem, 7vw, 7rem);
        overflow: hidden;
        background-color: var(--login-bg);
        background-image: radial-gradient(circle, #ffffff08 1px, transparent 1px);
        background-size: 32px 32px;
        isolation: isolate;
      }
      .login-hero::after {
        content: '';
        position: absolute;
        z-index: 3;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        background: linear-gradient(to bottom, transparent, #6c63ff88 35%, #a78bfa88 65%, transparent);
        box-shadow: 0 0 16px rgba(108, 99, 255, .28);
      }
      .login-orb { position: absolute; z-index: -1; border-radius: 50%; filter: blur(2px); pointer-events: none; }
      .login-orb--one { top: -16rem; left: -14rem; width: 37.5rem; height: 37.5rem; background: rgba(108,99,255,.12); animation: login-float 8s ease-in-out infinite; }
      .login-orb--two { right: -10rem; bottom: -13rem; width: 25rem; height: 25rem; background: rgba(167,139,250,.08); animation: login-float 11s ease-in-out infinite reverse; animation-delay: -3s; }
      .login-orb--three { top: 40%; left: -8rem; width: 18.75rem; height: 18.75rem; background: rgba(59,130,246,.06); animation: login-float 14s ease-in-out infinite; animation-delay: -6s; }
      .login-hero__content { position: relative; z-index: 1; width: min(100%, 38rem); }
      .login-brand-mark, .login-badge, .login-title, .login-tagline, .login-features, .login-stats { opacity: 0; animation: login-rise .5s cubic-bezier(.16,1,.3,1) forwards; }
      .login-brand-mark { display: grid; width: 3.5rem; height: 3.5rem; place-items: center; margin-bottom: 1.7rem; color: #fff; background: linear-gradient(135deg, var(--login-violet), var(--login-lilac)); border: 1px solid rgba(255,255,255,.22); border-radius: 1rem; box-shadow: 0 12px 30px rgba(108,99,255,.32); font-size: 1.45rem; font-weight: 800; animation-delay: .03s; }
      .login-badge { display: inline-flex; align-items: center; gap: .45rem; margin: 0 0 1rem; padding: .38rem .88rem; color: var(--login-lilac); background: #6c63ff11; border: 1px solid #6c63ff44; border-radius: 100px; font-size: .6875rem; font-weight: 650; letter-spacing: .1em; text-transform: uppercase; animation-delay: .1s; }
      .login-title { max-width: 100%; margin: 0; overflow: visible; background: linear-gradient(135deg, #fff 30%, var(--login-lilac) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: #fff; font-size: clamp(3rem, 6vw, 5rem); font-weight: 800; letter-spacing: -.06em; line-height: .98; overflow-wrap: anywhere; animation-delay: .2s; }
      .login-tagline { max-width: 24rem; margin: 1.4rem 0 0; color: var(--login-muted); font-size: 1.1rem; line-height: 1.7; animation-delay: .3s; }
      .login-features { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: 1.75rem; animation-delay: .4s; }
      .login-feature { display: inline-flex; align-items: center; gap: .42rem; padding: .5rem .78rem; color: #a0a0c0; background: #0f0f1f; border: 1px solid #1e1e3a; border-radius: .5rem; font-size: .75rem; white-space: nowrap; }
      .login-stats { display: flex; gap: 0; margin-top: clamp(2.4rem, 6vh, 4rem); animation-delay: .5s; }
      .login-stat { display: grid; min-width: 7.75rem; gap: .2rem; padding: 0 1.25rem; }
      .login-stat:first-child { padding-left: 0; }
      .login-stat + .login-stat { border-left: 1px solid rgba(167,139,250,.2); }
      .login-stat strong { background: linear-gradient(135deg, #fff, var(--login-lilac)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.2rem; font-weight: 750; letter-spacing: -.04em; }
      .login-stat span { color: var(--login-muted); font-size: .7rem; font-weight: 500; }

      .login-panel { display: flex; min-width: 480px; align-items: center; justify-content: center; padding: 3.5rem; background: var(--login-panel); border-left: 1px solid #1a1a35; }
      .login-card { width: min(100%, 30rem); min-width: min(480px, 100%); padding: 3rem 3.5rem; background: rgba(18,18,39,.58); border: 1px solid rgba(167,139,250,.18); border-radius: 1.35rem; box-shadow: 0 24px 70px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.025); animation: login-card-in .6s .2s cubic-bezier(.16,1,.3,1) both; }
      .login-kicker { display: block; color: var(--login-violet); font-size: .6875rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
      .login-card h2 { margin: .55rem 0 0; color: var(--login-ink); font-size: 2rem; font-weight: 700; letter-spacing: -.04em; line-height: 1.1; }
      .login-card__intro { margin: .65rem 0 2.5rem; color: var(--login-muted); font-size: .95rem; line-height: 1.55; }
      .login-form-group { margin-bottom: 1.25rem; }
      .login-form-group label { display: block; margin-bottom: .5rem; color: var(--login-muted); font-size: .6875rem; font-weight: 650; letter-spacing: .1em; text-transform: uppercase; }
      .login-input-wrap { position: relative; }
      .login-input { width: 100%; min-height: 3.35rem; padding: .82rem 1rem; color: var(--login-ink); background: #080810; border: 1px solid var(--login-stroke); border-radius: .625rem; outline: none; font: inherit; font-size: .9375rem; transition: border-color .2s, box-shadow .2s, background .2s; }
      .login-input::placeholder { color: #4f4f71; }
      .login-input:focus { background: #0a0a16; border-color: var(--login-violet); box-shadow: 0 0 0 3px rgba(108,99,255,.15); }
      .login-input--password { padding-right: 3.25rem; }
      .login-password-toggle { position: absolute; top: 50%; right: .45rem; display: grid; width: 2.35rem; height: 2.35rem; place-items: center; padding: 0; color: var(--login-muted); background: transparent; border: 0; border-radius: .45rem; cursor: pointer; transform: translateY(-50%); transition: color .2s, background .2s; }
      .login-password-toggle:hover, .login-password-toggle:focus-visible { color: var(--login-lilac); background: rgba(108,99,255,.1); outline: none; }
      .login-password-toggle .login-eye--open { display: none; }
      .login-password-toggle.is-visible .login-eye--closed { display: none; }
      .login-password-toggle.is-visible .login-eye--open { display: inline; }
      .login-submit { position: relative; width: 100%; min-height: 3.25rem; margin-top: .25rem; overflow: hidden; color: #fff; background: linear-gradient(135deg, var(--login-violet), var(--login-lilac)); border: 0; border-radius: .625rem; box-shadow: 0 8px 20px rgba(108,99,255,.2); cursor: pointer; font: inherit; font-size: 1rem; font-weight: 650; letter-spacing: -.01em; transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s cubic-bezier(.16,1,.3,1), filter .2s; }
      .login-submit:hover:not(:disabled) { box-shadow: 0 8px 30px rgba(108,99,255,.4); filter: saturate(1.08); transform: translateY(-2px); }
      .login-submit:active:not(:disabled) { transform: translateY(0) scale(.98); }
      .login-submit:disabled { cursor: wait; }
      .login-submit:disabled::after { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.22) 42%, transparent 63%); transform: translateX(-120%); animation: login-shimmer 1.2s ease-in-out infinite; }
      .login-submit:has(~ .login-error[style*="block"]) { animation: login-shake .4s ease; }
      .login-error { display: none; margin-top: .75rem; color: #ef4444; font-size: .875rem; line-height: 1.4; animation: login-error-in .2s ease-out both; }
      .login-register { margin: 1.5rem 0 0; color: var(--login-muted); font-size: .875rem; text-align: center; }
      .login-register a { color: var(--login-lilac); font-weight: 650; text-decoration: none; }
      .login-register a:hover { color: #c4b5fd; text-decoration: underline; text-underline-offset: .18em; }
      .login-demo { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--login-stroke); }
      .login-demo summary { display: flex; align-items: center; justify-content: space-between; color: var(--login-muted); cursor: pointer; font-size: .875rem; list-style: none; transition: color .2s; }
      .login-demo summary::-webkit-details-marker { display: none; }
      .login-demo summary:hover { color: #a0a0c0; }
      .login-demo__left { display: inline-flex; align-items: center; gap: .5rem; }
      .login-demo__chevron { color: var(--login-lilac); transition: transform .2s; }
      .login-demo[open] .login-demo__chevron { transform: rotate(180deg); }
      .login-demo__content { display: grid; grid-template-rows: 0fr; margin-top: .75rem; opacity: 0; transition: grid-template-rows .25s ease, opacity .2s ease; }
      .login-demo[open] .login-demo__content { grid-template-rows: 1fr; opacity: 1; }
      .login-demo__content > div { min-height: 0; overflow: hidden; }
      .login-demo-grid { display: grid; gap: .25rem; padding: .55rem; background: #080810; border: 1px solid var(--login-stroke); border-radius: .5rem; }
      .login-demo-item { display: grid; grid-template-columns: 4.8rem minmax(0,1fr); gap: .5rem; width: 100%; padding: .5rem .6rem; color: #a0a0c0; background: transparent; border: 0; border-radius: .375rem; cursor: pointer; font: inherit; font-size: .75rem; text-align: left; transition: background .2s, color .2s; }
      .login-demo-item:hover, .login-demo-item:focus-visible { color: #e5e3ff; background: #0f0f1f; outline: none; }
      .login-demo-role { color: var(--login-violet); font-weight: 700; }
      .login-demo-credential { overflow: hidden; color: inherit; text-overflow: ellipsis; white-space: nowrap; }
      @keyframes login-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-40px); } }
      @keyframes login-rise { to { opacity: 1; transform: translateY(0); } from { opacity: 0; transform: translateY(20px); } }
      @keyframes login-card-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes login-shimmer { to { transform: translateX(120%); } }
      @keyframes login-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
      @keyframes login-error-in { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
      @media (max-width: 900px) { .login-screen { grid-template-columns: minmax(0,1fr) minmax(450px,1.15fr); } .login-hero { padding: 2.5rem; } .login-features, .login-stats { display: none; } .login-panel { min-width: 450px; padding: 2.25rem; } .login-card { padding: 2.5rem; } }
      @media (max-width: 700px) { .login-screen { grid-template-columns: 1fr; overflow: visible; } .login-hero { min-height: 17.5rem; align-items: flex-end; padding: 2.4rem 1.5rem; } .login-hero::after { top: auto; bottom: 0; width: 100%; height: 1px; background: linear-gradient(to right, transparent, #6c63ff88, #a78bfa88, transparent); } .login-brand-mark { width: 2.7rem; height: 2.7rem; margin-bottom: 1rem; border-radius: .8rem; font-size: 1.15rem; } .login-title { font-size: clamp(2.75rem, 15vw, 4rem); } .login-tagline { margin-top: .8rem; font-size: .93rem; line-height: 1.55; } .login-panel { min-width: 0; padding: 1.25rem; } .login-card { width: 100%; padding: 2rem 1.25rem; border-radius: 1rem; } .login-card__intro { margin-bottom: 1.75rem; } }
      @media (prefers-reduced-motion: reduce) { .login-screen *, .login-screen *::before, .login-screen *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
    </style>
    <main class="login-screen" aria-label="UniPortal sign in">
      <section class="login-hero" aria-labelledby="login-title">
        <div class="login-orb login-orb--one" aria-hidden="true"></div>
        <div class="login-orb login-orb--two" aria-hidden="true"></div>
        <div class="login-orb login-orb--three" aria-hidden="true"></div>
        <div class="login-hero__content">
          <div class="login-brand-mark" aria-hidden="true">U</div>
          <p class="login-badge"><span aria-hidden="true">✦</span> University operations</p>
          <h1 class="login-title" id="login-title">UniPortal</h1>
          <p class="login-tagline">Faculty appointments, office hours, and academic coordination in one focused workspace.</p>
          <div class="login-features" aria-label="Platform capabilities">
            <span class="login-feature">📅 Smart Scheduling</span>
            <span class="login-feature">👨‍🏫 Faculty Portal</span>
            <span class="login-feature">🎓 Student Booking</span>
          </div>
          <div class="login-stats" aria-label="Platform statistics">
            <div class="login-stat"><strong>500+</strong><span>Students</span></div>
            <div class="login-stat"><strong>50+</strong><span>Faculty</span></div>
            <div class="login-stat"><strong>2000+</strong><span>Appointments</span></div>
          </div>
        </div>
      </section>

      <section class="login-panel" aria-labelledby="welcome-title">
        <div class="login-card">
          <span class="login-kicker">Secure access</span>
          <h2 id="welcome-title">Welcome back</h2>
          <p class="login-card__intro">Sign in to continue to your personalised portal.</p>

          <div class="login-form-group">
            <label for="login-email">Email address</label>
            <div class="login-input-wrap"><input type="email" id="login-email" class="login-input" placeholder="you@university.edu" autocomplete="email"></div>
          </div>
          <div class="login-form-group">
            <label for="login-password">Password</label>
            <div class="login-input-wrap">
              <input type="password" id="login-password" class="login-input login-input--password" placeholder="••••••••" autocomplete="current-password">
              <button class="login-password-toggle" type="button" aria-label="Show password" onclick="const input=document.getElementById('login-password');const visible=input.type==='password';input.type=visible?'text':'password';this.classList.toggle('is-visible',visible);this.setAttribute('aria-label',visible?'Hide password':'Show password');"><span class="login-eye--closed" aria-hidden="true">◉</span><span class="login-eye--open" aria-hidden="true">◌</span></button>
            </div>
          </div>
          <button id="login-btn" class="login-submit" type="button">Sign In <span aria-hidden="true">→</span></button>
          <div id="login-error" class="login-error" role="alert" aria-live="polite" style="display:none;"></div>
          <p class="login-register">New to UniPortal? <a href="#/register">Create your account</a></p>

          <details class="login-demo">
            <summary><span class="login-demo__left"><span aria-hidden="true">→</span> Demo credentials</span><span class="login-demo__chevron" aria-hidden="true">⌄</span></summary>
            <div class="login-demo__content"><div><div class="login-demo-grid">
              <button class="login-demo-item" type="button" data-email="admin@uni.edu" data-password="Admin@123"><span class="login-demo-role">Admin</span><span class="login-demo-credential">admin@uni.edu / Admin@123</span></button>
              <button class="login-demo-item" type="button" data-email="dr.sharma@uni.edu" data-password="Faculty@123"><span class="login-demo-role">Faculty</span><span class="login-demo-credential">dr.sharma@uni.edu / Faculty@123</span></button>
              <button class="login-demo-item" type="button" data-email="alice@uni.edu" data-password="Student@123"><span class="login-demo-role">Student</span><span class="login-demo-credential">alice@uni.edu / Student@123</span></button>
            </div></div></div>
          </details>
        </div>
      </section>
    </main>
  `;

  // Click-to-fill demo tiles
  container.querySelectorAll('.login-demo-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('login-email').value    = item.dataset.email;
      document.getElementById('login-password').value = item.dataset.password;
      document.getElementById('login-error').style.display = 'none';
    });
  });

  const btn      = document.getElementById('login-btn');
  const errorDiv = document.getElementById('login-error');

  function showError(msg) {
    errorDiv.textContent   = msg;
    errorDiv.style.display = 'block';
    btn.disabled           = false;
    btn.innerHTML          = 'Sign In <span aria-hidden="true">→</span>';
  }

  async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { showError('Please enter your email and password.'); return; }

    btn.disabled  = true;
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:0.5rem;"><span class="spinner" style="width:16px;height:16px;border-width:2px;"></span>Signing in…</span>';
    errorDiv.style.display = 'none';

    // Simulate 800ms async auth
    await new Promise(r => setTimeout(r, 800));

    // Check if this email is pending admin approval
    const isPending = getPendingUsers().some(
      p => p.email.toLowerCase() === email.toLowerCase()
    );
    if (isPending) {
      showError('Your registration is pending admin approval. Please wait for the admin to approve your account.');
      return;
    }

    // Authenticate against localStorage store (no server needed)
    const user = getUserByEmail(email);
    if (user && user.password === password) {
      const { password: _pw, ...safeUser } = user;
      console.log('✅ Logged in:', safeUser);
      setCurrentUser(safeUser);
      window.location.hash = `#/${safeUser.role}/dashboard`;
      return;
    }

    showError('Invalid email or password. Please try again.');
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
  }

  btn.addEventListener('click', handleLogin);
  container.querySelectorAll('#login-email,#login-password').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });
}
