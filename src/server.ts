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

/**
 * ENDPOINT: /users
 * PADRÃO: Upsert (Update or Insert)
 * Garante que o e-mail seja a chave de identidade única e evita falhas de integridade.
 */
fastify.post('/users', async (request, reply) => {
  const { name, email, context } = request.body as any;
  
  if (!email) return reply.status(400).send({ error: 'Email é obrigatório' });

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, context },
      create: { name, email, context },
    });
    return user;
  } catch (e: any) {
    fastify.log.error(`Erro no Upsert de Usuário: ${e.message}`);
    return reply.status(500).send({ error: 'Falha na persistência do usuário' });
  }
});

/**
 * ENDPOINT: /disc/answers
 * PADRÃO: Validação de Existência + Transação de Limpeza
 */
fastify.post('/disc/answers', async (request, reply) => {
  const { userId, answers } = request.body as any;

  try {
    // Validação de pré-condição: O usuário DEVE existir
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return reply.status(404).send({ error: 'Usuário inexistente. Impossível vincular respostas.' });
    }

    // Operação atômica: Remove anteriores e insere novas
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
    fastify.log.error(`Erro ao salvar respostas: ${e.message}`);
    return reply.status(500).send({ error: 'Erro interno ao processar diagnóstico' });
  }
});

fastify.get('/disc/:userId/pdf', async (request, reply) => {
  const { userId } = request.params as any;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const scores = await prisma.discAnswer.findMany({ where: { userId } });

    if (!user || scores.length === 0) return reply.status(404).send({ error: 'Dados insuficientes para PDF' });

    const dimensions = ['Expressão', 'Decisão', 'Regulação', 'Contexto'];
    const formattedScores = dimensions.map(d => {
      const dScores = scores.filter(s => s.dimension === d);
      const avg = dScores.length > 0 ? dScores.reduce((acc, curr) => acc + curr.score, 0) / dScores.length : 0;
      return { dimension: d, avg };
    });

    const pdf = await generateDiscPdf(user, formattedScores);
    reply.type('application/pdf').send(pdf);
  } catch (e: any) {
    return reply.status(500).send({ error: 'Erro na geração do documento' });
  }
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
