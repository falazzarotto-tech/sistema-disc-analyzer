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

// ---------- ROTA /users ----------
// Regra: se o email já existir, reutiliza o mesmo usuário (atualiza nome/contexto)
fastify.post('/users', async (request, reply) => {
  const { name, email, context } = request.body as any;
  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { name, email, context },
      });
      fastify.log.info(`Usuário criado: ${user.id}`);
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { name, context },
      });
      fastify.log.info(`Usuário reutilizado: ${user.id}`);
    }

    return user;
  } catch (e: any) {
    fastify.log.error(e);
    return reply.status(500).send({ error: 'Erro ao criar ou buscar usuário: ' + e.message });
  }
});

// ---------- ROTA /disc/answers ----------
fastify.post('/disc/answers', async (request, reply) => {
  const { userId, answers } = request.body as any;

  if (!userId || !answers || !Array.isArray(answers) || answers.length === 0) {
    return reply.status(400).send({ error: 'Dados inválidos ou incompletos' });
  }

  try {
    // 1) Confirma se o usuário existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(400).send({ error: 'Usuário não encontrado para este ID' });
    }

    // 2) Limpa respostas antigas e salva novas
    await prisma.discAnswer.deleteMany({ where: { userId } });

    const result = await prisma.discAnswer.createMany({
      data: answers.map((a: any) => ({
        userId,
        questionId: Number(a.questionId),
        dimension: String(a.dimension),
        score: Number(a.score),
      })),
    });

    fastify.log.info(`Respostas salvas para usuário ${userId}: ${result.count}`);
    return { message: 'OK', count: result.count };
  } catch (e: any) {
    fastify.log.error(e);
    return reply.status(500).send({ error: 'Erro ao salvar respostas no banco: ' + e.message });
  }
});

// ---------- ROTA PDF ----------
fastify.get('/disc/:userId/pdf', async (request, reply) => {
  const { userId } = request.params as any;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const scores = await prisma.discAnswer.findMany({ where: { userId } });

    if (!user || scores.length === 0) {
      return reply.status(404).send({ error: 'Dados não encontrados' });
    }

    const dimensions = ['Expressão', 'Decisão', 'Regulação', 'Contexto'];
    const formattedScores = dimensions.map((d) => {
      const dScores = scores.filter((s) => s.dimension === d);
      const avg =
        dScores.length > 0
          ? dScores.reduce((acc, curr) => acc + curr.score, 0) / dScores.length
          : 0;
      return { dimension: d, avg };
    });

    const pdf = await generateDiscPdf(user, formattedScores);
    reply.type('application/pdf').send(pdf);
  } catch (e: any) {
    fastify.log.error(e);
    return reply.status(500).send({ error: 'Erro ao gerar PDF: ' + e.message });
  }
});

const start = async () => {
  await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
};
start();
