# Documentação Técnica - Sistema Ânima

## Fluxo Funcional
1. POST /users -> Cria usuário e retorna ID.
2. POST /disc/answers -> Salva array de respostas vinculado ao ID.
3. GET /disc/:id/pdf -> Gera relatório baseado nas respostas salvas.

## Configurações de Ambiente
- Porta: process.env.PORT (padrão 3000)
- Banco: PostgreSQL (via Prisma)
- Estáticos: Pasta /public

## Comandos de Manutenção
- Build: npm run build
- Deploy: git push origin main
