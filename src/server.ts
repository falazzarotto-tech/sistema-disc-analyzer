import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateDiscPdf } from './pdfService';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/',
});

fastify.post('/users', async (request, reply) => {
  try {
    const user = await prisma.user.create({ data: request.body as any });
    return user;
  } catch (e: any) {
    return reply.status(500).send({ error: e.message });
  }
});

fastify.post('/disc/answers', async (request, reply) => {
  const { userId, answers } = request.body as any;
  try {
    // Limpeza e inserção
    await prisma.discAnswer.deleteMany({ where: { userId } });
    const result = await prisma.discAnswer.createMany({
      data: answers.map((a: any) => ({
        userId,
        questionId: Number(a.questionId),
        dimension: String(a.dimension),
        score: Number(a.score)
      }))
    });
    return { message: 'OK', count: result.count };
  } catch (e: any) {
    console.error(e);
    // RETORNA O ERRO REAL PARA O NAVEGADOR VER
    return reply.status(500).send({ error: 'ERRO NO BANCO: ' + e.message });
  }
});

fastify.get('/disc/:userId/pdf', async (request, reply) => {
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

  const pdf = await generateDiscPdf(user, formattedScores);
  reply.type('application/pdf').send(pdf);
});

const start = async () => {
  await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
};
start();
