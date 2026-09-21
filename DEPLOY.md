# Publicação rápida

## Cloudflare Pages

- Comando de build: `npm run build`
- Diretório de saída: `dist`
- Node.js: 20 ou superior

## Banco D1

```bash
npx wrangler login
npx wrangler d1 create webapp-production
```

Copie o `database_id` retornado para `wrangler.jsonc`. Depois execute:

```bash
npm install
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

O `seed` deve ser executado apenas na primeira instalação. Nas atualizações seguintes, aplique apenas as novas migrações.

## Verificação pós-publicação

- Abra `/` e teste o site público.
- Abra `/admin/login` e valide o painel.
- Teste envio de lead, edição de conteúdo e upload de mídia.
- Verifique `/robots.txt` e `/sitemap.xml`.
- Configure domínio personalizado e HTTPS no Cloudflare Pages, se necessário.
