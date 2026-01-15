import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

const DISC_INTERPRETATION: Record<string, any> = {
  D: { name: "Dominância (Executor)", traits: "Direto, decidido, focado em resultados.", strengths: "Decisão rápida.", growth: "Impaciência." },
  I: { name: "Influência (Comunicador)", traits: "Otimista, persuasivo, sociável.", strengths: "Networking.", growth: "Falta de foco." },
  S: { name: "Estabilidade (Planejador)", traits: "Calmo, paciente, leal.", strengths: "Trabalho em equipe.", growth: "Resistência a mudanças." },
  C: { name: "Conformidade (Analista)", traits: "Preciso, analítico, disciplinado.", strengths: "Qualidade técnica.", growth: "Perfeccionismo." }
};

app.get('/health', async () => ({ status: "ok" }));

app.get('/users', async () => await prisma.user.findMany());

app.post('/disc/answers', async (request, reply) => {
  try {
    const AnswerSchema = z.object({
      userId: z.string(),
      answers: z.array(z.object({
        questionId: z.number(),
        dimension: z.enum(['D', 'I', 'S', 'C']),
        score: z.number()
      }))
    });

    const { userId, answers } = AnswerSchema.parse(request.body);

    // 1. Salva as respostas
    await prisma.discAnswer.createMany({
      data: answers.map(a => ({
        userId,
        questionId: a.questionId,
        dimension: a.dimension,
        score: a.score
      }))
    });

    // 2. Busca as somas
    const results = await prisma.discAnswer.groupBy({
      by: ['dimension'],
      where: { userId },
      _sum: { score: true }
    });

    // 3. Consolida os scores
    const scores: any = { D: 0, I: 0, S: 0, C: 0 };
    results.forEach(res => {
      if (res.dimension) scores[res.dimension] = res._sum.score || 0;
    });

    // 4. Define o dominante
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

    return {
      userId,
      scores,
      profile: DISC_INTERPRETATION[dominant]
    };

  } catch (error: any) {
    app.log.error(error); // Isso vai mostrar o erro real nos logs da Railway
    reply.status(500).send({ 
      error: "Erro ao processar teste", 
      details: error.message 
    });
  }
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};
start();
