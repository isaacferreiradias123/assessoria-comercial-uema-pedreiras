/**
 * Autenticação do painel administrativo.
 *
 * - Senhas: PBKDF2-SHA256, 100.000 iterações, salt aleatório de 16 bytes.
 * - Sessões: token opaco de 32 bytes armazenado no D1, cookie httpOnly de 7 dias.
 * - Força bruta: tentativas por IP registradas em `login_attempts`.
 */
import type { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export type Bindings = { DB: D1Database }
export type AdminUser = { id: number; email: string; name: string }

/** Contexto aceito pelos helpers — só exige o binding do banco. */
type AnyCtx = Context<any, any, any>

const enc = new TextEncoder()
const PBKDF2_ITERATIONS = 100_000

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
  const view = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return bytesToHex(bits)
}

/** Comparação em tempo constante (evita timing attacks). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  return safeEqual(await derive(password, hexToBytes(saltHex)), hashHex)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `${bytesToHex(salt)}:${await derive(password, salt)}`
}

// ---------- Sessões ----------

const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 dias

export async function createSession(db: D1Database, userId: number): Promise<string> {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)))
  await db
    .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, Date.now() + SESSION_TTL_MS)
    .run()
  // Limpeza oportunista de sessões expiradas.
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run()
  return token
}

export function setSessionCookie(c: AnyCtx, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    // Em desenvolvimento local (http://localhost) o atributo Secure impediria o envio.
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000
  })
}

export function clearSessionCookie(c: AnyCtx) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

export async function getSessionUser(c: AnyCtx): Promise<AdminUser | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const row = await (c.env as Bindings).DB.prepare(
    `SELECT u.id, u.email, u.name
       FROM sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?`
  )
    .bind(token, Date.now())
    .first<AdminUser>()
  return row ?? null
}

export async function destroySession(c: AnyCtx) {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) {
    await (c.env as Bindings).DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
  }
  clearSessionCookie(c)
}

/** Middleware das rotas `/api/admin/*`. */
export async function requireAuth(c: AnyCtx, next: Next) {
  const user = await getSessionUser(c)
  if (!user) return c.json({ error: 'Não autenticado' }, 401)
  c.set('user', user)
  await next()
}

// ---------- Proteção contra força bruta ----------

const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const LOGIN_MAX_ATTEMPTS = 8

/** Identificador do cliente: IP informado pela Cloudflare, com fallback seguro. */
export function clientKey(c: AnyCtx): string {
  const fwd = (c.req.header('X-Forwarded-For') || '').split(',')[0]
  return c.req.header('CF-Connecting-IP') || (fwd ? fwd.trim() : '') || 'desconhecido'
}

export async function isRateLimited(
  db: D1Database,
  key: string,
  max = LOGIN_MAX_ATTEMPTS,
  windowMs = LOGIN_WINDOW_MS
): Promise<boolean> {
  const since = Date.now() - windowMs
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND created_at > ?')
    .bind(key, since)
    .first<{ n: number }>()
  return (row?.n ?? 0) >= max
}

export async function recordAttempt(db: D1Database, key: string) {
  await db.prepare('INSERT INTO login_attempts (key, created_at) VALUES (?, ?)').bind(key, Date.now()).run()
  await db.prepare('DELETE FROM login_attempts WHERE created_at < ?').bind(Date.now() - LOGIN_WINDOW_MS).run()
}

export async function clearAttempts(db: D1Database, key: string) {
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run()
}
