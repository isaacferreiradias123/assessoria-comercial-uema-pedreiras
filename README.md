# Assessoria Comercial UEMA Pedreiras

Site público com painel administrativo, persistência em Cloudflare D1 e publicação em Cloudflare Pages.

## Requisitos

- Node.js 20+
- Conta Cloudflare com Pages e D1
- Wrangler autenticado com `npx wrangler login`

## Rodar localmente

```bash
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Acesse `http://localhost:5173`. Para simular o ambiente de produção:

```bash
npm run preview
```

## Publicar

1. Conecte este repositório a um projeto no Cloudflare Pages.
2. Configure `npm run build` como comando de build e `dist` como diretório de saída.
3. Crie o banco D1 `webapp-production` e substitua `local-placeholder` pelo `database_id` real em `wrangler.jsonc`.
4. Execute `npm run db:migrate:remote` e, somente na primeira instalação, `npm run db:seed:remote`.
5. Publique com `npm run deploy`.

Depois, acesse `/admin/login` para administrar o conteúdo. Teste o site público, o login, o envio de leads e as alterações no painel antes de divulgar o endereço.

## Estrutura essencial

- `src/`: aplicação Hono, rotas, autenticação e painel.
- `public/`: arquivos públicos, imagens e CSS/JS compilados.
- `migrations/`: schema e alterações do banco D1.
- `seed.sql`: conteúdo inicial.
- `wrangler.jsonc`: configuração do Cloudflare Pages + D1.

## Segurança

Não faça commit de segredos. O `.gitignore` já exclui `.env`, `.dev.vars`, logs, `dist`, `.wrangler` e dependências.

## Rollback

Use **Cloudflare Pages → Deployments → Rollback**. O rollback do código não altera os dados do D1.
