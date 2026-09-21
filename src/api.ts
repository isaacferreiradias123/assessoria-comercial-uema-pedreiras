// API administrativa (protegida) + API pública de conteúdo
import { Hono } from 'hono'
import type { Bindings } from './auth'
import { requireAuth, verifyPassword, createSession, setSessionCookie, destroySession, getSessionUser, clientKey, isRateLimited, recordAttempt, clearAttempts } from './auth'

type Env = { Bindings: Bindings; Variables: { user: { id: number; email: string; name: string } } }

// ---------- Helpers ----------
const LIST_TABLES = ['plans', 'services', 'faqs', 'steps', 'problem_cards', 'testimonials'] as const
type ListTable = typeof LIST_TABLES[number]

const CONTENT_KEYS = ['settings', 'topbar', 'navbar', 'hero', 'problems', 'authority', 'servicesSection', 'plansSection', 'stepsSection', 'faqSection', 'finalCta', 'footer', 'seo', 'analytics', 'whatsappWidget', 'testimonialsSection', 'contactSection']

function sanitize(v: unknown): unknown {
  if (typeof v === 'string') {
    return v.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  }
  if (Array.isArray(v)) return v.map(sanitize)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v)) out[k] = sanitize(val)
    return out
  }
  return v
}

async function logAudit(db: D1Database, email: string, action: string, entity: string, detail: string) {
  await db.prepare('INSERT INTO audit_logs (user_email, action, entity, detail) VALUES (?, ?, ?, ?)')
    .bind(email, action, entity, detail.slice(0, 500)).run()
}

// ---------- API pública ----------
export const publicApi = new Hono<Env>()

publicApi.get('/content', async (c) => {
  const db = c.env.DB
  const rows = await db.prepare('SELECT key, value FROM content').all<{ key: string; value: string }>()
  const content: Record<string, unknown> = {}
  for (const r of rows.results) {
    try { content[r.key] = JSON.parse(r.value) }
    catch { content[r.key] = {} }
  }

  const [plans, services, faqs, steps, problems, testimonials] = await Promise.all([
    db.prepare('SELECT id, name, price, promo_price, billing_type, description, badge, highlighted, features, cta_text, whatsapp_message, note FROM plans WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT id, name, description, icon, price, highlighted FROM services WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT id, question, answer FROM faqs WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT id, title, description FROM steps WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT id, title, description, icon FROM problem_cards WHERE active = 1 ORDER BY sort_order').all(),
    db.prepare('SELECT id, name, role, quote, rating FROM testimonials WHERE active = 1 ORDER BY sort_order').all()
  ])
  content.plans = plans.results.map((p: any) => ({ ...p, features: JSON.parse(p.features || '[]') }))
  content.services = services.results
  content.faqs = faqs.results
  content.steps = steps.results
  content.problemCards = problems.results
  content.testimonials = testimonials.results
  return c.json(content)
})

