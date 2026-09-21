// Páginas institucionais (termos, privacidade) e página 404 personalizada.
// Compartilham o mesmo CSS compilado e os mesmos tokens de tema do site principal.

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export type PageShellOptions = {
  title: string
  description: string
  canonical: string
  companyName: string
  /** Conteúdo já sanitizado/gerado internamente (nunca entrada do usuário). */
  body: string
  /** noindex para páginas que não devem aparecer na busca (ex.: 404). */
  noindex?: boolean
}

function shell(o: PageShellOptions): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<script>(function(){try{var s=localStorage.getItem('site-theme');document.documentElement.setAttribute('data-theme',s==='dark'?'dark':'light')}catch(_){document.documentElement.setAttribute('data-theme','light')}})();</script>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
${o.noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${esc(o.canonical)}">`}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(o.canonical)}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="/static/projeto-logo-recortado.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"></noscript>
<link rel="stylesheet" href="/static/app.css">
<style>
  :root{color-scheme:light;--page:#f8fafc;--surface:#fff;--ink:#0f172a;--muted:#475569;--line:#e2e8f0}
  html[data-theme="dark"]{color-scheme:dark;--page:#0b1220;--surface:#111c31;--ink:#f8fafc;--muted:#cbd5e1;--line:#26364f}
  body{background:var(--page);color:var(--ink)}
  .legal h2{margin-top:2rem;font-size:1.25rem;font-weight:800;color:var(--ink)}
  .legal p,.legal li{color:var(--muted);line-height:1.75;font-size:.95rem}
  .legal p{margin-top:.75rem}
  .legal ul{margin-top:.75rem;padding-left:1.25rem;list-style:disc}
  .legal a{color:#2563eb;text-decoration:underline}
</style>
</head>
<body class="antialiased">
<a href="#conteudo" class="skip-link">Pular para o conteúdo principal</a>
<header class="border-b" style="border-color:var(--line);background:var(--surface)">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
    <a href="/" class="flex items-center gap-3 font-extrabold" style="color:var(--ink)">
      <img src="/static/projeto-logo-recortado.png" alt="" width="36" height="36" class="h-9 w-9 object-contain" decoding="async">
      <span class="text-sm sm:text-base truncate">${esc(o.companyName)}</span>
    </a>
    <a href="/" class="text-sm font-semibold" style="color:#2563eb">Voltar ao site</a>
  </div>
</header>
<main id="conteudo" class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
${o.body}
</main>
<footer class="border-t py-8 text-center text-xs" style="border-color:var(--line);color:var(--muted)">
  <div class="max-w-3xl mx-auto px-4">
    <nav aria-label="Links institucionais" class="flex flex-wrap justify-center gap-x-4 gap-y-1">
      <a href="/termos" class="hover:underline">Termos de uso</a>
      <a href="/privacidade" class="hover:underline">Política de privacidade</a>
      <a href="/#contato" class="hover:underline">Contato</a>
    </nav>
    <p class="mt-3">© ${new Date().getFullYear()} ${esc(o.companyName)} — Pedreiras, Maranhão</p>
  </div>
</footer>
</body>
</html>`
}

type SiteInfo = { companyName?: string; email?: string; whatsappDisplay?: string; city?: string; state?: string }

export function renderTermsPage(s: SiteInfo, canonical: string): string {
  const company = s.companyName || 'Assessoria Comercial UEMA Pedreiras'
  return shell({
    title: `Termos de uso — ${company}`,
    description: `Condições de uso do site e dos serviços de assessoria comercial oferecidos pela ${company}.`,
    canonical,
    companyName: company,
    body: `
<article class="legal">
  <h1 class="fluid-h2 font-extrabold">Termos de uso</h1>
  <p class="text-sm">Última atualização: ${new Date().toLocaleDateString('pt-BR')}</p>

  <h2>1. Sobre este site</h2>
  <p>Este site apresenta os serviços de assessoria comercial conduzidos por estudantes e professores vinculados à UEMA em ${esc(s.city || 'Pedreiras')} — ${esc(s.state || 'MA')}. O acesso e a navegação são gratuitos.</p>

  <h2>2. Natureza dos serviços</h2>
  <p>As informações publicadas têm caráter informativo e não substituem consultoria jurídica, contábil ou financeira formal. Cada atendimento é acordado individualmente, com escopo, prazos e responsabilidades definidos antes do início dos trabalhos.</p>

  <h2>3. Uso adequado</h2>
  <ul>
    <li>Não é permitido tentar acessar áreas restritas, como o painel administrativo, sem autorização.</li>
    <li>Não é permitido enviar conteúdo ilícito, ofensivo ou automatizado pelos canais de contato.</li>
    <li>Não é permitido reproduzir textos, marcas e imagens deste site sem autorização prévia.</li>
  </ul>

  <h2>4. Canais de contato</h2>
  <p>As mensagens enviadas pelo formulário ou pelo WhatsApp ${esc(s.whatsappDisplay || '')} são respondidas em horário comercial. Não há garantia de resposta imediata.</p>

  <h2>5. Disponibilidade</h2>
  <p>Trabalhamos para manter o site sempre disponível, mas podem ocorrer interrupções por manutenção ou fatores externos. Conteúdos, preços e condições podem ser atualizados a qualquer momento.</p>

  <h2>6. Contato</h2>
  <p>Dúvidas sobre estes termos podem ser enviadas${s.email ? ` para <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ' pelos nossos canais de atendimento'}.</p>
</article>`
  })
}

export function renderPrivacyPage(s: SiteInfo, canonical: string): string {
  const company = s.companyName || 'Assessoria Comercial UEMA Pedreiras'
  return shell({
    title: `Política de privacidade — ${company}`,
    description: `Como a ${company} coleta, usa e protege os dados pessoais enviados pelo site, conforme a LGPD.`,
    canonical,
    companyName: company,
    body: `
<article class="legal">
  <h1 class="fluid-h2 font-extrabold">Política de privacidade</h1>
  <p class="text-sm">Última atualização: ${new Date().toLocaleDateString('pt-BR')}</p>

  <h2>1. Dados que coletamos</h2>
  <ul>
    <li><strong>Dados de contato</strong> que você informa no formulário: nome, WhatsApp, negócio e mensagem.</li>
    <li><strong>Dados técnicos</strong> gerados automaticamente: endereço IP e data/hora, usados apenas para segurança e prevenção de spam.</li>
  </ul>

  <h2>2. Por que usamos esses dados</h2>
  <p>Utilizamos as informações exclusivamente para responder ao seu contato, organizar o atendimento e melhorar os serviços oferecidos. Não vendemos nem compartilhamos dados com terceiros para fins comerciais.</p>

  <h2>3. Base legal (LGPD)</h2>
  <p>O tratamento ocorre com base no seu consentimento ao enviar o formulário e no legítimo interesse de responder à solicitação, conforme a Lei nº 13.709/2018.</p>

  <h2>4. Armazenamento e segurança</h2>
  <p>Os dados ficam em banco de dados gerenciado, com acesso restrito à equipe do projeto por login protegido por senha criptografada, limite de tentativas e registro de auditoria. A conexão com o site é feita por HTTPS.</p>

  <h2>5. Prazo de guarda</h2>
  <p>Mantemos os contatos apenas pelo tempo necessário ao atendimento e ao histórico do projeto. Você pode pedir a exclusão a qualquer momento.</p>

  <h2>6. Seus direitos</h2>
  <p>Você pode solicitar confirmação, acesso, correção, portabilidade, anonimização ou exclusão dos seus dados, além de revogar o consentimento${s.email ? `, escrevendo para <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ' pelos nossos canais de atendimento'}.</p>

  <h2>7. Cookies e medição</h2>
  <p>Não usamos cookies de publicidade. Guardamos apenas a sua preferência de tema (claro ou escuro) no próprio navegador. Caso ferramentas de medição de audiência estejam ativas, elas coletam dados agregados de navegação.</p>
</article>`
  })
}

export function renderNotFoundPage(s: SiteInfo): string {
  const company = s.companyName || 'Assessoria Comercial UEMA Pedreiras'
  return shell({
    title: `Página não encontrada — ${company}`,
    description: 'A página que você procura não existe ou foi movida.',
    canonical: '/',
    companyName: company,
    noindex: true,
    body: `
<div class="text-center py-10">
  <p class="text-6xl sm:text-7xl font-extrabold" style="color:#2563eb">404</p>
  <h1 class="mt-4 fluid-h2 font-extrabold">Esta página não existe</h1>
  <p class="mt-3" style="color:var(--muted)">O endereço pode ter mudado ou o link estar incorreto. Veja por onde continuar:</p>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <a href="/" class="tap-target inline-flex items-center justify-center rounded-xl bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3">Ir para a página inicial</a>
    <a href="/#contato" class="tap-target inline-flex items-center justify-center rounded-xl border px-6 py-3 font-bold" style="border-color:var(--line);color:var(--ink)">Falar com a equipe</a>
  </div>
  <nav aria-label="Seções do site" class="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
    <a href="/#servicos" class="hover:underline" style="color:#2563eb">Serviços</a>
    <a href="/#planos" class="hover:underline" style="color:#2563eb">Planos</a>
    <a href="/#como-funciona" class="hover:underline" style="color:#2563eb">Como funciona</a>
    <a href="/#faq" class="hover:underline" style="color:#2563eb">Perguntas frequentes</a>
  </nav>
</div>`
  })
}
