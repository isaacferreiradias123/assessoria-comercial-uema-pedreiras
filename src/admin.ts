const THEME_CONTROL = `<span class="theme-moon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg></span><span class="theme-sun" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></span>`

const THEME_CHOICES = `<button type="button" data-theme-choice="light" aria-pressed="false"><span aria-hidden="true">☼</span><span>Claro</span></button><button type="button" data-theme-choice="dark" aria-pressed="false"><span aria-hidden="true">◐</span><span>Escuro</span></button>`

const THEME_BOOT = `<script>(function(){try{var saved=localStorage.getItem('site-theme');var theme=saved==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',theme)}catch(_){document.documentElement.setAttribute('data-theme','light')}})();</script>`

const THEME_STYLE = `<style>
:root{color-scheme:light;--admin-page:#f1f5f9;--admin-surface:#fff;--admin-surface-muted:#f8fafc;--admin-input:#fff;--admin-ink:#0f172a;--admin-muted:#64748b;--admin-line:#e2e8f0;--admin-soft:#eff6ff}
html[data-theme="dark"]{color-scheme:dark;--admin-page:#0b1220;--admin-surface:#111c31;--admin-surface-muted:#152238;--admin-input:#0f1a2e;--admin-ink:#f8fafc;--admin-muted:#94a3b8;--admin-line:#26364f;--admin-soft:rgba(37,99,235,.16)}
html,body{min-width:320px;scroll-behavior:smooth}body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--admin-page)!important;color:var(--admin-ink);transition:background-color .25s ease,color .25s ease}button,input,select,textarea{font:inherit}button{touch-action:manipulation}button:active{transform:translateY(1px)}
#content>section,#content>div>a,#content [data-id]{box-shadow:0 1px 2px rgba(15,23,42,.04);transition:transform .2s cubic-bezier(.23,1,.32,1),box-shadow .2s ease,border-color .2s ease}#content>section:hover,#content>div>a:hover,#content [data-id]:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(15,23,42,.07)}#content [data-id]{will-change:transform}.nav-item{transition:background-color .18s ease,color .18s ease,transform .18s cubic-bezier(.23,1,.32,1)}.nav-item:hover{transform:translateX(2px)}#sidebar,.modal-body{overscroll-behavior:contain}.modal-body{max-height:min(70vh,42rem);overflow:auto}
input,select,textarea{background:var(--admin-input);color:var(--admin-ink);border-color:var(--admin-line)}input::placeholder,textarea::placeholder{color:var(--admin-muted)}
input:focus-visible,button:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
.theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;border:1px solid var(--admin-line);border-radius:.8rem;color:var(--admin-ink);background:var(--admin-surface);transition:background-color .2s ease,border-color .2s ease,color .2s ease,transform .16s cubic-bezier(.23,1,.32,1)}.theme-toggle:hover{border-color:#60a5fa;color:#2563eb;background:var(--admin-soft)}.theme-toggle svg{width:1.1rem;height:1.1rem}.theme-sun{display:none}.theme-moon{display:block}html[data-theme="dark"] .theme-sun{display:block}html[data-theme="dark"] .theme-moon{display:none}
.theme-picker{display:inline-flex;align-items:center;gap:.15rem;padding:.2rem;border:1px solid var(--admin-line);border-radius:.8rem;background:var(--admin-surface);color:var(--admin-muted)}.theme-picker button{display:inline-flex;align-items:center;justify-content:center;gap:.3rem;min-height:2.2rem;padding:.35rem .65rem;border:0;border-radius:.6rem;background:transparent;color:inherit;font-size:.72rem;font-weight:700;transition:background-color .2s ease,color .2s ease,transform .16s ease}.theme-picker button:hover{background:var(--admin-soft);color:#2563eb}.theme-picker button[aria-pressed="true"]{background:#2563eb;color:#fff;box-shadow:0 2px 6px rgba(37,99,235,.22)}
html[data-theme="dark"] .project-logo{filter:none!important;opacity:1!important}html[data-theme="dark"] #content>section:hover,html[data-theme="dark"] #content>div>a:hover,html[data-theme="dark"] #content [data-id]:hover{box-shadow:0 10px 26px rgba(0,0,0,.22)}html[data-theme="dark"] .bg-white{background:var(--admin-surface)!important}html[data-theme="dark"] .bg-slate-50{background:var(--admin-surface-muted)!important}html[data-theme="dark"] .bg-slate-100{background:var(--admin-page)!important}html[data-theme="dark"] .text-primary{color:#f8fafc!important}html[data-theme="dark"] .text-slate-800,html[data-theme="dark"] .text-slate-700{color:#cbd5e1!important}html[data-theme="dark"] .text-slate-600{color:#cbd5e1!important}html[data-theme="dark"] .text-slate-500,html[data-theme="dark"] .text-slate-400{color:#94a3b8!important}html[data-theme="dark"] .text-brand{color:#60a5fa!important}html[data-theme="dark"] .border-slate-200,html[data-theme="dark"] .border-slate-300{border-color:var(--admin-line)!important}html[data-theme="dark"] .bg-blue-50{background:var(--admin-soft)!important}html[data-theme="dark"] .hover\\:bg-slate-50:hover{background:#1d2b43!important}html[data-theme="dark"] .hover\\:bg-blue-50:hover{background:rgba(37,99,235,.2)!important}
.nav-item.active{background:#eff6ff;color:#1d4ed8;font-weight:700}html[data-theme="dark"] .nav-item.active{background:rgba(37,99,235,.2);color:#93c5fd}
#toast-container{width:min(24rem,calc(100vw - 2rem));pointer-events:none}#toast-container>div{pointer-events:auto}#modal-container{isolation:isolate}
@media (max-width:639px){#toast-container{left:1rem;right:1rem;top:1rem}.modal-body{padding:1rem!important}.admin-actions{flex-direction:column}.admin-actions>*{width:100%}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transform:none!important}}
</style>`