// Servir imagens da biblioteca de mídia
publicApi.get('/media/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT mime_type, data, url FROM media WHERE id = ?').bind(id).first<{ mime_type: string; data: string | null; url: string | null }>()
  if (!row) return c.notFound()
  if (row.data) {
    const bin = Uint8Array.from(atob(row.data), ch => ch.charCodeAt(0))
    return new Response(bin, {
      headers: {
        'Content-Type': row.mime_type,
        // Imagens da biblioteca são versionadas por id: cache longo no navegador e na CDN.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  }
  if (row.url) {
    c.header('Cache-Control', 'public, max-age=86400')
    return c.redirect(row.url, 302)
  }
  return c.notFound()
})

// Recebe mensagens do formulário de contato do site público.
// Protegido por honeypot + limite por IP para evitar spam automatizado.
publicApi.post('/leads', async (c) => {
  let body: { name?: string; whatsapp?: string; business?: string; interest?: string; message?: string; website?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Dados inválidos' }, 400) }

  // Honeypot: bots preenchem o campo oculto; respondemos ok sem gravar nada.
  if (body.website) return c.json({ ok: true })

  const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
  const name = clean(body.name, 120)
  const whatsapp = clean(body.whatsapp, 20)
  const digits = whatsapp.replace(/\D/g, '')

  if (name.length < 2) return c.json({ error: 'Informe o seu nome.' }, 400)
  if (digits.length < 10 || digits.length > 13) return c.json({ error: 'Informe um WhatsApp válido com DDD.' }, 400)

  const key = 'lead:' + clientKey(c)
  if (await isRateLimited(c.env.DB, key, 5, 10 * 60_000)) {
    return c.json({ error: 'Muitas mensagens enviadas. Tente novamente em alguns minutos.' }, 429)
  }
  await recordAttempt(c.env.DB, key)

  await c.env.DB.prepare('INSERT INTO leads (name, whatsapp, business, interest, message, source) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(name, digits, clean(body.business, 120) || null, clean(body.interest, 80) || null, clean(body.message, 1200) || null, 'formulario-site')
    .run()

  return c.json({ ok: true })
})

// ---------- Auth ----------
export const authApi = new Hono<Env>()

authApi.post('/login', async (c) => {
  let body: { email?: string; password?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Dados inválidos' }, 400) }
  const email = (body.email || '').trim().toLowerCase()
  const password = body.password || ''
  if (!email || !password) return c.json({ error: 'Informe e-mail e senha' }, 400)

  // Limite de 5 tentativas por IP a cada 15 minutos (proteção contra força bruta).
  const key = 'login:' + clientKey(c)
  if (await isRateLimited(c.env.DB, key, 5, 15 * 60_000)) {
    await logAudit(c.env.DB, email, 'login_blocked', 'auth', 'Tentativas de login bloqueadas por limite de taxa')
    return c.json({ error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }, 429)
  }

  const user = await c.env.DB.prepare('SELECT id, email, name, password_hash FROM admin_users WHERE lower(email) = ?')
    .bind(email).first<{ id: number; email: string; name: string; password_hash: string }>()
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    await recordAttempt(c.env.DB, key)
    await logAudit(c.env.DB, email, 'login_failed', 'auth', 'Tentativa de login malsucedida')
    return c.json({ error: 'E-mail ou senha incorretos' }, 401)
  }
  await clearAttempts(c.env.DB, key)
  const token = await createSession(c.env.DB, user.id)
  setSessionCookie(c, token)
  await logAudit(c.env.DB, user.email, 'login', 'auth', 'Login realizado')
  return c.json({ ok: true, user: { email: user.email, name: user.name } })
})

authApi.post('/logout', async (c) => {
  await destroySession(c)
  return c.json({ ok: true })
})

authApi.get('/me', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ user: null }, 401)
  return c.json({ user: { email: user.email, name: user.name } })
})

// ---------- API admin (protegida) ----------
export const adminApi = new Hono<Env>()
adminApi.use('*', requireAuth)

// Conteúdo (seções JSON)
adminApi.get('/content/:key', async (c) => {
  const key = c.req.param('key')
  if (!CONTENT_KEYS.includes(key)) return c.json({ error: 'Chave inválida' }, 400)
  const row = await c.env.DB.prepare('SELECT value, updated_at FROM content WHERE key = ?').bind(key).first<{ value: string; updated_at: string }>()
  if (!row) return c.json({ error: 'Não encontrado' }, 404)
  return c.json({ key, value: JSON.parse(row.value), updatedAt: row.updated_at })
})

adminApi.put('/content/:key', async (c) => {
  const key = c.req.param('key')
  if (!CONTENT_KEYS.includes(key)) return c.json({ error: 'Chave inválida' }, 400)
  let value: unknown
  try { value = await c.req.json() } catch { return c.json({ error: 'JSON inválido' }, 400) }
  value = sanitize(value)

  // Validações específicas
  if (key === 'settings') {
    const v = value as Record<string, string>
    if (v.whatsapp && !/^\d{10,15}$/.test(v.whatsapp.replace(/\D/g, ''))) {
      return c.json({ error: 'WhatsApp inválido. Use apenas números com DDD (ex: 5599981687603).' }, 400)
    }
    if (v.whatsapp) v.whatsapp = v.whatsapp.replace(/\D/g, '')
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
      return c.json({ error: 'E-mail inválido.' }, 400)
    }
    for (const field of ['instagram', 'facebook', 'tiktok'] as const) {
      if (v[field] && !/^https?:\/\/[^\s<]+$/i.test(v[field])) return c.json({ error: `URL inválida em ${field}. Comece com https://` }, 400)
    }
  }
  if (key === 'navbar') {
    const links = (value as any)?.links
    if (links !== undefined && (!Array.isArray(links) || links.some((l: any) => l && l.href && !(/^#[a-z0-9_-]+$/i.test(String(l.href).trim()) || /^https?:\/\/[^\s<]+$/i.test(String(l.href).trim()))))) {
      return c.json({ error: 'Há um destino de navegação inválido. Use uma âncora (#secao) ou uma URL https://.' }, 400)
    }
  }
  if (key === 'seo') {
    const v = value as any
    if (v.canonical && !/^https?:\/\/[^\s<]+$/i.test(String(v.canonical).trim())) return c.json({ error: 'URL canônica inválida. Comece com https://' }, 400)
    if (v.ogImage && !/^(https?:\/\/|\/)[^\s<]+$/i.test(String(v.ogImage).trim())) return c.json({ error: 'Imagem social inválida.' }, 400)
  }

  await c.env.DB.prepare('INSERT INTO content (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP')
    .bind(key, JSON.stringify(value)).run()
  await logAudit(c.env.DB, c.get('user').email, 'update', `content:${key}`, `Seção "${key}" atualizada`)
  return c.json({ ok: true })
})

// CRUD genérico para tabelas de lista
const TABLE_FIELDS: Record<ListTable, string[]> = {
  plans: ['name', 'price', 'promo_price', 'billing_type', 'description', 'badge', 'highlighted', 'features', 'cta_text', 'whatsapp_message', 'note', 'sort_order', 'active'],
  services: ['name', 'description', 'icon', 'price', 'highlighted', 'sort_order', 'active'],
  faqs: ['question', 'answer', 'sort_order', 'active'],
  steps: ['title', 'description', 'sort_order', 'active'],
  problem_cards: ['title', 'description', 'icon', 'sort_order', 'active'],
  testimonials: ['name', 'role', 'quote', 'rating', 'sort_order', 'active']
}

const TABLE_LABEL: Record<ListTable, string> = {
  plans: 'Plano', services: 'Serviço', faqs: 'FAQ', steps: 'Etapa', problem_cards: 'Card de problema', testimonials: 'Depoimento'
}

function tableParam(c: any): ListTable | null {
  const t = c.req.param('table')
  return (LIST_TABLES as readonly string[]).includes(t) ? t as ListTable : null
}

adminApi.get('/items/:table', async (c) => {
  const table = tableParam(c)
  if (!table) return c.json({ error: 'Tabela inválida' }, 400)
  const rows = await c.env.DB.prepare(`SELECT * FROM ${table} ORDER BY sort_order, id`).all()
  const results = rows.results.map((r: any) => table === 'plans' ? { ...r, features: JSON.parse(r.features || '[]') } : r)
  return c.json({ items: results })
})

adminApi.post('/items/:table', async (c) => {
  const table = tableParam(c)
  if (!table) return c.json({ error: 'Tabela inválida' }, 400)
  let body: Record<string, unknown>
  try { body = sanitize(await c.req.json()) as Record<string, unknown> } catch { return c.json({ error: 'JSON inválido' }, 400) }

  const err = validateItem(table, body)
  if (err) return c.json({ error: err }, 400)

  const fields = TABLE_FIELDS[table].filter(f => body[f] !== undefined)
  if (!fields.length) return c.json({ error: 'Nenhum campo informado' }, 400)
  const values = fields.map(f => normalizeField(f, body[f]))
  const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`
  const res = await c.env.DB.prepare(sql).bind(...values).run()
  await logAudit(c.env.DB, c.get('user').email, 'create', table, `${TABLE_LABEL[table]} criado: ${body.name || body.question || body.title || ''}`)
  return c.json({ ok: true, id: res.meta.last_row_id })
})

adminApi.put('/items/:table/:id', async (c) => {
  const table = tableParam(c)
  if (!table) return c.json({ error: 'Tabela inválida' }, 400)
  const id = Number(c.req.param('id'))
  let body: Record<string, unknown>
  try { body = sanitize(await c.req.json()) as Record<string, unknown> } catch { return c.json({ error: 'JSON inválido' }, 400) }

  const err = validateItem(table, body, true)
  if (err) return c.json({ error: err }, 400)

  const old = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<any>()
  if (!old) return c.json({ error: 'Item não encontrado' }, 404)

  const fields = TABLE_FIELDS[table].filter(f => body[f] !== undefined)
  if (!fields.length) return c.json({ error: 'Nenhum campo informado' }, 400)
  const values = fields.map(f => normalizeField(f, body[f]))
  const sql = `UPDATE ${table} SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  await c.env.DB.prepare(sql).bind(...values, id).run()

  // detalhe de auditoria com valor anterior/novo (ex.: preço)
  const changes: string[] = []
  for (const f of fields) {
    const oldV = f === 'features' ? old[f] : String(old[f] ?? '')
    const newV = f === 'features' ? JSON.stringify(body[f]) : String(body[f] ?? '')
    if (oldV !== newV && ['price', 'name', 'question', 'title'].includes(f)) {
      changes.push(`${f}: "${oldV}" → "${newV}"`)
    }
  }
  await logAudit(c.env.DB, c.get('user').email, 'update', table, `${TABLE_LABEL[table]} #${id} atualizado${changes.length ? ' — ' + changes.join('; ') : ''}`)
  return c.json({ ok: true })
})

adminApi.delete('/items/:table/:id', async (c) => {
  const table = tableParam(c)
  if (!table) return c.json({ error: 'Tabela inválida' }, 400)
  const id = Number(c.req.param('id'))
  const old = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<any>()
  if (!old) return c.json({ error: 'Item não encontrado' }, 404)
  await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run()
  await logAudit(c.env.DB, c.get('user').email, 'delete', table, `${TABLE_LABEL[table]} excluído: ${old.name || old.question || old.title || '#' + id}`)
  return c.json({ ok: true })
})

adminApi.post('/items/:table/:id/duplicate', async (c) => {
  const table = tableParam(c)
  if (!table) return c.json({ error: 'Tabela inválida' }, 400)
  const id = Number(c.req.param('id'))
  const old = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<any>()
  if (!old) return c.json({ error: 'Item não encontrado' }, 404)
  const fields = TABLE_FIELDS[table]
  const values = fields.map(f => {
    if (f === 'name' || f === 'title' || f === 'question') return `${old[f]} (cópia)`
    if (f === 'sort_order') return (old[f] ?? 0) + 1
    return old[f]
  })
  const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`
  const res = await c.env.DB.prepare(sql).bind(...values).run()
  await logAudit(c.env.DB, c.get('user').email, 'create', table, `${TABLE_LABEL[table]} duplicado a partir de #${id}`)
  return c.json({ ok: true, id: res.meta.last_row_id })
})

adminApi.post('/items/:table/reorder', async (c) => {
  const table = tableParam(c)
  if (!table) return c.json({ error: 'Tabela inválida' }, 400)
  let body: { ids?: number[] }
  try { body = await c.req.json() } catch { return c.json({ error: 'JSON inválido' }, 400) }
  if (!Array.isArray(body.ids) || !body.ids.length) return c.json({ error: 'ids deve ser um array não vazio' }, 400)
  const ids = body.ids.map(Number)
  if (ids.some(id => !Number.isInteger(id) || id < 1) || new Set(ids).size !== ids.length) return c.json({ error: 'ids inválidos ou duplicados' }, 400)
  const current = await c.env.DB.prepare(`SELECT id FROM ${table} ORDER BY id`).all<{ id: number }>()
  const expected = current.results.map(row => row.id).sort((a, b) => a - b)
  const received = [...ids].sort((a, b) => a - b)
  if (expected.length !== received.length || expected.some((id, i) => id !== received[i])) return c.json({ error: 'A lista de ids não corresponde aos itens existentes.' }, 400)
  const stmts = ids.map((id, i) =>
    c.env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(i + 1, id)
  )
  await c.env.DB.batch(stmts)
  await logAudit(c.env.DB, c.get('user').email, 'reorder', table, `Itens reordenados`)
  return c.json({ ok: true })
})

function normalizeField(field: string, value: unknown): unknown {
  if (field === 'features') return JSON.stringify(Array.isArray(value) ? value : [])
  if (field === 'highlighted' || field === 'active') return value ? 1 : 0
  if (field === 'sort_order') return Number(value) || 0
  if (field === 'rating') return Math.max(1, Math.min(5, Number(value) || 5))
  if (value === null || value === undefined) return null
  return String(value)
}

function validateItem(table: ListTable, body: Record<string, unknown>, partial = false): string | null {
  const req = (f: string, label: string) => {
    if (!partial && (body[f] === undefined || String(body[f]).trim() === '')) return `Campo obrigatório: ${label}`
    if (partial && body[f] !== undefined && String(body[f]).trim() === '') return `Campo obrigatório: ${label}`
    return null
  }
  if (table === 'plans') {
    const e = req('name', 'nome') || req('price', 'preço')
    if (e) return e
    if (body.price !== undefined && !/^\d+([.,]\d{1,2})?$/.test(String(body.price).trim())) return 'Preço inválido. Use apenas números, ex: 180 ou 180,00.'
    if (body.promo_price !== undefined && body.promo_price !== null && String(body.promo_price).trim() !== '' && !/^\d+([.,]\d{1,2})?$/.test(String(body.promo_price).trim())) return 'Preço promocional inválido.'
  }
  if (table === 'services') { const e = req('name', 'nome'); if (e) return e }
  if (table === 'faqs') { const e = req('question', 'pergunta') || req('answer', 'resposta'); if (e) return e }
  if (table === 'steps') { const e = req('title', 'título'); if (e) return e }
  if (table === 'problem_cards') { const e = req('title', 'título'); if (e) return e }
  if (table === 'testimonials') {
    const e = req('name', 'nome') || req('quote', 'depoimento')
    if (e) return e
    if (body.rating !== undefined && !(Number(body.rating) >= 1 && Number(body.rating) <= 5)) return 'Avaliação deve ser um número de 1 a 5.'
  }
  return null
}

// Leads recebidos pelo formulário de contato
const LEAD_STATUSES = ['novo', 'em-contato', 'convertido', 'descartado'] as const

adminApi.get('/leads', async (c) => {
  const status = c.req.query('status')
  const filtered = !!status && (LEAD_STATUSES as readonly string[]).includes(status)
  const stmt = filtered
    ? c.env.DB.prepare('SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC LIMIT 200').bind(status)
    : c.env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 200')
  const rows = await stmt.all()
  return c.json({ items: rows.results })
})

adminApi.put('/leads/:id', async (c) => {
  const id = Number(c.req.param('id'))
  let body: { status?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'JSON inválido' }, 400) }
  if (!body.status || !(LEAD_STATUSES as readonly string[]).includes(body.status)) {
    return c.json({ error: 'Status inválido.' }, 400)
  }
  const res = await c.env.DB.prepare('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(body.status, id).run()
  if (!res.meta.changes) return c.json({ error: 'Lead não encontrado' }, 404)
  await logAudit(c.env.DB, c.get('user').email, 'update', 'leads', `Lead #${id} marcado como "${body.status}"`)
  return c.json({ ok: true })
})

adminApi.delete('/leads/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const res = await c.env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run()
  if (!res.meta.changes) return c.json({ error: 'Lead não encontrado' }, 404)
  await logAudit(c.env.DB, c.get('user').email, 'delete', 'leads', `Lead #${id} excluído`)
  return c.json({ ok: true })
})

// Mídia
adminApi.get('/media', async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, filename, mime_type, url, alt_text, title, source, size_bytes, created_at FROM media ORDER BY id DESC').all()
  return c.json({ items: rows.results })
})

