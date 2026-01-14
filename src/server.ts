import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Esquemas de Validação
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const AnswerSchema = z.object({
  userId: z.string().uuid(),
  answers: z.array(z.object({
    question_id: z.number(),
    dimension: z.enum(['D', 'I', 'S', 'C']),
    score: z.number().min(0)
  }))
});

// Rota: Criar Usuário
app.post('/users', async (request, reply) => {
  const data = UserSchema.parse(request.body);
  const user = await prisma.user.create({ data });
  return user;
});

// Rota: Salvar Respostas
app.post('/disc/answers', async (request, reply) => {
  const { userId, answers } = AnswerSchema.parse(request.body);
  const operations = answers.map(a => prisma.discAnswer.create({
    data: { userId, questionId: a.question_id, dimension: a.dimension, score: a.score }
  }));
  await Promise.all(operations);
  return { message: "Respostas processadas" };
});

// Rota: Ver Resultado (Consolidação)
app.get('/disc/:userId', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  const results = await prisma.discAnswer.groupBy({
    by: ['dimension'],
    where: { userId },
    _sum: { score: true }
  });
  const scores: any = { D: 0, I: 0, S: 0, C: 0 };
  results.forEach(r => { scores[r.dimension] = r._sum.score || 0; });
  const dominant = Object.entries(scores).reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
  return { user_id: userId, scores, dominant };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log("🚀 Servidor DISC rodando!");
  } catch (err) {
    process.exit(1);
  }
};
start();