const THEME_SCRIPT = `<script>(function(){function sync(){var dark=document.documentElement.getAttribute('data-theme')==='dark';document.querySelectorAll('[data-theme-toggle]').forEach(function(b){b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Ativar tema claro':'Ativar tema escuro');b.setAttribute('title',dark?'Ativar tema claro':'Ativar tema escuro')})}function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('site-theme',t)}catch(_){ }sync()}document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-theme-toggle]'):null;if(b)setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')});sync()})();</script>`
const THEME_CHOICES_SCRIPT = `<script>(function(){function sync(){var dark=document.documentElement.getAttribute('data-theme')==='dark';document.querySelectorAll('[data-theme-choice]').forEach(function(b){b.setAttribute('aria-pressed',String((b.getAttribute('data-theme-choice')==='dark')===dark))})}function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('site-theme',t)}catch(_){ }sync()}document.querySelectorAll('[data-theme-choice]').forEach(function(b){b.addEventListener('click',function(){setTheme(b.getAttribute('data-theme-choice')==='dark'?'dark':'light')})});if(window.MutationObserver){new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}sync()})();</script>`

export function renderLoginPage(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
${THEME_BOOT}
<title>Entrar — Painel Administrativo</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="/static/projeto-logo-recortado.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- CSS compilado no build (substitui o Tailwind via CDN, que compilava no navegador). -->
<link rel="stylesheet" href="/static/app.css">
${THEME_STYLE}
</head>
<body class="min-h-screen bg-primary flex items-center justify-center p-4 relative">
<div class="theme-picker absolute top-4 right-4" role="group" aria-label="Escolher tema">${THEME_CHOICES}</div>
<main class="w-full max-w-sm">
  <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transition-colors">
    <div class="flex flex-col items-center mb-6">
      <img src="/static/projeto-logo-recortado.png" alt="Logo Assessoria Comercial UEMA Pedreiras" class="project-logo w-16 h-16 object-contain mb-3" width="64" height="64">
      <h1 class="text-xl font-extrabold text-primary text-center">Painel Administrativo</h1>
      <p class="text-sm text-slate-500 text-center mt-1">Assessoria Comercial UEMA Pedreiras</p>
    </div>
    <form id="login-form" class="space-y-4" novalidate>
      <div>
        <label for="email" class="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
        <input id="email" name="email" type="email" autocomplete="email" required
          class="w-full min-h-11 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:border-brand" placeholder="seu@email.com">
      </div>
      <div>
        <label for="password" class="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required
          class="w-full min-h-11 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:border-brand" placeholder="••••••••">
      </div>
      <p id="login-error" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert"></p>
      <button type="submit" id="login-btn" class="w-full min-h-11 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-lg transition-colors">Entrar</button>
    </form>
    <a href="/" class="block text-center text-sm text-slate-500 hover:text-brand mt-5 py-2">← Voltar ao site</a>
  </div>
</main>
<script>
document.getElementById('login-form').addEventListener('submit', async function(e){
  e.preventDefault();
  var btn = document.getElementById('login-btn');
  var err = document.getElementById('login-error');
  err.classList.add('hidden');
  btn.disabled = true; btn.textContent = 'Entrando...';
  try {
    var res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value })
    });
    var data = await res.json();
    if (res.ok) { window.location.href = '/admin'; return; }
    err.textContent = data.error || 'Não foi possível entrar.';
    err.classList.remove('hidden');
  } catch (_) {
    err.textContent = 'Erro de conexão. Tente novamente.';
    err.classList.remove('hidden');
  }
  btn.disabled = false; btn.textContent = 'Entrar';
});
</script>
${THEME_SCRIPT}
${THEME_CHOICES_SCRIPT}
</body>
</html>`
}

export function renderAdminShell(user: { email: string; name: string }): string {
  const esc = (s: string) => s.replace(/</g, '&lt;').replace(/"/g, '&quot;')
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
${THEME_BOOT}
<title>Painel — Assessoria Comercial UEMA Pedreiras</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="/static/projeto-logo-recortado.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- CSS compilado no build (substitui o Tailwind via CDN, que compilava no navegador). -->
<link rel="stylesheet" href="/static/app.css">
${THEME_STYLE}
</head>
<body class="bg-slate-100 min-h-screen">
<div id="admin-root" data-user-email="${esc(user.email)}" data-user-name="${esc(user.name)}"></div>
<div id="toast-container" class="fixed top-4 right-4 z-[100] space-y-2" aria-live="polite"></div>
<div id="modal-container"></div>
<script src="/static/admin.js"></script>
${THEME_SCRIPT}
${THEME_CHOICES_SCRIPT}
</body>
</html>`
}
