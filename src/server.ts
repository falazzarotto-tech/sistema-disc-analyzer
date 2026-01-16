import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateAiAnalysis } from './aiService';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/',
});

// Listar usuários (Para resolver o seu 404)
fastify.get('/users', async () => {
  return await prisma.user.findMany();
});

// Criar/Atualizar usuário
fastify.post('/users', async (request, reply) => {
  const { name, email, context } = request.body as any;
  try {
    return await prisma.user.upsert({
      where: { email },
      update: { name, context },
      create: { name, email, context },
    });
  } catch (e) {
    return reply.status(500).send({ error: 'Erro ao processar usuário' });
  }
});

// Salvar respostas
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

// Análise de IA
fastify.get('/disc/:userId/analysis', async (request, reply) => {
  const { userId } = request.params as any;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const scores = await prisma.discAnswer.findMany({ where: { userId } });

  if (!user || scores.length === 0) return reply.status(404).send({ error: 'Dados insuficientes' });

  const dimensions = ['Expressão', 'Decisão', 'Regulação', 'Contexto'];
  const formattedScores = dimensions.map(d => {
    const dScores = scores.filter(s => s.dimension === d);
    const avg = dScores.length > 0 ? dScores.reduce((acc, curr) => acc + curr.score, 0) / dScores.length : 0;
    return { dimension: d, avg };
  });

  const aiAnalysis = await generateAiAnalysis(user.name, formattedScores);
  return { scores: formattedScores, aiAnalysis };
});

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
