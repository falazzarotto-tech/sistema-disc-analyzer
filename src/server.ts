import fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { QUESTION_MODULES } from './questionService';
import { SYSTEM_IDENTITY } from './systemConfig';
import { generateMapReport } from './aiService';
import { generateProfessionalPDF } from './pdfService';

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
    where: { email: email || '' },
    update: { name, context },
    create: { name, email, context },
  });
});

app.post('/disc/answers', async (request, reply) => {
  const body = request.body as any;
  const userId = body?.userId;
  const answers = body?.answers ?? [];

  if (!userId) return reply.status(400).send({ error: 'userId é obrigatório' });

  const uid: string = String(userId);

  await prisma.discAnswer.deleteMany({ where: { userId: uid } });
  await prisma.discAnswer.createMany({
    data: answers.map((a: any) => ({
      userId: uid,
      questionId: a.questionId,
      dimension: a.dimension,
      score: a.score
    }))
  });
  return { status: 'success' };
});

app.get('/disc/:userId/map', async (request, reply) => {
  const params = request.params as { userId?: string | null };
  const userId = params.userId;
  if (!userId) return reply.status(400).send({ error: 'userId é obrigatório' });

  const uid: string = String(userId);

  const user = await prisma.user.findUnique({ where: { id: uid } });
  const answers = await prisma.discAnswer.groupBy({
    by: ['dimension'],
    where: { userId: uid },
    _avg: { score: true }
  });

  if (!user || answers.length === 0) {
    return reply.status(404).send({ error: 'Dados insuficientes para gerar o mapa.' });
  }

  const scores = answers.map(a => ({
    dimension: a.dimension,
    avg: a._avg.score || 3
  }));

  // Correção aplicada aqui:
  const map = generateMapReport(user.name, scores, user.context ?? '');
  return map;
});

app.get('/disc/:userId/pdf', async (request, reply) => {
  const params = request.params as { userId?: string | null };
  const userId = params.userId;
  if (!userId) return reply.status(400).send({ error: 'userId é obrigatório' });

  const uid: string = String(userId);

  const user = await prisma.user.findUnique({ where: { id: uid } });
  const answers = await prisma.discAnswer.groupBy({
    by: ['dimension'],
    where: { userId: uid },
    _avg: { score: true }
  });

  if (!user || answers.length === 0) return reply.status(404).send({ error: 'Dados insuficientes' });

  const scores = answers.map(a => ({ dimension: a.dimension, avg: a._avg.score || 3 }));

  // Correção aplicada aqui também:
  const map = generateMapReport(user.name, scores, user.context ?? '');
  
  const pdfBuffer = await generateProfessionalPDF(map);
  
  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `attachment; filename=Mapa_Anima_${user.name}.pdf`);
  return reply.send(pdfBuffer);
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 8080, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};
start();