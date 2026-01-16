import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateDiscPdf } from './pdfService';
import { generateAiAnalysis } from './aiService';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/',
});

fastify.post('/users', async (request, reply) => {
  const { name, email, context } = request.body as any;
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, context },
      create: { name, email, context },
    });
    return user;
  } catch (e) {
    return reply.status(500).send({ error: 'Erro ao processar usuário' });
  }
});

fastify.post('/disc/answers', async (request, reply) => {
  const { userId, answers } = request.body as any;
  try {
    await prisma.discAnswer.deleteMany({ where: { userId } });
    await prisma.discAnswer.createMany({
      data: answers.map((a: any) => ({
        userId,
        questionId: Number(a.questionId),
        dimension: String(a.dimension),
        score: Number(a.score)
      }))
    });
    return { message: 'OK' };
  } catch (e) {
    return reply.status(500).send({ error: 'Erro ao salvar respostas' });
  }
});

// ENDPOINT DE ALTA COMPLEXIDADE: ANÁLISE CLAUDE 3.5 SONNET
fastify.get('/disc/:userId/analysis', async (request, reply) => {
  const { userId } = request.params as any;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const scores = await prisma.discAnswer.findMany({ where: { userId } });

  if (!user || scores.length === 0) return reply.status(404).send({ error: 'Dados não encontrados' });

  const dimensions = ['Expressão', 'Decisão', 'Regulação', 'Contexto'];
  const formattedScores = dimensions.map(d => {
    const dScores = scores.filter(s => s.dimension === d);
    const avg = dScores.length > 0 ? dScores.reduce((acc, curr) => acc + curr.score, 0) / dScores.length : 0;
    return { dimension: d, avg };
  });

  // Chamada ao Claude 3.5 Sonnet
  const aiAnalysis = await generateAiAnalysis(user.name, formattedScores);
  return { scores: formattedScores, aiAnalysis };
});

const start = async () => {
  await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
};
start();
