import { generateProfessionalPDF } from "./pdfService";
import fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { QUESTION_MODULES } from './questionService';
import { SYSTEM_IDENTITY } from './systemConfig';
import { generateMapReport } from './aiService';

const app = fastify({ logger: true });
const prisma = new PrismaClient();

app.register(cors);
app.register(staticFiles, {
  root: path.join(__dirname, '../public'),
  prefix: '/', 
});

app.get('/questions', async () => {
  return { system: SYSTEM_IDENTITY.name, modules: QUESTION_MODULES };
});

app.post('/users', async (request, reply) => {
  const { name, email, context } = request.body as any;
  return await prisma.user.upsert({
    where: { email },
    update: { name, context },
    create: { name, email, context },
  });
});

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

// ROTA DO MAPA: Gera a análise completa seguindo as regras
app.get('/disc/:userId/map', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const answers = await prisma.discAnswer.groupBy({
    by: ['dimension'],
    where: { userId },
    _avg: { score: true }
  });

  if (!user || answers.length === 0) {
    return reply.status(404).send({ error: 'Dados insuficientes para gerar o mapa.' });
  }

  const scores = answers.map(a => ({
    dimension: a.dimension,
    avg: a._avg.score || 3
  }));

  const map = generateMapReport(user.name, scores, user.context);
  return map;
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};
start();
