import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateDiscPdf } from './pdfService';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

const publicPath = path.join(__dirname, '..', 'public');

fastify.register(fastifyStatic, {
  root: publicPath,
  prefix: '/',
});

fastify.post('/users', async (request, reply) => {
  const { name, email, context } = request.body as any;
  const user = await prisma.user.create({ data: { name, email, context } });
  return user;
});

fastify.post('/disc/answers', async (request, reply) => {
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
  return { message: 'Respostas registradas' };
});

fastify.get('/disc/:userId/pdf', async (request, reply) => {
  const { userId } = request.params as any;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const scores = await prisma.discAnswer.groupBy({
    by: ['dimension'],
    where: { userId },
    _avg: { score: true }
  });
  if (!user || scores.length === 0) return reply.status(404).send({ error: 'Não encontrado' });
  const formattedScores = scores.map(s => ({ dimension: s.dimension, avg: s._avg.score }));
  try {
    const pdf = await generateDiscPdf(user, formattedScores);
    const safeName = user.name.replace(/\s+/g, '_').toUpperCase();
    reply.type('application/pdf').header('Content-Disposition', `attachment; filename="Anima_${safeName}.pdf"`).send(pdf);
  } catch (err) {
    reply.status(500).send({ error: 'Erro PDF' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};
start();
