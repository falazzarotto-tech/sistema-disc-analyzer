import fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { QUESTION_MODULES } from './questionService';
import { SYSTEM_IDENTITY } from './systemConfig';

const app = fastify({ logger: true });
const prisma = new PrismaClient();

app.register(cors);
app.register(staticFiles, {
  root: path.join(__dirname, '../public'),
  prefix: '/', 
});

// Rota para buscar as perguntas organizadas por módulos
app.get('/questions', async () => {
  return {
    system: SYSTEM_IDENTITY.name,
    modules: QUESTION_MODULES
  };
});

// Rota para criar usuário
app.post('/users', async (request, reply) => {
  const { name, email, context } = request.body as any;
  return await prisma.user.upsert({
    where: { email },
    update: { name, context },
    create: { name, email, context },
  });
});

// Rota para salvar respostas
app.post('/disc/answers', async (request, reply) => {
  const { userId, answers } = request.body as any;
  await prisma.discAnswer.deleteMany({ where: { userId } });
  await prisma.discAnswer.createMany({
    data: answers.map((a: any) => ({
      userId,
      questionId: a.questionId,
      dimension: a.dimension,
      score: a.score
    }))
  });
  return { status: 'success' };
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};
start();
