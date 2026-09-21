import { Hono } from 'hono'
import type { Bindings } from './auth'
import { getSessionUser } from './auth'
import { publicApi, authApi, adminApi } from './api'
import { renderSite } from './site'
import { renderAdminShell, renderLoginPage } from './admin'
import { renderTermsPage, renderPrivacyPage, renderNotFoundPage } from './pages'

type Env = { Bindings: Bindings; Variables: { user: { id: number; email: string; name: string } } }

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T }
  catch { return fallback }
}

const app = new Hono<Env>()

/**
 * Cabeçalhos de segurança aplicados a todas as respostas.
 * A CSP permite scripts/estilos inline porque o SSR entrega o comportamento
 * da página embutido no HTML; as demais diretivas fecham o restante.
 */
app.use('*', async (c, next) => {
  await next()
  const h = c.res.headers
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('X-Frame-Options', 'SAMEORIGIN')
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  h.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()')
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  h.set('Cross-Origin-Opener-Policy', 'same-origin')
  if ((h.get('Content-Type') || '').includes('text/html')) {
    h.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https:",
      "connect-src 'self' https://www.google-analytics.com https://connect.facebook.net",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; '))
  }
})

// APIs
app.route('/api', publicApi)
app.route('/api/auth', authApi)
app.route('/api/admin', adminApi)

// Painel administrativo (sempre fora dos índices de busca)
app.use('/admin/*', async (c, next) => {
  await next()
  c.res.headers.set('X-Robots-Tag', 'noindex, nofollow')
})

app.get('/admin/login', async (c) => {
  const user = await getSessionUser(c)
  if (user) return c.redirect('/admin')
  return c.html(renderLoginPage())
})

app.get('/admin', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.redirect('/admin/login')
  return c.html(renderAdminShell(user))
})

app.get('/admin/*', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.redirect('/admin/login')
  return c.html(renderAdminShell(user))
})

/** Carrega todo o conteúdo editável do banco em um único objeto. */
async function loadContent(db: D1Database): Promise<Record<string, unknown>> {
  const rows = await db.prepare('SELECT key, value FROM content').all<{ key: string; value: string }>()
  const content: Record<string, unknown> = {}
  for (const r of rows.results) content[r.key] = parseJson(r.value, {})

  const [plans, services, faqs, steps, problems, testimonials] = await Promise.all([
    db.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT * FROM faqs WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT * FROM steps WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT * FROM problem_cards WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT * FROM testimonials WHERE active = 1 ORDER BY sort_order').all().catch(() => ({ results: [] as any[] }))
  ])
  content.plans = plans.results.map((p: any) => ({ ...p, features: parseJson(p.features || '[]', []) }))
  content.services = services.results
  content.faqs = faqs.results
  content.steps = steps.results
  content.problemCards = problems.results
  content.testimonials = testimonials.results
  return content
}

/** Lê apenas as configurações gerais (usado nas páginas institucionais e no 404). */
async function loadSettings(db: D1Database): Promise<Record<string, string>> {
  const row = await db.prepare("SELECT value FROM content WHERE key = 'settings'").first<{ value: string }>()
  return row ? parseJson<Record<string, string>>(row.value, {}) : {}
}

// Site público (SSR a partir do banco)
app.get('/', async (c) => {
  const url = new URL(c.req.url)
  const content = await loadContent(c.env.DB)
  return c.html(renderSite(content, { origin: url.origin, path: '/' }))
})

// Páginas institucionais
app.get('/termos', async (c) => {
  const url = new URL(c.req.url)
  return c.html(renderTermsPage(await loadSettings(c.env.DB), `${url.origin}/termos`))
})

app.get('/privacidade', async (c) => {
  const url = new URL(c.req.url)
  return c.html(renderPrivacyPage(await loadSettings(c.env.DB), `${url.origin}/privacidade`))
})

// robots.txt e sitemap.xml gerados a partir do domínio real da requisição
app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin
  return c.text(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api/',
      '',
      `Sitemap: ${origin}/sitemap.xml`,
      ''
    ].join('\n'),
    200,
    { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' }
  )
})

app.get('/sitemap.xml', (c) => {
  const origin = new URL(c.req.url).origin
  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    { loc: `${origin}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${origin}/termos`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${origin}/privacidade`, priority: '0.3', changefreq: 'yearly' }
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
})

// Página 404 personalizada
app.notFound(async (c) => {
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'Endpoint não encontrado' }, 404)
  let settings: Record<string, string> = {}
  try { settings = await loadSettings(c.env.DB) } catch { /* banco indisponível: usa os padrões */ }
  return c.html(renderNotFoundPage(settings), 404)
})

export default app
