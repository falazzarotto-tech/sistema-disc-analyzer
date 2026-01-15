import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Dicionário de Interpretação DISC
const DISC_INTERPRETATION: Record<string, any> = {
  D: {
    name: "Dominância (Executor)",
    traits: "Direto, decidido, focado em resultados e competitivo.",
    strengths: "Tomada de decisão rápida, aceita desafios, foca na eficiência.",
    growth: "Pode ser impaciente e negligenciar detalhes ou sentimentos alheios."
  },
  I: {
    name: "Influência (Comunicador)",
    traits: "Entusiasta, otimista, persuasivo e sociável.",
    strengths: "Ótimo em networking, motiva equipes, comunica ideias com facilidade.",
    growth: "Pode ter dificuldade com organização e foco em tarefas repetitivas."
  },
  S: {
    name: "Estabilidade (Planejador)",
    traits: "Calmo, paciente, leal e bom ouvinte.",
    strengths: "Trabalha bem em equipe, cria ambientes harmoniosos, é persistente.",
    growth: "Pode ter resistência a mudanças bruscas e dificuldade em dizer não."
  },
  C: {
    name: "Conformidade (Analista)",
    traits: "Preciso, analítico, detalhista e disciplinado.",
    strengths: "Alta qualidade técnica, segue processos, evita riscos desnecessários.",
    growth: "Pode ser excessivamente crítico e se perder em detalhes (perfeccionismo)."
  }
};

app.get('/health', async () => {
  return { status: "ok", service: "Sistema DISC Analyzer" };
});

app.get('/users', async () => {
  return await prisma.user.findMany();
});

app.post('/users', async (request, reply) => {
  try {
    const UserSchema = z.object({ name: z.string(), email: z.string().email() });
    const data = UserSchema.parse(request.body);
    return await prisma.user.create({ data });
  } catch (error: any) {
    reply.status(400).send({ error: error.message });
  }
});

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

    await prisma.discAnswer.createMany({
      data: answers.map(a => ({
        userId,
        questionId: a.questionId,
        dimension: a.dimension,
        score: a.score
      }))
    });

    const results = await prisma.discAnswer.groupBy({
      by: ['dimension'],
      where: { userId },
      _sum: { score: true }
    });

    const scores = results.reduce((acc: any, curr) => {
      acc[curr.dimension] = curr._sum.score;
      return acc;
    }, { D: 0, I: 0, S: 0, C: 0 });

    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

    return {
      userId,
      scores,
      profile: DISC_INTERPRETATION[dominant]
    };

  } catch (error: any) {
    reply.status(500).send({ error: "Erro ao processar teste" });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};

start();
