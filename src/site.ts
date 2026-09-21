// Renderização SSR do site público a partir do conteúdo do banco
export type SiteContent = Record<string, any>

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function waLink(number: string, message: string): string {
  return `https://wa.me/${(number || '').replace(/\D/g, '')}?text=${encodeURIComponent(message || '')}`
}

function safeHref(value: unknown, fallback = '#'): string {
  const raw = String(value ?? '').trim()
  if (/^#[a-z0-9_-]+$/i.test(raw)) return raw
  if (/^https?:\/\/[^\s<]+$/i.test(raw)) return raw
  if (/^(mailto|tel):[^\s<]+$/i.test(raw)) return raw
  return fallback
}

function safeImageSrc(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim()
  if (/^(https?:\/\/|\/)[^\s<]+$/i.test(raw)) return raw
  return fallback
}

function jsString(value: unknown): string {
  return JSON.stringify(String(value ?? ''))
}

const ICONS: Record<string, string> = {
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'keyboard': '<rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
  'layout': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'id-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M8 14a3 3 0 0 0-3 3M14 9h4M14 13h4"/>',
  'palette': '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  'list-checks': '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  'briefcase': '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  'star': '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>'
}

function icon(name: string, cls = 'w-6 h-6'): string {
  const path = ICONS[name] || ICONS['briefcase']
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${path}</svg>`
}

const WA_SVG = `<svg viewBox="0 0 32 32" fill="currentColor" class="w-6 h-6" aria-hidden="true"><path d="M16.004 3C9.383 3 4 8.383 4 15.004c0 2.646.868 5.096 2.338 7.09L4.06 28.062l6.14-2.23a11.94 11.94 0 0 0 5.804 1.494C22.625 27.326 28 21.943 28 15.322 28 8.7 22.625 3 16.004 3zm0 21.994a9.94 9.94 0 0 1-5.07-1.387l-.363-.216-3.644 1.324 1.288-3.553-.237-.373a9.93 9.93 0 0 1-1.552-5.348c0-5.49 4.468-9.958 9.958-9.958 5.49 0 9.957 4.468 9.957 9.958 0 5.49-4.467 9.553-9.937 9.553zm5.462-7.44c-.3-.15-1.77-.874-2.045-.974-.274-.1-.474-.15-.673.15-.2.3-.774.973-.948 1.173-.175.2-.35.225-.65.075-.3-.15-1.264-.466-2.408-1.485-.89-.794-1.49-1.774-1.665-2.074-.174-.3-.018-.462.132-.612.135-.134.3-.35.45-.524.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.673-1.622-.923-2.222-.243-.583-.49-.504-.673-.513l-.573-.01c-.2 0-.524.075-.798.375-.275.3-1.048 1.024-1.048 2.497 0 1.473 1.072 2.895 1.222 3.095.15.2 2.11 3.222 5.112 4.517.714.308 1.272.492 1.706.63.717.228 1.37.196 1.886.119.575-.086 1.77-.724 2.02-1.423.25-.7.25-1.298.175-1.423-.075-.125-.275-.2-.575-.35z"/></svg>`

const THEME_TOGGLE = `<span class="theme-moon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg></span><span class="theme-sun" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></span>`
const THEME_CHOICES = `<button type="button" data-theme-choice="light" aria-pressed="false"><span class="theme-choice-sun" aria-hidden="true">☼</span><span>Claro</span></button><button type="button" data-theme-choice="dark" aria-pressed="false"><span class="theme-choice-moon" aria-hidden="true">◐</span><span>Escuro</span></button>`

export type RenderOptions = {
  /** Origem absoluta da requisicao (ex.: https://exemplo.com). Usada em canonical/og:url. */
  origin?: string
  /** Caminho atual, sempre iniciado por "/". */
  path?: string
}

export function renderSite(ct: SiteContent, opts: RenderOptions = {}): string {
  const s = ct.settings || {}
  const seo = ct.seo || {}
  const topbar = ct.topbar || {}
  const navbar = ct.navbar || {}
  const hero = ct.hero || {}
  const problems = ct.problems || {}
  const authority = ct.authority || {}
  const servicesSection = ct.servicesSection || {}
  const plansSection = ct.plansSection || {}
  const stepsSection = ct.stepsSection || {}
  const faqSection = ct.faqSection || {}
  const finalCta = ct.finalCta || {}
  const footer = ct.footer || {}
  const widget = ct.whatsappWidget || {}
  const analytics = ct.analytics || {}

  const plans: any[] = ct.plans || []
  const services: any[] = ct.services || []
  const faqs: any[] = ct.faqs || []
  const steps: any[] = ct.steps || []
  const problemCards: any[] = ct.problemCards || []

  const wa = (msg?: string) => waLink(s.whatsapp, msg || s.whatsappDefaultMessage)

  const navLinks: any[] = navbar.links || []
  const testimonialsSection = ct.testimonialsSection || {}
  const testimonials: any[] = ct.testimonials || []
  const contactSection = ct.contactSection || {}

  // URLs absolutas: canonical e og:url devem sempre apontar para a propria pagina.
  const origin = (opts.origin || '').replace(/\/+$/, '')
  const path = opts.path && opts.path.startsWith('/') ? opts.path : '/'
  const pageUrl = origin ? origin + (path === '/' ? '/' : path) : path
  const abs = (u: string) => (u.startsWith('http') || !origin ? u : origin + u)
  const canonicalUrl = seo.canonical || pageUrl
  const ogImageUrl = abs(safeImageSrc(seo.ogImage || s.logoUrl, '/static/projeto-logo-recortado.png'))

  // Dados estruturados: negocio local + catalogo de servicos.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: s.companyName,
    description: seo.description || s.description,
    url: pageUrl,
    image: ogImageUrl,
    telephone: s.phone || s.whatsappDisplay,
    email: s.email || undefined,
    areaServed: s.city ? `${s.city}, ${s.state}` : undefined,
    address: { '@type': 'PostalAddress', addressLocality: s.city, addressRegion: s.state, addressCountry: 'BR' },
    openingHours: s.businessHours || undefined,
    sameAs: [s.instagram, s.facebook, s.tiktok].filter(Boolean),
    hasOfferCatalog: services.length
      ? {
          '@type': 'OfferCatalog',
          name: servicesSection.title || 'Servicos',
          itemListElement: services.map((sv: any) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: sv.name, description: sv.description }
          }))
        }
      : undefined
  }

  const analyticsScripts = [
    analytics.gtmId ? `<script async src="https://www.googletagmanager.com/gtm.js?id=${esc(analytics.gtmId)}"></script>` : '',
    analytics.googleAnalyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(analytics.googleAnalyticsId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',${jsString(analytics.googleAnalyticsId)});</script>` : '',
    analytics.metaPixelId ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${jsString(analytics.metaPixelId)});fbq('track','PageView');</script>` : ''
  ].join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f8fafc">
<script>(function(){try{var saved=localStorage.getItem('site-theme');var theme=saved==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',theme)}catch(_){document.documentElement.setAttribute('data-theme','light')}})();</script>
<title>${esc(seo.title || s.companyName)}</title>
<meta name="description" content="${esc(seo.description || s.description)}">
${seo.keywords ? `<meta name="keywords" content="${esc(seo.keywords)}">` : ''}
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:site_name" content="${esc(s.companyName)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(seo.ogTitle || seo.title || s.companyName)}">
<meta property="og:description" content="${esc(seo.ogDescription || seo.description || '')}">
<meta property="og:image" content="${esc(ogImageUrl)}">
<meta name="twitter:image" content="${esc(ogImageUrl)}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="${esc(safeImageSrc(s.faviconUrl, '/static/projeto-logo-recortado.png'))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"></noscript>
<!-- CSS compilado no build: substitui o Tailwind via CDN, que compilava no navegador do visitante. -->
<link rel="stylesheet" href="/static/app.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  :root{color-scheme:light;--page:#f8fafc;--surface:#fff;--surface-muted:#f8fafc;--ink:#0f172a;--muted:#475569;--muted-soft:#64748b;--line:#e2e8f0;--soft-blue:#eff6ff;--soft-red:#fef2f2;--topbar-bg:#eaf2ff;--topbar-ink:#0f172a;--topbar-link:#1d4ed8;--ease-out:cubic-bezier(.23,1,.32,1)}
  html[data-theme="dark"]{color-scheme:dark;--page:#0b1220;--surface:#111c31;--surface-muted:#152238;--ink:#f8fafc;--muted:#cbd5e1;--muted-soft:#94a3b8;--line:#26364f;--soft-blue:rgba(37,99,235,.16);--soft-red:rgba(239,68,68,.14);--topbar-bg:#0b1220;--topbar-ink:#f8fafc;--topbar-link:#6ee7b7}
  html{scroll-behavior:smooth;scroll-padding-top:5rem}
  body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background-color:var(--page)!important;color:var(--ink)!important;overflow-x:hidden;transition:background-color .25s ease,color .25s ease}
  #scroll-progress{position:fixed;inset:0 0 auto 0;height:3px;z-index:70;pointer-events:none;background:linear-gradient(90deg,#2563eb,#10b981);transform:scaleX(0);transform-origin:left center;transition:transform .12s linear}
  img{max-width:100%;height:auto}
  section[id]{scroll-margin-top:5rem}
  .fade-up{opacity:0;transform:translateY(18px);transition:opacity .55s var(--ease-out) var(--reveal-delay,0ms),transform .55s var(--ease-out) var(--reveal-delay,0ms)}
  ::selection{background:rgba(37,99,235,.18);color:var(--ink)}
  #site-header.is-scrolled{box-shadow:0 8px 26px rgba(15,23,42,.08)}
  html[data-theme="dark"] #site-header.is-scrolled{box-shadow:0 8px 26px rgba(0,0,0,.24)}
  .nav-link[aria-current="true"]{color:#2563eb}
  html[data-theme="dark"] .nav-link[aria-current="true"]{color:#93c5fd}
  .fade-up.visible{opacity:1;transform:none}
  .faq-answer{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s var(--ease-out)}
  .faq-item[data-open="true"] .faq-answer{grid-template-rows:1fr}
  .faq-answer>div{overflow:hidden}
  .faq-item[data-open="true"] .faq-chevron{transform:rotate(180deg)}
  .faq-chevron{transition:transform .28s var(--ease-out)}
  a:focus-visible,button:focus-visible{outline:3px solid #60a5fa;outline-offset:3px;border-radius:8px}
  button,a{touch-action:manipulation}
  button:active,a:active{transform:translateY(1px)}
  #top-bar{background-color:var(--topbar-bg)!important;color:var(--topbar-ink)!important;border-bottom:1px solid var(--line);transition:background-color .25s ease,color .25s ease,border-color .25s ease}
  #top-bar a{color:var(--topbar-link)!important}
  #site-header{background-color:rgba(255,255,255,.94);border-color:var(--line);transition:background-color .25s ease,border-color .25s ease}
  html[data-theme="dark"] #site-header{background-color:rgba(15,23,42,.9)!important;border-color:var(--line)!important}
  html[data-theme="dark"] #mobile-menu{background-color:var(--surface)!important;border-color:var(--line)!important}
  html[data-theme="dark"] .bg-white{background-color:var(--surface)!important}
  html[data-theme="dark"] .bg-slate-50{background-color:var(--surface-muted)!important}
  html[data-theme="dark"] .bg-slate-100{background-color:#0f1a2e!important}
  html[data-theme="dark"] .text-primary{color:#f8fafc!important}
  html[data-theme="dark"] .text-slate-800{color:#e2e8f0!important}
  html[data-theme="dark"] .text-slate-700{color:#cbd5e1!important}
  html[data-theme="dark"] .text-slate-600{color:#cbd5e1!important}
  html[data-theme="dark"] .text-slate-500{color:#94a3b8!important}
  html[data-theme="dark"] .text-slate-400{color:#94a3b8!important}
  html[data-theme="dark"] .text-brand{color:#60a5fa!important}
  html[data-theme="dark"] .text-accent-dark{color:#6ee7b7!important}
  html[data-theme="dark"] .border-slate-200,html[data-theme="dark"] .border-slate-300{border-color:var(--line)!important}
  html[data-theme="dark"] .bg-blue-50{background-color:var(--soft-blue)!important}
  html[data-theme="dark"] .bg-red-50{background-color:var(--soft-red)!important}
  html[data-theme="dark"] .hover\\:bg-slate-50:hover{background-color:#1d2b43!important}
  html[data-theme="dark"] .hover\\:bg-blue-50:hover{background-color:rgba(37,99,235,.2)!important}
  .theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;border:1px solid var(--line);border-radius:.8rem;color:var(--ink);background:var(--surface);transition:background-color .2s ease,border-color .2s ease,color .2s ease,transform .16s var(--ease-out)}
  .theme-toggle:hover{border-color:#60a5fa;color:#2563eb;background:var(--soft-blue)}
  .theme-toggle svg{width:1.1rem;height:1.1rem}
  .theme-picker{display:inline-flex;align-items:center;gap:.15rem;padding:.2rem;border:1px solid var(--line);border-radius:.8rem;background:var(--surface);color:var(--muted-soft)}
  .theme-picker button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:.3rem;min-height:2.2rem;padding:.35rem .65rem;border:0;border-radius:.6rem;background:transparent;color:inherit;font-size:.72rem;font-weight:700;transition:background-color .2s ease,color .2s ease,transform .16s var(--ease-out)}
  .theme-picker button:hover{color:#2563eb;background:var(--soft-blue)}
  .theme-picker button[aria-pressed="true"]{background:#2563eb;color:#fff;box-shadow:0 2px 6px rgba(37,99,235,.22)}
  .theme-choice-sun,.theme-choice-moon{font-size:1rem;line-height:1}
  .theme-sun{display:none}.theme-moon{display:block}
  html[data-theme="dark"] .theme-sun{display:block}html[data-theme="dark"] .theme-moon{display:none}
  .brand-mark{display:block;background:transparent;border-radius:0;padding:0;transition:opacity .2s ease,transform .16s var(--ease-out)}
  .brand-mark:hover{opacity:.86}
  .logo-asset{display:block;max-width:100%;height:auto;object-fit:contain}
  html[data-theme="dark"] .project-logo,html[data-theme="dark"] .institution-logo{filter:none!important;opacity:1!important}
  .wa-float{animation:pulse-soft 2.5s infinite}
  #mobile-bar{padding-bottom:calc(.75rem + env(safe-area-inset-bottom));background-color:var(--surface)!important;border-color:var(--line)!important}
  @keyframes pulse-soft{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.45)}50%{box-shadow:0 0 0 12px rgba(16,185,129,0)}}
  @media (max-width:640px){#mobile-menu .mobile-link{min-height:2.75rem;display:flex;align-items:center}#mobile-menu>div{padding-bottom:calc(1rem + env(safe-area-inset-bottom))}.wa-float{bottom:calc(4.75rem + env(safe-area-inset-bottom))!important;right:1rem!important}}
  @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}.fade-up{opacity:1;transform:none;transition:none}.wa-float{animation:none}button,a,#scroll-progress{transition:none!important}}
</style>
${analyticsScripts}
</head>
<body class="bg-[#F8FAFC] text-slate-800 antialiased ${widget.mobileBarEnabled ? 'pb-20 md:pb-0' : ''}">
<a href="#conteudo" class="skip-link">Pular para o conteúdo principal</a>
<div id="scroll-progress" aria-hidden="true"></div>

${topbar.enabled ? `
<div id="top-bar" class="theme-topbar text-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] sm:text-sm">
    <p class="leading-snug">${esc(topbar.text)}</p>
    ${topbar.linkEnabled ? `<a href="${wa()}" target="_blank" rel="noopener" class="hidden sm:inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2">${esc(topbar.linkText || 'Falar agora')}</a>` : ''}
  </div>
</div>` : ''}

<header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200" id="site-header">
  <nav class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4" aria-label="Navegação principal">
    <a href="#inicio" class="flex items-center gap-3 min-w-0">
      <img src="${esc(safeImageSrc(s.logoUrl, '/static/projeto-logo-recortado.png'))}" alt="${esc(s.companyName)}" class="brand-mark project-logo logo-asset h-11 w-11 object-contain shrink-0" width="44" height="44" decoding="async">
      <span class="flex flex-col min-w-0">
        <span class="font-extrabold text-primary leading-tight text-sm sm:text-base truncate">${esc(s.shortName || s.companyName)}</span>
        ${navbar.badge ? `<span class="text-[11px] font-semibold text-brand leading-tight">${esc(navbar.badge)}</span>` : ''}
      </span>
    </a>
    <div class="hidden xl:flex items-center gap-4 xl:gap-6">
      ${navLinks.map(l => `<a href="${safeHref(l.href)}" data-nav-target="${esc(safeHref(l.href))}" class="nav-link text-sm font-medium text-slate-600 hover:text-primary transition-colors">${esc(l.label)}</a>`).join('')}
      <div class="theme-picker hidden xl:inline-flex" role="group" aria-label="Escolher tema">${THEME_CHOICES}</div>
      <button type="button" data-theme-toggle class="theme-toggle hidden lg:inline-flex xl:hidden" aria-label="Alternar tema" aria-pressed="false" title="Alternar tema">${THEME_TOGGLE}<span class="sr-only">Alternar tema</span></button>
      <a href="${wa()}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">${WA_SVG}${esc(navbar.ctaText || 'Falar no WhatsApp')}</a>
    </div>
    <div class="flex items-center gap-2 xl:hidden">
      <button type="button" data-theme-toggle class="theme-toggle" aria-label="Ativar tema escuro" aria-pressed="false" title="Alternar tema">${THEME_TOGGLE}<span class="sr-only">Alternar tema</span></button>
      <button id="menu-btn" class="p-2 text-primary" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-menu">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-7 h-7"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
    </button>
    </div>
  </nav>
  <div id="mobile-menu" class="xl:hidden hidden border-t border-slate-200 bg-white">
    <div class="px-4 py-4 flex flex-col gap-1">
      ${navLinks.map(l => `<a href="${safeHref(l.href)}" data-nav-target="${esc(safeHref(l.href))}" class="mobile-link nav-link py-3 px-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50">${esc(l.label)}</a>`).join('')}
      <a href="${wa()}" target="_blank" rel="noopener" class="mt-2 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-3 rounded-lg">${WA_SVG}${esc(navbar.ctaText || 'Falar no WhatsApp')}</a>
      <div class="mt-3 pt-3 border-t border-slate-200"><p class="px-2 mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Aparência</p><div class="theme-picker w-full" role="group" aria-label="Escolher tema">${THEME_CHOICES}</div></div>
    </div>
  </div>
</header>

<main id="inicio">
<span id="conteudo" class="sr-only" tabindex="-1"></span>
${hero.enabled !== false ? `
<section id="hero-section" class="relative overflow-hidden bg-primary text-white">
  <div class="absolute inset-0 opacity-[0.07]" aria-hidden="true" style="background-image:radial-gradient(circle at 20% 30%, #2563EB 0, transparent 40%),radial-gradient(circle at 80% 70%, #10B981 0, transparent 40%)"></div>
  <div class="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 text-center">
    ${hero.badge ? `<span class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-slate-100 text-sm sm:text-base font-semibold px-5 py-2 rounded-full mb-8">${esc(hero.badge)}</span>` : ''}
    <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight">${esc(hero.title)}</h1>
    <p class="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">${esc(hero.subtitle)}</p>
    <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
      <a href="${wa()}" target="_blank" rel="noopener" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold px-6 sm:px-9 py-4 sm:py-5 rounded-xl text-base sm:text-lg transition-all hover:scale-[1.02]">${WA_SVG}${esc(hero.ctaPrimary)}</a>
      <a href="#como-funciona" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-6 sm:px-9 py-4 sm:py-5 rounded-xl text-base sm:text-lg transition-colors">${esc(hero.ctaSecondary)}</a>
    </div>
    <div class="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
      <div class="bg-white/5 border border-white/15 rounded-2xl px-5 py-6 flex flex-col items-center gap-3">
        <span class="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center">${icon('check', 'w-6 h-6')}</span>
        <span class="text-base font-semibold text-slate-200">Preço transparente</span>
      </div>
      <div class="bg-white/5 border border-white/15 rounded-2xl px-5 py-6 flex flex-col items-center gap-3">
        <span class="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center">${icon('shield', 'w-6 h-6')}</span>
        <span class="text-base font-semibold text-slate-200">Validação antes da entrega</span>
      </div>
      <div class="bg-white/5 border border-white/15 rounded-2xl px-5 py-6 flex flex-col items-center gap-3">
        <span class="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center">${icon('map-pin', 'w-6 h-6')}</span>
        <span class="text-base font-semibold text-slate-200">Atendimento local</span>
      </div>
    </div>
  </div>
</section>` : ''}

${problems.enabled !== false && problemCards.length ? `
<section id="problemas" class="py-14 sm:py-16 md:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center mb-12 fade-up">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">${esc(problems.title)}</h2>
      ${problems.subtitle ? `<p class="mt-4 text-slate-600 text-base sm:text-lg">${esc(problems.subtitle)}</p>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      ${problemCards.map((p, i) => `
      <article class="problem-card bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all fade-up" style="--reveal-delay:${Math.min(i, 5) * 55}ms">
        <div class="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-4">${icon(p.icon || 'alert-circle')}</div>
        <h3 class="font-bold text-primary text-lg">${esc(p.title)}</h3>
        <p class="mt-2 text-sm text-slate-600 leading-relaxed">${esc(p.description)}</p>
      </article>`).join('')}
    </div>
  </div>
</section>` : ''}

${authority.enabled !== false ? `
<section id="autoridade" class="py-16 md:py-24 bg-white border-y border-slate-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
    <div class="fade-up">
      <span class="inline-flex items-center gap-2 bg-blue-50 text-brand text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">Contexto acadêmico</span>
      <h2 class="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">${esc(authority.title)}</h2>
      <p class="mt-5 text-slate-600 text-base sm:text-lg leading-relaxed">${esc(authority.text)}</p>
      <p class="mt-4 text-sm text-slate-500 leading-relaxed">${esc(authority.detail)}</p>
      <div class="mt-6 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div class="w-11 h-11 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">${icon('briefcase')}</div>
        <div><p class="font-bold text-primary">${esc(authority.courseName)}</p><p class="text-sm text-slate-500">${esc(authority.institutionName)}</p></div>
      </div>
    </div>
    <div class="fade-up">
      <div class="flex flex-col items-center text-center">
        <img src="${esc(safeImageSrc(s.institutionLogoUrl, '/static/uema-logo-recortado.png'))}" alt="Logotipo da Universidade Estadual do Maranhão — UEMA" class="institution-logo logo-asset w-full max-w-2xl" loading="lazy" decoding="async">
        <p class="mt-6 text-xs text-slate-400 leading-relaxed max-w-sm">A identidade institucional pertence à universidade. O serviço comercial é de responsabilidade do projeto, com identidade própria.</p>
      </div>
    </div>
  </div>
</section>` : ''}

${servicesSection.enabled !== false && services.length ? `
<section id="servicos" class="py-14 sm:py-16 md:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center mb-12 fade-up">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">${esc(servicesSection.title)}</h2>
      ${servicesSection.subtitle ? `<p class="mt-4 text-slate-600 text-base sm:text-lg">${esc(servicesSection.subtitle)}</p>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${services.map((sv, i) => `
      <article class="service-card bg-white rounded-2xl border ${sv.highlighted ? 'border-brand shadow-md' : 'border-slate-200'} p-6 hover:shadow-lg transition-all fade-up" style="--reveal-delay:${Math.min(i, 5) * 55}ms">
        <div class="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">${icon(sv.icon || 'briefcase')}</div>
        <h3 class="font-bold text-primary text-lg">${esc(sv.name)}</h3>
        <p class="mt-2 text-sm text-slate-600 leading-relaxed">${esc(sv.description)}</p>
        ${sv.price ? `<p class="mt-3 font-bold text-brand">R$ ${esc(sv.price)}</p>` : ''}
      </article>`).join('')}
    </div>
  </div>
</section>` : ''}

${plansSection.enabled !== false && plans.length ? `
<section id="planos" class="py-16 md:py-24 bg-primary">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center mb-12 fade-up">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">${esc(plansSection.title)}</h2>
      ${plansSection.subtitle ? `<p class="mt-4 text-slate-300 text-base sm:text-lg">${esc(plansSection.subtitle)}</p>` : ''}
    </div>
    <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
      ${plans.map((p, i) => `
      <article class="plan-card relative bg-white rounded-2xl p-7 flex flex-col fade-up ${p.highlighted ? 'ring-4 ring-accent shadow-2xl' : 'shadow-lg'}" style="--reveal-delay:${Math.min(i, 5) * 70}ms">
        ${p.badge ? `<span class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">${esc(p.badge)}</span>` : ''}
        <h3 class="font-extrabold text-primary text-xl">${esc(p.name)}</h3>
        <div class="mt-3 flex items-end gap-2">
          ${p.promo_price ? `<span class="text-slate-400 line-through text-lg">R$ ${esc(p.price)}</span><span class="text-4xl font-extrabold text-primary">R$ ${esc(p.promo_price)}</span>` : `<span class="text-4xl font-extrabold text-primary">R$ ${esc(p.price)}</span>`}
        </div>
        <p class="text-sm font-semibold text-accent-dark mt-1">${esc(p.billing_type || 'Taxa única')}</p>
        ${p.description ? `<p class="mt-3 text-sm text-slate-600 leading-relaxed">${esc(p.description)}</p>` : ''}
        <ul class="mt-5 space-y-2.5 flex-1">
          ${(p.features || []).map((f: string) => `<li class="flex gap-2.5 text-sm text-slate-700"><span class="text-accent mt-0.5 shrink-0">${icon('check', 'w-4 h-4')}</span>${esc(f)}</li>`).join('')}
        </ul>
        ${p.note ? `<p class="mt-3 text-xs text-slate-500">${esc(p.note)}</p>` : ''}
        <a href="${waLink(s.whatsapp, p.whatsapp_message || s.whatsappDefaultMessage)}" target="_blank" rel="noopener" class="mt-6 inline-flex items-center justify-center gap-2 ${p.highlighted ? 'bg-accent hover:bg-accent-dark' : 'bg-brand hover:bg-brand-dark'} text-white font-bold px-6 py-3.5 rounded-xl transition-colors">${WA_SVG}${esc(p.cta_text || 'Escolher plano')}</a>
      </article>`).join('')}
    </div>
  </div>
</section>` : ''}

${stepsSection.enabled !== false && steps.length ? `
<section id="como-funciona" class="py-14 sm:py-16 md:py-24">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center mb-14 fade-up">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">${esc(stepsSection.title)}</h2>
      ${stepsSection.subtitle ? `<p class="mt-4 text-slate-600 text-base sm:text-lg">${esc(stepsSection.subtitle)}</p>` : ''}
    </div>
    <ol class="relative space-y-8 md:space-y-0 md:grid md:grid-cols-4 md:gap-6">
      ${steps.map((st, i) => `
      <li class="step-card relative flex md:flex-col gap-4 fade-up" style="--reveal-delay:${Math.min(i, 5) * 55}ms">
        <div class="flex flex-col items-center md:flex-row md:items-center">
          <span class="w-12 h-12 shrink-0 rounded-full bg-brand text-white font-extrabold flex items-center justify-center text-lg">${String(i + 1).padStart(2, '0')}</span>
          ${i < steps.length - 1 ? `<span class="hidden md:block flex-1 h-0.5 bg-slate-200 ml-3" aria-hidden="true"></span><span class="md:hidden w-0.5 flex-1 bg-slate-200 mt-2" aria-hidden="true"></span>` : ''}
        </div>
        <div class="pb-2"><h3 class="font-bold text-primary text-lg">${esc(st.title)}</h3><p class="mt-1.5 text-sm text-slate-600 leading-relaxed">${esc(st.description)}</p></div>
      </li>`).join('')}
    </ol>
  </div>
</section>` : ''}

${faqSection.enabled !== false && faqs.length ? `
<section id="faq" class="py-16 md:py-24 bg-white border-y border-slate-200">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12 fade-up">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">${esc(faqSection.title)}</h2>
      ${faqSection.subtitle ? `<p class="mt-4 text-slate-600 text-base sm:text-lg">${esc(faqSection.subtitle)}</p>` : ''}
    </div>
    <div class="space-y-3">
            ${faqs.map((f, i) => `
      <div class="faq-item bg-slate-50 border border-slate-200 rounded-xl fade-up" data-open="false" style="--reveal-delay:${Math.min(i, 5) * 45}ms">
          <button id="faq-trigger-${i}" class="faq-toggle w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold text-primary" aria-expanded="false" aria-controls="faq-panel-${i}">

          ${esc(f.question)}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="faq-chevron w-5 h-5 shrink-0 text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="faq-answer" id="faq-panel-${i}" role="region" aria-labelledby="faq-trigger-${i}" aria-hidden="true"><div><p class="px-5 pb-4 text-sm text-slate-600 leading-relaxed">${esc(f.answer)}</p></div></div>
      </div>`).join('')}
    </div>
  </div>
</section>` : ''}

${finalCta.enabled !== false ? `
<section id="cta-final" class="py-14 sm:py-16 md:py-24">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative overflow-hidden bg-primary rounded-3xl px-6 py-14 md:px-14 text-center fade-up">
      <div class="absolute inset-0 opacity-[0.08]" aria-hidden="true" style="background-image:radial-gradient(circle at 80% 20%, #10B981 0, transparent 45%),radial-gradient(circle at 15% 85%, #2563EB 0, transparent 45%)"></div>
      <h2 class="relative text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">${esc(finalCta.title)}</h2>
      <p class="relative mt-4 text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">${esc(finalCta.subtitle)}</p>
      <a href="${wa()}" target="_blank" rel="noopener" class="relative mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold px-6 sm:px-8 py-4 rounded-xl text-base sm:text-lg transition-all hover:scale-[1.02]">${WA_SVG}${esc(finalCta.ctaText)}</a>
    </div>
  </div>
</section>` : ''}
${testimonialsSection.enabled !== false && testimonials.length ? `
<section id="depoimentos" class="py-14 sm:py-16 md:py-24 bg-slate-50 border-y border-slate-200">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center mb-12 fade-up">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">${esc(testimonialsSection.title || 'O que dizem os empreendedores')}</h2>
      ${testimonialsSection.subtitle ? `<p class="mt-4 text-slate-600 text-base sm:text-lg">${esc(testimonialsSection.subtitle)}</p>` : ''}
    </div>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      ${testimonials.map((t: any, i: number) => {
        const rating = Math.max(1, Math.min(5, Number(t.rating) || 5))
        return `
      <figure class="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col fade-up" style="--reveal-delay:${Math.min(i, 5) * 55}ms">
        <div class="flex gap-1 text-amber-500" role="img" aria-label="Avaliação ${rating} de 5 estrelas">
          ${Array.from({ length: rating }).map(() => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4" aria-hidden="true">${ICONS['star']}</svg>`).join('')}
        </div>
        <blockquote class="mt-4 text-slate-700 text-sm leading-relaxed flex-1">&ldquo;${esc(t.quote)}&rdquo;</blockquote>
        <figcaption class="mt-5 pt-4 border-t border-slate-200">
          <span class="block font-bold text-primary text-sm">${esc(t.name)}</span>
          ${t.role ? `<span class="block text-xs text-slate-500 mt-0.5">${esc(t.role)}</span>` : ''}
        </figcaption>
      </figure>`
      }).join('')}
    </div>
  </div>
</section>` : ''}

${contactSection.enabled !== false ? `
<section id="contato" class="py-14 sm:py-16 md:py-24">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2 lg:items-start">
    <div class="fade-up">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">${esc(contactSection.title || 'Fale com a nossa equipe')}</h2>
      <p class="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">${esc(contactSection.subtitle || 'Conte o que o seu negócio precisa. Respondemos em até 1 dia útil e o atendimento é gratuito para empreendedores de Pedreiras e região.')}</p>
      <ul class="mt-6 space-y-3 text-sm text-slate-700">
        <li class="flex items-center gap-3">${icon('map-pin', 'w-5 h-5 text-brand')}${esc(s.city)} — ${esc(s.state)}</li>
        ${s.businessHours ? `<li class="flex items-center gap-3">${icon('clock', 'w-5 h-5 text-brand')}${esc(s.businessHours)}</li>` : ''}
        <li class="flex items-center gap-3">${WA_SVG}<a class="font-semibold text-brand hover:underline" href="${wa()}" target="_blank" rel="noopener">${esc(s.whatsappDisplay || s.phone)}</a></li>
        ${s.email ? `<li class="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-brand" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><a class="hover:underline break-all" href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : ''}
      </ul>
    </div>
    <form id="lead-form" novalidate class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card fade-up">
      <div class="grid gap-4">
        <div>
          <label for="lead-name" class="block text-sm font-semibold text-slate-700 mb-1.5">Nome <span class="text-red-600" aria-hidden="true">*</span></label>
          <input id="lead-name" name="name" type="text" required autocomplete="name" maxlength="120" class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-500" placeholder="Como podemos te chamar?">
          <p class="field-msg hidden" data-error-for="lead-name">Informe o seu nome.</p>
        </div>
        <div>
          <label for="lead-whatsapp" class="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp <span class="text-red-600" aria-hidden="true">*</span></label>
          <input id="lead-whatsapp" name="whatsapp" type="tel" required inputmode="tel" autocomplete="tel" maxlength="20" class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-500" placeholder="(99) 99999-9999">
          <p class="field-msg hidden" data-error-for="lead-whatsapp">Informe um WhatsApp com DDD.</p>
        </div>
        <div>
          <label for="lead-business" class="block text-sm font-semibold text-slate-700 mb-1.5">Negócio</label>
          <input id="lead-business" name="business" type="text" maxlength="120" class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-500" placeholder="Nome ou ramo do seu negócio">
        </div>
        <div>
          <label for="lead-message" class="block text-sm font-semibold text-slate-700 mb-1.5">Como podemos ajudar?</label>
          <textarea id="lead-message" name="message" rows="4" maxlength="1200" class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-500" placeholder="Conte rapidamente o seu desafio atual"></textarea>
        </div>
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hidden">
        <button type="submit" class="tap-target inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          <span data-submit-label>Enviar mensagem</span>
        </button>
        <p id="lead-form-status" role="status" aria-live="polite" class="text-sm font-semibold min-h-[1.25rem]"></p>
        <p class="text-xs text-slate-500 leading-relaxed">Ao enviar, você concorda com a nossa <a href="/privacidade" class="underline hover:text-brand">Política de Privacidade</a>. Usamos os seus dados apenas para responder ao contato.</p>
      </div>
    </form>
  </div>
</section>` : ''}
</main>

<footer class="bg-primary text-slate-300">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 grid gap-10 md:grid-cols-3">
    <div>
      <div class="flex items-center gap-3">
        <img src="${esc(safeImageSrc(s.logoUrl, '/static/projeto-logo-recortado.png'))}" alt="${esc(s.companyName)}" class="project-logo logo-asset h-12 w-12 object-contain shrink-0" width="48" height="48" loading="lazy" decoding="async">
        <p class="font-extrabold text-white leading-tight">${esc(s.companyName)}</p>
      </div>
      <p class="mt-4 text-sm leading-relaxed text-slate-400">${esc(footer.description)}</p>
    </div>
    <div>
      <h3 class="font-bold text-white mb-4">Contato</h3>
      <ul class="space-y-3 text-sm">
        <li><a href="${wa()}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 hover:text-white transition-colors">${WA_SVG}${esc(s.whatsappDisplay || s.phone)}</a></li>
        ${s.email ? `<li class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><a href="mailto:${esc(s.email)}" class="hover:text-white transition-colors break-all">${esc(s.email)}</a></li>` : ''}
        <li class="flex items-center gap-2">${icon('map-pin', 'w-5 h-5')}${esc(s.city)} — ${esc(s.state)}</li>
        ${s.businessHours ? `<li class="flex items-center gap-2">${icon('clock', 'w-5 h-5')}${esc(s.businessHours)}</li>` : ''}
      </ul>
      ${(s.instagram || s.facebook || s.tiktok) ? `<div class="mt-4 flex gap-3">
        ${s.instagram ? `<a href="${esc(s.instagram)}" target="_blank" rel="noopener" aria-label="Instagram" class="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>` : ''}
        ${s.facebook ? `<a href="${esc(s.facebook)}" target="_blank" rel="noopener" aria-label="Facebook" class="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>` : ''}
        ${s.tiktok ? `<a href="${esc(s.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok" class="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg></a>` : ''}
      </div>` : ''}
    </div>
    <div>
      <h3 class="font-bold text-white mb-4">Institucional</h3>
      <p class="text-xs text-slate-400 leading-relaxed">${esc(footer.institutionalNote)}</p>
      <div class="mt-4 max-w-sm">
        <img src="${esc(safeImageSrc(s.institutionLogoUrl, '/static/uema-logo-recortado.png'))}" alt="Logotipo da UEMA — Universidade Estadual do Maranhão" class="institution-logo logo-asset w-full" loading="lazy" decoding="async">
      </div>
    </div>
  </div>
  <div class="border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 text-center sm:text-left">
      <p>© ${new Date().getFullYear()} ${esc(s.copyright)}</p>
      <nav aria-label="Links institucionais" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <a href="/termos" class="hover:text-white transition-colors">Termos de uso</a>
        <a href="/privacidade" class="hover:text-white transition-colors">Política de privacidade</a>
        <a href="#contato" class="hover:text-white transition-colors">Contato</a>
      </nav>
      <p>Pedreiras — Maranhão</p>
    </div>
  </div>
</footer>

${widget.floatingEnabled ? `
<a href="${wa()}" target="_blank" rel="noopener" aria-label="${esc(widget.floatingTooltip || 'Falar no WhatsApp')}" title="${esc(widget.floatingTooltip || 'Falar no WhatsApp')}"
   class="wa-float fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 bg-accent hover:bg-accent-dark text-white rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110">
  <svg viewBox="0 0 32 32" fill="currentColor" class="w-8 h-8" aria-hidden="true"><path d="M16.004 3C9.383 3 4 8.383 4 15.004c0 2.646.868 5.096 2.338 7.09L4.06 28.062l6.14-2.23a11.94 11.94 0 0 0 5.804 1.494C22.625 27.326 28 21.943 28 15.322 28 8.7 22.625 3 16.004 3zm0 21.994a9.94 9.94 0 0 1-5.07-1.387l-.363-.216-3.644 1.324 1.288-3.553-.237-.373a9.93 9.93 0 0 1-1.552-5.348c0-5.49 4.468-9.958 9.958-9.958 5.49 0 9.957 4.468 9.957 9.958 0 5.49-4.467 9.553-9.937 9.553zm5.462-7.44c-.3-.15-1.77-.874-2.045-.974-.274-.1-.474-.15-.673.15-.2.3-.774.973-.948 1.173-.175.2-.35.225-.65.075-.3-.15-1.264-.466-2.408-1.485-.89-.794-1.49-1.774-1.665-2.074-.174-.3-.018-.462.132-.612.135-.134.3-.35.45-.524.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.673-1.622-.923-2.222-.243-.583-.49-.504-.673-.513l-.573-.01c-.2 0-.524.075-.798.375-.275.3-1.048 1.024-1.048 2.497 0 1.473 1.072 2.895 1.222 3.095.15.2 2.11 3.222 5.112 4.517.714.308 1.272.492 1.706.63.717.228 1.37.196 1.886.119.575-.086 1.77-.724 2.02-1.423.25-.7.25-1.298.175-1.423-.075-.125-.275-.2-.575-.35z"/></svg>
</a>` : ''}

${widget.mobileBarEnabled ? `
<div id="mobile-bar" class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 p-3">
  <a href="${wa()}" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-xl">${WA_SVG}${esc(widget.mobileBarText || 'Falar no WhatsApp')}</a>
</div>` : ''}

<script>
(function(){
  // Tema claro/escuro
  function syncThemeButtons(){
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function(b){
      b.setAttribute('aria-pressed', String(dark));
      b.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
      b.setAttribute('title', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    });
  }
  function setTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#0b1220' : '#f8fafc');
    try{localStorage.setItem('site-theme', theme)}catch(_){ }
    syncThemeButtons();
    syncThemeChoices();
  }
  syncThemeButtons();
  document.querySelectorAll('[data-theme-toggle]').forEach(function(b){
    b.addEventListener('click', function(){
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  });
  document.querySelectorAll('[data-theme-choice]').forEach(function(b){
    b.addEventListener('click', function(){ setTheme(b.getAttribute('data-theme-choice') === 'dark' ? 'dark' : 'light'); });
  });
  function syncThemeChoices(){
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('[data-theme-choice]').forEach(function(b){ b.setAttribute('aria-pressed', String((b.getAttribute('data-theme-choice') === 'dark') === dark)); });
  }
  syncThemeChoices();
  // Progresso de leitura
  var progress = document.getElementById('scroll-progress');
  if (progress) {
    function syncProgress(){
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    }
    window.addEventListener('scroll', syncProgress, {passive:true});
    window.addEventListener('resize', syncProgress, {passive:true});
    syncProgress();
  }
  // Menu mobile e estado do cabeçalho
  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('mobile-menu');
  var header = document.getElementById('site-header');
  function setMenu(open){
    if (!btn || !menu) return;
    menu.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  if (header) {
    function syncHeader(){ header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', syncHeader, {passive:true});
    syncHeader();
  }
  if (btn && menu) {
    btn.addEventListener('click', function(e){ e.stopPropagation(); setMenu(menu.classList.contains('hidden')); });
    menu.querySelectorAll('.mobile-link, a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
    document.addEventListener('click', function(e){
      if (!menu.classList.contains('hidden') && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) { setMenu(false); btn.focus(); }
    });
    window.addEventListener('resize', function(){ if (window.innerWidth >= 1280) setMenu(false); }, {passive:true});
  }
  // Realce discreto do item de navegação correspondente à seção visível
  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.nav-link').forEach(function(link){ link.setAttribute('aria-current', link.dataset.navTarget === '#' + entry.target.id ? 'true' : 'false'); });
      });
    }, {rootMargin:'-22% 0px -68% 0px', threshold:0});
    document.querySelectorAll('main section[id]').forEach(function(section){ navObserver.observe(section); });
  }
  // FAQ accordion
  document.querySelectorAll('.faq-toggle').forEach(function(t){
    t.addEventListener('click', function(){
      var item = t.closest('.faq-item');
      var open = item.getAttribute('data-open') === 'true';
      var nextOpen = !open;
      item.setAttribute('data-open', String(nextOpen));
      t.setAttribute('aria-expanded', String(nextOpen));
      var panel = item.querySelector('.faq-answer');
      if (panel) panel.setAttribute('aria-hidden', String(!nextOpen));
    });
  });
  // Animação fade-up
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.fade-up').forEach(function(el){ el.classList.add('visible'); });
  }
})();

  // ---- Formulário de contato: validação acessível + envio sem recarregar a página.
  var leadForm = document.getElementById('lead-form');
  if (leadForm) {
    var statusEl = document.getElementById('lead-form-status');
    var submitBtn = leadForm.querySelector('button[type="submit"]');
    var labelEl = leadForm.querySelector('[data-submit-label]');

    function setFieldError(input, show) {
      var msg = leadForm.querySelector('[data-error-for="' + input.id + '"]');
      input.classList.toggle('field-invalid', show);
      input.setAttribute('aria-invalid', String(show));
      if (msg) msg.classList.toggle('hidden', !show);
    }

    function validateLead() {
      var ok = true;
      var name = leadForm.querySelector('#lead-name');
      var phone = leadForm.querySelector('#lead-whatsapp');
      var nameOk = name.value.trim().length >= 2;
      setFieldError(name, !nameOk);
      if (!nameOk) ok = false;
      var digits = phone.value.replace(/\D/g, '');
      var phoneOk = digits.length >= 10 && digits.length <= 13;
      setFieldError(phone, !phoneOk);
      if (!phoneOk) ok = false;
      if (!ok) (nameOk ? phone : name).focus();
      return ok;
    }

    leadForm.querySelectorAll('#lead-name, #lead-whatsapp').forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value.trim()) validateLead(); });
    });

    leadForm.addEventListener('submit', function (event) {
      event.preventDefault();
      statusEl.className = 'text-sm font-semibold min-h-[1.25rem]';
      statusEl.textContent = '';
      if (!validateLead()) {
        statusEl.textContent = 'Revise os campos destacados antes de enviar.';
        statusEl.classList.add('text-red-600');
        return;
      }
      var payload = {
        name: leadForm.querySelector('#lead-name').value.trim(),
        whatsapp: leadForm.querySelector('#lead-whatsapp').value.trim(),
        business: leadForm.querySelector('#lead-business').value.trim(),
        message: leadForm.querySelector('#lead-message').value.trim(),
        website: leadForm.querySelector('[name="website"]').value
      };
      submitBtn.disabled = true;
      labelEl.textContent = 'Enviando...';
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, data: data }; });
      }).then(function (res) {
        if (!res.ok) throw new Error((res.data && res.data.error) || 'Falha no envio');
        leadForm.reset();
        statusEl.textContent = 'Mensagem enviada! Entraremos em contato pelo WhatsApp informado.';
        statusEl.classList.add('text-emerald-700');
      }).catch(function (err) {
        statusEl.textContent = 'Não foi possível enviar agora. Tente novamente ou fale direto pelo WhatsApp.';
        statusEl.classList.add('text-red-600');
        console.error(err);
      }).finally(function () {
        submitBtn.disabled = false;
        labelEl.textContent = 'Enviar mensagem';
      });
    });
  }
</script>
</body>
</html>`
}
