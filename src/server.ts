console.log("DEBUG: O arquivo server.ts começou a ser executado!");

import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = Fastify({ 
  logger: true
});

const prisma = new PrismaClient();

// Rota de Teste Simples (Health Check)
app.get('/health', async () => {
  return { ok: true, timestamp: new Date().toISOString() };
});

// Rota de Teste Simples
app.get('/', async () => {
  return { status: "Sistema DISC Online", timestamp: new Date().toISOString() };
});

// Rota: Listar Usuários
app.get('/users', async () => {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    return { error: "Erro ao acessar banco de dados", details: error };
  }
});

// Esquema de Validação
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// Rota: Criar Usuário
app.post('/users', async (request, reply) => {
  try {
    const data = UserSchema.parse(request.body);
    const user = await prisma.user.create({ data });
    return user;
  } catch (error) {
    reply.status(400).send(error);
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = '0.0.0.0'; 

    await app.listen({ port, host });
    console.log(`🚀 Servidor DISC rodando na porta ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();