/* Painel Administrativo — Assessoria Comercial UEMA Pedreiras */
(function () {
  'use strict';

  var root = document.getElementById('admin-root');
  var USER = { email: root.dataset.userEmail, name: root.dataset.userName };
  var THEME_ICON = '<span class="theme-moon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg></span><span class="theme-sun" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></span>';
  var THEME_PICKER = '<div class="theme-picker" role="group" aria-label="Escolher tema"><button type="button" data-theme-choice="light" aria-pressed="false"><span aria-hidden="true">☼</span><span>Claro</span></button><button type="button" data-theme-choice="dark" aria-pressed="false"><span aria-hidden="true">◐</span><span>Escuro</span></button></div>';

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ' +
      (type === 'error' ? 'bg-red-600' : type === 'info' ? 'bg-slate-700' : 'bg-emerald-600');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = msg;
    el.style.transition = 'opacity .24s ease, transform .24s cubic-bezier(.23,1,.32,1)';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    document.getElementById('toast-container').appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translateY(-4px)'; }, 3200);
    setTimeout(function () { el.remove(); }, 3500);
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = value; area.setAttribute('readonly', '');
      area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('Não foi possível copiar a URL.')); }
      catch (e) { reject(e); }
      finally { area.remove(); }
    });
  }

  function confirmDialog(message, onConfirm) {
    var wrap = document.createElement('div');
    var previousActive = document.activeElement;
    wrap.className = 'fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4';
    wrap.innerHTML =
      '<div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transition-colors" role="dialog" aria-modal="true" aria-label="Confirmação" tabindex="-1">' +
      '<p class="text-slate-800 font-semibold">' + esc(message) + '</p>' +
      '<div class="admin-actions mt-5 flex gap-3 justify-end">' +
      '<button class="cancel min-h-11 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>' +
      '<button class="ok min-h-11 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Excluir</button>' +
      '</div></div>';
    document.getElementById('modal-container').appendChild(wrap);
    function close() {
      if (!wrap.isConnected) return;
      wrap.remove(); document.removeEventListener('keydown', onKeyDown);
      if (previousActive && previousActive.focus) previousActive.focus();
    }
    function onKeyDown(e) { if (e.key === 'Escape') close(); }
    wrap.querySelector('.cancel').addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('.ok').addEventListener('click', function () { close(); onConfirm(); });
    document.addEventListener('keydown', onKeyDown);
    wrap.querySelector('.ok').focus();
  }

  async function api(method, url, body) {
    var opts = { method: method, headers: {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    var res = await fetch(url, opts);
    if (res.status === 401 && url.indexOf('/api/auth') === -1) { window.location.href = '/admin/login'; throw new Error('unauth'); }
    var data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error((data && data.error) || 'Não foi possível salvar as alterações. Verifique os dados e tente novamente.');
    return data;
  }

  // ---------- Componentes de formulário ----------
  function field(label, name, value, opts) {
    opts = opts || {};
    var help = opts.help ? '<p class="text-xs text-slate-400 mt-1">' + esc(opts.help) + '</p>' : '';
    if (opts.type === 'textarea') {
      return '<div><label class="block text-sm font-semibold text-slate-700 mb-1.5" for="f-' + name + '">' + esc(label) + '</label>' +
        '<textarea id="f-' + name + '" data-name="' + name + '" rows="' + (opts.rows || 3) + '" class="frm w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm">' + esc(value) + '</textarea>' + help + '</div>';
    }
    return '<div><label class="block text-sm font-semibold text-slate-700 mb-1.5" for="f-' + name + '">' + esc(label) + '</label>' +
      '<input id="f-' + name + '" data-name="' + name + '" type="' + (opts.type || 'text') + '" value="' + esc(value) + '" class="frm w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm" placeholder="' + esc(opts.placeholder || '') + '">' + help + '</div>';
  }

  function toggleField(label, name, checked, help) {
    return '<div class="flex items-center justify-between gap-4 py-1">' +
      '<div><p class="text-sm font-semibold text-slate-700">' + esc(label) + '</p>' +
      (help ? '<p class="text-xs text-slate-400">' + esc(help) + '</p>' : '') + '</div>' +
      '<button type="button" role="switch" aria-checked="' + (checked ? 'true' : 'false') + '" data-name="' + name + '" class="toggle frm-toggle" aria-label="' + esc(label) + '"></button></div>';
  }

  function bindToggles(container) {
    container.querySelectorAll('.frm-toggle').forEach(function (t) {
      t.addEventListener('click', function () {
        t.setAttribute('aria-checked', t.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      });
    });
  }

  function collectForm(container) {
    var out = {};
    container.querySelectorAll('.frm').forEach(function (el) { out[el.dataset.name] = el.value; });
    container.querySelectorAll('.frm-toggle').forEach(function (el) { out[el.dataset.name] = el.getAttribute('aria-checked') === 'true'; });
    return out;
  }

  function saveBtn(id) {
    return '<button id="' + id + '" class="mt-6 inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">Salvar alterações</button>';
  }

  function bindSave(btnId, handler) {
    var btn = document.getElementById(btnId);
    btn.addEventListener('click', async function () {
      var orig = btn.textContent;
      btn.disabled = true; btn.textContent = 'Salvando...';
      try {
        await handler();
        toast('Alterações salvas com sucesso.');
      } catch (e) {
        if (e.message !== 'unauth') toast(e.message, 'error');
      }
      btn.disabled = false; btn.textContent = orig;
    });
  }

  function sectionCard(title, inner) {
    return '<section class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 transition-colors"><h2 class="text-lg font-extrabold text-primary mb-5">' + esc(title) + '</h2>' + inner + '</section>';
  }

  function pageHeader(title, subtitle) {
    return '<div class="mb-6"><h1 class="text-2xl font-extrabold text-primary">' + esc(title) + '</h1>' +
      (subtitle ? '<p class="text-sm text-slate-500 mt-1">' + esc(subtitle) + '</p>' : '') + '</div>';
  }

  // ---------- Layout / roteamento ----------
  var NAV = [
    { section: 'Geral' },
    { route: 'dashboard', label: 'Dashboard', icon: '📊' },
    { section: 'Editor do Site' },
    { route: 'editor/settings', label: 'Configurações Gerais', icon: '⚙️' },
    { route: 'editor/topbar', label: 'Top Bar', icon: '📣' },
    { route: 'editor/navbar', label: 'Navbar', icon: '🧭' },
    { route: 'editor/hero', label: 'Hero', icon: '🚀' },
    { route: 'editor/problems', label: 'Problemas', icon: '⚠️' },
    { route: 'editor/authority', label: 'Autoridade', icon: '🎓' },
    { route: 'editor/sections', label: 'Títulos das Seções', icon: '🗂️' },
    { route: 'editor/finalcta', label: 'CTA Final', icon: '📢' },
    { route: 'editor/footer', label: 'Rodapé', icon: '🦶' },
    { route: 'editor/whatsapp', label: 'WhatsApp', icon: '💬' },
    { section: 'Conteúdo' },
    { route: 'content/plans', label: 'Planos', icon: '💳' },
    { route: 'content/services', label: 'Serviços', icon: '🛠️' },
    { route: 'content/faqs', label: 'FAQ', icon: '❓' },
    { route: 'content/steps', label: 'Etapas', icon: '🪜' },
    { route: 'content/problem_cards', label: 'Cards de Problemas', icon: '🧩' },
    { route: 'content/testimonials', label: 'Depoimentos', icon: '💬' },
    { section: 'Sistema' },
    { route: 'leads', label: 'Contatos Recebidos', icon: '📥' },
    { route: 'media', label: 'Mídia', icon: '🖼️' },
    { route: 'seo', label: 'SEO', icon: '🔍' },
    { route: 'analytics', label: 'Analytics', icon: '📈' },
    { route: 'audit', label: 'Histórico', icon: '🕒' }
  ];

  function renderShell() {
    var navHtml = NAV.map(function (n) {
      if (n.section) return '<p class="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">' + esc(n.section) + '</p>';
      return '<a href="#/' + n.route + '" data-route="' + n.route + '" class="nav-item flex items-center gap-2.5 min-h-11 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"><span aria-hidden="true">' + n.icon + '</span>' + esc(n.label) + '</a>';
    }).join('');

    root.innerHTML =
      '<div class="flex min-h-screen">' +
      '<aside id="sidebar" class="fixed lg:static inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white border-r border-slate-200 flex flex-col min-h-screen -translate-x-full lg:translate-x-0 transition-transform">' +
      '  <div class="p-4 border-b border-slate-200 flex items-center gap-3">' +
      '    <img src="/static/projeto-logo-recortado.png" alt="" class="project-logo w-10 h-10 object-contain">' +
      '    <div class="leading-tight"><p class="font-extrabold text-primary text-sm">Painel Administrativo</p><p class="text-[11px] text-slate-400">UEMA Pedreiras</p></div>' +
      '  </div>' +
      '  <nav class="flex-1 overflow-y-auto p-3" aria-label="Menu do painel">' + navHtml + '</nav>' +
      '  <div class="p-4 border-t border-slate-200">' +
      '    <div class="flex items-center justify-between gap-3 mb-3"><p class="text-xs font-semibold text-slate-600 truncate">' + esc(USER.name) + '</p>' + THEME_PICKER + '</div>' +
      '    <p class="text-[11px] text-slate-400 truncate mb-3">' + esc(USER.email) + '</p>' +
      '    <div class="flex gap-2">' +
      '      <a href="/" target="_blank" rel="noopener" class="flex-1 min-h-10 inline-flex items-center justify-center text-xs font-bold text-brand border border-brand rounded-lg py-2 hover:bg-blue-50 transition-colors">Visualizar Site</a>' +
      '      <button id="logout-btn" class="flex-1 min-h-10 text-xs font-bold text-slate-600 border border-slate-300 rounded-lg py-2 hover:bg-slate-50 transition-colors">Sair</button>' +
      '    </div>' +
      '  </div>' +
      '</aside>' +
      '<div id="sidebar-overlay" class="fixed inset-0 z-40 bg-black/40 hidden lg:hidden"></div>' +
      '<div class="flex-1 min-w-0 flex flex-col">' +
      '  <header class="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-3">' +
      '    <button id="sidebar-btn" class="p-2 -ml-2 text-primary shrink-0" aria-label="Abrir menu do painel" aria-expanded="false" aria-controls="sidebar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg></button>' +
      '    <p class="font-extrabold text-primary text-sm truncate">Painel Administrativo</p>' + THEME_PICKER +
      '  </header>' +
      '  <main id="content" class="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto"></main>' +
      '</div></div>';

    document.getElementById('logout-btn').addEventListener('click', async function () {
      await api('POST', '/api/auth/logout');
      window.location.href = '/admin/login';
    });
    var sb = document.getElementById('sidebar'), ov = document.getElementById('sidebar-overlay');
    var sidebarBtn = document.getElementById('sidebar-btn');
    sidebarBtn.addEventListener('click', function () {
      var isOpen = !sb.classList.contains('-translate-x-full');
      if (isOpen) closeSidebar(); else openSidebar();
    });
    ov.addEventListener('click', closeSidebar);
    sb.querySelectorAll('a[data-route]').forEach(function (a) { a.addEventListener('click', closeSidebar); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sb.classList.contains('-translate-x-full') && window.innerWidth < 1024) { closeSidebar(); sidebarBtn.focus(); } });
    function openSidebar() { sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden'); sidebarBtn.setAttribute('aria-expanded', 'true'); }
    function closeSidebar() { sb.classList.add('-translate-x-full'); ov.classList.add('hidden'); sidebarBtn.setAttribute('aria-expanded', 'false'); }
  }

  function setActiveNav(route) {
    document.querySelectorAll('.nav-item').forEach(function (a) {
      a.classList.toggle('active', a.dataset.route === route);
    });
  }

  var content = null;

  async function router() {
    var route = location.hash.replace(/^#\//, '') || 'dashboard';
    setActiveNav(route);
    content = document.getElementById('content');
    content.innerHTML = '<div class="py-20 text-center text-slate-400 text-sm">Carregando...</div>';
    try {
      if (route === 'dashboard') await pageDashboard();
      else if (route === 'editor/settings') await pageSettings();
      else if (route === 'editor/topbar') await pageTopbar();
      else if (route === 'editor/navbar') await pageNavbar();
      else if (route === 'editor/hero') await pageHero();
      else if (route === 'editor/problems') await pageProblems();
      else if (route === 'editor/authority') await pageAuthority();
      else if (route === 'editor/sections') await pageSections();
      else if (route === 'editor/finalcta') await pageFinalCta();
      else if (route === 'editor/footer') await pageFooter();
      else if (route === 'editor/whatsapp') await pageWhatsapp();
      else if (route.indexOf('content/') === 0) await pageList(route.split('/')[1]);
      else if (route === 'leads') await pageLeads();
      else if (route === 'media') await pageMedia();
      else if (route === 'seo') await pageSeo();
      else if (route === 'analytics') await pageAnalytics();
      else if (route === 'audit') await pageAudit();
      else content.innerHTML = pageHeader('Página não encontrada');
    } catch (e) {
      if (e.message !== 'unauth') content.innerHTML = '<div class="py-20 text-center text-red-500 text-sm">Erro ao carregar: ' + esc(e.message) + '</div>';
    }
  }

  window.__admin = { toast: toast };
  window.addEventListener('hashchange', router);
  renderShell();
  router();

  // ---------- Dashboard ----------
  async function pageDashboard() {
    var d = await api('GET', '/api/admin/dashboard');
    var cards = [
      { n: d.plans, label: 'Planos ativos', route: 'content/plans' },
      { n: d.services, label: 'Serviços ativos', route: 'content/services' },
      { n: d.faqs, label: 'FAQs ativas', route: 'content/faqs' },
      { n: d.media, label: 'Imagens na mídia', route: 'media' }
    ].map(function (c) {
      return '<a href="#/' + c.route + '" class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow block">' +
        '<p class="text-3xl font-extrabold text-primary">' + c.n + '</p>' +
        '<p class="text-sm text-slate-500 mt-1">' + c.label + '</p></a>';
    }).join('');

    content.innerHTML = pageHeader('Dashboard', 'Visão geral do site e atalhos rápidos.') +
      '<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">' + cards + '</div>' +
      sectionCard('Status do site',
        '<div class="space-y-3 text-sm">' +
        '<div class="flex items-center justify-between"><span class="text-slate-500">Status</span><span class="inline-flex items-center gap-1.5 font-bold text-emerald-600"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Publicado — alterações salvas aparecem imediatamente no site</span></div>' +
        '<div class="flex items-center justify-between"><span class="text-slate-500">Última alteração</span><span class="font-semibold text-slate-700">' + esc(d.lastUpdate ? new Date(d.lastUpdate + 'Z').toLocaleString('pt-BR') : '—') + '</span></div>' +
        (d.lastAction ? '<div class="flex items-start justify-between gap-4"><span class="text-slate-500 shrink-0">Ação</span><span class="text-slate-700 text-right">' + esc(d.lastAction) + '</span></div>' : '') +
        '<div class="flex items-center justify-between"><span class="text-slate-500">Analytics</span><span class="font-semibold ' + (d.analyticsConfigured ? 'text-emerald-600">Configurado' : 'text-slate-400">Analytics não configurado') + '</span></div>' +
        '</div>') +
      sectionCard('Atalhos',
        '<div class="flex flex-wrap gap-2">' +
        [['editor/hero', 'Editar Hero'], ['content/plans', 'Gerenciar Planos'], ['content/faqs', 'Gerenciar FAQ'], ['editor/settings', 'WhatsApp e Contato'], ['seo', 'SEO'], ['media', 'Biblioteca de Mídia']].map(function (a) {
          return '<a href="#/' + a[0] + '" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-brand text-sm font-semibold text-slate-600 transition-colors">' + a[1] + '</a>';
        }).join('') + '</div>');
  }

  // ---------- Editores de conteúdo (JSON) ----------
  async function contentGet(key) { return (await api('GET', '/api/admin/content/' + key)).value; }
  async function contentPut(key, value) { return api('PUT', '/api/admin/content/' + key, value); }

  async function pageSettings() {
    var v = await contentGet('settings');
    content.innerHTML = pageHeader('Configurações Gerais', 'Dados principais do negócio usados em todo o site.') +
      sectionCard('Identidade',
        '<div class="grid sm:grid-cols-2 gap-4">' +
        field('Nome da empresa', 'companyName', v.companyName) +
        field('Nome curto (navbar)', 'shortName', v.shortName) +
        field('Slogan', 'slogan', v.slogan) +
        field('Copyright (rodapé)', 'copyright', v.copyright) +
        '</div><div class="mt-4">' + field('Descrição', 'description', v.description, { type: 'textarea' }) + '</div>' +
        '<div class="grid sm:grid-cols-2 gap-4 mt-4">' +
        imagePicker('Logo do projeto', 'logoUrl', v.logoUrl) +
        imagePicker('Logo institucional (UEMA)', 'institutionLogoUrl', v.institutionLogoUrl) +
        imagePicker('Favicon', 'faviconUrl', v.faviconUrl) +
        '</div>') +
      sectionCard('Contato e WhatsApp',
        '<div class="grid sm:grid-cols-2 gap-4">' +
        field('WhatsApp (somente números, com DDI+DDD)', 'whatsapp', v.whatsapp, { help: 'Ex: 5599981687603 — usado em todos os botões do site.' }) +
        field('WhatsApp (como aparece no site)', 'whatsappDisplay', v.whatsappDisplay, { placeholder: '(99) 98168-7603' }) +
        field('Telefone', 'phone', v.phone) +
        field('E-mail', 'email', v.email, { type: 'email' }) +
        field('Cidade', 'city', v.city) +
        field('Estado (UF)', 'state', v.state) +
        field('Endereço', 'address', v.address) +
        field('CEP', 'cep', v.cep) +
        field('Horário de atendimento', 'businessHours', v.businessHours) +
        '</div><div class="mt-4">' +
        field('Mensagem padrão do WhatsApp', 'whatsappDefaultMessage', v.whatsappDefaultMessage, { type: 'textarea', rows: 2, help: 'Mensagem pré-preenchida quando o visitante clica em um botão de WhatsApp.' }) + '</div>') +
      sectionCard('Redes sociais',
        '<div class="grid sm:grid-cols-3 gap-4">' +
        field('Instagram (URL)', 'instagram', v.instagram, { placeholder: 'https://instagram.com/...' }) +
        field('Facebook (URL)', 'facebook', v.facebook, { placeholder: 'https://facebook.com/...' }) +
        field('TikTok (URL)', 'tiktok', v.tiktok, { placeholder: 'https://tiktok.com/@...' }) +
        '</div>') +
      saveBtn('save-settings');
    bindImagePickers(content);
    bindSave('save-settings', async function () {
      var data = collectForm(content);
      var urls = ['instagram', 'facebook', 'tiktok'];
      for (var i = 0; i < urls.length; i++) {
        var u = data[urls[i]];
        if (u && !/^https?:\/\/.+/.test(u)) throw new Error('URL inválida em ' + urls[i] + '. Comece com https://');
      }
      await contentPut('settings', data);
    });
  }

  async function pageTopbar() {
    var v = await contentGet('topbar');
    content.innerHTML = pageHeader('Top Bar', 'Barra de aviso no topo do site.') +
      sectionCard('Configuração',
        toggleField('Exibir top bar', 'enabled', v.enabled) +
        '<div class="mt-4 space-y-4">' +
        field('Texto do aviso', 'text', v.text, { type: 'textarea', rows: 2 }) +
        field('Texto do link/botão', 'linkText', v.linkText) +
        toggleField('Exibir link "Falar agora"', 'linkEnabled', v.linkEnabled) +
        '</div>') +
      saveBtn('save-topbar');
    bindToggles(content);
    bindSave('save-topbar', async function () { await contentPut('topbar', collectForm(content)); });
  }

  async function pageNavbar() {
    var v = await contentGet('navbar');
    var links = v.links || [];
    content.innerHTML = pageHeader('Navbar', 'Menu de navegação do site.') +
      sectionCard('Configuração',
        '<div class="grid sm:grid-cols-2 gap-4">' +
        field('Badge (abaixo do nome)', 'badge', v.badge) +
        field('Texto do botão WhatsApp', 'ctaText', v.ctaText) +
        '</div>') +
      sectionCard('Links do menu',
        '<div id="nav-links" class="space-y-3"></div>' +
        '<button id="add-link" class="mt-3 text-sm font-bold text-brand hover:text-brand-dark">+ Adicionar link</button>') +
      saveBtn('save-navbar');

    var box = document.getElementById('nav-links');
    function renderLinks() {
      box.innerHTML = links.map(function (l, i) {
        return '<div class="flex gap-2 items-center" data-i="' + i + '">' +
          '<input value="' + esc(l.label) + '" data-k="label" class="lnk flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Rótulo" aria-label="Rótulo do link ' + (i + 1) + '">' +
          '<input value="' + esc(l.href) + '" data-k="href" class="lnk flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="#secao" aria-label="Destino do link ' + (i + 1) + '">' +
          '<button class="del-link p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Remover link">✕</button></div>';
      }).join('') || '<p class="text-sm text-slate-400">Nenhum link no menu.</p>';
      box.querySelectorAll('.del-link').forEach(function (b) {
        b.addEventListener('click', function () {
          links.splice(Number(b.parentElement.dataset.i), 1); renderLinks();
        });
      });
      box.querySelectorAll('.lnk').forEach(function (inp) {
        inp.addEventListener('input', function () {
          links[Number(inp.parentElement.dataset.i)][inp.dataset.k] = inp.value;
        });
      });
    }
    renderLinks();
    document.getElementById('add-link').addEventListener('click', function () {
      links.push({ label: '', href: '#' }); renderLinks();
    });
    bindSave('save-navbar', async function () {
      var data = collectForm(content);
      data.links = links.filter(function (l) { return l.label.trim(); });
      await contentPut('navbar', data);
    });
  }

  async function pageHero() {
    var v = await contentGet('hero');
    content.innerHTML = pageHeader('Hero', 'Primeira dobra do site — o que o visitante vê primeiro.') +
      sectionCard('Conteúdo',
        toggleField('Exibir seção Hero', 'enabled', v.enabled !== false) +
        '<div class="mt-4 space-y-4">' +
        field('Badge', 'badge', v.badge) +
        field('Título principal', 'title', v.title, { type: 'textarea', rows: 3 }) +
        field('Subtítulo', 'subtitle', v.subtitle, { type: 'textarea', rows: 3 }) +
        '<div class="grid sm:grid-cols-2 gap-4">' +
        field('Botão principal (CTA)', 'ctaPrimary', v.ctaPrimary) +
        field('Botão secundário', 'ctaSecondary', v.ctaSecondary) +
        '</div>' +
        '</div>') +
      saveBtn('save-hero');
    bindToggles(content);
    bindSave('save-hero', async function () {
      var d = collectForm(content);
      if (!d.title.trim()) throw new Error('Campo obrigatório: título.');
      await contentPut('hero', d);
    });
  }

  async function pageProblems() {
    var v = await contentGet('problems');
    content.innerHTML = pageHeader('Seção de Problemas', 'Título e subtítulo da seção. Os cards são editados em "Cards de Problemas".') +
      sectionCard('Conteúdo',
        toggleField('Exibir seção', 'enabled', v.enabled !== false) +
        '<div class="mt-4 space-y-4">' +
        field('Título', 'title', v.title, { type: 'textarea', rows: 2 }) +
        field('Subtítulo', 'subtitle', v.subtitle, { type: 'textarea', rows: 2 }) +
        '</div><p class="mt-4 text-sm"><a class="font-bold text-brand" href="#/content/problem_cards">→ Editar os cards de problemas</a></p>') +
      saveBtn('save-problems');
    bindToggles(content);
    bindSave('save-problems', async function () { await contentPut('problems', collectForm(content)); });
  }

  async function pageAuthority() {
    var v = await contentGet('authority');
    content.innerHTML = pageHeader('Autoridade e Contexto Acadêmico', 'Seção que apresenta a relação com o curso e a instituição.') +
      sectionCard('Conteúdo',
        toggleField('Exibir seção', 'enabled', v.enabled !== false) +
        '<div class="mt-4 space-y-4">' +
        field('Título', 'title', v.title) +
        field('Texto principal', 'text', v.text, { type: 'textarea' }) +
        field('Texto de esclarecimento', 'detail', v.detail, { type: 'textarea', help: 'Deixa clara a distinção entre a instituição e o projeto/serviço comercial.' }) +
        '<div class="grid sm:grid-cols-2 gap-4">' +
        field('Nome do curso', 'courseName', v.courseName) +
        field('Nome da instituição', 'institutionName', v.institutionName) +
        '</div></div>') +
      saveBtn('save-authority');
    bindToggles(content);
    bindSave('save-authority', async function () { await contentPut('authority', collectForm(content)); });
  }

  async function pageSections() {
    var keys = [
      ['servicesSection', 'Seção de Serviços'],
      ['plansSection', 'Seção de Planos'],
      ['stepsSection', 'Seção Como Funciona'],
      ['faqSection', 'Seção FAQ'],
      ['testimonialsSection', 'Seção de Depoimentos'],
      ['contactSection', 'Seção de Contato']
    ];
    var values = {};
    for (var i = 0; i < keys.length; i++) values[keys[i][0]] = await contentGet(keys[i][0]);
    content.innerHTML = pageHeader('Títulos das Seções', 'Título, subtítulo e visibilidade de cada bloco do site.') +
      keys.map(function (k) {
        var v = values[k[0]];
        return sectionCard(k[1],
          '<div data-sec="' + k[0] + '">' +
          toggleField('Exibir seção', k[0] + '__enabled', v.enabled !== false) +
          '<div class="mt-4 space-y-4">' +
          field('Título', k[0] + '__title', v.title) +
          field('Subtítulo', k[0] + '__subtitle', v.subtitle, { type: 'textarea', rows: 2 }) +
          '</div></div>');
      }).join('') + saveBtn('save-sections');
    bindToggles(content);
    bindSave('save-sections', async function () {
      var all = collectForm(content);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i][0];
        await contentPut(k, { enabled: all[k + '__enabled'], title: all[k + '__title'], subtitle: all[k + '__subtitle'] });
      }
    });
  }

  async function pageFinalCta() {
    var v = await contentGet('finalCta');
    content.innerHTML = pageHeader('CTA Final', 'Chamada final antes do rodapé.') +
      sectionCard('Conteúdo',
        toggleField('Exibir seção', 'enabled', v.enabled !== false) +
        '<div class="mt-4 space-y-4">' +
        field('Título', 'title', v.title, { type: 'textarea', rows: 2 }) +
        field('Subtítulo', 'subtitle', v.subtitle, { type: 'textarea', rows: 2 }) +
        field('Texto do botão', 'ctaText', v.ctaText) +
        '</div>') +
      saveBtn('save-finalcta');
    bindToggles(content);
    bindSave('save-finalcta', async function () { await contentPut('finalCta', collectForm(content)); });
  }

  async function pageFooter() {
    var v = await contentGet('footer');
    content.innerHTML = pageHeader('Rodapé', 'Textos exibidos no rodapé. Contatos e redes vêm das Configurações Gerais.') +
      sectionCard('Conteúdo',
        field('Descrição do negócio', 'description', v.description, { type: 'textarea' }) +
        '<div class="mt-4">' +
        field('Nota institucional', 'institutionalNote', v.institutionalNote, { type: 'textarea', help: 'Texto legal/institucional sobre a relação com a universidade.' }) +
        '</div>') +
      saveBtn('save-footer');
    bindSave('save-footer', async function () { await contentPut('footer', collectForm(content)); });
  }

  async function pageWhatsapp() {
    var v = await contentGet('whatsappWidget');
    content.innerHTML = pageHeader('WhatsApp — Botões Fixos', 'Botão flutuante e barra fixa do mobile. O número é definido em Configurações Gerais.') +
      sectionCard('Botão flutuante',
        toggleField('Exibir botão flutuante', 'floatingEnabled', v.floatingEnabled) +
        '<div class="mt-4">' + field('Tooltip (dica ao passar o mouse)', 'floatingTooltip', v.floatingTooltip) + '</div>') +
      sectionCard('Barra fixa no mobile',
        toggleField('Exibir barra fixa no mobile', 'mobileBarEnabled', v.mobileBarEnabled) +
        '<div class="mt-4">' + field('Texto do botão', 'mobileBarText', v.mobileBarText) + '</div>') +
      '<p class="text-sm text-slate-500 mb-2"><a class="font-bold text-brand" href="#/editor/settings">→ Alterar número e mensagem padrão do WhatsApp</a></p>' +
      saveBtn('save-wa');
    bindToggles(content);
    bindSave('save-wa', async function () { await contentPut('whatsappWidget', collectForm(content)); });
  }

  // ---------- CRUD de listas ----------
  var LIST_CONFIG = {
    plans: {
      title: 'Planos', subtitle: 'Adicione, edite, reordene e ative/desative os pacotes exibidos no site.',
      itemLabel: 'plano', nameField: 'name',
      empty: 'Nenhum plano cadastrado.',
      summary: function (it) { return 'R$ ' + it.price + (it.badge ? ' · ' + it.badge : '') + ' · ' + (it.features || []).length + ' benefícios'; },
      form: function (it) {
        it = it || {};
        return '<div class="grid sm:grid-cols-2 gap-4">' +
          field('Nome do plano *', 'name', it.name || '') +
          field('Badge (ex: Mais Vendido)', 'badge', it.badge || '') +
          field('Preço (R$) *', 'price', it.price || '', { placeholder: '180' }) +
          field('Preço promocional (opcional)', 'promo_price', it.promo_price || '', { help: 'Se preenchido, o preço normal aparece riscado.' }) +
          field('Tipo de cobrança', 'billing_type', it.billing_type || 'Taxa única') +
          field('Texto do botão (CTA)', 'cta_text', it.cta_text || 'Escolher plano') +
          '</div><div class="mt-4 space-y-4">' +
          field('Descrição', 'description', it.description || '', { type: 'textarea', rows: 2 }) +
          field('Benefícios (um por linha)', '__features', (it.features || []).join('\n'), { type: 'textarea', rows: 6 }) +
          field('Mensagem do WhatsApp deste plano', 'whatsapp_message', it.whatsapp_message || '', { type: 'textarea', rows: 2, help: 'Mensagem pré-preenchida quando o visitante clica no botão deste plano.' }) +
          field('Observação (opcional)', 'note', it.note || '') +
          toggleField('Plano em destaque (borda verde)', 'highlighted', !!it.highlighted) +
          toggleField('Ativo (visível no site)', 'active', it.active === undefined ? true : !!it.active) +
          '</div>';
      },
      collect: function (box) {
        var d = collectForm(box);
        d.features = (d.__features || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        delete d.__features;
        return d;
      }
    },
    services: {
      title: 'Serviços', subtitle: 'Serviços exibidos na seção "O que organizamos".',
      itemLabel: 'serviço', nameField: 'name',
      empty: 'Nenhum serviço cadastrado.',
      summary: function (it) { return (it.description || '').slice(0, 70) + '...'; },
      form: function (it) {
        it = it || {};
        var icons = ['message-circle', 'book-open', 'id-card', 'palette', 'map-pin', 'list-checks', 'briefcase', 'star', 'phone', 'shield', 'search', 'clock', 'layout', 'keyboard'];
        return '<div class="space-y-4">' +
          field('Nome do serviço *', 'name', it.name || '') +
          field('Descrição', 'description', it.description || '', { type: 'textarea', rows: 3 }) +
          '<div class="grid sm:grid-cols-2 gap-4">' +
          '<div><label class="block text-sm font-semibold text-slate-700 mb-1.5" for="f-icon">Ícone</label>' +
          '<select id="f-icon" data-name="icon" class="frm w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm">' +
          icons.map(function (ic) { return '<option value="' + ic + '"' + (it.icon === ic ? ' selected' : '') + '>' + ic + '</option>'; }).join('') +
          '</select></div>' +
          field('Preço (opcional, sem R$)', 'price', it.price || '') +
          '</div>' +
          toggleField('Destaque (borda azul)', 'highlighted', !!it.highlighted) +
          toggleField('Ativo (visível no site)', 'active', it.active === undefined ? true : !!it.active) +
          '</div>';
      },
      collect: collectForm
    },
    faqs: {
      title: 'FAQ', subtitle: 'Perguntas frequentes exibidas no site.',
      itemLabel: 'pergunta', nameField: 'question',
      empty: 'Nenhuma pergunta cadastrada.',
      summary: function (it) { return (it.answer || '').slice(0, 80) + '...'; },
      form: function (it) {
        it = it || {};
        return '<div class="space-y-4">' +
          field('Pergunta *', 'question', it.question || '', { type: 'textarea', rows: 2 }) +
          field('Resposta *', 'answer', it.answer || '', { type: 'textarea', rows: 4 }) +
          toggleField('Ativa (visível no site)', 'active', it.active === undefined ? true : !!it.active) +
          '</div>';
      },
      collect: collectForm
    },
    steps: {
      title: 'Etapas — Como Funciona', subtitle: 'Passos da timeline "Como funciona".',
      itemLabel: 'etapa', nameField: 'title',
      empty: 'Nenhuma etapa cadastrada.',
      summary: function (it) { return (it.description || '').slice(0, 80); },
      form: function (it) {
        it = it || {};
        return '<div class="space-y-4">' +
          field('Título *', 'title', it.title || '') +
          field('Descrição', 'description', it.description || '', { type: 'textarea', rows: 2 }) +
          toggleField('Ativa (visível no site)', 'active', it.active === undefined ? true : !!it.active) +
          '</div>';
      },
      collect: collectForm
    },
    problem_cards: {
      title: 'Cards de Problemas', subtitle: 'Cards da seção "Seu comércio pode estar perdendo oportunidades".',
      itemLabel: 'card', nameField: 'title',
      empty: 'Nenhum card cadastrado.',
      summary: function (it) { return (it.description || '').slice(0, 80); },
      form: function (it) {
        it = it || {};
        var icons = ['clock', 'keyboard', 'layout', 'search', 'alert-circle', 'message-circle', 'shield', 'star'];
        return '<div class="space-y-4">' +
          field('Título *', 'title', it.title || '') +
          field('Descrição', 'description', it.description || '', { type: 'textarea', rows: 3 }) +
          '<div><label class="block text-sm font-semibold text-slate-700 mb-1.5" for="f-icon2">Ícone</label>' +
          '<select id="f-icon2" data-name="icon" class="frm w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm">' +
          icons.map(function (ic) { return '<option value="' + ic + '"' + (it.icon === ic ? ' selected' : '') + '>' + ic + '</option>'; }).join('') +
          '</select></div>' +
          toggleField('Ativo (visível no site)', 'active', it.active === undefined ? true : !!it.active) +
          '</div>';
      },
      collect: collectForm
    },
    testimonials: {
      title: 'Depoimentos', subtitle: 'Relatos de empreendedores exibidos na página inicial.',
      itemLabel: 'depoimento', nameField: 'name',
      empty: 'Nenhum depoimento cadastrado.',
      summary: function (it) { return (it.quote || '').slice(0, 80) + '...'; },
      form: function (it) {
        it = it || {};
        var rating = it.rating === undefined ? 5 : it.rating;
        return '<div class="space-y-4">' +
          field('Nome *', 'name', it.name || '') +
          field('Negócio / cargo', 'role', it.role || '', { help: 'Ex.: Mercadinho Bom Preço — Pedreiras' }) +
          field('Depoimento *', 'quote', it.quote || '', { type: 'textarea', rows: 4 }) +
          '<div><label class="block text-sm font-semibold text-slate-700 mb-1.5" for="f-rating">Nota</label>' +
          '<select id="f-rating" data-name="rating" class="frm w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm">' +
          [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (Number(rating) === n ? ' selected' : '') + '>' + n + ' estrela' + (n > 1 ? 's' : '') + '</option>'; }).join('') +
          '</select></div>' +
          toggleField('Ativo (visível no site)', 'active', it.active === undefined ? true : !!it.active) +
          '</div>';
      },
      collect: collectForm
    }
  };

  async function pageList(table) {
    var cfg = LIST_CONFIG[table];
    if (!cfg) { content.innerHTML = pageHeader('Página não encontrada'); return; }
    var res = await api('GET', '/api/admin/items/' + table);
    var items = res.items;

    var listHtml = items.length ? items.map(function (it, i) {
      return '<div class="flex items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 transition-colors" data-id="' + it.id + '">' +
        '<div class="flex flex-col gap-1">' +
        '<button class="mv-up p-1 text-slate-400 hover:text-brand disabled:opacity-25" aria-label="Mover para cima" ' + (i === 0 ? 'disabled' : '') + '>▲</button>' +
        '<button class="mv-dn p-1 text-slate-400 hover:text-brand disabled:opacity-25" aria-label="Mover para baixo" ' + (i === items.length - 1 ? 'disabled' : '') + '>▼</button>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
        '<p class="font-bold text-primary truncate">' + esc(it[cfg.nameField]) +
        (it.active ? '' : ' <span class="text-[10px] font-bold uppercase bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full align-middle">inativo</span>') + '</p>' +
        '<p class="text-xs text-slate-500 truncate">' + esc(cfg.summary(it)) + '</p>' +
        '</div>' +
        '<div class="flex flex-wrap gap-1 shrink-0 justify-end">' +
        '<button class="edit-it min-h-10 px-3 py-1.5 text-xs font-bold text-brand hover:bg-blue-50 rounded-lg">Editar</button>' +
        '<button class="dup-it min-h-10 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Duplicar</button>' +
        '<button class="del-it min-h-10 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg">Excluir</button>' +
        '</div></div>';
    }).join('') :
      '<div class="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center"><p class="text-slate-400">' + esc(cfg.empty) + '</p></div>';

    content.innerHTML = pageHeader(cfg.title, cfg.subtitle) +
      '<div class="mb-5"><button id="add-item" class="min-h-11 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Adicionar ' + cfg.itemLabel + '</button></div>' +
      '<div id="item-list" class="space-y-3">' + listHtml + '</div>';

    document.getElementById('add-item').addEventListener('click', function () { openItemModal(table, null); });

    content.querySelectorAll('[data-id]').forEach(function (row) {
      var id = Number(row.dataset.id);
      var it = items.find(function (x) { return x.id === id; });
      row.querySelector('.edit-it').addEventListener('click', function () { openItemModal(table, it); });
      row.querySelector('.dup-it').addEventListener('click', async function () {
        try { await api('POST', '/api/admin/items/' + table + '/' + id + '/duplicate'); toast('Item duplicado.'); router(); }
        catch (e) { toast(e.message, 'error'); }
      });
      row.querySelector('.del-it').addEventListener('click', function () {
        confirmDialog('Tem certeza que deseja excluir este item?', async function () {
          try { await api('DELETE', '/api/admin/items/' + table + '/' + id); toast('Item excluído.'); router(); }
          catch (e) { toast(e.message, 'error'); }
        });
      });
      row.querySelector('.mv-up').addEventListener('click', function () { moveItem(table, items, id, -1); });
      row.querySelector('.mv-dn').addEventListener('click', function () { moveItem(table, items, id, 1); });
    });
  }

  async function moveItem(table, items, id, dir) {
    var ids = items.map(function (x) { return x.id; });
    var idx = ids.indexOf(id);
    var to = idx + dir;
    if (to < 0 || to >= ids.length) return;
    ids.splice(idx, 1); ids.splice(to, 0, id);
    try { await api('POST', '/api/admin/items/' + table + '/reorder', { ids: ids }); router(); }
    catch (e) { toast(e.message, 'error'); }
  }

  function openItemModal(table, item) {
    var cfg = LIST_CONFIG[table];
    var previousActive = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[80] flex items-start justify-center bg-black/50 p-4 overflow-y-auto';
    wrap.innerHTML =
      '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 transition-colors" role="dialog" aria-modal="true" aria-label="' + (item ? 'Editar' : 'Adicionar') + ' ' + cfg.itemLabel + '" tabindex="-1">' +
      '<div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">' +
      '<h2 class="font-extrabold text-primary text-lg">' + (item ? 'Editar' : 'Adicionar') + ' ' + cfg.itemLabel + '</h2>' +
      '<button class="close-modal p-2 text-slate-400 hover:text-slate-700" aria-label="Fechar">✕</button></div>' +
      '<div class="modal-body p-6">' + cfg.form(item) + '</div>' +
      '<div class="admin-actions flex justify-end gap-3 px-6 py-4 border-t border-slate-200">' +
      '<button class="close-modal min-h-11 px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>' +
      '<button class="save-item min-h-11 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-bold">Salvar</button>' +
      '</div></div>';
    document.getElementById('modal-container').appendChild(wrap);
    var body = wrap.querySelector('.modal-body');
    bindToggles(body);
    function close() {
      if (!wrap.isConnected) return;
      wrap.remove(); document.removeEventListener('keydown', onEsc);
      if (previousActive && previousActive.focus) previousActive.focus();
    }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    wrap.querySelectorAll('.close-modal').forEach(function (b) { b.addEventListener('click', close); });
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.addEventListener('keydown', onEsc);
    var firstField = wrap.querySelector('input,textarea,select,button');
    if (firstField) firstField.focus();
    wrap.querySelector('.save-item').addEventListener('click', async function () {
      var btn = wrap.querySelector('.save-item');
      btn.disabled = true; btn.textContent = 'Salvando...';
      try {
        var data = cfg.collect(body);
        if (item) await api('PUT', '/api/admin/items/' + table + '/' + item.id, data);
        else await api('POST', '/api/admin/items/' + table, data);
        toast('Alterações salvas com sucesso.');
        close();
        router();
      } catch (e) {
        toast(e.message, 'error');
        btn.disabled = false; btn.textContent = 'Salvar';
      }
    });
  }

  // ---------- Mídia ----------
  var mediaCache = [];
  var IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml|avif)$/;
  function readImageFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result).split(',')[1] || ''); };
      reader.onerror = function () { reject(new Error('Não foi possível ler este arquivo.')); };
      reader.readAsDataURL(file);
    });
  }
  function validateImageFile(file) {
    if (!file) return 'Escolha uma imagem.';
    if (!IMAGE_TYPES.test(file.type)) return 'Formato não suportado. Use PNG, JPG, WebP, GIF, SVG ou AVIF.';
    if (file.size > 2 * 1024 * 1024) return 'Imagem muito grande. Máximo: 2 MB.';
    return '';
  }
  async function uploadImageFile(file, extra) {
    var error = validateImageFile(file);
    if (error) throw new Error(error);
    var b64 = await readImageFile(file);
    return api('POST', '/api/admin/media', Object.assign({ filename: file.name, mimeType: file.type, data: b64, altText: '', title: file.name }, extra || {}));
  }

  async function pageMedia() {
    var res = await api('GET', '/api/admin/media');
    mediaCache = res.items;
    var grid = mediaCache.length ? mediaCache.map(function (m) {
      var src = m.url || ('/api/media/' + m.id);
      return '<div class="bg-white border border-slate-200 rounded-2xl overflow-hidden" data-id="' + m.id + '">' +
        '<div class="aspect-square bg-slate-50 flex items-center justify-center p-3"><img src="' + esc(src) + '" alt="' + esc(m.alt_text) + '" class="max-w-full max-h-full object-contain" loading="lazy"></div>' +
        '<div class="p-3">' +
        '<p class="text-xs font-bold text-primary truncate" title="' + esc(m.filename) + '">' + esc(m.filename) + '</p>' +
        '<p class="text-[11px] text-slate-400 truncate">' + esc(m.alt_text || 'sem texto alternativo') + '</p>' +
        '<div class="mt-2 flex gap-1">' +
        '<button class="edit-media flex-1 text-[11px] font-bold text-brand hover:bg-blue-50 rounded-lg py-1.5">Metadados</button>' +
        '<button class="replace-media flex-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 rounded-lg py-1.5">Substituir</button>' +
        '<button class="copy-media flex-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg py-1.5">Copiar URL</button>' +
        (m.url && m.url.indexOf('/static/') === 0 ? '' : '<button class="del-media flex-1 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg py-1.5">Excluir</button>') +
        '</div></div></div>';
    }).join('') : '';

    content.innerHTML = pageHeader('Biblioteca de Mídia', 'Adicione, substitua e organize as imagens usadas no site.') +
      '<div class="mb-5 flex flex-wrap items-center gap-3"><label class="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-3 rounded-xl text-sm cursor-pointer shadow-sm">' +
      '<span class="text-lg leading-none" aria-hidden="true">+</span><span>Adicionar imagem</span><input type="file" id="media-upload" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif" class="sr-only"></label>' +
      '<span class="text-xs text-slate-500">PNG, JPG, WebP, GIF, SVG ou AVIF • máximo 2 MB</span></div>' +
      (mediaCache.length ?
        '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">' + grid + '</div>' :
        '<div class="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center"><p class="text-slate-400">Sua biblioteca de mídia está vazia.</p></div>');

    document.getElementById('media-upload').addEventListener('change', async function (e) {
      var file = e.target.files[0];
      var error = validateImageFile(file);
      if (error) { toast(error, 'error'); e.target.value = ''; return; }
      toast('Enviando imagem...', 'info');
      try {
        await uploadImageFile(file);
        toast('Imagem adicionada à biblioteca.');
        router();
      } catch (err) { toast(err.message, 'error'); e.target.value = ''; }
    });

    content.querySelectorAll('[data-id]').forEach(function (card) {
      var id = Number(card.dataset.id);
      var m = mediaCache.find(function (x) { return x.id === id; });
      var url = m.url || ('/api/media/' + m.id);
      card.querySelector('.copy-media').addEventListener('click', function () {
        copyText(url).then(function () { toast('URL copiada: ' + url); }).catch(function () { toast('Não foi possível copiar a URL.', 'error'); });
      });
      card.querySelector('.edit-media').addEventListener('click', function () { openMediaModal(m); });
      card.querySelector('.replace-media').addEventListener('click', function () { replaceMediaFile(m); });
      var del = card.querySelector('.del-media');
      if (del) del.addEventListener('click', function () {
        confirmDialog('Tem certeza que deseja excluir este item?', async function () {
          try { await api('DELETE', '/api/admin/media/' + id); toast('Imagem excluída.'); router(); }
          catch (e) { toast(e.message, 'error'); }
        });
      });
    });
  }

  async function replaceMediaFile(m) {
    var currentUrl = m.url || ('/api/media/' + m.id);
    var previousActive = document.activeElement;
    var previewUrl = '';
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[90] flex items-start justify-center bg-black/50 p-4 overflow-y-auto';
    wrap.innerHTML =
      '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8" role="dialog" aria-modal="true" aria-label="Substituir arquivo da imagem">' +
      '<div class="flex items-center justify-between px-6 py-4 border-b border-slate-200"><div><h2 class="font-extrabold text-primary text-lg">Substituir imagem</h2><p class="text-xs text-slate-500 mt-1 truncate max-w-[16rem]">' + esc(m.filename) + '</p></div>' +
      '<button class="close-modal p-2 text-slate-400" aria-label="Fechar">✕</button></div>' +
      '<div class="modal-body p-6 space-y-4">' +
      '<div class="bg-slate-50 rounded-xl p-4 flex items-center justify-center min-h-48"><img id="replace-preview" src="' + esc(currentUrl) + '" alt="' + esc(m.alt_text || '') + '" class="max-h-52 max-w-full object-contain"></div>' +
      '<label class="block"><span class="block text-sm font-semibold text-slate-700 mb-1.5">Escolha o novo arquivo</span><input id="replace-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif" class="block w-full min-h-11 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"></label>' +
      '<p class="text-xs text-slate-500">A imagem atual será substituída no mesmo endereço. O texto alternativo, título e demais referências serão preservados.</p>' +
      '</div>' +
      '<div class="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t border-slate-200"><button class="close-modal min-h-11 px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600">Cancelar</button><button class="save-replacement min-h-11 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-bold">Substituir arquivo</button></div></div>';
    document.getElementById('modal-container').appendChild(wrap);
    var input = wrap.querySelector('#replace-file');
    var preview = wrap.querySelector('#replace-preview');
    function close() {
      if (!wrap.isConnected) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      wrap.remove(); document.removeEventListener('keydown', onEsc);
      if (previousActive && previousActive.focus) previousActive.focus();
    }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    wrap.querySelectorAll('.close-modal').forEach(function (b) { b.addEventListener('click', close); });
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.addEventListener('keydown', onEsc);
    input.addEventListener('change', function () {
      var file = input.files[0];
      var error = validateImageFile(file);
      if (error) { toast(error, 'error'); input.value = ''; return; }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      preview.src = previewUrl;
    });
    wrap.querySelector('.save-replacement').addEventListener('click', async function () {
      var btn = wrap.querySelector('.save-replacement');
      var file = input.files[0];
      var error = validateImageFile(file);
      if (error) { toast(error, 'error'); return; }
      btn.disabled = true; btn.textContent = 'Substituindo...';
      try {
        var b64 = await readImageFile(file);
        await api('PUT', '/api/admin/media/' + m.id + '/replace', { filename: file.name, mimeType: file.type, data: b64 });
        toast('Imagem substituída com sucesso.');
        close();
        router();
      } catch (e) { toast(e.message, 'error'); btn.disabled = false; btn.textContent = 'Substituir arquivo'; }
    });
  }

  function openMediaModal(m) {
    var url = m.url || ('/api/media/' + m.id);
    var previousActive = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[80] flex items-start justify-center bg-black/50 p-4 overflow-y-auto';
    wrap.innerHTML =
      '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8" role="dialog" aria-modal="true" aria-label="Detalhes da imagem" tabindex="-1">' +
      '<div class="flex items-center justify-between px-6 py-4 border-b border-slate-200"><h2 class="font-extrabold text-primary text-lg">Detalhes da imagem</h2>' +
      '<button class="close-modal p-2 text-slate-400" aria-label="Fechar">✕</button></div>' +
      '<div class="modal-body p-6 space-y-4">' +
      '<div class="bg-slate-50 rounded-xl p-4 flex items-center justify-center"><img src="' + esc(url) + '" alt="' + esc(m.alt_text) + '" class="max-h-48 object-contain"></div>' +
      '<p class="text-xs text-slate-500 break-all">URL: <code class="bg-slate-100 px-1.5 py-0.5 rounded">' + esc(url) + '</code></p>' +
      field('Texto alternativo (acessibilidade)', 'altText', m.alt_text || '') +
      field('Título', 'title', m.title || '') +
      field('Fonte/origem', 'source', m.source || '', { help: 'De onde a imagem veio (site oficial, banco de imagens, etc).' }) +
      '</div>' +
      '<div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">' +
      '<button class="close-modal px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600">Cancelar</button>' +
      '<button class="save-item px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-bold">Salvar</button></div></div>';
    document.getElementById('modal-container').appendChild(wrap);
    function close() {
      if (!wrap.isConnected) return;
      wrap.remove(); document.removeEventListener('keydown', onEsc);
      if (previousActive && previousActive.focus) previousActive.focus();
    }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    wrap.querySelectorAll('.close-modal').forEach(function (b) { b.addEventListener('click', close); });
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.addEventListener('keydown', onEsc);
    var firstField = wrap.querySelector('input,textarea,select,button');
    if (firstField) firstField.focus();
    wrap.querySelector('.save-item').addEventListener('click', async function () {
      var btn = wrap.querySelector('.save-item');
      btn.disabled = true; btn.textContent = 'Salvando...';
      try {
        var d = collectForm(wrap.querySelector('.modal-body'));
        await api('PUT', '/api/admin/media/' + m.id, d);
        toast('Alterações salvas com sucesso.');
        close(); router();
      } catch (e) { toast(e.message, 'error'); btn.disabled = false; btn.textContent = 'Salvar'; }
    });
  }

  // Seletor de imagem (usado nas Configurações)
  function imagePicker(label, name, value) {
    return '<div><label class="block text-sm font-semibold text-slate-700 mb-1.5">' + esc(label) + '</label>' +
      '<div class="img-picker border border-slate-300 rounded-lg p-3 flex items-center gap-3" data-name="' + name + '" data-label="' + esc(label) + '">' +
      '<div class="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0">' +
      '<img class="ip-preview max-w-full max-h-full object-contain" src="' + esc(value) + '" alt=""></div>' +
      '<div class="flex-1 min-w-0"><input data-name="' + name + '" value="' + esc(value) + '" class="frm ip-input w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" aria-label="URL da imagem: ' + esc(label) + '">' +
      '<div class="flex flex-wrap items-center gap-3 mt-1.5"><button type="button" class="ip-choose text-xs font-bold text-brand">Escolher da biblioteca</button><label class="text-xs font-bold text-emerald-600 cursor-pointer">Enviar nova<input type="file" class="ip-upload sr-only" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"></label></div></div></div></div>';
  }

  function bindImagePickers(container) {
    container.querySelectorAll('.img-picker').forEach(function (p) {
      var input = p.querySelector('.ip-input');
      var img = p.querySelector('.ip-preview');
      var label = p.getAttribute('data-label') || 'Imagem';
      input.addEventListener('input', function () { img.src = input.value; });
      p.querySelector('.ip-upload').addEventListener('change', async function (e) {
        var file = e.target.files[0];
        var error = validateImageFile(file);
        if (error) { toast(error, 'error'); e.target.value = ''; return; }
        toast('Enviando nova imagem...', 'info');
        try {
          var uploaded = await uploadImageFile(file, { altText: label, title: file.name });
          input.value = uploaded.url;
          img.src = uploaded.url;
          toast('Imagem enviada. Clique em Salvar para aplicar.');
        } catch (err) { toast(err.message, 'error'); }
        e.target.value = '';
      });
      p.querySelector('.ip-choose').addEventListener('click', async function () {
        var res = await api('GET', '/api/admin/media');
        var wrap = document.createElement('div');
        wrap.className = 'fixed inset-0 z-[85] flex items-start justify-center bg-black/50 p-4 overflow-y-auto';
        wrap.innerHTML = '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" role="dialog" aria-modal="true" aria-label="Escolher imagem">' +
          '<div class="flex items-center justify-between px-6 py-4 border-b border-slate-200"><h2 class="font-extrabold text-primary">Escolher imagem</h2>' +
          '<button class="close-modal p-2 text-slate-400" aria-label="Fechar">✕</button></div>' +
          '<div class="p-6 grid grid-cols-3 sm:grid-cols-4 gap-3">' +
          (res.items.length ? res.items.map(function (m) {
            var u = m.url || ('/api/media/' + m.id);
            return '<button class="pick-img border border-slate-200 rounded-xl p-2 hover:border-brand transition-colors" data-url="' + esc(u) + '">' +
              '<img src="' + esc(u) + '" alt="' + esc(m.alt_text) + '" class="w-full h-20 object-contain"><p class="text-[10px] text-slate-500 truncate mt-1">' + esc(m.filename) + '</p></button>';
          }).join('') : '<p class="col-span-4 text-center text-slate-400 text-sm py-6">Sua biblioteca de mídia está vazia. Envie imagens na página Mídia.</p>') +
          '</div></div>';
        document.getElementById('modal-container').appendChild(wrap);
        wrap.querySelector('.close-modal').addEventListener('click', function () { wrap.remove(); });
        wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
        wrap.querySelectorAll('.pick-img').forEach(function (b) {
          b.addEventListener('click', function () {
            input.value = b.dataset.url; img.src = b.dataset.url; wrap.remove();
          });
        });
      });
    });
  }

  // ---------- SEO ----------
  async function pageSeo() {
    var v = await contentGet('seo');
    content.innerHTML = pageHeader('SEO', 'Como o site aparece no Google e ao ser compartilhado.') +
      sectionCard('Mecanismos de busca',
        '<div class="space-y-4">' +
        field('Título da página (title)', 'title', v.title, { help: 'Ideal: até 60 caracteres.' }) +
        field('Descrição (meta description)', 'description', v.description, { type: 'textarea', rows: 2, help: 'Ideal: até 160 caracteres.' }) +
        field('Palavras-chave', 'keywords', v.keywords, { type: 'textarea', rows: 2 }) +
        field('URL canônica (opcional)', 'canonical', v.canonical, { placeholder: 'https://seusite.pages.dev' }) +
        '</div>') +
      sectionCard('Compartilhamento (Open Graph)',
        '<div class="space-y-4">' +
        field('Título ao compartilhar (OG title)', 'ogTitle', v.ogTitle) +
        field('Descrição ao compartilhar', 'ogDescription', v.ogDescription, { type: 'textarea', rows: 2 }) +
        imagePicker('Imagem social (OG image)', 'ogImage', v.ogImage) +
        '</div>') +
      saveBtn('save-seo');
    bindImagePickers(content);
    bindSave('save-seo', async function () { await contentPut('seo', collectForm(content)); });
  }

  // ---------- Analytics ----------
  async function pageAnalytics() {
    var v = await contentGet('analytics');
    content.innerHTML = pageHeader('Analytics', 'Ferramentas de medição. Só são ativadas no site quando o ID é preenchido.') +
      sectionCard('Configuração',
        '<div class="space-y-4">' +
        field('Google Analytics (ID de medição)', 'googleAnalyticsId', v.googleAnalyticsId, { placeholder: 'G-XXXXXXXXXX' }) +
        field('Google Tag Manager (ID)', 'gtmId', v.gtmId, { placeholder: 'GTM-XXXXXXX' }) +
        field('Meta Pixel (ID)', 'metaPixelId', v.metaPixelId, { placeholder: 'somente números' }) +
        '</div><p class="mt-4 text-xs text-slate-400">Deixe em branco os campos que não usa. Nenhum código de medição é inserido no site sem um ID válido.</p>') +
      saveBtn('save-analytics');
    bindSave('save-analytics', async function () {
      var d = collectForm(content);
      if (d.googleAnalyticsId && !/^G-[A-Z0-9]+$/i.test(d.googleAnalyticsId.trim())) throw new Error('ID do Google Analytics inválido. Formato: G-XXXXXXXXXX');
      if (d.gtmId && !/^GTM-[A-Z0-9]+$/i.test(d.gtmId.trim())) throw new Error('ID do Google Tag Manager inválido. Formato: GTM-XXXXXXX');
      if (d.metaPixelId && !/^\d+$/.test(d.metaPixelId.trim())) throw new Error('ID do Meta Pixel deve conter apenas números.');
      await contentPut('analytics', d);
    });
  }

  // ---------- Histórico ----------
  async function pageAudit() {
    var res = await api('GET', '/api/admin/audit');
    var rows = res.items.length ? res.items.map(function (l) {
      var badge = l.action === 'delete' ? 'bg-red-100 text-red-700' : l.action === 'create' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';
      var label = { create: 'Criação', update: 'Edição', delete: 'Exclusão', login: 'Login', reorder: 'Reordenação' }[l.action] || l.action;
      return '<div class="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">' +
        '<span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ' + badge + '">' + esc(label) + '</span>' +
        '<div class="min-w-0 flex-1"><p class="text-sm text-slate-700">' + esc(l.detail || l.entity) + '</p>' +
        '<p class="text-[11px] text-slate-400 mt-0.5">' + esc(l.user_email) + ' · ' + esc(new Date(l.created_at + 'Z').toLocaleString('pt-BR')) + '</p></div></div>';
    }).join('') : '<div class="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center"><p class="text-slate-400">Nenhuma alteração registrada ainda.</p></div>';
    content.innerHTML = pageHeader('Histórico de Alterações', 'Últimas 100 ações realizadas no painel.') +
      '<div class="space-y-2">' + rows + '</div>';
  }

  // ---------- Contatos recebidos (leads) ----------
  var LEAD_STATUS = [
    { value: 'novo', label: 'Novo', badge: 'bg-blue-100 text-blue-700' },
    { value: 'em-contato', label: 'Em contato', badge: 'bg-amber-100 text-amber-700' },
    { value: 'convertido', label: 'Convertido', badge: 'bg-emerald-100 text-emerald-700' },
    { value: 'descartado', label: 'Descartado', badge: 'bg-slate-200 text-slate-600' }
  ];

  async function pageLeads() {
    var filter = (location.hash.split('?')[1] || '').replace('status=', '');
    var res = await api('GET', '/api/admin/leads' + (filter ? '?status=' + encodeURIComponent(filter) : ''));
    var items = res.items || [];

    var filters = [{ value: '', label: 'Todos' }].concat(LEAD_STATUS).map(function (f) {
      var on = filter === f.value;
      return '<a href="#/leads' + (f.value ? '?status=' + f.value : '') + '" class="tap-target inline-flex items-center rounded-full px-4 py-2 text-xs font-bold border transition-colors ' +
        (on ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50') + '">' + esc(f.label) + '</a>';
    }).join('');

    var rows = items.length ? items.map(function (l) {
      var st = LEAD_STATUS.filter(function (s) { return s.value === l.status; })[0] || LEAD_STATUS[0];
      var digits = String(l.whatsapp || '').replace(/\D/g, '');
      return '<div class="bg-white border border-slate-200 rounded-xl p-4" data-id="' + l.id + '">' +
        '<div class="flex flex-wrap items-start justify-between gap-3">' +
        '<div class="min-w-0">' +
        '<p class="font-bold text-primary truncate">' + esc(l.name) + '</p>' +
        '<p class="text-xs text-slate-500">' + esc(l.business || 'Negócio não informado') + ' · ' + esc(new Date(l.created_at + 'Z').toLocaleString('pt-BR')) + '</p>' +
        '</div>' +
        '<span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ' + st.badge + '">' + esc(st.label) + '</span>' +
        '</div>' +
        (l.message ? '<p class="mt-3 text-sm text-slate-600 whitespace-pre-line">' + esc(l.message) + '</p>' : '') +
        '<div class="admin-actions mt-4 flex flex-wrap items-center gap-2">' +
        (digits ? '<a href="https://wa.me/' + esc(digits) + '" target="_blank" rel="noopener" class="tap-target inline-flex items-center min-h-10 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">WhatsApp ' + esc(l.whatsapp) + '</a>' : '') +
        '<select data-status class="frm min-h-10 border border-slate-300 rounded-lg px-3 text-xs font-semibold" aria-label="Situação do contato ' + esc(l.name) + '">' +
        LEAD_STATUS.map(function (s) { return '<option value="' + s.value + '"' + (s.value === l.status ? ' selected' : '') + '>' + esc(s.label) + '</option>'; }).join('') +
        '</select>' +
        '<button data-del class="tap-target inline-flex items-center min-h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold text-red-600 hover:bg-red-50">Excluir</button>' +
        '</div></div>';
    }).join('') : '<div class="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center"><p class="text-slate-400">Nenhum contato recebido' + (filter ? ' nesta situação' : '') + '.</p></div>';

    content.innerHTML = pageHeader('Contatos Recebidos', 'Mensagens enviadas pelo formulário do site.') +
      '<div class="flex flex-wrap gap-2 mb-5">' + filters + '</div>' +
      '<div class="space-y-3">' + rows + '</div>';

    content.querySelectorAll('[data-status]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var id = sel.closest('[data-id]').dataset.id;
        try { await api('PUT', '/api/admin/leads/' + id, { status: sel.value }); toast('Situação atualizada.'); }
        catch (e) { if (e.message !== 'unauth') toast(e.message, 'error'); }
      });
    });
    content.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('[data-id]');
        confirmDialog('Excluir este contato? Esta ação não pode ser desfeita.', async function () {
          try { await api('DELETE', '/api/admin/leads/' + card.dataset.id); toast('Contato excluído.'); router(); }
          catch (e) { if (e.message !== 'unauth') toast(e.message, 'error'); }
        });
      });
    });
  }

})();
