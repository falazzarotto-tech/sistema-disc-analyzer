import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateDiscPdf } from './pdfService';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

// Habilitar CORS para evitar bloqueios de segurança do navegador
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/',
});

// Rota de Saúde (para testar se o servidor está vivo)
fastify.get('/health', async () => ({ status: 'ok' }));

fastify.post('/users', async (request, reply) => {
  try {
    const user = await prisma.user.create({ data: request.body as any });
    return user;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao criar usuário' });
  }
});

fastify.post('/disc/answers', async (request, reply) => {
  const { userId, answers } = request.body as any;
  
  if (!userId || !answers || !Array.isArray(answers)) {
    return reply.status(400).send({ error: 'Dados inválidos ou incompletos' });
  }

  try {
    // Limpa e salva em uma única transação para garantir integridade
    await prisma.$transaction([
      prisma.discAnswer.deleteMany({ where: { userId } }),
      prisma.discAnswer.createMany({
        data: answers.map((a: any) => ({
          userId,
          questionId: a.questionId,
          dimension: a.dimension,
          score: a.score
        }))
      })
    ]);

    return { message: 'OK' };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao salvar respostas no banco' });
  }
});

fastify.get('/disc/:userId/pdf', async (request, reply) => {
  const { userId } = request.params as any;
  
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const scores = await prisma.discAnswer.findMany({ where: { userId } });

    if (!user || scores.length === 0) {
      return reply.status(404).send({ error: 'Dados não encontrados' });
    }

    const dimensions = ['Expressão', 'Decisão', 'Regulação', 'Contexto'];
    const formattedScores = dimensions.map(d => {
      const dScores = scores.filter(s => s.dimension === d);
      const avg = dScores.length > 0 ? dScores.reduce((acc, curr) => acc + curr.score, 0) / dScores.length : 0;
      return { dimension: d, avg };
    });

    const pdf = await generateDiscPdf(user, formattedScores);
    reply.type('application/pdf').send(pdf);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao gerar PDF' });
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
