import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Rota de Health Check
app.get('/health', async () => {
  return { status: "ok", service: "Sistema DISC Analyzer" };
});

// Rota: Criar Usuário
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

app.post('/users', async (request, reply) => {
  try {
    const data = UserSchema.parse(request.body);
    const user = await prisma.user.create({ data });
    return user;
  } catch (error: any) {
    reply.status(400).send({ error: error.message });
  }
});

// ========================================
// LÓGICA DISC: PROCESSAR RESPOSTAS
// ========================================

const AnswerSchema = z.object({
  userId: z.string(),
  answers: z.array(z.object({
    questionId: z.number(),
    dimension: z.enum(['D', 'I', 'S', 'C']),
    score: z.number().min(1).max(5) // Ex: 1 a 5 de afinidade
  }))
});

app.post('/disc/answers', async (request, reply) => {
  try {
    const { userId, answers } = AnswerSchema.parse(request.body);

    // Salva todas as respostas no banco
    await prisma.discAnswer.createMany({
      data: answers.map(a => ({
        userId,
        questionId: a.questionId,
        dimension: a.dimension,
        score: a.score
      }))
    });

    // Calcula o Perfil Consolidado
    const results = await prisma.discAnswer.groupBy({
      by: ['dimension'],
      where: { userId },
      _sum: { score: true }
    });

    // Formata o resultado para o usuário
    const profile = results.reduce((acc: any, curr) => {
      acc[curr.dimension] = curr._sum.score;
      return acc;
    }, { D: 0, I: 0, S: 0, C: 0 });

    return {
      userId,
      message: "Teste processado com sucesso",
      scores: profile,
      dominant: Object.keys(profile).reduce((a, b) => profile[a] > profile[b] ? a : b)
    };

  } catch (error: any) {
    console.error(error);
    reply.status(500).send({ error: "Erro ao processar teste DISC" });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor rodando na porta ${port}`);
  } catch (err) {
    process.exit(1);
  }
};

start();
