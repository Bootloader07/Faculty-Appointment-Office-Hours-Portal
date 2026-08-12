import { submitRegistrationRequest } from '../../data/store.js';


export function render(container) {
  container.innerHTML = `
    <style>
      /* Registration-page-only visual system — intentionally scoped. */
      .register-screen, .register-screen * { box-sizing: border-box; }
      .register-screen {
        --reg-bg: #080810; --reg-panel: #0d0d20; --reg-ink: #f0f0ff;
        --reg-muted: #7070a0; --reg-stroke: #1e1e3a; --reg-violet: #6c63ff; --reg-lilac: #a78bfa;
        display: grid; grid-template-columns: minmax(0,55fr) minmax(480px,45fr); min-height: 100dvh;
        overflow: hidden; color: var(--reg-ink); background: var(--reg-bg);
        font-family:var(--font-sans);
      }
      .register-hero { position: relative; display: flex; min-width: 0; align-items: center; justify-content: center; padding: clamp(2.5rem,7vw,7rem); overflow: hidden; isolation: isolate; background-color: var(--reg-bg); background-image: radial-gradient(circle,#ffffff08 1px,transparent 1px); background-size: 32px 32px; }
      .register-hero::after { content:''; position:absolute; z-index:3; top:0; right:0; width:1px; height:100%; background:linear-gradient(to bottom,transparent,#6c63ff88 35%,#a78bfa88 65%,transparent); box-shadow:0 0 16px rgba(108,99,255,.28); }
      .register-orb { position:absolute; z-index:-1; border-radius:50%; filter:blur(2px); pointer-events:none; }
      .register-orb--one { top:-16rem; left:-14rem; width:37.5rem; height:37.5rem; background:rgba(108,99,255,.12); animation:reg-float 8s ease-in-out infinite; }
      .register-orb--two { right:-10rem; bottom:-13rem; width:25rem; height:25rem; background:rgba(167,139,250,.08); animation:reg-float 11s ease-in-out infinite reverse -3s; }
      .register-orb--three { top:40%; left:-8rem; width:18.75rem; height:18.75rem; background:rgba(59,130,246,.06); animation:reg-float 14s ease-in-out infinite -6s; }
      .register-hero__content { position:relative; z-index:1; width:min(100%,38rem); }
      .register-mark,.register-badge,.register-title,.register-tagline,.register-features,.register-stats { opacity:0; animation:reg-rise .5s cubic-bezier(.16,1,.3,1) forwards; }
      .register-mark { display:grid; width:3.5rem; height:3.5rem; place-items:center; margin-bottom:1.7rem; color:#fff; background:linear-gradient(135deg,var(--reg-violet),var(--reg-lilac)); border:1px solid rgba(255,255,255,.22); border-radius:1rem; box-shadow:0 12px 30px rgba(108,99,255,.32); font-size:1.45rem; font-weight:800; animation-delay:.03s; }
      .register-badge { display:inline-flex; align-items:center; gap:.45rem; margin:0 0 1rem; padding:.38rem .88rem; color:var(--reg-lilac); background:#6c63ff11; border:1px solid #6c63ff44; border-radius:100px; font-size:.6875rem; font-weight:650; letter-spacing:.1em; text-transform:uppercase; animation-delay:.1s; }
      .register-title { max-width:100%; margin:0; overflow:visible; background:linear-gradient(135deg,#fff 30%,var(--reg-lilac) 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:#fff; font-size:clamp(3rem,6vw,5rem); font-weight:800; letter-spacing:-.06em; line-height:.98; overflow-wrap:anywhere; animation-delay:.2s; }
      .register-tagline { max-width:24rem; margin:1.4rem 0 0; color:var(--reg-muted); font-size:1.1rem; line-height:1.7; animation-delay:.3s; }
      .register-features { display:flex; flex-wrap:wrap; gap:.55rem; margin-top:1.75rem; animation-delay:.4s; }
      .register-feature { display:inline-flex; align-items:center; gap:.42rem; padding:.5rem .78rem; color:#a0a0c0; background:#0f0f1f; border:1px solid #1e1e3a; border-radius:.5rem; font-size:.75rem; white-space:nowrap; }
      .register-stats { display:flex; gap:0; margin-top:clamp(2.4rem,6vh,4rem); animation-delay:.5s; }
      .register-stat { display:grid; min-width:8.1rem; gap:.2rem; padding:0 1.25rem; }
      .register-stat:first-child { padding-left:0; } .register-stat + .register-stat { border-left:1px solid rgba(167,139,250,.2); }
      .register-stat strong { background:linear-gradient(135deg,#fff,var(--reg-lilac)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; font-size:1.02rem; font-weight:750; letter-spacing:-.035em; }
      .register-stat span { color:var(--reg-muted); font-size:.7rem; font-weight:500; }

      .register-panel { display:flex; min-width:480px; align-items:center; justify-content:center; padding:3rem 3.5rem; overflow-y:auto; background:var(--reg-panel); border-left:1px solid #1a1a35; }
      .register-card { width:min(100%,32rem); min-width:min(480px,100%); padding:3rem 3.5rem; background:rgba(18,18,39,.58); border:1px solid rgba(167,139,250,.18); border-radius:1.35rem; box-shadow:0 24px 70px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.025); animation:reg-card-in .6s .2s cubic-bezier(.16,1,.3,1) both; }
      .register-kicker { display:block; color:var(--reg-violet); font-size:.6875rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
      .register-card h1 { margin:.55rem 0 0; color:var(--reg-ink); font-size:1.85rem; font-weight:700; letter-spacing:-.03em; line-height:1.1; }
      .register-intro { margin:.65rem 0 2rem; color:var(--reg-muted); font-size:.95rem; line-height:1.55; }
      .register-group { margin-bottom:1.25rem; }
      .register-group label { display:block; margin-bottom:.5rem; color:var(--reg-muted); font-size:.6875rem; font-weight:650; letter-spacing:.1em; text-transform:uppercase; }
      .register-input-wrap { position:relative; }
      .register-input { width:100%; min-height:3.35rem; padding:.82rem 1rem; color:var(--reg-ink); background:#080810; border:1px solid var(--reg-stroke); border-radius:.625rem; outline:none; font:inherit; font-size:.9375rem; transition:border-color .2s,box-shadow .2s,background .2s; }
      .register-input::placeholder { color:#4f4f71; } .register-input:focus { background:#0a0a16; border-color:var(--reg-violet); box-shadow:0 0 0 3px rgba(108,99,255,.15); }
      .register-input--password { padding-right:3.25rem; }
      .register-password-toggle { position:absolute; top:50%; right:.45rem; display:grid; width:2.35rem; height:2.35rem; place-items:center; padding:0; color:var(--reg-muted); background:transparent; border:0; border-radius:.45rem; cursor:pointer; transform:translateY(-50%); transition:color .2s,background .2s; }
      .register-password-toggle:hover,.register-password-toggle:focus-visible { color:var(--reg-lilac); background:rgba(108,99,255,.1); outline:none; }
      .register-password-toggle .reg-eye--open { display:none; } .register-password-toggle.is-visible .reg-eye--closed { display:none; } .register-password-toggle.is-visible .reg-eye--open { display:inline; }
      .register-role-control { display:flex; gap:.25rem; padding:.25rem; background:#080810; border:1px solid var(--reg-stroke); border-radius:.625rem; }
      .register-role-pill { flex:1; min-height:2.65rem; padding:.5rem; color:var(--reg-muted); background:transparent; border:0; border-radius:.5rem; cursor:pointer; font:inherit; font-size:.875rem; font-weight:500; transition:background .15s,color .15s,box-shadow .15s,transform .15s; }
      .register-role-pill:hover { color:#c4b5fd; background:rgba(108,99,255,.09); }
      .register-role-pill.is-active { color:#fff; background:var(--reg-violet); box-shadow:0 2px 8px rgba(108,99,255,.4); }
      .register-role-select { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
      .register-submit { position:relative; width:100%; min-height:3.25rem; margin-top:.25rem; overflow:hidden; color:#fff; background:linear-gradient(135deg,var(--reg-violet),var(--reg-lilac)); border:0; border-radius:.625rem; box-shadow:0 8px 20px rgba(108,99,255,.2); cursor:pointer; font:inherit; font-size:1rem; font-weight:650; letter-spacing:-.01em; transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s cubic-bezier(.16,1,.3,1),filter .2s; }
      .register-submit:hover:not(:disabled) { box-shadow:0 8px 30px rgba(108,99,255,.4); filter:saturate(1.08); transform:translateY(-2px); } .register-submit:active:not(:disabled) { transform:translateY(0) scale(.98); } .register-submit:disabled { cursor:wait; }
      .register-submit:disabled::after { content:''; position:absolute; inset:0; background:linear-gradient(100deg,transparent 20%,rgba(255,255,255,.22) 42%,transparent 63%); transform:translateX(-120%); animation:reg-shimmer 1.2s ease-in-out infinite; }
      .register-submit:has(+ .register-error[style*="block"]) { animation:reg-shake .4s ease; }
      .register-error { display:none; margin-top:.75rem; color:#ef4444; font-size:.875rem; line-height:1.4; animation:reg-error-in .2s ease-out both; }
      .register-login { margin:1.5rem 0 0; color:var(--reg-muted); font-size:.875rem; text-align:center; }
      .register-login a { color:var(--reg-lilac); font-weight:650; text-decoration:none; } .register-login a:hover { color:#c4b5fd; text-decoration:underline; text-underline-offset:.18em; }
      @keyframes reg-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-40px); } }
      @keyframes reg-rise { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes reg-card-in { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
      @keyframes reg-shimmer { to { transform:translateX(120%); } }
      @keyframes reg-shake { 0%,100% { transform:translateX(0); } 20% { transform:translateX(-8px); } 40% { transform:translateX(8px); } 60% { transform:translateX(-6px); } 80% { transform:translateX(6px); } }
      @keyframes reg-error-in { from { opacity:0; transform:translateY(-3px); } to { opacity:1; transform:translateY(0); } }
      @media (max-width:900px) { .register-screen { grid-template-columns:minmax(0,1fr) minmax(450px,1.15fr); } .register-hero { padding:2.5rem; } .register-features,.register-stats { display:none; } .register-panel { min-width:450px; padding:2.25rem; } .register-card { padding:2.5rem; } }
      @media (max-width:700px) { .register-screen { grid-template-columns:1fr; overflow:visible; } .register-hero { min-height:17.5rem; align-items:flex-end; padding:2.4rem 1.5rem; } .register-hero::after { top:auto; bottom:0; width:100%; height:1px; background:linear-gradient(to right,transparent,#6c63ff88,#a78bfa88,transparent); } .register-mark { width:2.7rem; height:2.7rem; margin-bottom:1rem; border-radius:.8rem; font-size:1.15rem; } .register-title { font-size:clamp(2.75rem,15vw,4rem); } .register-tagline { margin-top:.8rem; font-size:.93rem; line-height:1.55; } .register-panel { min-width:0; padding:1.25rem; overflow:visible; } .register-card { width:100%; min-width:0; padding:2rem 1.25rem; border-radius:1rem; } .register-intro { margin-bottom:1.75rem; } }
      @media (prefers-reduced-motion:reduce) { .register-screen *,.register-screen *::before,.register-screen *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; } }
    </style>
    <main class="register-screen" aria-label="Create a UniPortal account">
      <section class="register-hero" aria-labelledby="register-brand-title">
        <div class="register-orb register-orb--one" aria-hidden="true"></div><div class="register-orb register-orb--two" aria-hidden="true"></div><div class="register-orb register-orb--three" aria-hidden="true"></div>
        <div class="register-hero__content">
          <div class="register-mark" aria-hidden="true">U</div>
          <p class="register-badge"><span aria-hidden="true">✦</span> University operations</p>
          <h1 class="register-title" id="register-brand-title">UniPortal</h1>
          <p class="register-tagline">Create your account and join the academic scheduling platform.</p>
          <div class="register-features" aria-label="Platform capabilities"><span class="register-feature">📅 Smart Scheduling</span><span class="register-feature">👨‍🏫 Faculty Portal</span><span class="register-feature">🎓 Student Booking</span></div>
          <div class="register-stats" aria-label="Platform benefits"><div class="register-stat"><strong>3 Roles</strong><span>One workspace</span></div><div class="register-stat"><strong>Real-time</strong><span>Updates</span></div><div class="register-stat"><strong>Instant</strong><span>Booking</span></div></div>
        </div>
      </section>
      <section class="register-panel" aria-labelledby="register-heading">
        <div class="register-card">
          <span class="register-kicker">Join UniPortal</span><h1 id="register-heading">Create Account</h1><p class="register-intro">Join the Faculty Appointment Portal</p>
          <div class="register-group"><label for="reg-name">Full name</label><div class="register-input-wrap"><input type="text" id="reg-name" class="register-input" placeholder="John Doe" autocomplete="name"></div></div>
          <div class="register-group"><label for="reg-email">Email address</label><div class="register-input-wrap"><input type="email" id="reg-email" class="register-input" placeholder="name@uni.edu" autocomplete="email"></div></div>
          <div class="register-group"><label for="reg-password">Password</label><div class="register-input-wrap"><input type="password" id="reg-password" class="register-input register-input--password" placeholder="Min 6 characters" autocomplete="new-password"><button class="register-password-toggle" type="button" aria-label="Show password" onclick="const input=document.getElementById('reg-password');const visible=input.type==='password';input.type=visible?'text':'password';this.classList.toggle('is-visible',visible);this.setAttribute('aria-label',visible?'Hide password':'Show password');"><span class="reg-eye--closed" aria-hidden="true">◉</span><span class="reg-eye--open" aria-hidden="true">◌</span></button></div></div>
          <div class="register-group"><label for="reg-role">Role</label><div class="register-role-control" role="group" aria-label="Role selection"><button class="register-role-pill is-active" type="button" data-role="student" aria-pressed="true">Student</button><button class="register-role-pill" type="button" data-role="faculty" aria-pressed="false">Faculty</button><button class="register-role-pill" type="button" data-role="admin" aria-pressed="false">Admin</button></div><select id="reg-role" class="register-role-select" aria-label="Role"><option value="student">Student</option><option value="faculty">Faculty</option><option value="admin">Admin</option></select></div>
          <div class="register-group" style="margin-bottom:1.75rem;"><label for="reg-department">Department</label><div class="register-input-wrap"><input type="text" id="reg-department" class="register-input" placeholder="e.g. Computer Science"></div></div>
          <button id="reg-btn" class="register-submit" type="button">Create Account <span aria-hidden="true">→</span></button><div id="reg-error" class="register-error" role="alert" aria-live="polite" style="display:none;"></div>
          <p class="register-login">Already have an account? <a href="#/login">Sign In</a></p>
        </div>
      </section>
    </main>
  `;

  const roleSelect = document.getElementById('reg-role');
  container.querySelectorAll('.register-role-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      roleSelect.value = pill.dataset.role;
      container.querySelectorAll('.register-role-pill').forEach(item => {
        const active = item === pill;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
    });
  });

  const btn      = document.getElementById('reg-btn');
  const errorDiv = document.getElementById('reg-error');
  function showError(msg) {
    errorDiv.textContent   = msg;
    errorDiv.style.display = 'block';
    btn.disabled           = false;
    btn.innerHTML          = 'Create Account <span aria-hidden="true">→</span>';
  }
  btn.addEventListener('click', async () => {
    const name       = document.getElementById('reg-name').value.trim();
    const email      = document.getElementById('reg-email').value.trim();
    const password   = document.getElementById('reg-password').value;
    const role       = document.getElementById('reg-role').value;
    const department = document.getElementById('reg-department').value.trim();
    // Validate
    if (!name)                                 return showError('Please enter your full name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Please enter a valid email address.');
    if (!password || password.length < 6)      return showError('Password must be at least 6 characters.');
    if (!department)                           return showError('Please enter your department.');

    btn.disabled  = true;
    btn.innerHTML = 'Submitting request…';
    errorDiv.style.display = 'none';
    await new Promise(r => setTimeout(r, 600));

    const result = submitRegistrationRequest({ name, email, password, role, department });

    if (!result.success) {
      return showError(result.error);
    }

    // ── Show success card in place of the form ────────────────────────────────
    const card = container.querySelector('.register-card');
    if (card) {
      card.innerHTML = `
        <div style="text-align:center;padding:1.5rem 0;">
          <div style="font-size:3.5rem;margin-bottom:1.25rem;line-height:1;">✅</div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#f0f0ff;
            margin:0 0 0.75rem;letter-spacing:-.03em;">Request Submitted!</h2>
          <p style="color:#7070a0;font-size:0.95rem;line-height:1.6;margin:0 0 1.5rem;">
            Your registration request has been sent to the admin.<br>
            You will be able to log in once your account is approved.
          </p>
          <div style="background:#080810;border:1px solid #6c63ff44;
            border-radius:10px;padding:1rem 1.25rem;margin-bottom:1.75rem;text-align:left;">
            <p style="color:#a0a0c0;font-size:13px;margin:0;line-height:1.6;">
              ℹ️ Please check back and try logging in after
              the admin has approved your registration.
            </p>
          </div>
          <button id="reg-back-btn" class="register-submit" type="button"
            style="max-width:240px;margin:0 auto;display:block;">
            Back to Sign In <span aria-hidden="true">→</span>
          </button>
        </div>
      `;
      card.querySelector('#reg-back-btn').addEventListener('click', () => {
        window.location.hash = '#/login';
      });
    }
  });
}