adminApi.post('/media', async (c) => {
  let body: { filename?: string; mimeType?: string; data?: string; altText?: string; title?: string; source?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'JSON inválido' }, 400) }
  if (!body.filename || !body.mimeType || !body.data) return c.json({ error: 'Arquivo inválido' }, 400)
  if (!/^image\/(png|jpe?g|webp|gif|svg\+xml|avif)$/.test(body.mimeType)) return c.json({ error: 'Formato não suportado. Use PNG, JPG, WebP, GIF, SVG ou AVIF.' }, 400)
  const base64 = body.data.includes(',') ? body.data.split(',').pop() || '' : body.data
  const normalized = base64.replace(/\s/g, '')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) return c.json({ error: 'Dados de imagem inválidos.' }, 400)
  const sizeBytes = Math.floor(normalized.length * 0.75)
  if (sizeBytes > 2 * 1024 * 1024) return c.json({ error: 'Imagem muito grande. Máximo: 2 MB.' }, 400)
  const res = await c.env.DB.prepare('INSERT INTO media (filename, mime_type, data, alt_text, title, source, size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(body.filename, body.mimeType, normalized, body.altText || '', body.title || '', body.source || '', sizeBytes).run()
  await logAudit(c.env.DB, c.get('user').email, 'create', 'media', `Imagem enviada: ${body.filename}`)
  return c.json({ ok: true, id: res.meta.last_row_id, url: `/api/media/${res.meta.last_row_id}` })
})

