/**
 * Tailwind CSS 3 — build local.
 *
 * Antes o site carregava https://cdn.tailwindcss.com em produção (compilava o CSS
 * no navegador a cada visita). Agora o CSS é gerado no build para /static/app.css.
 * Os tokens abaixo reproduzem exatamente a configuração que era enviada ao CDN,
 * então o visual permanece idêntico.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', 'html[data-theme="dark"] &'],
  content: ['./src/**/*.{ts,tsx}', './src/client/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      },
      colors: {
        primary: '#0F172A',
        brand: { DEFAULT: '#2563EB', dark: '#1D4ED8' },
        accent: { DEFAULT: '#10B981', dark: '#059669' }
      },
      maxWidth: { content: '72rem' },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.06), 0 8px 24px -12px rgba(15,23,42,.18)',
        lift: '0 12px 40px -12px rgba(15,23,42,.28)'
      }
    }
  },
  // Classes montadas dinamicamente em tempo de execução (ícones, estados, badges).
  safelist: [
    'w-4', 'h-4', 'w-5', 'h-5', 'w-6', 'h-6', 'w-7', 'h-7', 'w-8', 'h-8',
    'bg-emerald-600', 'bg-red-600', 'bg-slate-800', 'bg-amber-500',
    'text-emerald-700', 'text-red-700', 'text-amber-700', 'text-slate-700',
    'bg-emerald-50', 'bg-red-50', 'bg-amber-50', 'bg-slate-50'
  ],
  plugins: []
}