adminApi.put('/media/:id/replace', async (c) => {
  const id = Number(c.req.param('id'))
  let body: { filename?: string; mimeType?: string; data?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'JSON inválido' }, 400) }
  if (!body.filename || !body.mimeType || !body.data) return c.json({ error: 'Arquivo inválido' }, 400)
  if (!/^image\/(png|jpe?g|webp|gif|svg\+xml|avif)$/.test(body.mimeType)) return c.json({ error: 'Formato não suportado. Use PNG, JPG, WebP, GIF ou SVG.' }, 400)
  const base64 = body.data.includes(',') ? body.data.split(',').pop() || '' : body.data
  const normalized = base64.replace(/\s/g, '')
  const sizeBytes = Math.floor(normalized.length * 0.75)
  if (sizeBytes > 2 * 1024 * 1024) return c.json({ error: 'Imagem muito grande. Máximo: 2 MB.' }, 400)
  const old = await c.env.DB.prepare('SELECT id, filename FROM media WHERE id = ?').bind(id).first<{ id: number; filename: string }>()
  if (!old) return c.json({ error: 'Imagem não encontrada' }, 404)
  await c.env.DB.prepare('UPDATE media SET filename = ?, mime_type = ?, data = ?, url = NULL, size_bytes = ? WHERE id = ?')
    .bind(body.filename, body.mimeType, normalized, sizeBytes, id).run()
  await logAudit(c.env.DB, c.get('user').email, 'update', 'media', `Arquivo substituído: ${old.filename} → ${body.filename}`)
  return c.json({ ok: true, id, url: `/api/media/${id}` })
})

adminApi.put('/media/:id', async (c) => {
  const id = Number(c.req.param('id'))
  let body: { altText?: string; title?: string; source?: string }
  try { body = sanitize(await c.req.json()) as any } catch { return c.json({ error: 'JSON inválido' }, 400) }
  const old = await c.env.DB.prepare('SELECT id FROM media WHERE id = ?').bind(id).first<{ id: number }>()
  if (!old) return c.json({ error: 'Imagem não encontrada' }, 404)
  await c.env.DB.prepare('UPDATE media SET alt_text = COALESCE(?, alt_text), title = COALESCE(?, title), source = COALESCE(?, source) WHERE id = ?')
    .bind(body.altText ?? null, body.title ?? null, body.source ?? null, id).run()
  await logAudit(c.env.DB, c.get('user').email, 'update', 'media', `Metadados da imagem #${id} atualizados`)
  return c.json({ ok: true })
})

adminApi.delete('/media/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const old = await c.env.DB.prepare('SELECT filename FROM media WHERE id = ?').bind(id).first<{ filename: string }>()
  if (!old) return c.json({ error: 'Imagem não encontrada' }, 404)
  await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user').email, 'delete', 'media', `Imagem excluída: ${old.filename}`)
  return c.json({ ok: true })
})

// Histórico
adminApi.get('/audit', async (c) => {
  const rows = await c.env.DB.prepare('SELECT user_email, action, entity, detail, created_at FROM audit_logs ORDER BY id DESC LIMIT 100').all()
  return c.json({ items: rows.results })
})

// Dashboard - estatísticas reais
adminApi.get('/dashboard', async (c) => {
  const db = c.env.DB
  const [plans, faqs, services, media, lastLog] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM plans WHERE active = 1').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM faqs WHERE active = 1').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM services WHERE active = 1').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM media').first<{ n: number }>(),
    db.prepare('SELECT detail, created_at FROM audit_logs ORDER BY id DESC LIMIT 1').first<{ detail: string; created_at: string }>()
  ])
  const analytics = await db.prepare("SELECT value FROM content WHERE key = 'analytics'").first<{ value: string }>()
  const a = analytics ? JSON.parse(analytics.value) : {}
  return c.json({
    plans: plans?.n ?? 0,
    faqs: faqs?.n ?? 0,
    services: services?.n ?? 0,
    media: media?.n ?? 0,
    lastUpdate: lastLog?.created_at ?? null,
    lastAction: lastLog?.detail ?? null,
    analyticsConfigured: Boolean(a.googleAnalyticsId || a.metaPixelId || a.gtmId)
  })
})
